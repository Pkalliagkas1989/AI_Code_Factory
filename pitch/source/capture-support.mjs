import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const MAX_FRAMES = 18000
export function parseOptions(args) {
  const [outDir, fpsText = '30', durationText = '20', list] = args
  if (!outDir || args.length > 4) throw new Error('usage: node capture.mjs <outDir> <fps=30> <duration=20> [t1,t2,...]')
  const fps = Number(fpsText), duration = Number(durationText)
  if (!Number.isFinite(fps) || fps <= 0 || !Number.isFinite(duration) || duration <= 0) throw new Error('fps and duration must be finite positive numbers')
  const count = Math.round(fps * duration)
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX_FRAMES) throw new Error(`maximum ${MAX_FRAMES} frames; fps × duration must produce at least one frame`)
  let times
  if (list !== undefined) {
    const entries = list.split(',')
    if (entries.length > MAX_FRAMES || entries.some(t => !t.trim() || !Number.isFinite(Number(t)) || Number(t) < 0 || Number(t) > duration)) throw new Error(`still times must be finite, between 0 and duration, with maximum ${MAX_FRAMES} entries`)
    times = entries.map(Number)
  } else times = Array.from({ length: count }, (_, i) => i / fps)
  return { outDir, fps, duration, times, stills: list !== undefined }
}

export async function readEndpoint(profile) {
  const data = await readFile(join(profile, 'DevToolsActivePort'), 'utf8')
  const [port, path] = data.trim().split('\n')
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535 || !/^\/devtools\/browser\/[a-zA-Z0-9-]+$/.test(path)) throw new Error('invalid Chrome debugging endpoint')
  return `ws://127.0.0.1:${port}${path}`
}

export function connectCDP(url, { WebSocketImpl = WebSocket, timeoutMs = 10000, signal } = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocketImpl(url)
    let id = 0, closed = false, opened = false
    const pending = new Map()
    const fail = (error) => {
      if (closed) return
      closed = true
      clearTimeout(startup)
      signal?.removeEventListener('abort', abort)
      reject(error)
      for (const request of pending.values()) { clearTimeout(request.timer); request.reject(error) }
      pending.clear()
      ws.close()
    }
    const abort = () => fail(signal.reason ?? new Error('capture aborted'))
    const startup = setTimeout(() => fail(new Error('CDP connection timeout')), timeoutMs)
    ws.addEventListener('close', () => fail(new Error('CDP connection closed')))
    ws.addEventListener('error', () => fail(new Error('CDP connection error')))
    ws.addEventListener('message', e => {
      let message
      try { message = JSON.parse(e.data) } catch { fail(new Error('invalid CDP JSON message')); return }
      const request = pending.get(message.id)
      if (!request) return
      pending.delete(message.id); clearTimeout(request.timer)
      if (message.error) request.reject(new Error(`CDP: ${message.error.message}`))
      else request.resolve(message)
    })
    ws.addEventListener('open', () => {
      if (closed || opened) return
      opened = true; clearTimeout(startup)
      resolve({
        send(method, params = {}, sessionId) {
          if (closed) return Promise.reject(new Error('CDP connection closed'))
          return new Promise((resolve, reject) => {
            const requestId = ++id
            const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP ${method} timeout`)) }, timeoutMs)
            pending.set(requestId, { resolve, reject, timer })
            try { ws.send(JSON.stringify({ id: requestId, method, params, ...(sessionId ? { sessionId } : {}) })) }
            catch (error) { pending.delete(requestId); clearTimeout(timer); reject(error) }
          })
        },
        close: () => fail(new Error('CDP connection closed'))
      })
    })
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) abort()
  })
}

export async function stopChrome(child, graceMs = 2000, kill = signal => child.kill(signal)) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  let timer
  await new Promise((resolve, reject) => {
    const done = error => {
      clearTimeout(timer)
      child.removeListener('exit', exited); child.removeListener('error', done)
      if (error) reject(error); else resolve()
    }
    const exited = () => done()
    const sendSignal = signal => { try { kill(signal) } catch (error) { done(error) } }
    child.once('exit', exited); child.once('error', done)
    timer = setTimeout(() => {
      timer = setTimeout(() => done(new Error('Chrome did not exit after SIGKILL')), graceMs)
      sendSignal('SIGKILL')
    }, graceMs)
    sendSignal('SIGTERM')
  })
}
