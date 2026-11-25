// Tiny WebAudio sound effects, synthesized on the spot — no audio files, no
// network. Every sound is a short oscillator or noise burst through one shared
// context, created lazily on the first user gesture so browsers allow it.

let context = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

function ensureContext() {
  if (!context) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(freq, duration, type = 'sine', volume = 0.12, when = 0, slideTo = null) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function noiseBurst(duration, volume = 0.08, when = 0, lowpass = 1200) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
}

/** A click on a bin: a short wooden tick. */
export function sfxClick() {
  tone(620, 0.06, 'triangle', 0.1);
}

/** A chop: two quick knocks. */
export function sfxChop() {
  noiseBurst(0.05, 0.14, 0, 2500);
  noiseBurst(0.05, 0.1, 0.09, 2500);
}

/** The wok lights: a sizzle swell. */
export function sfxSizzle() {
  noiseBurst(0.5, 0.05, 0, 4500);
  tone(180, 0.4, 'sawtooth', 0.03, 0, 90);
}

/** A dish served: a bright ding-ding. */
export function sfxServe() {
  tone(880, 0.12, 'sine', 0.14);
  tone(1318, 0.22, 'sine', 0.12, 0.1);
}

/** A perfect cook: a rising chirp. */
export function sfxPerfect() {
  tone(660, 0.1, 'triangle', 0.12, 0, 990);
  tone(990, 0.16, 'triangle', 0.12, 0.09, 1320);
}

/** A mistake: a low buzz. */
export function sfxError() {
  tone(160, 0.22, 'square', 0.08, 0, 110);
}

/** An order arrives: a soft bell. */
export function sfxOrder() {
  tone(1046, 0.14, 'sine', 0.07);
  tone(784, 0.14, 'sine', 0.05, 0.12);
}

/** The shift ends in a win: a little jingle. */
export function sfxWin() {
  [523, 659, 784, 1046].forEach((freq, i) => tone(freq, 0.18, 'triangle', 0.12, i * 0.13));
}

/** A new shift starts: a rising two-note call to the kitchen. */
export function sfxStart() {
  tone(523, 0.1, 'triangle', 0.12);
  tone(784, 0.18, 'triangle', 0.12, 0.1);
}

/** The shift ends in a loss: a falling phrase. */
export function sfxLose() {
  [392, 330, 262].forEach((freq, i) => tone(freq, 0.22, 'triangle', 0.1, i * 0.16));
}
