<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Url;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class URLController extends Controller
{
    /**
     * Shorten a URL
     */
    public function shorten(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'original_url' => 'required|url|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid URL provided',
                'errors' => $validator->errors()
            ], 422);
        }

        $originalUrl = $request->input('original_url');
        
        // Check if URL already exists for this user (if authenticated)
        $existingUrl = null;
        if (Auth::check()) {
            $existingUrl = Url::where('original_url', $originalUrl)
                            ->where('user_id', Auth::id())
                            ->first();
        } else {
            // For anonymous users, check if URL exists without user_id
            $existingUrl = Url::where('original_url', $originalUrl)
                            ->whereNull('user_id')
                            ->first();
        }

        // Create new shortened URL
        $url = new Url();
        $url->original_url = $originalUrl;
        $url->short_code = $url->generateShortCode();
        $url->user_id = Auth::id(); // Will be null for anonymous users
        $url->save();

        return response()->json([
            'success' => true,
            'message' => 'URL shortened successfully',
            'data' => [
                'original_url' => $url->original_url,
                'short_url' => $url->short_url,
                'short_code' => $url->short_code,
                'clicks' => $url->clicks,
                'created_at' => $url->created_at
            ]
        ], 201);
    }

    /**
     * Get URL statistics
     */
    public function stats($shortCode)
    {
        $url = Url::where('short_code', $shortCode)->first();

        if (!$url) {
            return response()->json([
                'success' => false,
                'message' => 'Short URL not found'
            ], 404);
        }

        // Check if user has permission to view stats
        if ($url->user_id && (!Auth::check() || Auth::id() !== $url->user_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view statistics'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'original_url' => $url->original_url,
                'short_url' => $url->short_url,
                'short_code' => $url->short_code,
                'clicks' => $url->clicks,
                'created_at' => $url->created_at,
                'expires_at' => $url->expires_at
            ]
        ]);
    }

    /**
     * Get user's URLs (authenticated users only)
     */
    public function index()
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $urls = Url::where('user_id', Auth::id())
                   ->orderBy('created_at', 'desc')
                   ->get()
                   ->map(function ($url) {
                       return [
                           'id' => $url->id,
                           'original_url' => $url->original_url,
                           'short_url' => $url->short_url,
                           'short_code' => $url->short_code,
                           'clicks' => $url->clicks,
                           'created_at' => $url->created_at,
                           'expires_at' => $url->expires_at
                       ];
                   });

        return response()->json([
            'success' => true,
            'data' => $urls
        ]);
    }

    /**
     * Upload a file for testing
     */
    public function uploadFile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid file provided',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            
            # For Local Storage (commented out)
            // $filePath = $file->storeAs('uploads', $fileName, 'public');
            // return response()->json([
            //     'success' => true,
            //     'message' => 'File uploaded successfully',
            //     'data' => [
            //         'file_name' => $fileName,
            //         'file_path' => $filePath,
            //         'file_size' => $file->getSize(),
            //         'mime_type' => $file->getMimeType(),
            //         'original_name' => $file->getClientOriginalName(),
            //         'url' => Storage::url($filePath)
            //     ]
            // ], 201);

            # Optimized S3 Storage
            $file = $request->file('file');
            
            // Generate unique filename with original extension
            $extension = $file->getClientOriginalExtension();
            $fileName = time() . '_' . uniqid() . '.' . $extension;
            $filePath = 'uploads/' . $fileName;
            
            // Upload to S3 with error handling
            try {
                $uploaded = $file->storeAs('uploads', $fileName, 's3');
            } catch (\Exception $e) {
                throw new \Exception('AWS S3 Upload Error: ' . $e->getMessage());
            }
            
            if (!$uploaded) {
                throw new \Exception('S3 upload returned false - check bucket permissions and AWS credentials');
            }
            
            // Generate multiple URL options
            $protectedUrl = url('/api/v1/files/' . base64_encode($uploaded));
            $s3Url = 'https://' . config('filesystems.disks.s3.bucket') . '.s3.' . config('filesystems.disks.s3.region') . '.amazonaws.com/' . $uploaded;
            $cloudFrontUrl = 'https://' . env('AWS_CLOUDFRONT_DOMAIN') . '/' . $uploaded;
            
            return response()->json([
                'success' => true,
                'message' => 'File uploaded successfully to S3',
                'data' => [
                    'file_name' => $fileName,
                    'file_path' => $filePath,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'original_name' => $file->getClientOriginalName(),
                    'url' => $protectedUrl,
                    's3_url' => $s3Url,
                    'cloudfront_url' => $cloudFrontUrl,
                    's3_path' => $filePath
                ]
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'File upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Serve protected files with authorization check
     */
    public function serveFile($encodedPath)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required to access file'
            ], 401);
        }

        try {
            // Decode the file path
            $filePath = base64_decode($encodedPath);
            
            // Additional authorization logic here
            // For example, check if user owns the file or has permission
            // You can store file ownership in database and check here
            
            $s3Disk = Storage::disk('s3');
            
            // Check if file exists
            if (!$s3Disk->exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            // Get file content and metadata
            $fileContent = $s3Disk->get($filePath);
            $mimeType = $s3Disk->mimeType($filePath);
            $filename = basename($filePath);

            // Return file with proper headers
            return response($fileContent)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'inline; filename="' . $filename . '"')
                ->header('Cache-Control', 'private, max-age=3600');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error serving file',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
