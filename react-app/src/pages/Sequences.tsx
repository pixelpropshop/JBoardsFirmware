import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sequenceService } from '../services/sequenceService';
import { audioService } from '../services/audioService';
import type { Sequence, EffectSequence } from '../types/sequence';
import type { AudioFile } from '../types/audio';
import SequenceCard from '../components/SequenceCard';

const Sequences: React.FC = () => {
  const navigate = useNavigate();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'effect' | 'fseq'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // FSEQ Edit modal state
  const [showFseqEditModal, setShowFseqEditModal] = useState(false);
  const [editingFseq, setEditingFseq] = useState<string | null>(null);
  const [fseqEditName, setFseqEditName] = useState('');
  const [fseqEditAudioUrl, setFseqEditAudioUrl] = useState('');
  const [fseqEditLoop, setFseqEditLoop] = useState(false);
  const [savingFseq, setSavingFseq] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loadingAudioFiles, setLoadingAudioFiles] = useState(false);

  useEffect(() => {
    loadSequences();
  }, []);

  // Load audio files when edit modal opens
  useEffect(() => {
    if (showFseqEditModal) {
      loadAudioFiles();
    }
  }, [showFseqEditModal]);

  const loadAudioFiles = async () => {
    try {
      setLoadingAudioFiles(true);
      const files = await audioService.getAudioFiles();
      setAudioFiles(files);
    } catch (err) {
      console.error('Error loading audio files:', err);
      // Don't show error to user, just continue with empty list
    } finally {
      setLoadingAudioFiles(false);
    }
  };

  const loadSequences = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sequenceService.getSequences();
      setSequences(data);
    } catch (err) {
      setError('Failed to load sequences');
      console.error('Error loading sequences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (id: string) => {
    try {
      const result = await sequenceService.playSequence(id);
      if (result.success) {
        // Could show a toast notification here
        console.log('Playing sequence:', id);
      } else {
        setError(result.message || 'Failed to play sequence');
      }
    } catch (err) {
      setError('Failed to play sequence');
      console.error('Error playing sequence:', err);
    }
  };

  const handleEdit = (id: string) => {
    const sequence = sequences.find((s) => s.id === id);
    if (!sequence) {
      setError('Sequence not found');
      return;
    }

    // FSEQ sequences open edit modal, effect sequences navigate to editor
    if (sequence.type === 'fseq') {
      setEditingFseq(id);
      setFseqEditName(sequence.name);
      setFseqEditAudioUrl(sequence.audioUrl || '');
      setFseqEditLoop(sequence.loop ?? false);
      setShowFseqEditModal(true);
    } else {
      navigate(`/sequences/edit/${id}`);
    }
  };

  const handleDuplicate = async (id: string) => {
    const sequence = sequences.find((s) => s.id === id);
    if (!sequence) {
      setError('Sequence not found');
      return;
    }

    // Only effect sequences can be duplicated (FSEQ requires file upload)
    if (sequence.type === 'fseq') {
      setError('FSEQ sequences cannot be duplicated. Please upload a new file.');
      return;
    }

    try {
      // Create a copy with " (Copy)" appended to name
      const result = await sequenceService.createSequence(
        `${sequence.name} (Copy)`,
        sequence.description,
        sequence.steps,
        sequence.loop
      );

      if (result.success && result.sequence) {
        // Add to list and navigate to editor
        setSequences([...sequences, result.sequence]);
        navigate(`/sequences/edit/${result.sequence.id}`);
      } else {
        setError(result.message || 'Failed to duplicate sequence');
      }
    } catch (err) {
      setError('Failed to duplicate sequence');
      console.error('Error duplicating sequence:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      const result = await sequenceService.deleteSequence(id);
      if (result.success) {
        setSequences(sequences.filter((s) => s.id !== id));
        setDeleteConfirm(null);
      } else {
        setError(result.message || 'Failed to delete sequence');
      }
    } catch (err) {
      setError('Failed to delete sequence');
      console.error('Error deleting sequence:', err);
    }
  };

  const handleNewSequence = () => {
    navigate('/sequences/new');
  };

  const handleExport = (id: string) => {
    const sequence = sequences.find((s) => s.id === id);
    if (!sequence) {
      setError('Sequence not found');
      return;
    }

    // Only effect sequences can be exported as JSON
    if (sequence.type === 'fseq') {
      setError('FSEQ sequences cannot be exported as JSON. Download the .fseq file instead.');
      return;
    }

    try {
      // Create JSON blob
      const json = JSON.stringify(sequence, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sequence.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export sequence');
      console.error('Error exporting sequence:', err);
    }
  };

  const handleImport = () => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedSequence = JSON.parse(text) as EffectSequence;

        // Validate sequence structure
        if (!importedSequence.name || !Array.isArray(importedSequence.steps)) {
          setError('Invalid sequence file format');
          return;
        }

        // Create sequence with imported data (append (Imported) to name)
        const result = await sequenceService.createSequence(
          `${importedSequence.name} (Imported)`,
          importedSequence.description,
          importedSequence.steps,
          importedSequence.loop ?? false
        );

        if (result.success && result.sequence) {
          setSequences([...sequences, result.sequence]);
          navigate(`/sequences/edit/${result.sequence.id}`);
        } else {
          setError(result.message || 'Failed to import sequence');
        }
      } catch (err) {
        setError('Failed to import sequence. Invalid JSON file.');
        console.error('Error importing sequence:', err);
      }
    };
    input.click();
  };

  const handleUploadFseq = () => {
    setShowUploadModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.fseq')) {
      setError('Please select a valid .fseq file');
      return;
    }

    setUploadFile(file);
    // Auto-fill name from filename (remove .fseq extension)
    const baseName = file.name.replace(/\.fseq$/i, '');
    setUploadName(baseName);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      setError('Please select a file');
      return;
    }

    if (!uploadName.trim()) {
      setError('Sequence name is required');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const result = await sequenceService.uploadFseq(
        uploadFile,
        uploadName.trim(),
        uploadDescription.trim() || undefined
      );

      if (result.success && result.sequence) {
        setSequences([...sequences, result.sequence]);
        setShowUploadModal(false);
        resetUploadForm();
      } else {
        setError(result.message || 'Failed to upload FSEQ file');
      }
    } catch (err) {
      setError('Failed to upload FSEQ file');
      console.error('Error uploading FSEQ:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleFseqEditSubmit = async () => {
    if (!editingFseq) return;

    if (!fseqEditName.trim()) {
      setError('Sequence name is required');
      return;
    }

    try {
      setSavingFseq(true);
      setError(null);

      const result = await sequenceService.updateFseq(
        editingFseq,
        fseqEditName.trim(),
        fseqEditAudioUrl.trim() || undefined,
        fseqEditLoop
      );

      if (result.success && result.sequence) {
        // Update sequence in list
        setSequences(sequences.map(s => s.id === editingFseq ? result.sequence! : s));
        setShowFseqEditModal(false);
        setEditingFseq(null);
      } else {
        setError(result.message || 'Failed to update FSEQ sequence');
      }
    } catch (err) {
      setError('Failed to update FSEQ sequence');
      console.error('Error updating FSEQ:', err);
    } finally {
      setSavingFseq(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadName('');
    setUploadDescription('');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading sequences...</div>
        </div>
      </div>
    );
  }

  // Filter sequences based on selected type
  const filteredSequences = sequences.filter((seq) => {
    if (filterType === 'all') return true;
    return seq.type === filterType;
  });

  const effectCount = sequences.filter((s) => s.type === 'effect').length;
  const fseqCount = sequences.filter((s) => s.type === 'fseq').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sequences</h1>
          <p className="text-gray-600 dark:text-gray-400">Create timed playlists of LED effects</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUploadFseq}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload FSEQ
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import
          </button>
          <button
            onClick={handleNewSequence}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Sequence
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          All
          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
            filterType === 'all'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {sequences.length}
          </span>
        </button>
        <button
          onClick={() => setFilterType('effect')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterType === 'effect'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          🎵 Effect Sequences
          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
            filterType === 'effect'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {effectCount}
          </span>
        </button>
        <button
          onClick={() => setFilterType('fseq')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterType === 'fseq'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          🎄 FSEQ Sequences
          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
            filterType === 'fseq'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {fseqCount}
          </span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {filteredSequences.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {filterType === 'fseq' ? '�' : '�🎵'}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {sequences.length === 0 
              ? 'No sequences yet' 
              : `No ${filterType === 'fseq' ? 'FSEQ' : 'effect'} sequences`}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {sequences.length === 0 
              ? 'Create your first sequence to get started with timed effect playlists'
              : filterType === 'fseq'
              ? 'Upload FSEQ files from xLights to get started'
              : 'Create effect sequences using the built-in LED effects'}
          </p>
          <button
            onClick={handleNewSequence}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create First Sequence
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSequences.map((sequence) => (
            <div key={sequence.id} className="relative">
              <SequenceCard
                sequence={sequence}
                onPlay={handlePlay}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
                onDelete={handleDelete}
              />
              {deleteConfirm === sequence.id && (
                <div className="absolute top-2 right-2 bg-red-600 dark:bg-red-600 text-white text-sm px-3 py-1 rounded-lg shadow-lg">
                  Click again to confirm delete
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload FSEQ Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-300 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Upload FSEQ Sequence</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  FSEQ File <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  type="file"
                  accept=".fseq"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {uploadFile && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Sequence Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sequence Name <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Christmas Carol Medley"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  maxLength={64}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <div className="p-6 border-t border-gray-300 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
                disabled={uploading || !uploadFile || !uploadName.trim()}
              >
                {uploading ? 'Uploading...' : 'Upload Sequence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FSEQ Edit Modal */}
      {showFseqEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-300 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit FSEQ Sequence Settings</h3>
                <button
                  onClick={() => {
                    setShowFseqEditModal(false);
                    setEditingFseq(null);
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Sequence Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sequence Name <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={fseqEditName}
                  onChange={(e) => setFseqEditName(e.target.value)}
                  placeholder="Christmas Carol Medley"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  maxLength={64}
                />
              </div>

              {/* Audio File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Audio File (from SD Card)
                </label>
                <select
                  value={fseqEditAudioUrl}
                  onChange={(e) => setFseqEditAudioUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  disabled={loadingAudioFiles}
                >
                  <option value="">No audio</option>
                  {loadingAudioFiles ? (
                    <option disabled>Loading audio files...</option>
                  ) : audioFiles.length === 0 ? (
                    <option disabled>No audio files found</option>
                  ) : (
                    audioFiles.map((file) => (
                      <option key={file.filename} value={`/sd/audio/${file.filename}`}>
                        {file.filename}
                        {file.duration ? ` (${Math.floor(file.duration / 60)}:${(file.duration % 60).toString().padStart(2, '0')})` : ''}
                      </option>
                    ))
                  )}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  {audioFiles.length === 0 && !loadingAudioFiles
                    ? 'No audio files available. Upload audio files from the Audio page.'
                    : 'Select an audio file from the SD card to play with this sequence'}
                </p>
              </div>

              {/* Loop Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="fseq-edit-loop"
                  checked={fseqEditLoop}
                  onChange={(e) => setFseqEditLoop(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="fseq-edit-loop" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Loop sequence (restart from beginning when finished)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-300 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowFseqEditModal(false);
                  setEditingFseq(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded"
                disabled={savingFseq}
              >
                Cancel
              </button>
              <button
                onClick={handleFseqEditSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                disabled={savingFseq || !fseqEditName.trim()}
              >
                {savingFseq ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredSequences.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-500">
          Showing {filteredSequences.length} of {sequences.length} {sequences.length === 1 ? 'sequence' : 'sequences'}
          {filterType !== 'all' && (
            <button
              onClick={() => setFilterType('all')}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
            >
              Show all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Sequences;
