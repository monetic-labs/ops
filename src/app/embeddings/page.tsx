'use client';

import { useState } from 'react';
import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input';
import { Card } from '@nextui-org/card';
import { Spinner } from '@nextui-org/spinner';

export default function EmbeddingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setStatus({ type: null, message: '' });

    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);

    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setStatus({
        type: 'success',
        message: `Successfully uploaded ${data.document.title}`,
      });
      setFile(null);
      setCategory('');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Document Embeddings Upload</h1>
      
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".md,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
              label="Upload Document"
              description="Supported formats: Markdown (.md), Text (.txt)"
            />
          </div>

          <div>
            <Input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Enter category (optional)"
              label="Category"
            />
          </div>

          <Button
            type="submit"
            color="primary"
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <Spinner size="sm" color="current" />
            ) : (
              'Upload and Generate Embedding'
            )}
          </Button>

          {status.type && (
            <div
              className={`p-4 rounded ${
                status.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {status.message}
            </div>
          )}
        </form>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Upload Guidelines</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Only markdown (.md) and text (.txt) files are supported</li>
          <li>Files should be in plain text format</li>
          <li>Category is optional but helps with organization</li>
          <li>Maximum file size: 5MB</li>
        </ul>
      </div>
    </div>
  );
}