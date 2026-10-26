// Renders index.html frame by frame in headless Chrome over CDP (no dependencies).
// usage: node capture.mjs <outDir> <fps> <duration> [t1,t2,...]   (times list = stills only)
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const [outDir, fps = '30', dur = '20', list] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const here = new URL('.', import.meta.url).pathname
const port = 9337
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(here, 'chrome-profile')}`,
  '--hide-scrollbars', '--window-size=1920,1080', '--no-first-run', '--disable-gpu', 'about:blank'
], { stdio: 'ignore' })

let targets
for (let i = 0; i < 50; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break } catch {}
  await sleep(200)
}
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let id = 0; const pending = new Map()
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } })
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: 'file://' + resolve(here, 'index.html') })
await sleep(800)
await evaluate('window.ready')

const times = list ? list.split(',').map(Number) : Array.from({ length: Math.round(+fps * +dur) }, (_, i) => i / +fps)
for (let i = 0; i < times.length; i++) {
  await evaluate(`render(${times[i]}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  const name = list ? `still-${times[i].toFixed(2)}.png` : `f${String(i).padStart(5, '0')}.png`
  writeFileSync(join(outDir, name), Buffer.from(shot.result.data, 'base64'))
  if (!list && i % 60 === 0) console.log(`frame ${i}/${times.length}`)
}
ws.close(); chrome.kill()
