import { useState } from 'react';
import axios from 'axios';

export default function FileUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileSelect = (event) => {
        setSelectedFile(event.target.files[0]);
        setUploadResult(null);
        setError(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post('/api/v1/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setUploadResult(response.data);
            setSelectedFile(null);
            // Reset file input
            document.getElementById('file-input').value = '';
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
                <h3 className="text-lg font-medium mb-4">File Upload</h3>
                
                <div className="space-y-4">
                    <div>
                        <input
                            id="file-input"
                            type="file"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    {selectedFile && (
                        <div className="text-sm text-gray-600">
                            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Uploading...' : 'Upload File'}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {uploadResult && uploadResult.success && (
                        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                            <h4 className="font-medium mb-2">Upload Successful!</h4>
                            <div className="text-sm space-y-1">
                                <p><strong>File:</strong> {uploadResult.data.original_name}</p>
                                <p><strong>Size:</strong> {(uploadResult.data.file_size / 1024 / 1024).toFixed(2)} MB</p>
                                <p><strong>Type:</strong> {uploadResult.data.mime_type}</p>
                                <p><strong>URL:</strong> 
                                    <a 
                                        href={uploadResult.data.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 ml-1"
                                    >
                                        {uploadResult.data.url}
                                    </a>
                                </p>
                                <p><strong>S3 URL:</strong> 
                                    <a 
                                        href={uploadResult.data.s3_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 ml-1"
                                    >
                                        {uploadResult.data.s3_url}
                                    </a>
                                </p>
                                <p><strong>CloudFront CDN URL:</strong> 
                                    <a 
                                        href={uploadResult.data.cloudfront_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 ml-1"
                                    >
                                        {uploadResult.data.cloudfront_url}
                                    </a>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}