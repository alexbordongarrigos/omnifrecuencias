
export type CategoryId = 'all' | 'pyramid' | 'body' | 'planetary' | 'solfeggio' | 'brain' | 'synergy' | 'bioresonance' | 'music' | 'chakras' | 'rhythms' | 'microtonal';

export interface FrequencyItem {
  id: string;
  hz: string;
  numericalHz: number; // For sorting
  name: string;
  category: CategoryId;
  description: string;
  detailedUsage: string;
  evidence: string;
  location?: string;
  binauralBeatHz?: number;
  harmonics?: number[];
  cymaticPatternName?: string;
}

export interface SortOption {
  label: string;
  value: 'hz-asc' | 'hz-desc' | 'name-asc' | 'location';
}

export const CATEGORIES: { id: CategoryId; label: string; iconName: string; color: string }[] = [
  { id: 'all', label: 'Todas', iconName: 'Layers', color: 'text-slate-200' },
  { id: 'solfeggio', label: 'Solfeggio', iconName: 'Music', color: 'text-purple-400' },
  { id: 'planetary', label: 'Cósmicas', iconName: 'Orbit', color: 'text-cyan-400' },
  { id: 'body', label: 'Cuerpo & Orgánicas', iconName: 'Activity', color: 'text-red-400' },
  { id: 'bioresonance', label: 'Rife & Patógenos', iconName: 'Shield', color: 'text-orange-400' },
  { id: 'brain', label: 'Neuroacústica', iconName: 'Brain', color: 'text-pink-400' },
  { id: 'pyramid', label: 'Megalitos', iconName: 'Pyramid', color: 'text-amber-500' },
  { id: 'music', label: 'Música Sagrada', iconName: 'Radio', color: 'text-indigo-400' },
  { id: 'chakras', label: 'Chakras & Vórtex', iconName: 'Sun', color: 'text-yellow-400' },
  { id: 'rhythms', label: 'Ritmos e Isocrónicos', iconName: 'Volume2', color: 'text-emerald-400' },
  { id: 'microtonal', label: 'Pitagóricas & Microtonales', iconName: 'Sliders', color: 'text-blue-400' },
  { id: 'synergy', label: 'Sinergias Maestras', iconName: 'Zap', color: 'text-teal-400' },
];

// --- Audio Engine Types ---

export type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface TransitionVariant {
  frequency: number;
  volume: number;
  panX: number;
  panY: number;
  panZ: number;
  type: WaveType;
  crestValleyRatio?: number;
  dutyCycle?: number;
}

export interface TransitionState {
  enabled: boolean;
  start: TransitionVariant;
  end: TransitionVariant;
  duration: number; // in seconds
  loopCount: number | 'infinite';
  isPlaying: boolean;
  progress: number; // 0 to 1
  currentLoop: number;
  direction: 'forward' | 'backward'; // For looping back and forth
}

export interface OscillatorState {
  id: string;
  frequency: number;
  type: WaveType;
  volume: number; // 0 to 1
  
  // Spatial Audio (3D)
  panX: number; // -1 (Left) to 1 (Right)
  panY: number; // -1 (Down) to 1 (Up)
  panZ: number; // -1 (Back) to 1 (Front)

  isPlaying: boolean;
  name?: string;

  // Crossfade for wave types
  type2?: WaveType;
  typeMix?: number; // 0 to 1 (0 = type, 1 = type2)

  // Wave Shaping & Modulation (Crest & Valley Leveling / Distance)
  crestValleyRatio?: number; // 0.1 (compresion valle) to 2.0 (expansión cresta) - default 1.0
  dutyCycle?: number; // -0.8 to 0.8 (wave asymmetry/shaping) - default 0
  harmonicDistortion?: number; // 0 to 1 (non-linear warping) - default 0
  phaseOffset?: number; // 0 to 360 degrees - default 0

  // Visualization & Routing
  isIndependent: boolean; // If true, routes directly to master (skipping combined bus) and visualizes separately
  color: string; // Hex color for the wave

  // Transition / Envelope
  transition?: TransitionState;
}

export interface AudioContextState {
  isPlaying: boolean;
  oscillators: OscillatorState[];
  masterVolume: number;
}

