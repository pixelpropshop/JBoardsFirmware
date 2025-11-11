import { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { AudioFile } from '../types/audio';
import { api } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Audio() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [audioFrequencies, setAudioFrequencies] = useState<number[]>(new Array(32).fill(0));
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    loadAudioFiles();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const loadAudioFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const files = await audioService.getAudioFiles();
      setAudioFiles(files);
    } catch (err) {
      setError('Failed to load audio files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
      setError('Invalid file type. Please upload MP3, WAV, or OGG files.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await audioService.uploadAudioFile(file);
      await loadAudioFiles();
      // Reset file input
      event.target.value = '';
    } catch (err) {
      setError('Failed to upload audio file');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (filename: string) => {
    setConfirmDelete(filename);
  };

  const performDelete = async () => {
    if (!confirmDelete) return;

    try {
      setError(null);
      await audioService.deleteAudioFile(confirmDelete);
      await loadAudioFiles();
    } catch (err) {
      setError('Failed to delete audio file');
      console.error(err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAudioUrl = (filename: string): string => {
    const baseUrl = api.getBaseUrl();
    return `${baseUrl}/api/files/audio/stream/${encodeURIComponent(filename)}`;
  };

  const handlePlay = async (filename: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    // If clicking the same file that's playing, toggle pause
    if (currentlyPlaying === filename && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    // Load and play new file
    const url = getAudioUrl(filename);
    audio.src = url;
    setCurrentlyPlaying(filename);
    
    try {
      await audio.play();
      setIsPlaying(true);
      setupAudioVisualization();
    } catch (err) {
      console.error('Failed to play audio:', err);
      setError('Failed to play audio file');
    }
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentlyPlaying(null);
    setCurrentTime(0);
    setAudioFrequencies(new Array(32).fill(0));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const setupAudioVisualization = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Create audio context and analyser
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaElementSource(audio);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    // Start visualization loop
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVisualization = () => {
      analyser.getByteFrequencyData(dataArray);
      setAudioFrequencies(Array.from(dataArray));
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };

    updateVisualization();
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">Audio Files</h1>
        <p className="text-gray-500">Manage audio files on SD card</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      )}

      {/* Audio Player */}
      {currentlyPlaying && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg className="w-5 h-5 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="font-medium truncate">{currentlyPlaying}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={isPlaying ? handlePause : () => handlePlay(currentlyPlaying)}
                className="p-2 rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleStop}
                className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                title="Stop"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="mb-3 h-16 bg-gray-100 dark:bg-gray-900 rounded flex items-end gap-1 px-2 overflow-hidden">
            {audioFrequencies.map((freq, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-brand-600 to-brand-400 rounded-t transition-all duration-75"
                style={{ height: `${(freq / 255) * 100}%`, minHeight: '2px' }}
              />
            ))}
          </div>

          {/* Seek Bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatDuration(Math.floor(currentTime))}</span>
              <span>{formatDuration(Math.floor(duration))}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <span className="text-xs text-gray-500 w-10 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60 mb-4">
        <h2 className="text-lg font-medium mb-3">Upload Audio File</h2>
        <div className="flex items-center gap-3">
          <label className="flex-1">
            <input
              type="file"
              accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-brand-600 file:text-white hover:file:bg-brand-700 file:cursor-pointer disabled:opacity-50"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">Supported formats: MP3, WAV, OGG</p>
      </div>

      {/* Audio Files List */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/60 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-medium">Audio Files ({audioFiles.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading audio files...</div>
        ) : audioFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No audio files found. Upload a file to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {audioFiles.map((file) => (
              <div
                key={file.filename}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
              <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-5 h-5 text-brand-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      />
                    </svg>
                    <span className="font-medium truncate">{file.filename}</span>
                    {currentlyPlaying === file.filename && (
                      <span className="flex items-center gap-1 text-xs text-brand-500">
                        <span className="inline-block w-1 h-1 bg-brand-500 rounded-full animate-pulse"></span>
                        Playing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    {file.duration && <span>{formatDuration(file.duration)}</span>}
                    {file.uploadedAt && (
                      <span className="hidden sm:inline">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handlePlay(file.filename)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title={currentlyPlaying === file.filename && isPlaying ? 'Pause' : 'Play'}
                  >
                    {currentlyPlaying === file.filename && isPlaying ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(file.filename)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title="Delete file"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Audio File"
          message={`Are you sure you want to delete "${confirmDelete}"? This action cannot be undone.`}
          onConfirm={performDelete}
          onCancel={() => setConfirmDelete(null)}
          dangerous
        />
      )}
    </div>
  );
}
