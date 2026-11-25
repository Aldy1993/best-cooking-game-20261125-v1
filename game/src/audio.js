// Warung Senja — sound: every effect synthesized with WebAudio, no files.
// One clear job: a tiny synth the game calls for feedback on every action.

export function createSound() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', gain = 0.12, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + when);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + when + dur);
    amp.gain.setValueAtTime(0.0001, ac.currentTime + when);
    amp.gain.exponentialRampToValueAtTime(gain, ac.currentTime + when + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + when + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + dur + 0.05);
  }

  function noise(dur, gain = 0.08, filterFreq = 3200) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const amp = ac.createGain();
    amp.gain.value = gain;
    src.connect(filter);
    filter.connect(amp);
    amp.connect(ac.destination);
    src.start();
  }

  return {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    pickup() { tone(520, 0.09, 'triangle', 0.1); },
    chop() { noise(0.08, 0.12, 1800); tone(180, 0.06, 'square', 0.05); },
    cookStart() { noise(0.25, 0.05, 5200); tone(220, 0.15, 'sawtooth', 0.04, 0, 330); },
    sizzle() { noise(0.18, 0.025, 6000); },
    done() { tone(880, 0.12, 'sine', 0.1); tone(1318, 0.16, 'sine', 0.09, 0.09); },
    serve() {
      tone(1046, 0.1, 'triangle', 0.12);
      tone(1318, 0.1, 'triangle', 0.12, 0.09);
      tone(1568, 0.22, 'triangle', 0.12, 0.18);
    },
    coin() { tone(1568, 0.07, 'square', 0.05); tone(2093, 0.12, 'square', 0.05, 0.06); },
    error() { tone(160, 0.18, 'sawtooth', 0.07, 0, 110); },
    expire() { tone(392, 0.2, 'sine', 0.09, 0, 196); tone(196, 0.3, 'sine', 0.08, 0.15); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, i * 0.12));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.09, i * 0.14));
    },
  };
}
