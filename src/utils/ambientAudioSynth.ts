// Web Audio API ambient soundtrack generator for zero-latency, 100% reliable audio playback
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let intervalTimer: any = null;

const CHORDS = [
  [261.63, 329.63, 392.00, 523.25], // C Major 7 (C, E, G, C)
  [220.00, 261.63, 329.63, 440.00], // A Minor (A, C, E, A)
  [174.61, 220.00, 261.63, 349.23], // F Major (F, A, C, F)
  [196.00, 246.94, 293.66, 392.00]  // G Major (G, B, D, G)
];

export function startAmbientSoundtrack() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!masterGain) {
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.08, audioCtx.currentTime); // Soft background level
      masterGain.connect(audioCtx.destination);
    }

    let chordIdx = 0;

    const playChord = () => {
      if (!audioCtx || audioCtx.state === 'closed' || !masterGain) return;
      const notes = CHORDS[chordIdx % CHORDS.length];
      chordIdx++;

      notes.forEach((freq, idx) => {
        if (!audioCtx || !masterGain) return;
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();

        // Soft sine wave for meditative, pleasant ambient campus background
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        const now = audioCtx.currentTime;
        const duration = 4.8;

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.03, now + 1.2);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    };

    playChord();
    if (intervalTimer) clearInterval(intervalTimer);
    intervalTimer = setInterval(playChord, 4600);
  } catch (err) {
    console.warn('Ambient audio synth skipped:', err);
  }
}

export function stopAmbientSoundtrack() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  if (masterGain && audioCtx) {
    try {
      masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    } catch {
      // Ignore
    }
  }
}
