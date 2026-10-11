import React, { useState, useEffect, useRef } from 'react';
import { useModal } from '../hooks/useModal';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Sparkles, 
  Building2, 
  Users, 
  Zap, 
  CheckCircle2, 
  X, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Cpu,
  GraduationCap,
  Layers,
  Subtitles,
  RotateCcw,
  FastForward,
  Plus,
  Image as ImageIcon,
  Film,
  Radio,
  Coffee,
  Trophy,
  Upload,
  Lock,
  Trash2
} from 'lucide-react';
import { CAMPUS_TOUR_SCENES, VideoScene } from '../data/campusVideoData';
import { startAmbientSoundtrack, stopAmbientSoundtrack } from '../utils/ambientAudioSynth';

interface CampusVideoShowcaseProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreEvents?: () => void;
  isOrganizer?: boolean;
  onRoleRestrictedNotice?: () => void;
}

const STORAGE_CUSTOM_SCENES_KEY = 'campusconnect_custom_video_scenes_v1';

export const CampusVideoShowcase: React.FC<CampusVideoShowcaseProps> = ({
  isOpen,
  onClose,
  onExploreEvents,
  isOrganizer = false,
  onRoleRestrictedNotice
}) => {
  // Scene management
  const [scenes, setScenes] = useState<VideoScene[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_SCENES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return [...CAMPUS_TOUR_SCENES, ...parsed];
        }
      }
    } catch {
      // Fallback
    }
    return CAMPUS_TOUR_SCENES;
  });

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [elapsedSceneSeconds, setElapsedSceneSeconds] = useState(0);
  const [playerMode, setPlayerMode] = useState<'cinematic_reel' | 'video_stream'>('cinematic_reel');
  const [videoStreamFailed, setVideoStreamFailed] = useState(false);
  const [isAddingCustomScene, setIsAddingCustomScene] = useState(false);
  const [showStudentRestrictedPrompt, setShowStudentRestrictedPrompt] = useState(false);
  
  // Custom scene form state
  const [customTitle, setCustomTitle] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customNarration, setCustomNarration] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentScene = scenes[activeSceneIndex] || scenes[0];
  const sceneDuration = (currentScene.duration || 10) / playbackSpeed;

  // Handle ambient soundtrack when audio is unmuted and playing
  useEffect(() => {
    if (isOpen && isPlaying && !isMuted) {
      startAmbientSoundtrack();
    } else {
      stopAmbientSoundtrack();
    }
    return () => {
      stopAmbientSoundtrack();
    };
  }, [isOpen, isPlaying, isMuted]);

  // Main playback timer ticker for smooth progress and auto-advancing scenes
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const intervalTime = 100; // 100ms precision
    const timer = setInterval(() => {
      setElapsedSceneSeconds((prev) => {
        const next = prev + (0.1 * playbackSpeed);
        if (next >= sceneDuration) {
          // Advance to next scene or loop
          setActiveSceneIndex((idx) => (idx + 1) % scenes.length);
          return 0;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, playbackSpeed, sceneDuration, scenes.length]);

  // Reset elapsed timer when manually picking a scene
  const handleSelectScene = (index: number) => {
    setActiveSceneIndex(index);
    setElapsedSceneSeconds(0);
    setIsPlaying(true);
    setVideoStreamFailed(false);
  };

  // Keyboard shortcut listener for spacebar play/pause
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        setActiveSceneIndex((prev) => (prev + 1) % scenes.length);
        setElapsedSceneSeconds(0);
      } else if (e.code === 'ArrowLeft') {
        setActiveSceneIndex((prev) => (prev - 1 + scenes.length) % scenes.length);
        setElapsedSceneSeconds(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scenes.length]);

  useModal(isOpen, onClose);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.max(0, (elapsedSceneSeconds / sceneDuration) * 100));

  // Ken-Burns camera movement animation phase based on scene index
  const getKenBurnsClass = (idx: number) => {
    const variants = [
      'scale-110 translate-x-3 -translate-y-2',
      'scale-115 -translate-x-3 translate-y-1',
      'scale-120 translate-x-1 translate-y-3',
      'scale-110 -translate-x-2 -translate-y-2',
      'scale-115 translate-x-3 translate-y-2',
      'scale-118 -translate-x-2 translate-y-3',
      'scale-112 translate-x-3 -translate-y-1'
    ];
    return variants[idx % variants.length];
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleAddSceneClick = () => {
    if (!isOrganizer) {
      setShowStudentRestrictedPrompt(true);
      if (onRoleRestrictedNotice) {
        onRoleRestrictedNotice();
      }
      return;
    }
    setIsAddingCustomScene(!isAddingCustomScene);
  };

  const handleDeleteCustomScene = (sceneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOrganizer) return;
    const updated = scenes.filter((s) => s.id !== sceneId);
    setScenes(updated);
    try {
      const customOnly = updated.filter((s) => s.id.startsWith('custom-scene-'));
      localStorage.setItem(STORAGE_CUSTOM_SCENES_KEY, JSON.stringify(customOnly));
    } catch {
      // Ignore
    }
    if (activeSceneIndex >= updated.length) {
      setActiveSceneIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleAddCustomSceneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOrganizer) return;
    if (!customTitle.trim() || !customImageUrl.trim()) return;

    const newScene: VideoScene = {
      id: `custom-scene-${Date.now()}`,
      chapterTitle: customTitle.trim(),
      chapterBadge: 'Organizer Verified Stop',
      location: customLocation.trim() || 'VIT Main Campus',
      room: 'Academic & Research Wing',
      duration: 12,
      imageUrl: customImageUrl.trim(),
      fallbackImageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1400&auto=format&fit=crop&q=85',
      heading: customTitle.trim(),
      subtitle: customNarration.trim() || 'Official tour stop published by campus event organizer.',
      narration: customNarration.trim() || `Welcome to ${customTitle.trim()} at ${customLocation.trim() || 'VIT Campus'}.`,
      highlights: ['Official Organizer-curated stop', 'High-definition infrastructure showcase'],
      stats: [
        { label: 'Status', value: 'Verified' },
        { label: 'Publisher', value: 'Organizer' }
      ],
      perkAlert: 'Official Tour Addition'
    };

    const updated = [...scenes, newScene];
    setScenes(updated);

    try {
      const customOnly = updated.filter((s) => s.id.startsWith('custom-scene-'));
      localStorage.setItem(STORAGE_CUSTOM_SCENES_KEY, JSON.stringify(customOnly));
    } catch (err) {
      console.warn('Failed to persist custom scene:', err);
    }

    setCustomTitle('');
    setCustomLocation('');
    setCustomImageUrl('');
    setCustomNarration('');
    setIsAddingCustomScene(false);
    setActiveSceneIndex(updated.length - 1);
    setElapsedSceneSeconds(0);
  };

  return (
    <div 
      className="cc-overlay cc-static fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ink-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        className="cc-dialog relative w-full max-w-5xl bg-ink-950 border border-ink-800 text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 bg-ink-900/90 border-b border-ink-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/40 text-brand-400 flex items-center justify-center shadow-inner">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold text-brand-400 bg-brand-950/80 border border-brand-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Campus Video & Infrastructure Tour
                </span>
                <span className="hidden sm:inline text-xs text-ink-400 font-medium">Vellore Institute of Technology</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{currentScene.chapterTitle}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Player Mode Switcher */}
            <div className="hidden sm:flex items-center bg-ink-800/80 border border-ink-700/60 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPlayerMode('cinematic_reel');
                  setVideoStreamFailed(false);
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  playerMode === 'cinematic_reel'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-ink-400 hover:text-white'
                }`}
              >
                Cinematic Motion
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlayerMode('video_stream');
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  playerMode === 'video_stream'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-ink-400 hover:text-white'
                }`}
              >
                Live Video
              </button>
            </div>

            {/* Organizer-Restricted Add Scene Button */}
            <button
              onClick={handleAddSceneClick}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isOrganizer
                  ? 'bg-brand-600/30 hover:bg-brand-600/50 border-brand-500/60 text-brand-200'
                  : 'bg-ink-800/80 hover:bg-ink-700/80 border-ink-700 text-ink-400'
              }`}
              title={isOrganizer ? "Organizer: Add Campus Tour Stop" : "Event Organizer Access Only"}
            >
              {isOrganizer ? (
                <>
                  <Plus className="w-3.5 h-3.5 text-brand-400" />
                  <span className="hidden md:inline">Add Scene</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-brand-600 text-white font-extrabold">ORG</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-ink-400" />
                  <span className="hidden md:inline">Add Scene</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-ink-700 text-ink-300 font-bold">🔒 Org</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Student Permission Restriction Prompt Banner */}
        {showStudentRestrictedPrompt && !isOrganizer && (
          <div className="p-3 bg-amber-950/90 border-b border-amber-800/80 text-amber-200 text-xs flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Organizer Permission Required:</strong> Students cannot add or modify official campus video scenes. Switch to an <strong>Event Organizer</strong> account to publish custom stops.
              </span>
            </div>
            <button
              onClick={() => setShowStudentRestrictedPrompt(false)}
              className="p-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-300 text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Organizer Custom Scene Uploader Form Drawer */}
        {isAddingCustomScene && isOrganizer && (
          <form 
            onSubmit={handleAddCustomSceneSubmit}
            className="p-4 bg-ink-900 border-b border-ink-800 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-150"
          >
            <div>
              <label className="text-2xs font-bold text-ink-400 block mb-1">Scene Title</label>
              <input
                type="text"
                placeholder="e.g. Electric Vehicle Dynamometer"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-ink-950 border border-ink-700 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-2xs font-bold text-ink-400 block mb-1">Campus Location / Room</label>
              <input
                type="text"
                placeholder="e.g. Technology Tower 3rd Floor"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-ink-950 border border-ink-700 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-2xs font-bold text-ink-400 block mb-1">Photo / Video Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-ink-950 border border-ink-700 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Publish Scene</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCustomScene(false)}
                className="px-2.5 py-1.5 bg-ink-800 hover:bg-ink-700 text-ink-400 text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Video Canvas & Motion Stage */}
        <div className="relative aspect-video sm:aspect-[16/9] max-h-[460px] bg-black flex items-center justify-center overflow-hidden group select-none">
          
          {/* PLAYER 1: LIVE VIDEO STREAM (with auto-fallback to Cinematic Photo Reel on error) */}
          {playerMode === 'video_stream' && !videoStreamFailed && currentScene.videoClipUrl ? (
            <video
              ref={videoRef}
              src={currentScene.videoClipUrl}
              autoPlay={isPlaying}
              loop
              muted={isMuted}
              playsInline
              onError={() => {
                console.warn('Video clip stream failed, falling back to cinematic motion reel.');
                setVideoStreamFailed(true);
              }}
              className="w-full h-full object-cover"
            />
          ) : (
            /* PLAYER 2: CINEMATIC DYNAMIC MOTION REEL (100% Reliable HD Photo Engine with Ken-Burns Camera movement) */
            <div className="relative w-full h-full overflow-hidden bg-ink-950 flex items-center justify-center">
              <img
                key={`${currentScene.id}-${activeSceneIndex}`}
                src={currentScene.imageUrl}
                alt={currentScene.heading}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = currentScene.fallbackImageUrl;
                }}
                className={`w-full h-full object-cover transition-transform ease-out duration-10000 filter brightness-90 contrast-105 ${
                  isPlaying ? getKenBurnsClass(activeSceneIndex) : 'scale-100'
                }`}
              />

              {/* Dynamic Lens Flare / Sun Shimmer overlay */}
              <div className="absolute top-0 right-0 w-full h-full bg-radial from-brand-500/10 via-transparent to-transparent pointer-events-none mix-blend-screen" />
            </div>
          )}

          {/* Cinematic Vignette & Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-ink-950/50 pointer-events-none" />

          {/* Top Left Live Campus Telemetry Badges */}
          <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2 pointer-events-none z-10">
            <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg">
              <Building2 className="w-3.5 h-3.5 text-brand-400" />
              <span>{currentScene.location}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentScene.room}</span>
            </div>
            {currentScene.perkAlert && (
              <div className="hidden sm:flex px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-xs font-bold text-emerald-300 items-center gap-1 shadow-lg">
                <Coffee className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentScene.perkAlert}</span>
              </div>
            )}
          </div>

          {/* Top Right Tour Quality Indicator */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-2 pointer-events-none z-10">
            <div className="text-2xs font-mono text-brand-400 font-bold px-2 py-0.5 rounded bg-black/70 border border-brand-500/40 backdrop-blur-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
              <span>HD 1080p • 60 FPS</span>
            </div>
          </div>

          {/* Center Lower-Third Cinematic Title Card */}
          <div className="absolute bottom-16 left-4 right-4 sm:left-6 sm:right-6 pointer-events-none z-10 transition-all duration-300">
            <div className="max-w-2xl bg-black/60 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-xl shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-2xs font-extrabold uppercase tracking-wide bg-brand-600 text-white">
                  {currentScene.chapterBadge}
                </span>
                <span className="text-xs text-ink-300 font-medium">
                  Scene {activeSceneIndex + 1} of {scenes.length}
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-tight">
                {currentScene.heading}
              </h3>
              <p className="text-xs text-ink-300 mt-1 line-clamp-2 leading-relaxed">
                {currentScene.subtitle}
              </p>

              {/* Closed Caption Narration Overlay */}
              {showCaptions && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-start gap-2 text-xs text-amber-200/90 font-mono bg-black/40 px-2.5 py-1.5 rounded-lg">
                  <Subtitles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="italic leading-snug">"{currentScene.narration}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Scrubbable Video Progress Bar */}
          <div className="absolute bottom-12 left-0 right-0 px-4 sm:px-6 z-20">
            <div 
              className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-full cursor-pointer transition-all relative overflow-hidden group/bar"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, clickX / rect.width));
                setElapsedSceneSeconds(pct * sceneDuration);
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-brand-600 to-amber-500 rounded-full transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Bottom Floating Video Control Bar */}
          <div className="absolute bottom-2.5 left-4 right-4 sm:left-6 sm:right-6 flex items-center justify-between p-2 rounded-xl bg-ink-950/80 backdrop-blur-md border border-white/10 z-20">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors cursor-pointer shadow-md"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSceneIndex((idx) => (idx - 1 + scenes.length) % scenes.length);
                  setElapsedSceneSeconds(0);
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-ink-200 transition-colors cursor-pointer"
                title="Previous Chapter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSceneIndex((idx) => (idx + 1) % scenes.length);
                  setElapsedSceneSeconds(0);
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-ink-200 transition-colors cursor-pointer"
                title="Next Chapter"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  !isMuted 
                    ? 'bg-brand-600/30 border border-brand-500 text-brand-300' 
                    : 'bg-white/10 hover:bg-white/20 text-ink-300'
                }`}
                title={isMuted ? 'Unmute Ambient Tour Soundtrack' : 'Mute Soundtrack'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setShowCaptions(!showCaptions)}
                className={`p-2 rounded-lg transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs font-semibold ${
                  showCaptions 
                    ? 'bg-amber-600/30 border border-amber-500 text-amber-300' 
                    : 'bg-white/10 hover:bg-white/20 text-ink-400'
                }`}
                title="Toggle Narration Captions"
              >
                <Subtitles className="w-3.5 h-3.5" />
                <span className="text-2xs">CC</span>
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Playback Speed Selector */}
              <div className="flex items-center bg-ink-900 border border-ink-800 rounded-lg p-0.5 text-xs font-bold">
                {[1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      playbackSpeed === spd 
                        ? 'bg-brand-600 text-white' 
                        : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-ink-200 transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chapters & Interactive Tour Stops Grid */}
        <div className="p-4 sm:p-5 bg-ink-900 border-t border-ink-800 space-y-4 overflow-y-auto max-h-[300px]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-ink-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              <span>Tour Destinations & Campus Infrastructure ({scenes.length})</span>
            </h4>
            <span className="text-xs text-ink-400">Click any stop to jump instantly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {scenes.map((sc, idx) => {
              const isSelected = idx === activeSceneIndex;
              const isCustom = sc.id.startsWith('custom-scene-');
              return (
                <div
                  key={sc.id}
                  onClick={() => handleSelectScene(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 group relative overflow-hidden ${
                    isSelected
                      ? 'bg-brand-950/60 border-brand-500/80 ring-1 ring-brand-500/50 shadow-md'
                      : 'bg-ink-800/60 border-ink-700/60 hover:bg-ink-800 text-ink-300'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-ink-700 relative">
                    <img
                      src={sc.imageUrl}
                      alt={sc.chapterTitle}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = sc.fallbackImageUrl;
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-brand-600/30 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`text-2xs font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-brand-600 text-white' : 'bg-ink-700 text-ink-300'
                        }`}>
                          CH {idx + 1}
                        </span>
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-brand-400' : 'text-white'}`}>
                          {sc.chapterTitle}
                        </span>
                      </div>

                      {/* Organizer delete button for custom-added stops */}
                      {isOrganizer && isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomScene(sc.id, e)}
                          className="p-1 text-ink-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                          title="Delete Custom Tour Stop"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-ink-400 line-clamp-1">
                      {sc.location} • {sc.room}
                    </p>
                    
                    {/* Live Highlight Stat Pills */}
                    {sc.stats && sc.stats.length > 0 && (
                      <div className="flex items-center gap-2 mt-1 text-2xs text-ink-400">
                        <span>{sc.stats[0].label}: <strong className="text-ink-200">{sc.stats[0].value}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Features & Call to action */}
          <div className="pt-3 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Buffering & Instant Playback</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified VIT Infrastructure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{isOrganizer ? "Organizer Mode Active" : "Student View"}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (onExploreEvents) onExploreEvents();
              }}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
            >
              <span>Explore Campus Events & RSVPs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
