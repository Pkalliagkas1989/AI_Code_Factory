import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'

// Exercise the actual standalone inline script, with no server or dependencies.
const html = readFileSync(new URL('./dashboard.html', import.meta.url), 'utf8')
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
const context = vm.createContext({})
vm.runInContext(script.slice(0, script.indexOf("document.getElementById('board').addEventListener")), context)
const run = (source) => vm.runInContext(source, context)

test('reviewer names and verdict attributes cannot create markup', () => {
  const output = run(`card({id:'001-test',stage:'review',reviews:{'<img src=x onerror=alert(1)>':'PASS'},rounds:[{'<img src=x onerror=alert(1)>':'" onmouseover="alert(1)'}]})`)
  assert.ok(output.includes('&lt;img'))
  assert.ok(!output.includes('<img'))
  assert.ok(!output.includes('class="chip " onmouseover='))
  assert.ok(output.includes('class="chip pending"'))
})

test('cost values accept only finite nonnegative safe numbers', () => {
  for (const value of ['"<img src=x onerror=alert(1)>"', '"90"', '-1', 'NaN', 'Infinity', 'Number.MAX_SAFE_INTEGER + 1', '{}', '[]', 'null']) {
    assert.equal(run(`duration(${value})`), '–', value)
    assert.equal(run(`sum({run:${value}})`), 0, value)
    const output = run(`costTable({tokens:{run:1000},seconds:{run:${value}}})`)
    assert.ok(!output.includes('<img'), value)
    assert.ok(!output.includes('NaN') && !output.includes('Infinity'), value)
  }
  assert.equal(run('duration(61)'), '1m 1s')
  assert.equal(run('sum({a:1000,b:2000})'), 3000)
  assert.equal(run('sum({a:Number.MAX_SAFE_INTEGER,b:1})'), 0)
})

test('mixed valid and malformed run metrics preserve valid rows', () => {
  const output = run(`costTable({tokens:{builder:2000,reviewer:1000,bad:'<img src=x>'},seconds:{builder:61,reviewer:30}})`)
  assert.ok(output.includes('3.0k'))
  assert.ok(output.includes('1m 31s'))
  assert.ok(output.includes('67%'))
  assert.ok(!output.includes('<img') && !output.includes('NaN'))
})

test('malformed job fields render safely and metadata is normalized', () => {
  for (const value of ['null', '[]', '{}', '{id:2,feature:{},after:3,reviews:[],rounds:null,tokens:[],seconds:[]}']) {
    const output = run(`card(${value})`)
    assert.equal(typeof output, 'string')
    assert.ok(!output.includes('[object Object]'))
    assert.equal(typeof run(`costTable(${value})`), 'string')
  }
  assert.equal(run(`normalizeJob({id:'../../wrong',stage:'review',round:1e10,reviews:null},'001-test').id`), '001-test')
  assert.equal(run(`normalizeJob({round:Number.MAX_SAFE_INTEGER + 1},'001-test').round`), 0)
})

test('dashboard server examples bind only to loopback', () => {
  const manual = readFileSync(new URL('../MANUAL.md', import.meta.url), 'utf8')
  for (const text of [html, manual]) {
    for (const command of text.matchAll(/python3 -m http\.server[^\n"`<]*/g)) {
      assert.match(command[0], /--bind 127\.0\.0\.1/)
    }
  }
})


test('directory IDs stay authoritative and malformed jobs do not break loading', async () => {
  const local = vm.createContext({})
  vm.runInContext(script.slice(0, script.indexOf("document.getElementById('board').addEventListener")), local)
  vm.runInContext(`
    listDir = async () => ['001-valid/', '002-null/', '003-incomplete/', '004-broken/']
    get = async (url) => {
      if (url.includes('001-valid')) return JSON.stringify({id:'../../wrong', stage:'review', round:2, reviews:{'bad/name': 'PASS'}})
      if (url.includes('002-null')) return 'null'
      if (url.includes('003-incomplete')) return JSON.stringify({id:4, round:Number.MAX_SAFE_INTEGER + 1, reviews:[], feature:{}, after:8})
      throw new Error('incomplete JSON')
    }
  `, local)
  const jobs = await vm.runInContext('loadJobs()', local)
  assert.deepEqual(Array.from(jobs, (job) => job.id), ['001-valid', '002-null', '003-incomplete'])
  assert.equal(jobs[0].rounds.length, 2)
  assert.equal(jobs[2].rounds.length, 0)
  local.loadedJobs = jobs
  assert.equal(typeof vm.runInContext('loadedJobs.map(card).join("")', local), 'string')
})


test('rework keeps round four visible and long histories show the latest bounded rounds', async () => {
  for (const round of [4, 105, 1e10]) {
    const local = vm.createContext({})
    vm.runInContext(script.slice(0, script.indexOf("document.getElementById('board').addEventListener")), local)
    local.currentRound = round
    vm.runInContext(`
      globalThis.requests = []
      get = async (url) => { requests.push(url); return 'VERDICT: CHANGES' }
      globalThis.job = normalizeJob({id:'001-rework', round:currentRound, reviews:{code:'PASS'}})
    `, local)
    await vm.runInContext('loadRounds(job).then((rounds) => { job.rounds = rounds })', local)
    const output = vm.runInContext('card(job)', local)
    const count = Math.min(round, 100)
    const first = round - count + 1
    assert.equal(vm.runInContext('job.rounds.length', local), count)
    assert.equal(local.requests.length, count - 1)
    assert.ok(local.requests[0].includes(`/round-${first}/`))
    assert.ok(output.includes(`>R${first}</span>`))
    assert.ok(output.includes(`>R${round}</span><span class="chip PASS">code</span>`))
    if (round > 100) {
      assert.ok(output.includes('Showing latest 100 rounds'))
      assert.ok(!output.includes(`>R${first - 1}</span>`))
    } else assert.ok(!output.includes('Showing latest'))
  }
})
