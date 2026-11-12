import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { parseOptions, connectCDP, stopChrome, readEndpoint } from './capture-support.mjs'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

test('capture defaults retain 20 seconds at 30 fps', () => {
  const options = parseOptions(['frames'])
  assert.equal(options.times.length, 600)
  assert.equal(options.times[599], 599 / 30)
})

test('invalid and excessive capture input is rejected before side effects', () => {
  for (const args of [[], ['x', '0'], ['x', 'NaN'], ['x', 'Infinity'], ['x', '-1'], ['x', '30', '0'], ['x', '30', 'Infinity'], ['x', '100000', '100000'], ['x', '30', '20', ''], ['x', '30', '20', '1,,2'], ['x', '30', '20', '-1'], ['x', '30', '20', '21'], ['x', '30', '20', 'NaN']]) {
    assert.throws(() => parseOptions(args), /usage|finite|positive|maximum|still/i, JSON.stringify(args))
  }
  assert.deepEqual(parseOptions(['x', '30', '20', '0,20']).times, [0, 20])
})

test('endpoint comes from fresh profile and rejects malformed data', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'capture-test-'))
  try {
    await writeFile(join(dir, 'DevToolsActivePort'), '42123\n/devtools/browser/unique-id\n')
    assert.equal(await readEndpoint(dir), 'ws://127.0.0.1:42123/devtools/browser/unique-id')
    for (const value of ['9337\nws://other/target', '0\n/devtools/browser/id', '65536\n/devtools/browser/id', '42\n/devtools/page/id']) {
      await writeFile(join(dir, 'DevToolsActivePort'), value)
      await assert.rejects(readEndpoint(dir), /endpoint/i)
    }
  } finally { await rm(dir, { recursive: true, force: true }) }
})

class Socket extends EventTarget {
  static latest
  constructor() { super(); Socket.latest = this; this.sent = []; this.closed = false }
  send(data) { this.sent.push(JSON.parse(data)) }
  close() { this.closed = true; this.dispatchEvent(new Event('close')) }
  reply(data) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) })) }
}
async function connection() {
  const pending = connectCDP('ws://local', { WebSocketImpl: Socket, timeoutMs: 25 })
  Socket.latest.dispatchEvent(new Event('open'))
  return pending
}
test('CDP startup timeout closes socket', async () => {
  await assert.rejects(connectCDP('ws://local', { WebSocketImpl: Socket, timeoutMs: 5 }), /timeout/i)
  assert.equal(Socket.latest.closed, true)
})
test('CDP rejects protocol errors, times out RPCs and rejects pending calls on close', async () => {
  const cdp = await connection()
  const failed = cdp.send('Page.enable')
  Socket.latest.reply({ id: 1, error: { message: 'denied' } })
  await assert.rejects(failed, /denied/)
  await assert.rejects(cdp.send('Page.enable'), /timeout/i)
  const pending = cdp.send('Page.enable')
  Socket.latest.close()
  await assert.rejects(pending, /closed/i)
  await assert.rejects(cdp.send('Page.enable'), /closed/i)
})
test('CDP handles malformed messages and abort cleanup', async () => {
  const controller = new AbortController()
  const pending = connectCDP('ws://local', { WebSocketImpl: Socket, signal: controller.signal, timeoutMs: 25 })
  Socket.latest.dispatchEvent(new Event('open'))
  const cdp = await pending
  const rpc = cdp.send('Page.enable')
  Socket.latest.dispatchEvent(new MessageEvent('message', { data: '{' }))
  await assert.rejects(rpc, /message|JSON/i)
  assert.equal(Socket.latest.closed, true)
  const waiting = connectCDP('ws://local', { WebSocketImpl: Socket, signal: controller.signal, timeoutMs: 25 })
  controller.abort()
  await assert.rejects(waiting, /abort/i)
  assert.equal(Socket.latest.closed, true)
})
test('Chrome cleanup escalates and waits for actual process exit', async () => {
  const child = new EventEmitter()
  child.exitCode = null; child.signalCode = null
  const signals = []
  child.kill = (signal) => { signals.push(signal); if (signal === 'SIGKILL') { child.signalCode = signal; child.emit('exit', null, signal) } }
  await stopChrome(child, 5)
  assert.deepEqual(signals, ['SIGTERM', 'SIGKILL'])
})

// Real disposable Node children exercise ownership/cleanup without opening Chrome or a port.
import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { capture } from './capture.mjs'

