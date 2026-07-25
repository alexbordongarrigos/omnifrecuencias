
import { useRef, useState, useEffect } from 'react';
import { OscillatorState, WaveType } from '../types';

interface AudioNodeRefs {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  gain1: GainNode;
  gain2: GainNode;
  mainGain: GainNode;
  shaper: WaveShaperNode;
  dcBlocker: BiquadFilterNode;
  aaFilter: BiquadFilterNode;
  delay: DelayNode;
  panner: PannerNode;
  analyser: AnalyserNode;
}

// Factor de escala para el espacio 3D.
const SPATIAL_SCALE = 10.0;

// Generador de curva de deformación armónica para valles, crestas y asimetría
const createShaperCurve = (crestValleyRatio: number = 1.0, dutyCycle: number = 0, harmonicDistortion: number = 0) => {
  const n = 1024;
  const curve = new Float32Array(n);
  const ratio = Math.max(0.1, Math.min(3.0, crestValleyRatio));
  const duty = Math.max(-0.8, Math.min(0.8, dutyCycle));
  const dist = Math.max(0, Math.min(1, harmonicDistortion));

  for (let i = 0; i < n; i++) {
    let x = (i / (n - 1)) * 2 - 1; // -1 to 1

    // Apply Duty Cycle (Asymmetry offset)
    x = Math.max(-1, Math.min(1, x + duty));

    // Crest vs Valley Distance & Leveling
    if (x >= 0) {
      x = Math.pow(x, 1 / ratio);
    } else {
      const invRatio = Math.max(0.05, 2 - ratio);
      x = -Math.pow(-x, 1 / invRatio);
    }

    // Non-linear Harmonic Distortion / Curve Saturation
    if (dist > 0) {
      const k = dist * 8;
      x = (1 + k) * x / (1 + k * Math.abs(x));
    }

    curve[i] = Math.max(-1, Math.min(1, x));
  }
  return curve;
};

