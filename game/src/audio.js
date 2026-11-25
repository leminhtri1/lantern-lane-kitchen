// Every sound synthesised with WebAudio, no files: knife chops, sizzling woks, bells for ready
// food and paid orders, warnings, a gong for rush hour, and a soft plucked night-market tune whose
// tempo rises with the rush. Audio starts on the first key or click, as browsers require.

const PENTA = [0, 3, 5, 7, 10, 12, 15, 17];

export function createAudio() {
  let ac = null;
  let master = null;
  let sfx = null;
  let musicBus = null;
  let noise = null;
  let sizzleGain = null;
  let musicOn = true;
  let intensity = 0;
  let nextNote = 0;
  let stepIndex = 0;
  let timer = null;

  function start() {
    if (ac) {
      if (ac.state === 'suspended') ac.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    ac = new Ctor();
    master = ac.createGain();
    master.gain.value = 0.7;
    master.connect(ac.destination);
    sfx = ac.createGain();
    sfx.gain.value = 0.8;
    sfx.connect(master);
    musicBus = ac.createGain();
    musicBus.gain.value = musicOn ? 0.22 : 0;
    musicBus.connect(master);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    // A looping filtered noise bed for the sizzle, faded by how much is frying.
    const src = ac.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3200;
    sizzleGain = ac.createGain();
    sizzleGain.gain.value = 0;
    src.connect(hp).connect(sizzleGain).connect(sfx);
    src.start();
    nextNote = ac.currentTime + 0.1;
    timer = window.setInterval(scheduleMusic, 90);
  }

  function tone(freq, dur, type = 'sine', vol = 0.3, when = 0, slideTo = null, bus = sfx) {
    if (!ac) return;
    const t = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function burst(dur, freq, q = 1, vol = 0.3, when = 0, type = 'bandpass') {
    if (!ac) return;
    const t = ac.currentTime + when;
    const src = ac.createBufferSource();
    src.buffer = noise;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(sfx);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  const SOUNDS = {
    chop() {
      burst(0.05, 2600, 2, 0.5);
      tone(520 + Math.random() * 80, 0.05, 'triangle', 0.25);
    },
    chopped() {
      tone(880, 0.08, 'triangle', 0.2);
      tone(1320, 0.12, 'triangle', 0.18, 0.06);
    },
    pickup() {
      tone(600, 0.07, 'sine', 0.22, 0, 900);
    },
    place() {
      tone(240, 0.09, 'triangle', 0.3, 0, 150);
      burst(0.04, 900, 1, 0.15);
    },
    cooked() {
      tone(1318, 0.6, 'sine', 0.22);
      tone(1976, 0.5, 'sine', 0.1, 0.01);
    },
    warn() {
      tone(880, 0.08, 'square', 0.1);
      tone(880, 0.08, 'square', 0.1, 0.14);
    },
    burnt() {
      tone(110, 0.5, 'sawtooth', 0.18, 0, 70);
      burst(0.5, 400, 0.7, 0.25);
    },
    complete() {
      [660, 880, 1100].forEach((f, i) => tone(f, 0.18, 'triangle', 0.2, i * 0.06));
    },
    served() {
      tone(1568, 0.5, 'sine', 0.22);
      tone(2093, 0.6, 'sine', 0.18, 0.08);
      tone(2637, 0.5, 'sine', 0.12, 0.16);
      burst(0.25, 6000, 1, 0.12, 0.05, 'highpass');
    },
    missed() {
      tone(330, 0.5, 'sawtooth', 0.14, 0, 160);
    },
    refuse() {
      tone(190, 0.1, 'square', 0.1);
    },
    order() {
      tone(988, 0.25, 'sine', 0.14);
      tone(1480, 0.25, 'sine', 0.08, 0.1);
    },
    tick() {
      tone(1400, 0.04, 'square', 0.08);
    },
    trash() {
      burst(0.25, 700, 0.8, 0.3, 0, 'lowpass');
    },
    rush() {
      tone(98, 2.2, 'sine', 0.4);
      tone(147, 2.0, 'sine', 0.2, 0.02);
      burst(1.2, 300, 0.5, 0.2);
    },
    shiftEnd() {
      tone(131, 2.4, 'sine', 0.35);
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.9, 'triangle', 0.14, 0.15 + i * 0.12));
    },
    click() {
      tone(700, 0.05, 'triangle', 0.18);
    },
  };

  function play(name) {
    if (!ac || !SOUNDS[name]) return;
    SOUNDS[name]();
  }

  function scheduleMusic() {
    if (!ac) return;
    const bpm = 84 + intensity * 34;
    const stepDur = 60 / bpm / 2;
    while (nextNote < ac.currentTime + 0.25) {
      const i = stepIndex % 32;
      const bar = Math.floor(stepIndex / 32);
      const root = [50, 50, 46, 48][bar % 4];
      if (i % 4 === 0) tone(midi(root - 12), stepDur * 3, 'triangle', 0.32, nextNote - ac.currentTime, null, musicBus);
      const pattern = (i * 7 + bar * 3) % 11;
      if (pattern < 6 && i % 2 === 0) {
        const note = root + 12 + PENTA[(i * 5 + bar * 2) % PENTA.length];
        tone(midi(note), stepDur * 1.8, 'triangle', 0.18, nextNote - ac.currentTime, null, musicBus);
      }
      if (i % 4 === 2) {
        const t = nextNote - ac.currentTime;
        if (t >= 0) tone(1800, 0.03, 'square', 0.05 + intensity * 0.05, t, null, musicBus);
      }
      nextNote += stepDur;
      stepIndex += 1;
    }
  }

  function midi(n) {
    return 440 * 2 ** ((n - 69) / 12);
  }

  return {
    start,
    play,
    setSizzle(level) {
      if (sizzleGain) sizzleGain.gain.setTargetAtTime(Math.min(0.12, level * 0.04), ac.currentTime, 0.1);
    },
    setIntensity(level) {
      intensity = level;
    },
    toggleMusic() {
      musicOn = !musicOn;
      if (musicBus) musicBus.gain.setTargetAtTime(musicOn ? 0.22 : 0, ac.currentTime, 0.1);
      return musicOn;
    },
    stop() {
      if (timer) window.clearInterval(timer);
    },
  };
}