test('missing Chrome executable rejects and removes its temporary profile', async () => {
  let profile
  await assert.rejects(capture(['unused'], {
    spawnChrome(command, args, options) {
      profile = args.find(arg => arg.startsWith('--user-data-dir=')).slice('--user-data-dir='.length)
      return spawn('/definitely-missing-pitch-chrome', [], options)
    }
  }), /ENOENT/)
  await assert.rejects(access(profile), { code: 'ENOENT' })
})

test('startup timeout terminates launched child and removes its profile', async () => {
  let child, profile
  await assert.rejects(capture(['unused'], {
    startupMs: 10,
    spawnChrome(command, args, options) {
      assert.ok(args.includes('--remote-debugging-port=0'))
      profile = args.find(arg => arg.startsWith('--user-data-dir=')).slice('--user-data-dir='.length)
      child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], options)
      return child
    }
  }), /startup timeout/)
  assert.throws(() => process.kill(child.pid, 0), { code: 'ESRCH' })
  await assert.rejects(access(profile), { code: 'ENOENT' })
})

test('SIGINT aborts startup, stops child, removes profile and signal listeners', async () => {
  let child, profile
  const count = process.listenerCount('SIGINT')
  const oldExitCode = process.exitCode
  try {
    await assert.rejects(capture(['unused'], {
      spawnChrome(command, args, options) {
        profile = args.find(arg => arg.startsWith('--user-data-dir=')).slice('--user-data-dir='.length)
        child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], options)
        child.once('spawn', () => process.emit('SIGINT'))
        return child
      }
    }), /abort|interrupt/i)
    assert.equal(process.exitCode, 130)
    assert.equal(process.listenerCount('SIGINT'), count)
    assert.throws(() => process.kill(child.pid, 0), { code: 'ESRCH' })
    await assert.rejects(access(profile), { code: 'ENOENT' })
  } finally { process.exitCode = oldExitCode }
})

test('successful capture and screenshot errors both close CDP, stop child and remove profile', async () => {
  const OriginalSocket = globalThis.WebSocket
  const output = await mkdtemp(join(tmpdir(), 'pitch-output-test-'))
  try {
    for (const failScreenshot of [false, true]) {
      let child, profile, socket
      class BrowserSocket extends Socket {
        constructor(url) {
          super(); socket = this
          assert.match(url, /^ws:\/\/127\.0\.0\.1:42123\/devtools\/browser\/test-id$/)
          queueMicrotask(() => this.dispatchEvent(new Event('open')))
        }
        send(data) {
          super.send(data)
          const request = JSON.parse(data)
          if (request.method === 'Page.enable') assert.equal(request.sessionId, 'owned-session')
          queueMicrotask(() => this.reply({
            id: request.id,
            ...(failScreenshot && request.method === 'Page.captureScreenshot'
              ? { error: { message: 'screenshot failed' } }
              : { result: request.method === 'Target.createTarget' ? { targetId: 'owned-target' }
                : request.method === 'Target.attachToTarget' ? { sessionId: 'owned-session' }
                  : request.method === 'Page.captureScreenshot' ? { data: Buffer.from('test-frame').toString('base64') }
                    : request.method === 'Runtime.evaluate' ? { result: {} } : {} })
          }))
        }
      }
      globalThis.WebSocket = BrowserSocket
      const result = capture([join(output, String(failScreenshot)), '1', '1'], {
        spawnChrome(command, args, options) {
          profile = args.find(arg => arg.startsWith('--user-data-dir=')).slice('--user-data-dir='.length)
          child = spawn(process.execPath, ['-e', "require('node:fs').writeFileSync(process.argv[1] + '/DevToolsActivePort', '42123\\n/devtools/browser/test-id\\n'); setInterval(() => {}, 1000)", profile], options)
          return child
        }
      })
      if (failScreenshot) await assert.rejects(result, /screenshot failed/)
      else {
        await result
        assert.equal(await (await import('node:fs/promises')).readFile(join(output, 'false', 'f00000.png'), 'utf8'), 'test-frame')
      }
      assert.equal(socket.closed, true)
      assert.throws(() => process.kill(child.pid, 0), { code: 'ESRCH' })
      await assert.rejects(access(profile), { code: 'ENOENT' })
    }
  } finally {
    globalThis.WebSocket = OriginalSocket
    await rm(output, { recursive: true, force: true })
  }
})

test('cleanup reports a bounded failure if a killed child never exits', { timeout: 100 }, async () => {
  const child = new EventEmitter()
  child.exitCode = null; child.signalCode = null; child.kill = () => true
  await assert.rejects(stopChrome(child, 5), /did not exit/i)
  assert.equal(child.listenerCount('exit'), 0)
})