// --- Cymatics 3D Visualizer Types ---

export type CymaticsPalette = 'holographic' | 'quantum' | 'neon' | 'aurora' | 'gold';
export type CymaticsMode = 'chladni3d' | 'fluid3d' | 'quantum_lattice' | 'particles3d';

export interface CymaticsConfig {
  mode: CymaticsMode;
  n: number; // Chladni N modal factor
  m: number; // Chladni M modal factor
  particleCount: number;
  sensitivity: number;
  palette: CymaticsPalette;
  vibrationSpeed: number;
  vibrationAmplitude: number;
  plateMeshResolution: number;
  autoRotate: boolean;
  
  // Physics & Advanced Rendering
  showParticles: boolean;
  gravity: number; // Downward force
  particleDensity: number; // Resistance / spread
  particleSize: number; // Visual size
  particleWeight: number; // Inertia
}

export type BackgroundMode = 'solid' | 'gradient' | 'liquid-rainbow' | 'crystal-bubbles' | 'organic-fade' | 'morphing-colors';
export type SacredGeometryMode = 
  | 'goldenSpiral' | 'flowerOfLife' | 'quantumWave' | 'torus'
  | 'metatron' | 'merkaba' | 'platonicSolids' | 'sriYantra'
  | 'cymatics' | 'vectorEquilibrium' | 'treeOfLife' | 'yinYang'
  | 'mandala1' | 'mandala2' | 'mandala3' | 'holographicFractal'
  | 'chakras' | 'om' | 'lotus' | 'dharmaChakra';

export interface SpiralConfig {
  k: number;
  psi: number;
  z0_r: number;
  z0_i: number;
  iter: number;
  zoom: number;
  speedMultiplier: number;
  thickness: number;
  opacity: number;
  unifiedMode: boolean; // Draw one combined spiral vs one per frequency
  colorPalette: CymaticsPalette;
  
  // New Math / Depth options
  depthMode: boolean;
  depthSpeed: number;
  baseFrequencyRef: number;
  angleMultiplier: number;
  
  // Advanced Math Extensions
  waveStyle: boolean;      // Enable sine wave literal drawing instead of smooth curves
  waveAmplitude: number;   // Amplitude of the wave perturbation
  infiniteDepth: boolean;  // Continuous zoom tunnel effect
  illumination: number;    // Multiplier for brightness and glow reacting to sound
  
  
  autoPilot: boolean;
  sacredGeometryEnabled: boolean;
  sacredGeometryModes: SacredGeometryMode[];
  bgMode: BackgroundMode;
}

// --- Gemini AI Generator Types ---

export interface GeminiWavePreset {
  title: string;
  explanation: string;
  mathematicalConcept: string;
  oscillators: Partial<OscillatorState>[];
}

// --- File System Types ---

export interface PresetContent {
  oscillators: OscillatorState[];
  cymaticsConfig?: Partial<CymaticsConfig>;
  spiralConfig?: Partial<SpiralConfig>;
  dateCreated: number;
  description?: string;
  authorId?: string; // Starseed OS account ID
  isPublic?: boolean; // Starseed OS cloud sharing
  version?: string;
  tags?: string[];
  category?: CategoryId | string;
}

export interface FileSystemNode {
  id: string;
  parentId: string | null;
  name: string;
  type: 'folder' | 'file';
  children?: FileSystemNode[]; // Only for folders
  content?: PresetContent; // Only for files
  createdAt: number;
}

// --- Live Sessions (Entonación) ---

export interface SessionParticipant {
  id: string; // User ID
  displayName: string;
  avatar_url?: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface LiveSession {
  id: string;
  hostId: string;
  hostName: string;
  presetName: string;
  presetContent: PresetContent; // The currently playing preset
  isPublic: boolean;
  allowOpenModifications: boolean; // Anyone can change settings?
  createdAt: number;
  participantsCount?: number; // Added for UI
}

// --- Community Profiles & Resonances ---

export interface OmniProfile {
  id: string;
  displayName: string;
  avatar_url?: string;
  cover_url?: string;
  status: 'online' | 'offline';
  lastActive: number;
  resonancesCount: number; // Followers
  particlesCount: number; // Public presets
}

export interface OmniResonance {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: number;
}