export const useAudio = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const masterAnalyserRef = useRef<AnalyserNode | null>(null);
  
  // New: Combined Bus for "Main Resonance" visualization/binaural calculation
  const combinedGainRef = useRef<GainNode | null>(null);
  const combinedAnalyserRef = useRef<AnalyserNode | null>(null);

  // Map to store audio nodes for each active oscillator
  const nodesRef = useRef<Map<string, AudioNodeRefs>>(new Map());
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [oscillators, setOscillators] = useState<OscillatorState[]>([]);
  const [masterVolume, setMasterVolume] = useState(1.0);

  // Initialize Audio Context
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      
      // Sync isPlaying state with context state
      ctx.onstatechange = () => {
        setIsPlaying(ctx.state === 'running');
      };

      // Listener set to center
      const listener = ctx.listener;
      if (listener.positionX) {
        listener.positionX.value = 0;
        listener.positionY.value = 0;
        listener.positionZ.value = 0;
        listener.forwardX.value = 0;
        listener.forwardY.value = 0;
        listener.forwardZ.value = -1;
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
      }

      // Master Output
      const masterGain = ctx.createGain();
      masterGain.gain.value = masterVolume; // Default master volume
      const masterAnalyser = ctx.createAnalyser();
      masterAnalyser.fftSize = 2048;

      // Combined Bus (For binaural resonance calculation)
      const combinedGain = ctx.createGain();
      const combinedAnalyser = ctx.createAnalyser();
      combinedAnalyser.fftSize = 2048;

      // Routing: 
      // 1. Combined Bus -> Master
      combinedGain.connect(combinedAnalyser);
      combinedAnalyser.connect(masterGain);
      
      // 2. Master -> Speaker
      masterGain.connect(masterAnalyser);
      masterAnalyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
      masterAnalyserRef.current = masterAnalyser;
      combinedGainRef.current = combinedGain;
      combinedAnalyserRef.current = combinedAnalyser;
      
      setIsPlaying(ctx.state === 'running');
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      masterGainRef.current = null;
      masterAnalyserRef.current = null;
      combinedGainRef.current = null;
      combinedAnalyserRef.current = null;
      nodesRef.current.clear();
    };
  }, []);

  const updateMasterVolume = (vol: number) => {
    setMasterVolume(vol);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
      masterGainRef.current.gain.setTargetAtTime(vol, audioCtxRef.current.currentTime, 0.02);
    }
  };

  const toggleMasterPlay = async () => {
    initAudio();
    if (!audioCtxRef.current) return;

    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    } else if (audioCtxRef.current.state === 'running') {
      await audioCtxRef.current.suspend();
    }
  };

  const addOscillator = (initialState?: Partial<OscillatorState>) => {
    initAudio();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    const newOsc: OscillatorState = {
      id: crypto.randomUUID(),
      frequency: initialState?.frequency || 432,
      type: initialState?.type || 'sine',
      volume: initialState?.volume !== undefined ? initialState.volume : 0.5,
      // 3D defaults
      panX: initialState?.panX !== undefined ? initialState.panX : 0,
      panY: initialState?.panY !== undefined ? initialState.panY : 0,
      panZ: initialState?.panZ !== undefined ? initialState.panZ : 0,
      
      // Wave Shaping & Modulation defaults
      crestValleyRatio: initialState?.crestValleyRatio !== undefined ? initialState.crestValleyRatio : 1.0,
      dutyCycle: initialState?.dutyCycle !== undefined ? initialState.dutyCycle : 0,
      harmonicDistortion: initialState?.harmonicDistortion !== undefined ? initialState.harmonicDistortion : 0,
      phaseOffset: initialState?.phaseOffset !== undefined ? initialState.phaseOffset : 0,

      isPlaying: true,
      name: initialState?.name || 'Oscilador',
      isIndependent: false,
      color: initialState?.color || '#38bdf8' 
    };

    setOscillators(prev => [...prev, newOsc]);
    createOscillatorNodes(newOsc);
    return newOsc.id;
  };

  const removeOscillator = (id: string) => {
    setOscillators(prev => prev.filter(o => o.id !== id));
    destroyOscillatorNodes(id);
  };

  const setAllOscillators = (newOscillatorsList: OscillatorState[]) => {
    initAudio();
    // Destroy obsolete ones
    nodesRef.current.forEach((_, id) => {
      if (!newOscillatorsList.some(o => o.id === id)) {
        destroyOscillatorNodes(id);
      }
    });
    // Add/update new ones
    newOscillatorsList.forEach(osc => {
      if (nodesRef.current.has(osc.id)) {
        updateOscillatorNodes(osc);
      } else {
        createOscillatorNodes(osc);
      }
    });
    setOscillators(newOscillatorsList);
  };

  const updateOscillator = (id: string, changes: Partial<OscillatorState>) => {
    initAudio();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setOscillators(prev => prev.map(o => {
      if (o.id === id) {
        const updated = { ...o, ...changes };
        updateOscillatorNodes(updated);
        return updated;
      }
      return o;
    }));
  };

  // --- Internal Audio Node Management ---

  const createOscillatorNodes = (oscState: OscillatorState) => {
    if (!audioCtxRef.current || !masterGainRef.current || !combinedGainRef.current) return;
    const ctx = audioCtxRef.current;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const mainGain = ctx.createGain();
    
    // WaveShaper for Crest/Valley modulation & symmetry
    const shaper = ctx.createWaveShaper();
    shaper.curve = createShaperCurve(
      oscState.crestValleyRatio ?? 1.0,
      oscState.dutyCycle ?? 0,
      oscState.harmonicDistortion ?? 0
    );
    shaper.oversample = '4x';

    // DC Blocker to remove DC offset caused by wave shaping
    const dcBlocker = ctx.createBiquadFilter();
    dcBlocker.type = 'highpass';
    dcBlocker.frequency.value = 1.0; 

    // Anti-Aliasing Filter (Lowpass) to reduce harmonic artifacts
    const aaFilter = ctx.createBiquadFilter();
    aaFilter.type = 'lowpass';
    // Gentle roll-off before Nyquist frequency to ensure wave purity
    aaFilter.frequency.value = Math.min(18000, ctx.sampleRate / 2.2);

    // DelayNode for Angular Phase Shift (0° to 360°)
    const delay = ctx.createDelay(1.0);
    const phaseDeg = oscState.phaseOffset || 0;
    const delayTime = phaseDeg > 0 ? (phaseDeg / 360) / Math.max(0.1, oscState.frequency) : 0;
    delay.delayTime.setValueAtTime(delayTime, ctx.currentTime);

    // PannerNode: Equal Power for Hard Panning capability
    const panner = ctx.createPanner();
    panner.panningModel = 'equalpower'; 
    panner.distanceModel = 'inverse';
    panner.rolloffFactor = 0; 
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512; 

    osc1.type = oscState.type;
    osc2.type = oscState.type2 || oscState.type;
    
    osc1.frequency.setValueAtTime(oscState.frequency, ctx.currentTime);
    osc2.frequency.setValueAtTime(oscState.frequency, ctx.currentTime);
    
    const mix = oscState.typeMix || 0;
    gain1.gain.setValueAtTime(1 - mix, ctx.currentTime);
    gain2.gain.setValueAtTime(mix, ctx.currentTime);
    
    mainGain.gain.setValueAtTime(oscState.volume, ctx.currentTime);
    
    // Set 3D Position
    if (panner.positionX) {
      panner.positionX.setValueAtTime(oscState.panX * SPATIAL_SCALE, ctx.currentTime);
      panner.positionY.setValueAtTime(oscState.panY * SPATIAL_SCALE, ctx.currentTime);
      panner.positionZ.setValueAtTime(oscState.panZ * -SPATIAL_SCALE, ctx.currentTime);
    }

    // Graph Connection: osc -> gain -> mainGain -> shaper -> dcBlocker -> aaFilter -> delay -> panner -> analyser
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(mainGain);
    gain2.connect(mainGain);
    mainGain.connect(shaper);
    shaper.connect(dcBlocker);
    dcBlocker.connect(aaFilter);
    aaFilter.connect(delay);
    delay.connect(panner);
    panner.connect(analyser);

    // Routing Logic: Independent vs Combined
    if (oscState.isIndependent) {
        analyser.connect(masterGainRef.current); // Direct to Master
    } else {
        analyser.connect(combinedGainRef.current); // To Combined Bus
    }

    osc1.start();
    osc2.start();

    nodesRef.current.set(oscState.id, { osc1, osc2, gain1, gain2, mainGain, shaper, dcBlocker, aaFilter, delay, panner, analyser });
  };

  const destroyOscillatorNodes = (id: string) => {
    const nodes = nodesRef.current.get(id);
    if (nodes) {
      try {
          if (audioCtxRef.current) {
            nodes.mainGain.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.01);
          }
          setTimeout(() => {
              nodes.osc1.stop();
              nodes.osc2.stop();
              nodes.osc1.disconnect();
              nodes.osc2.disconnect();
              nodes.gain1.disconnect();
              nodes.gain2.disconnect();
              nodes.mainGain.disconnect();
              nodes.shaper.disconnect();
              nodes.dcBlocker.disconnect();
              nodes.aaFilter.disconnect();
              nodes.delay.disconnect();
              nodes.panner.disconnect();
              nodes.analyser.disconnect();
          }, 50);
      } catch(e) { console.error("Error disconnecting node", e)}
      
      nodesRef.current.delete(id);
    }
  };

  const updateOscillatorNodes = (oscState: OscillatorState) => {
    const nodes = nodesRef.current.get(oscState.id);
    if (!nodes || !audioCtxRef.current || !masterGainRef.current || !combinedGainRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // Type
    if (nodes.osc1.type !== oscState.type) nodes.osc1.type = oscState.type;
    if (nodes.osc2.type !== (oscState.type2 || oscState.type)) nodes.osc2.type = oscState.type2 || oscState.type;
    
    // WaveShaper Update
    nodes.shaper.curve = createShaperCurve(
      oscState.crestValleyRatio ?? 1.0,
      oscState.dutyCycle ?? 0,
      oscState.harmonicDistortion ?? 0
    );

    // Angular Phase Shift Update (DelayNode)
    const phaseDeg = oscState.phaseOffset || 0;
    const delayTime = phaseDeg > 0 ? (phaseDeg / 360) / Math.max(0.1, oscState.frequency) : 0;
    nodes.delay.delayTime.setTargetAtTime(delayTime, now, 0.02);

    // Crossfade Mix (Equal Power)
    const mix = oscState.typeMix || 0;
    const gain1Value = Math.cos(mix * 0.5 * Math.PI);
    const gain2Value = Math.sin(mix * 0.5 * Math.PI);
    
    nodes.gain1.gain.setTargetAtTime(gain1Value, now, 0.02);
    nodes.gain2.gain.setTargetAtTime(gain2Value, now, 0.02);

    // Freq & Vol
    nodes.osc1.frequency.setTargetAtTime(oscState.frequency, now, 0.02);
    nodes.osc2.frequency.setTargetAtTime(oscState.frequency, now, 0.02);
    
    nodes.mainGain.gain.setTargetAtTime(oscState.isPlaying ? oscState.volume : 0, now, 0.02);
    
    // 3D Position
    if (nodes.panner.positionX) {
      nodes.panner.positionX.setTargetAtTime(oscState.panX * SPATIAL_SCALE, now, 0.02);
      nodes.panner.positionY.setTargetAtTime(oscState.panY * SPATIAL_SCALE, now, 0.02);
      nodes.panner.positionZ.setTargetAtTime(oscState.panZ * -SPATIAL_SCALE, now, 0.02);
    }

    // Routing update
    try {
        nodes.analyser.disconnect();
        if (oscState.isIndependent) {
            nodes.analyser.connect(masterGainRef.current);
        } else {
            nodes.analyser.connect(combinedGainRef.current);
        }
    } catch (e) { console.error("Routing update error", e); }
  };

  const getMasterAnalyser = () => masterAnalyserRef.current;
  const getCombinedAnalyser = () => combinedAnalyserRef.current;
  const getOscillatorAnalyser = (id: string) => nodesRef.current.get(id)?.analyser;

  // Global Adjustments
  const setGlobalVolume = (vol: number) => {
    setOscillators(prev => prev.map(o => {
      const updated = { ...o, volume: vol };
      updateOscillatorNodes(updated);
      return updated;
    }));
  };

  const centerAllPositions = () => {
    setOscillators(prev => prev.map(o => {
      const updated = { ...o, panX: 0, panY: 0, panZ: 0 };
      updateOscillatorNodes(updated);
      return updated;
    }));
  };

  const setGlobalWaveType = (type: WaveType) => {
    setOscillators(prev => prev.map(o => {
      const updated = { ...o, type };
      updateOscillatorNodes(updated);
      return updated;
    }));
  };

  // --- Transition Loop ---
  const lastTimeRef = useRef<number>(0);
  const reqFrameRef = useRef<number>(0);

  useEffect(() => {
    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000; // in seconds
      lastTimeRef.current = time;

      setOscillators(prev => {
        let hasChanges = false;
        const next = prev.map(osc => {
          if (!osc.transition || !osc.transition.enabled || !osc.transition.isPlaying) {
            return osc;
          }

          const t = osc.transition;
          const step = dt / Math.max(t.duration, 0.1); // avoid division by zero
          let newProgress = t.progress + (t.direction === 'forward' ? step : -step);
          let newDirection = t.direction;
          let newLoop = t.currentLoop;
          let isPlaying = t.isPlaying;

          if (newProgress >= 1) {
            newProgress = 1;
            if (t.loopCount === 'infinite' || newLoop < t.loopCount) {
              newDirection = 'backward';
              newLoop++;
            } else {
              isPlaying = false;
            }
          } else if (newProgress <= 0) {
            newProgress = 0;
            if (t.loopCount === 'infinite' || newLoop < t.loopCount) {
              newDirection = 'forward';
              newLoop++;
            } else {
              isPlaying = false;
            }
          }

          if (
            newProgress !== t.progress || 
            newDirection !== t.direction || 
            newLoop !== t.currentLoop || 
            isPlaying !== t.isPlaying
          ) {
            hasChanges = true;
            
            const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
            
            const updatedOsc = {
              ...osc,
              frequency: lerp(t.start.frequency, t.end.frequency, newProgress),
              volume: lerp(t.start.volume, t.end.volume, newProgress),
              panX: lerp(t.start.panX, t.end.panX, newProgress),
              panY: lerp(t.start.panY, t.end.panY, newProgress),
              panZ: lerp(t.start.panZ, t.end.panZ, newProgress),
              type: t.start.type,
              type2: t.end.type,
              typeMix: newProgress,
              transition: {
                ...t,
                progress: newProgress,
                direction: newDirection,
                currentLoop: newLoop,
                isPlaying
              }
            };
            
            updateOscillatorNodes(updatedOsc);
            return updatedOsc;
          }

          return osc;
        });

        return hasChanges ? next : prev;
      });

      reqFrameRef.current = requestAnimationFrame(loop);
    };

    reqFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqFrameRef.current);
  }, []);

  return {
    isPlaying,
    oscillators,
    masterVolume,
    updateMasterVolume,
    toggleMasterPlay,
    addOscillator,
    removeOscillator,
    updateOscillator,
    setAllOscillators,
    getMasterAnalyser,
    getCombinedAnalyser,
    getOscillatorAnalyser,
    setGlobalVolume,
    centerAllPositions,
    setGlobalWaveType
  };
};

