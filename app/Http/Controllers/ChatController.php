<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class ChatController extends Controller
{
    private $apiUrl;
    private $apiKey;
    private $model;

    public function __construct()
    {
        $this->apiUrl = env('LOCAL_AI_URL', 'https://llm.dvyrpt.com');
        $this->apiKey = env('LOCAL_AI_KEY', 'dummy-key');
        $this->model = env('LOCAL_AI_MODEL', 'gpt-oss-20b-mxfp4');
    }

    public function index()
    {
        return view('chat.index');
    }

    public function send(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000'
        ]);

        try {
            $client = new Client(['timeout' => 30]);
            
            $response = $client->post("{$this->apiUrl}/v1/chat/completions", [
                'headers' => [
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json'
                ],
                'json' => [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a helpful assistant. Keep responses concise and friendly.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $request->message
                        ]
                    ],
                    'max_tokens' => 500,
                    'temperature' => 0.7
                ]
            ]);

            $data = json_decode($response->getBody(), true);
            $rawContent = $data['choices'][0]['message']['content'] ?? 'No response received';
            
            // Parse Jan AI channel format
            $cleanContent = $this->parseJanAIResponse($rawContent);
            
            return response()->json([
                'success' => true,
                'message' => $cleanContent
            ]);

        } catch (RequestException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to connect to AI service: ' . $e->getMessage()
            ], 500);
        }
    }

    private function parseJanAIResponse(string $rawContent): string
    {
        // Extract content from Jan AI channel format
        // Format: <|channel|>final<|message|>actual content here
        if (preg_match('/<\|channel\|>final<\|message\|>(.+)$/s', $rawContent, $matches)) {
            return trim($matches[1]);
        }
        
        // Fallback: look for any content after the last <|message|> tag
        if (preg_match('/<\|message\|>([^<|]+)(?:<\|.*)?$/s', $rawContent, $matches)) {
            return trim($matches[1]);
        }
        
        // If no channel markers found, return as-is
        return $rawContent;
    }
}
