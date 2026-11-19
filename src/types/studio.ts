export type AspectRatio = '16:9' | '9:16';
export type VideoResolution = '720p' | '1080p' | '4k';
export type VideoDuration = '8s' | '9s' | '10s' | '12s';
export type LoopMode = 'crossfade' | 'pingpong' | 'standard';

export interface ReferenceAsset {
  id: string;
  filename: string;
  src: string;
  title: string;
  category: string;
  aspect: string;
  notes: string;
  isCustom?: boolean;
  dataUrl?: string;
}

export interface VideoTake {
  id: string;
  interactionId: string;
  videoUrl: string;
  mimeType: string;
  sizeBytes: number;
  aspectRatio: AspectRatio;
  duration: string;
  resolution: string;
  prompt: string;
  label: string;
  createdAt: string;
}

export interface GradeSettings {
  brightness: number; // default 0.65
  contrast: number; // default 1.15
  canvasOpacity: number; // 0 to 1
  vignetteStrength: number; // 0 to 1
  flashlightEnabled: boolean;
  flashlightRadius: number; // px
  flashlightIntensity: number; // 0 to 1
  showHeroUiOverlay: boolean;
  loopMode: LoopMode;
  crossfadeDuration: number; // seconds, default 1.0
  playbackRate: number; // default 1.0
}

export interface DirectorPreset {
  id: string;
  title: string;
  aspectRatio: AspectRatio;
  duration: VideoDuration;
  resolution: VideoResolution;
  prompt: string;
  recommendedRefs: string[];
}
