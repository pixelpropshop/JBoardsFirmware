import { useState, useEffect } from 'react';
import { filesService } from '../services/filesService';
import { FileInfo, FileType, StorageInfo } from '../types/files';

export default function Files() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<FileType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [filesData, storageData] = await Promise.all([
        filesService.getFiles(),
        filesService.getStorageInfo(),
      ]);
      setFiles(filesData);
      setStorage(storageData);
    } catch (err) {
      setError('Failed to load files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const result = await filesService.uploadFile(file);
      if (result.success && result.file) {
        setFiles([...files, result.file]);
        if (storage) {
          setStorage({
            ...storage,
            usedBytes: storage.usedBytes + result.file.size,
            freeBytes: storage.freeBytes - result.file.size,
          });
        }
      }
      event.target.value = '';
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (!confirm(`Delete "${file.filename}"?`)) return;

    try {
      setError(null);
      const result = await filesService.deleteFile(file.path);
      if (result.success) {
        setFiles(files.filter((f) => f.path !== file.path));
        if (storage) {
          setStorage({
            ...storage,
            usedBytes: storage.usedBytes - file.size,
            freeBytes: storage.freeBytes + file.size,
          });
        }
      }
    } catch (err) {
      setError('Failed to delete file');
      console.error(err);
    }
  };

  const handleDownload = (file: FileInfo) => {
    const url = filesService.getDownloadUrl(file.path);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = async (file: FileInfo) => {
    // Only preview text-based files
    if (![FileType.CONFIG, FileType.LOG, FileType.TEXT].includes(file.type)) {
      setError('Preview not available for this file type');
      return;
    }

    try {
      setLoadingPreview(true);
      setPreviewFile(file);
      const result = await filesService.previewFile(file.path);
      if (result.success) {
        setPreviewContent(result.content);
      } else {
        setError(result.message || 'Failed to preview file');
      }
    } catch (err) {
      setError('Failed to preview file');
      console.error(err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (type: FileType): string => {
    switch (type) {
      case FileType.AUDIO:
        return '🎵';
      case FileType.FSEQ:
        return '🎄';
      case FileType.CONFIG:
        return '⚙️';
      case FileType.LOG:
        return '📋';
      case FileType.BACKUP:
        return '💾';
      case FileType.TEXT:
        return '📄';
      default:
        return '📁';
    }
  };

  const getFileTypeBadge = (type: FileType): JSX.Element => {
    const colors = {
      [FileType.AUDIO]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
      [FileType.FSEQ]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      [FileType.CONFIG]: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      [FileType.LOG]: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      [FileType.BACKUP]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
      [FileType.TEXT]: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
      [FileType.OTHER]: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    };

    return (
      <span className={`px-2 py-0.5 text-xs rounded ${colors[type]}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  // Filter and sort files
  let filteredFiles = files;
  
  // Apply type filter
  if (typeFilter !== 'all') {
    filteredFiles = filteredFiles.filter((f) => f.type === typeFilter);
  }

  // Apply search filter
  if (searchQuery) {
    filteredFiles = filteredFiles.filter((f) =>
      f.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply sorting
  filteredFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.filename.localeCompare(b.filename);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
        comparison = (a.lastModified || '').localeCompare(b.lastModified || '');
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // File type counts
  const typeCounts = {
    all: files.length,
    [FileType.AUDIO]: files.filter((f) => f.type === FileType.AUDIO).length,
    [FileType.FSEQ]: files.filter((f) => f.type === FileType.FSEQ).length,
    [FileType.CONFIG]: files.filter((f) => f.type === FileType.CONFIG).length,
    [FileType.LOG]: files.filter((f) => f.type === FileType.LOG).length,
    [FileType.BACKUP]: files.filter((f) => f.type === FileType.BACKUP).length,
    [FileType.OTHER]: files.filter((f) => f.type === FileType.OTHER).length + files.filter((f) => f.type === FileType.TEXT).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading files...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">File Manager</h1>
        <p className="text-gray-500">Manage files on SD card</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Storage Info */}
      {storage && (
        <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-medium">Storage</h2>
              <p className="text-sm text-gray-500">
                {formatFileSize(storage.usedBytes)} used of {formatFileSize(storage.totalBytes)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round((storage.usedBytes / storage.totalBytes) * 100)}%</div>
              <div className="text-sm text-gray-500">{formatFileSize(storage.freeBytes)} free</div>
            </div>
          </div>
          
          {/* Storage Progress Bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${(storage.usedBytes / storage.totalBytes) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        {/* Upload Button */}
        <label className="flex-shrink-0">
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <div className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 cursor-pointer flex items-center gap-2 disabled:opacity-50">
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload File
              </>
            )}
          </div>
        </label>

        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        </div>

        {/* Sort */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split('-');
            setSortBy(sort as 'name' | 'size' | 'date');
            setSortOrder(order as 'asc' | 'desc');
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="size-asc">Size (Small)</option>
          <option value="size-desc">Size (Large)</option>
          <option value="date-desc">Date (Newest)</option>
          <option value="date-asc">Date (Oldest)</option>
        </select>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
            typeFilter === 'all'
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All <span className="ml-1">({typeCounts.all})</span>
        </button>
        <button
          onClick={() => setTypeFilter(FileType.AUDIO)}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
            typeFilter === FileType.AUDIO
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          🎵 Audio <span className="ml-1">({typeCounts[FileType.AUDIO]})</span>
        </button>
        <button
          onClick={() => setTypeFilter(FileType.FSEQ)}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
            typeFilter === FileType.FSEQ
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          🎄 FSEQ <span className="ml-1">({typeCounts[FileType.FSEQ]})</span>
        </button>
        <button
          onClick={() => setTypeFilter(FileType.CONFIG)}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
            typeFilter === FileType.CONFIG
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          ⚙️ Config <span className="ml-1">({typeCounts[FileType.CONFIG]})</span>
        </button>
        <button
          onClick={() => setTypeFilter(FileType.LOG)}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
            typeFilter === FileType.LOG
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          📋 Logs <span className="ml-1">({typeCounts[FileType.LOG]})</span>
        </button>
        <button
          onClick={() => setTypeFilter(FileType.BACKUP)}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
            typeFilter === FileType.BACKUP
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          💾 Backups <span className="ml-1">({typeCounts[FileType.BACKUP]})</span>
        </button>
        <button
          onClick={() => setTypeFilter(FileType.OTHER)}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
            typeFilter === FileType.OTHER
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          📁 Other <span className="ml-1">({typeCounts[FileType.OTHER]})</span>
        </button>
      </div>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-8 bg-white/60 dark:bg-gray-950/60 text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p>{searchQuery || typeFilter !== 'all' ? 'No files match your filters' : 'No files found'}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/60 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">{getFileIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{file.filename}</span>
                      {getFileTypeBadge(file.type)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="hidden sm:inline">{formatDate(file.lastModified)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  {[FileType.CONFIG, FileType.LOG, FileType.TEXT].includes(file.type) && (
                    <button
                      onClick={() => handlePreview(file)}
                      className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      title="Preview"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    title="Download"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(previewFile.type)}</span>
                <div>
                  <h3 className="text-xl font-semibold">{previewFile.filename}</h3>
                  <p className="text-sm text-gray-500">{previewFile.path}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewFile(null);
                  setPreviewContent('');
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingPreview ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading preview...</div>
                </div>
              ) : (
                <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap break-words">
                  {previewContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
