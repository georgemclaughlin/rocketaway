// Optional, locally synthesized sound. No downloads, timers or game-state writes.
export function createFlightAudio() {
  let context, master, rumble, filter, enabled = false;
  const voices = new Set();
  function init() {
    if (!enabled) return false;
    try {
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        master = context.createGain(); master.gain.value = .65; master.connect(context.destination);
        const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        const noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true;
        filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 220;
        rumble = context.createGain(); rumble.gain.value = 0;
        noise.connect(filter); filter.connect(rumble); rumble.connect(master); noise.start();
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
      return true;
    } catch { return false; }
  }
  function quiet() {
    if (!context) return;
    rumble.gain.cancelScheduledValues(context.currentTime);
    rumble.gain.setValueAtTime(0, context.currentTime);
    for (const voice of voices) { try { voice.stop(); } catch { /* Already stopped. */ } }
    voices.clear();
  }
  return {
    enable(value) { enabled = value; if (value) init(); else quiet(); },
    quiet,
    tone(frequency, duration = .14, type = 'sine', volume = .045, delay = 0) {
      if (!init()) return;
      const at = context.currentTime + delay, oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(.001, at); gain.gain.linearRampToValueAtTime(volume, at + .012);
      gain.gain.exponentialRampToValueAtTime(.001, at + duration);
      oscillator.connect(gain); gain.connect(master); voices.add(oscillator);
      oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(at); oscillator.stop(at + duration);
    },
    engine(active, intensity = 0) {
      if (!context || !enabled) return;
      rumble.gain.setTargetAtTime(active ? .13 : 0, context.currentTime, .07);
      filter.frequency.setTargetAtTime(180 + Math.min(1, intensity) * 650, context.currentTime, .1);
    },
  };
}
