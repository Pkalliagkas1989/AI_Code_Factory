// Renders index.html frame by frame in an isolated headless Chrome (no dependencies).
// usage: node capture.mjs <outDir> <fps=30> <duration=20> [t1,t2,...]
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'
import { parseOptions, readEndpoint, connectCDP, stopChrome } from './capture-support.mjs'

export async function capture(args, { spawnChrome = spawn, chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', startupMs = 10000, rpcMs = 10000 } = {}) {
  const { outDir, times, stills } = parseOptions(args)
  const controller = new AbortController()
  const { signal } = controller
  let chrome, cdp, profile, interrupted = false
  const interrupt = () => { interrupted = true; controller.abort(new Error('capture interrupted')) }
  const stop = reason => controller.abort(reason)
  const exited = () => stop(new Error('Chrome exited before capture finished'))
  const failed = error => stop(error)
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt)
  try {
    profile = await mkdtemp(join(tmpdir(), 'pitch-capture-'))
    signal.throwIfAborted()
    chrome = spawnChrome(chromePath, [
      '--headless=new', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
      '--hide-scrollbars', '--window-size=1920,1080', '--no-first-run', '--disable-gpu', 'about:blank'
    ], { stdio: 'ignore', detached: true })
    chrome.once('error', failed); chrome.once('exit', exited)
    let endpoint
    const deadline = Date.now() + startupMs
    while (!endpoint) {
      signal.throwIfAborted()
      try { endpoint = await readEndpoint(profile) } catch (error) {
        if (error.code !== 'ENOENT' && !error.message.includes('endpoint')) throw error
      }
      if (!endpoint) {
        if (Date.now() >= deadline) throw new Error('Chrome startup timeout: no debugging endpoint')
        await sleep(50, undefined, { signal })
      }
    }
    signal.throwIfAborted()
    cdp = await connectCDP(endpoint, { signal, timeoutMs: rpcMs })
    // Create our own target through this fresh browser's authenticated-by-random-path endpoint.
    const created = await cdp.send('Target.createTarget', { url: 'about:blank' })
    const attached = await cdp.send('Target.attachToTarget', { targetId: created.result.targetId, flatten: true })
    const send = (method, params) => cdp.send(method, params, attached.result.sessionId)
    const evaluate = async expression => {
      const reply = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
      if (reply.result.exceptionDetails) throw new Error(`Page evaluation failed: ${reply.result.exceptionDetails.text}`)
      return reply.result.result
    }
    await send('Page.enable')
    await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
    const here = fileURLToPath(new URL('.', import.meta.url))
    const navigation = await send('Page.navigate', { url: pathToFileURL(resolve(here, 'index.html')).href })
    if (navigation.result.errorText) throw new Error(`Page navigation failed: ${navigation.result.errorText}`)
    await sleep(800, undefined, { signal })
    await evaluate('window.ready')
    await mkdir(outDir, { recursive: true })
    for (let i = 0; i < times.length; i++) {
      signal.throwIfAborted()
      await evaluate(`render(${times[i]}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`)
      const shot = await send('Page.captureScreenshot', { format: 'png' })
      const name = stills ? `still-${times[i].toFixed(2)}.png` : `f${String(i).padStart(5, '0')}.png`
      await writeFile(join(outDir, name), Buffer.from(shot.result.data, 'base64'))
      if (!stills && i % 60 === 0) console.log(`frame ${i}/${times.length}`)
    }
  } catch (error) {
    throw signal.aborted ? signal.reason : error
  } finally {
    cdp?.close()
    // Kill the launched process group, including renderer helpers, never an existing profile/browser.
    const kill = sig => {
      try { process.kill(-chrome.pid, sig) } catch (error) { if (error.code !== 'ESRCH') throw error }
    }
    try {
      if (chrome?.pid) {
        await stopChrome(chrome, 2000, kill)
        kill('SIGKILL')
      }
    } finally {
      chrome?.removeListener('exit', exited); chrome?.removeListener('error', failed)
      process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt)
      if (interrupted) process.exitCode = 130
      if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  capture(process.argv.slice(2)).catch(error => {
    console.error(`Capture failed: ${error.message}`)
    process.exitCode ||= 1
  })
}
