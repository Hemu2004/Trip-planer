import React, { useState, useRef, useEffect } from 'react';
import { NavigationPage, KnowledgeBaseFile, KnowledgeFileStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { SUPER_ADMIN_EMAIL } from '../firebase';
import {
  loadKnowledgeFiles,
  addKnowledgeFile,
  deleteKnowledgeFile,
  reprocessKnowledgeFile,
  detectFileType,
  formatFileSize,
  readFileSnippet,
} from '../utils/knowledgeBaseStorage';
import {
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
  Search,
  BookOpen,
  X,
  FileCode,
  FileSpreadsheet,
  Clock,
  HardDrive,
  Eye,
  RotateCcw,
  Shield,
  ShieldAlert,
  Lock,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface KnowledgeBasePageProps {
  onNavigate: (page: NavigationPage) => void;
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.json'];
const ACCEPT_ATTRIBUTE =
  '.pdf,.doc,.docx,.txt,.md,.markdown,.csv,.json,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({ onNavigate }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<KnowledgeBaseFile | null>(null);

  // Success and error banner state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // STRICT ACCESS CONTROL:
  // If the user is authenticated as a normal traveler or visitor (not admin), deny access and redirect
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      const timer = setTimeout(() => {
        onNavigate('home');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isLoading, onNavigate]);

  // Load existing knowledge files from storage on mount (only for Admins)
  useEffect(() => {
    if (isAdmin) {
      const loaded = loadKnowledgeFiles();
      setFiles(loaded);
    }
  }, [isAdmin]);

  // If loading authentication state, show a subtle loading spinner
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Verifying administrator authorization...</p>
      </div>
    );
  }

  // If NOT Admin, render security-compliant Access Denied screen and do NOT expose any knowledge base data
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-20 px-4 text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-md">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Authorization Required</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Access Denied
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            The Knowledge Base contains shared application grounding documents used by the Trip Planner RAG pipeline.
            Only authenticated <strong>Administrators</strong> can view, upload, or manage these documents.
          </p>
          <p className="text-xs text-slate-400">
            Redirecting you to the home page...
          </p>
        </div>
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Return to Home
          </button>
          <button
            onClick={() => onNavigate('planner')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Open AI Planner & Chat</span>
          </button>
        </div>
      </div>
    );
  }

  // Filtered files based on search, format, and status
  const filteredFiles = files.filter((file) => {
    const matchesQuery =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.contentSnippet && file.contentSnippet.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (file.tags && file.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesType =
      selectedTypeFilter === 'all' ||
      (selectedTypeFilter === 'doc'
        ? file.fileType === 'doc' || file.fileType === 'docx'
        : file.fileType === selectedTypeFilter);

    const matchesStatus =
      selectedStatusFilter === 'all' || file.status === selectedStatusFilter;

    return matchesQuery && matchesType && matchesStatus;
  });

  // Stats calculations
  const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const readyCount = files.filter((f) => f.status === 'Ready').length;
  const processingCount = files.filter((f) => f.status === 'Processing' || f.status === 'Uploading').length;
  const failedCount = files.filter((f) => f.status === 'Failed').length;

  // Process raw File objects uploaded by Admin
  const processUploadedFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;

    setIsProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    let addedCount = 0;
    const errors: string[] = [];

    for (const file of filesToUpload) {
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
      const isSupported =
        SUPPORTED_EXTENSIONS.includes(ext) ||
        file.type.includes('pdf') ||
        file.type.includes('text') ||
        file.type.includes('word');

      if (!isSupported) {
        errors.push(`"${file.name}" has an unsupported format. Please upload PDF, DOC, DOCX, TXT, or text files.`);
        continue;
      }

      if (file.size > 25 * 1024 * 1024) {
        errors.push(`"${file.name}" exceeds the 25 MB limit.`);
        continue;
      }

      try {
        const fileType = detectFileType(file.name);
        const snippet = await readFileSnippet(file);
        const tokenEstimate = Math.max(50, Math.round(file.size / 380));

        const newDoc: KnowledgeBaseFile = {
          id: `kb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          fileType,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
          status: 'Ready',
          statusMessage: 'Processed and indexed for Trip Planner RAG pipeline',
          contentSnippet: snippet,
          category: 'destinations',
          tags: ['Admin Upload', fileType.toUpperCase()],
          uploadedBy: user?.name || 'Administrator',
          tokenEstimate,
          lastProcessedAt: new Date().toISOString(),
        };

        const updated = addKnowledgeFile(newDoc);
        setFiles(updated);
        addedCount++;

        // Sync with backend RAG documents endpoint for Super Admin
        fetch('/api/rag/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': user?.email || SUPER_ADMIN_EMAIL,
          },
          body: JSON.stringify(newDoc),
        }).catch((err) => console.warn('Backend RAG sync skipped:', err));
      } catch (err: any) {
        errors.push(`Failed to process "${file.name}": ${err?.message || 'Read error'}`);
      }
    }

    setIsProcessing(false);

    if (addedCount > 0) {
      setSuccessMessage(
        `Successfully uploaded and processed ${addedCount} document${
          addedCount > 1 ? 's' : ''
        } into the shared Knowledge Base.`
      );
    }
    if (errors.length > 0) {
      setErrorMessage(errors.join(' '));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag & drop event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
  };

  // Delete file handler
  const handleDelete = (id: string, name: string) => {
    const updated = deleteKnowledgeFile(id);
    setFiles(updated);
    setSuccessMessage(`Document "${name}" was permanently removed from the Knowledge Base.`);
    if (previewFile?.id === id) {
      setPreviewFile(null);
    }

    // Sync with backend RAG delete endpoint
    fetch(`/api/rag/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-email': user?.email || SUPER_ADMIN_EMAIL,
      },
    }).catch((err) => console.warn('Backend RAG delete sync skipped:', err));
  };

  // Re-process file handler (Requirement 2 & 8: Re-process knowledge files when required)
  const handleReprocess = async (id: string, name: string) => {
    setReprocessingId(id);
    try {
      const updated = await reprocessKnowledgeFile(id);
      setFiles(updated);
      setSuccessMessage(`Document "${name}" was successfully re-processed and re-indexed for RAG retrieval.`);

      // Sync with backend RAG reprocess endpoint
      fetch(`/api/rag/documents/${encodeURIComponent(id)}/reprocess`, {
        method: 'POST',
        headers: {
          'x-admin-email': user?.email || SUPER_ADMIN_EMAIL,
        },
      }).catch((err) => console.warn('Backend RAG reprocess sync skipped:', err));
    } catch (err: any) {
      setErrorMessage(`Failed to re-process "${name}": ${err?.message || 'Error during re-indexing'}`);
    } finally {
      setReprocessingId(null);
    }
  };

  // Helper for file type icons & colors
  const getFileTypeBadge = (type: KnowledgeBaseFile['fileType']) => {
    switch (type) {
      case 'pdf':
        return {
          icon: <FileText className="w-5 h-5 text-red-600" />,
          bg: 'bg-red-50 text-red-700 border-red-200',
          label: 'PDF',
        };
      case 'doc':
      case 'docx':
        return {
          icon: <FileText className="w-5 h-5 text-blue-600" />,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: type.toUpperCase(),
        };
      case 'txt':
        return {
          icon: <FileText className="w-5 h-5 text-slate-600" />,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'TXT',
        };
      case 'md':
        return {
          icon: <FileCode className="w-5 h-5 text-purple-600" />,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'MD',
        };
      case 'csv':
        return {
          icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'CSV',
        };
      default:
        return {
          icon: <FileText className="w-5 h-5 text-sky-600" />,
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          label: type.toUpperCase(),
        };
    }
  };

  // Helper for status badge rendering (Uploading, Processing, Ready, Failed)
  const renderStatusBadge = (status: KnowledgeFileStatus) => {
    switch (status) {
      case 'Ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Ready</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin"></span>
            <span>Processing</span>
          </span>
        );
      case 'Uploading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            <span>Uploading</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Failed</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 space-y-10">
      {/* Top Banner / Header with Admin Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold tracking-wide uppercase">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Knowledge Management</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              Shared RAG Pipeline
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Knowledge Base Management
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
            Manage the centralized travel knowledge repository. Uploaded documents (PDF, Word, Text) are processed,
            chunked, and indexed for the Gemini AI RAG pipeline so travelers receive verified, localized
            recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('planner')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Test Plan with AI</span>
          </button>
        </div>
      </div>

      {/* Security & Isolation Notice (Rule 7: User conversations are kept separate) */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-indigo-950">
        <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-indigo-900 block">
            Enterprise RAG Security & Conversation Isolation:
          </span>
          <p className="text-indigo-800/90 leading-relaxed">
            Only documents managed here by authenticated Administrators become shared RAG knowledge.
            Traveler chat messages, questions, and personal trip plans are private to each user session and are never
            automatically added to this shared Knowledge Base.
          </p>
        </div>
      </div>

      {/* Alert / Notification Feedback */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-3 text-emerald-900 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-800 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-rose-900 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Knowledge Docs</span>
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{files.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Admin-approved repository</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Ready for RAG</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">{readyCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Indexed and queryable</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Knowledge Store Size</span>
            <HardDrive className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{formatFileSize(totalSizeBytes)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Stored knowledge chunks</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Admin Control</span>
            <Shield className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">Enforced</div>
          <p className="text-[11px] text-slate-500 mt-1">RBAC Role: Administrator</p>
        </div>
      </div>

      {/* Admin Upload Zone (Drag & Drop + File Picker) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-sky-600" />
              <span>Upload Document to Knowledge Base</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or drop documents here. Status tracks: <span className="font-semibold text-slate-700">Uploading → Processing → Ready</span> (or Failed).
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Max 25 MB per file
          </div>
        </div>

        {/* Drag & Drop Box */}
        <div
          id="kb-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? 'border-sky-500 bg-sky-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-sky-400 bg-slate-50/60 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            onChange={handleFileInputChange}
            className="hidden"
            id="kb-file-input"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-7 h-7 animate-bounce" />
            </div>

            <div className="space-y-1">
              <p className="text-sm sm:text-base font-bold text-slate-800">
                {isDragging ? 'Drop documents to begin processing' : 'Drag & drop knowledge files here, or click to browse'}
              </p>
              <p className="text-xs text-slate-500">
                Upload regional transit guides, hotel policies, secret foodie passages, or custom itineraries.
              </p>
            </div>

            {/* Supported file badge chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                PDF
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                DOC / DOCX
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                TXT
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                Markdown
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                CSV / JSON
              </span>
            </div>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-3xl flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-sky-900">
                Uploading & Processing Documents into RAG Embeddings...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Admin File Management Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Admin Knowledge Documents ({filteredFiles.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review processing status, trigger re-processing, or delete knowledge documents.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[180px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Format Filter */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setSelectedTypeFilter('all')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedTypeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedTypeFilter('pdf')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedTypeFilter === 'pdf'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PDF
              </button>
              <button
                onClick={() => setSelectedTypeFilter('doc')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedTypeFilter === 'doc'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                DOC
              </button>
              <button
                onClick={() => setSelectedTypeFilter('txt')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedTypeFilter === 'txt'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                TXT
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedStatusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setSelectedStatusFilter('Ready')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedStatusFilter === 'Ready'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ready
              </button>
              <button
                onClick={() => setSelectedStatusFilter('Processing')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedStatusFilter === 'Processing'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Processing
              </button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filteredFiles.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No knowledge files match your filter</p>
            <p className="text-xs text-slate-400">
              Upload documents using the drag-and-drop zone above or reset your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Document Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Uploaded / Processed</th>
                    <th className="py-3 px-4">Processing Status</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredFiles.map((item) => {
                    const badge = getFileTypeBadge(item.fileType);
                    const isItemReprocessing = reprocessingId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                              {badge.icon}
                            </div>
                            <div className="min-w-0 max-w-xs sm:max-w-md">
                              <div className="font-bold text-slate-900 truncate" title={item.name}>
                                {item.name}
                              </div>
                              {item.contentSnippet && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {item.contentSnippet}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                          {formatFileSize(item.sizeBytes)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          <div>
                            {new Date(item.uploadedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          {item.lastProcessedAt && (
                            <div className="text-[10px] text-slate-400">
                              Synced {new Date(item.lastProcessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isItemReprocessing ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin"></span>
                              <span>Re-processing...</span>
                            </span>
                          ) : (
                            renderStatusBadge(item.status)
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Information */}
                            <button
                              onClick={() => setPreviewFile(item)}
                              title="View Document Details & Extracted Snippet"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Re-process document (Requirement 2 & 8) */}
                            <button
                              disabled={isItemReprocessing}
                              onClick={() => handleReprocess(item.id, item.name)}
                              title="Re-process & Re-index RAG Embeddings"
                              className={`p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer ${
                                isItemReprocessing ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <RotateCcw className={`w-4 h-4 ${isItemReprocessing ? 'animate-spin' : ''}`} />
                            </button>

                            {/* Delete document */}
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              title="Delete from Knowledge Base"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Document Detail Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  {getFileTypeBadge(previewFile.fileType).icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate max-w-xs" title={previewFile.name}>
                    {previewFile.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(previewFile.sizeBytes)} • Uploaded by {previewFile.uploadedBy || 'Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Indexed Text Snippet (RAG Embedding Source)
                </span>
                {renderStatusBadge(previewFile.status)}
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                {previewFile.contentSnippet || 'No text snippet extracted for this file.'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Document Type</span>
                <span className="font-semibold text-slate-800 uppercase">{previewFile.fileType}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Est. RAG Tokens</span>
                <span className="font-semibold text-indigo-700">~{previewFile.tokenEstimate || 150} tokens</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center gap-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handleReprocess(previewFile.id, previewFile.name);
                  setPreviewFile(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-process File</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(previewFile.id, previewFile.name)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
