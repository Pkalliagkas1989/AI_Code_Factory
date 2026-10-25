import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addTodo, toggleTodo, removeTodo, remaining, filterTodos, clearCompleted } from '../src/todos.js'

test('addTodo trims text and gives the next id', () => {
  const todos = addTodo(addTodo([], ' Buy milk '), 'Walk dog')
  assert.deepEqual(todos, [
    { id: 1, text: 'Buy milk', done: false },
    { id: 2, text: 'Walk dog', done: false },
  ])
})

test('addTodo ignores empty text', () => {
  assert.deepEqual(addTodo([], '   '), [])
})

test('toggleTodo flips one todo without mutating', () => {
  const before = addTodo([], 'a')
  const after = toggleTodo(before, 1)
  assert.equal(after[0].done, true)
  assert.equal(before[0].done, false)
})

test('removeTodo and remaining', () => {
  let todos = addTodo(addTodo([], 'a'), 'b')
  todos = toggleTodo(todos, 1)
  assert.equal(remaining(todos), 1)
  assert.deepEqual(removeTodo(todos, 1).map((t) => t.id), [2])
})

function sample() {
  return toggleTodo(addTodo(addTodo(addTodo([], 'a'), 'b'), 'c'), 2)
}

test('filterTodos all returns every todo', () => {
  assert.deepEqual(filterTodos(sample(), 'all').map((t) => t.text), ['a', 'b', 'c'])
})

test('filterTodos active returns only open todos', () => {
  assert.deepEqual(filterTodos(sample(), 'active').map((t) => t.text), ['a', 'c'])
})

test('filterTodos completed returns only done todos', () => {
  assert.deepEqual(filterTodos(sample(), 'completed').map((t) => t.text), ['b'])
})

test('filterTodos treats an unknown filter like all', () => {
  assert.deepEqual(filterTodos(sample(), 'bogus').map((t) => t.text), ['a', 'b', 'c'])
})

test('filterTodos does not mutate its input', () => {
  const before = sample()
  const copy = structuredClone(before)
  filterTodos(before, 'active')
  filterTodos(before, 'completed')
  filterTodos(before, 'all')
  assert.deepEqual(before, copy)
})

test('clearCompleted keeps only open todos', () => {
  assert.deepEqual(clearCompleted(sample()).map((t) => t.text), ['a', 'c'])
})

test('clearCompleted does not mutate its input', () => {
  const before = sample()
  const copy = structuredClone(before)
  const after = clearCompleted(before)
  assert.deepEqual(before, copy)
  assert.notEqual(after, before)
})
