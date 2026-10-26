// Synthesizes the soundtrack: 120 BPM, A minor (Am F C G), music and sfx on one beat grid from t=0.
// usage: node music.mjs out.wav
import { writeFileSync } from 'node:fs'

const SR = 44100, DUR = 20, N = SR * DUR, BEAT = 0.5
const L = new Float32Array(N), R = new Float32Array(N)
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12)
const add = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan) ; R[i] += v * (1 + pan) } }
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1

function kick(t, g = 1) { const s = Math.round(t * SR); for (let i = 0; i < SR * .35; i++) { const x = i / SR; const f = 45 + 90 * Math.exp(-x * 30); add(s + i, g * .9 * Math.sin(2 * Math.PI * (45 * x + 90 * (1 - Math.exp(-x * 30)) / 30)) * Math.exp(-x * 9)) } }
function clap(t, g = 1) { const s = Math.round(t * SR); let lp = 0; for (let i = 0; i < SR * .2; i++) { const x = i / SR; const n = rnd(); const hp = n - lp; lp += .35 * (n - lp); add(s + i, g * .28 * hp * Math.exp(-x * 22)) } }
function hat(t, g = 1, pan = .2) { const s = Math.round(t * SR); let lp = 0; for (let i = 0; i < SR * .06; i++) { const x = i / SR; const n = rnd(); lp += .6 * (n - lp); add(s + i, g * .08 * (n - lp) * Math.exp(-x * 70), pan) } }
function bass(t, m, len, g = 1) { const s = Math.round(t * SR), f = hz(m); let y = 0; for (let i = 0; i < SR * len; i++) { const x = i / SR; const saw = 2 * ((f * x) % 1) - 1; y += .08 * (saw - y); const env = Math.min(1, x * 200) * Math.exp(-x * 3) * Math.min(1, (len - x) * 60); add(s + i, g * .55 * (y * 1.6 + .4 * Math.sin(2 * Math.PI * f * x)) * env) } }
function pad(t, notes, len, g = 1) { const s = Math.round(t * SR); for (const [k, m] of notes.entries()) { const f = hz(m); let y = 0; const pan = (k - 1) * .4; for (let i = 0; i < SR * len; i++) { const x = i / SR; const v = (2 * ((f * x) % 1) - 1) + (2 * ((f * 1.004 * x) % 1) - 1); y += .03 * (v - y); const env = Math.min(1, x / .25) * Math.min(1, (len - x) / .3); add(s + i, g * .05 * y * env, pan) } } }
function pluck(t, m, g = 1, pan = 0) { const s = Math.round(t * SR), f = hz(m); for (let i = 0; i < SR * .4; i++) { const x = i / SR; add(s + i, g * .12 * (Math.sin(2 * Math.PI * f * x) + .3 * Math.sin(4 * Math.PI * f * x)) * Math.exp(-x * 11) * Math.min(1, x * 400), pan) } }
function whoosh(tEnd, len = .5, g = 1) { const s = Math.round((tEnd - len) * SR); let lp = 0; for (let i = 0; i < SR * len; i++) { const x = i / (SR * len); const n = rnd(); lp += (.02 + .25 * x) * (n - lp); add(s + i, g * .22 * lp * Math.pow(x, 2) * (1 - Math.pow(x, 8)), Math.sin(x * 3) * .3) } }
function chime(t, m, g = 1) { const s = Math.round(t * SR), f = hz(m); for (let i = 0; i < SR * 1.2; i++) { const x = i / SR; add(s + i, g * .1 * (Math.sin(2 * Math.PI * f * x) + .25 * Math.sin(2 * Math.PI * f * 3 * x) * Math.exp(-x * 6)) * Math.exp(-x * 3.5) * Math.min(1, x * 300)) } }

// Am F C G per bar (2s); roots for bass, triads for pads, arp tones for plucks
const prog = [[57, [69, 72, 76]], [53, [69, 72, 77]], [48, [67, 72, 76]], [55, [67, 71, 74]]]
const bars = DUR / 2
for (let b = 0; b < bars; b++) {
  const t0 = b * 2, [root, tri] = prog[b % 4]
  const last = b === bars - 1
  const intro = b === 0
  pad(t0, last ? [69, 72, 76] : tri, 2, last ? 1.2 : 1)
  for (let q = 0; q < 4; q++) {
    const t = t0 + q * BEAT
    if (!(last && q > 0)) kick(t, intro && q < 2 ? .6 : 1)
    if (!intro && !last && (q === 1 || q === 3)) clap(t, .9)
  }
  for (let e = 0; e < 8; e++) {
    const t = t0 + e * BEAT / 2
    if (!last) hat(t + (e % 2 ? 0 : 0), e % 2 ? 1 : .5, e % 4 < 2 ? .25 : -.25)
    if (!intro && !last) bass(t, (last ? 45 : root) - 12 + (e % 2 ? 12 : 0), BEAT / 2 * .9, e % 2 ? .6 : 1)
    if (b >= 2 && !last && e % 2 === 0) pluck(t + BEAT / 4, tri[(e / 2) % 3] + 12, .8, e % 4 ? .35 : -.35)
  }
  if (last) bass(t0, 33, 1.8, 1.1)
}
// sfx, all in key and on the grid: whooshes into each cut, chimes on reveals
for (const c of [3, 7, 11, 15, 17]) whoosh(c, .5, .9)
for (const [t, m] of [[1.0, 81], [3.25, 69], [3.5, 72], [4.0, 76], [4.5, 81], [7.5, 77], [9.0, 84], [12.25, 79], [13.0, 84], [16.0, 81], [17.0, 76]]) chime(t, m, .8)

// mix: gentle fade out of the last beat, soft clip, 16-bit stereo WAV
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
const buf = Buffer.alloc(44 + N * 4)
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16)
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28)
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) {
  const t = i / SR, fade = Math.min(1, (DUR - t) / 1.2)
  const l = Math.tanh(L[i] / peak * 1.4) * .85 * fade, r = Math.tanh(R[i] / peak * 1.4) * .85 * fade
  buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(r * 32767), 46 + i * 4)
}
writeFileSync(process.argv[2] || 'music.wav', buf)
console.log('peak', peak.toFixed(2))
