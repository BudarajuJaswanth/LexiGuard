'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/StateHandlers';
import { getDocuments, createDocumentRecord, uploadDocumentFile, isSupabaseConfigured } from '@/lib/supabase';
import { LegalDocument } from '@/types';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, FileSearch, GitCompare, MessageSquare, Loader2 } from 'lucide-react';

export default function DocumentsPage() {
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Documents List State
  const [documents, setDocuments] = useState<LegalDocument[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getDocuments();
    if (err) {
      setError(err);
      setDocuments(null);
    } else {
      setDocuments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx') {
        setUploadError(new Error('Invalid file format. Only PDF and DOCX files are supported by LexiGuard.'));
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError(new Error('Please select a PDF or DOCX file to upload.'));
      return;
    }

    setUploading(true);
    setUploadProgress(20);
    setUploadStatus('Uploading file to Supabase Storage...');
    setUploadError(null);
    setUploadSuccess(false);

    try {
      let filePath = `documents/${selectedFile.name}`;
      
      if (isSupabaseConfigured) {
        const { path, error: upErr } = await uploadDocumentFile(selectedFile);
        if (upErr) {
          throw upErr;
        }
        if (path) filePath = path;
      }

      setUploadProgress(70);
      setUploadStatus('Registering document metadata in Supabase database...');

      const ext = selectedFile.name.split('.').pop()?.toUpperCase() || 'PDF';
      const { data: newDoc, error: dbErr } = await createDocumentRecord({
        name: selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        file_type: ext,
        status: 'uploaded',
        error_message: null
      });

      if (dbErr) {
        throw dbErr;
      }

      setUploadProgress(100);
      setUploadStatus('Document successfully uploaded & registered in Supabase.');
      setUploadSuccess(true);
      setSelectedFile(null);

      // Refresh list
      await fetchDocs();
    } catch (err: any) {
      setUploadError(err instanceof Error ? err : new Error('Failed to complete upload process.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Legal Documents & Upload</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 uppercase font-mono">
              PDF & DOCX
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload legal agreements, contracts, or non-disclosure agreements for AI analysis and document-grounded navigation.
          </p>
        </div>

        {/* UPLOAD SCREEN INTERFACE */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-700 mb-4 flex items-center space-x-2">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Upload Document</span>
          </h2>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* File Drop Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/60 hover:bg-slate-50 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                id="document-file-input"
              />
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click or drag document file here to select
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported Formats: <strong className="font-semibold text-slate-700">PDF</strong>, <strong className="font-semibold text-slate-700">DOCX</strong>
                </p>
              </div>
            </div>

            {/* Selected File Details Box */}
            {selectedFile && (
              <div className="p-4 bg-slate-900 text-slate-100 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-sm">{selectedFile.name}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                      <span>Size: {(selectedFile.size / 1024).toFixed(1)} KB</span>
                      <span>Type: {selectedFile.name.split('.').pop()?.toUpperCase()}</span>
                      <span className="text-emerald-400 font-sans font-semibold">Ready to Upload</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Upload</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Upload Progress Status Bar */}
            {uploading && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                <div className="flex items-center justify-between mb-1.5 font-semibold">
                  <span>{uploadStatus}</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Success Alert */}
            {uploadSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Document successfully registered in Supabase. You can now run AI analysis or ask questions.</span>
              </div>
            )}

            {/* Upload Error Alert */}
            {uploadError && (
              <ErrorState
                title="Upload Error"
                error={uploadError}
                onRetry={() => setUploadError(null)}
                actionText="Dismiss Error"
              />
            )}
          </form>
        </div>

        {/* DOCUMENTS LIST SECTION */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>All Registered Documents (Supabase Backend)</span>
            </h2>
            <button
              onClick={fetchDocs}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <LoadingState
              message="Fetching documents from Supabase..."
              subtext="Querying table `documents`"
            />
          )}

          {/* Error state */}
          {!loading && error && (
            <ErrorState
              title="Failed to Load Documents"
              error={error}
              onRetry={fetchDocs}
              actionText="Retry Fetch"
            />
          )}

          {/* Empty state */}
          {!loading && !error && documents && documents.length === 0 && (
            <EmptyState
              title="No legal documents stored in Supabase"
              description="Use the upload area above to manually select a PDF or DOCX file."
              icon={FileText}
            />
          )}

          {/* Documents Table */}
          {!loading && !error && documents && documents.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Filename</th>
                      <th className="px-4 py-3">Format</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Uploaded Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Document Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-slate-900 flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate max-w-xs">{doc.name}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500 uppercase">
                          {doc.file_type || 'PDF'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {doc.status === 'processing' && <Badge type="STATUS_PROCESSING" />}
                          {doc.status === 'analyzed' && <Badge type="STATUS_ANALYZED" />}
                          {doc.status === 'uploaded' && <Badge type="STATUS_UPLOADED" />}
                          {doc.status === 'error' && <Badge type="STATUS_ERROR" />}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Link
                            href={`/analyze?doc=${doc.id}`}
                            className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] border border-blue-200 inline-flex items-center space-x-1"
                          >
                            <FileSearch className="w-3 h-3" />
                            <span>Analyze</span>
                          </Link>
                          <Link
                            href={`/ask?doc=${doc.id}`}
                            className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-[11px] border border-slate-300 inline-flex items-center space-x-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Q&A</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
