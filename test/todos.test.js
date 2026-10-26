import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addTodo, toggleTodo, removeTodo, remaining, itemsLeftLabel, filterTodos, clearCompleted, completeAll, editTodo } from '../src/todos.js'

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

test('itemsLeftLabel uses the singular only for one active todo', () => {
  assert.equal(itemsLeftLabel([]), '0 items left')
  assert.equal(itemsLeftLabel(addTodo([], 'a')), '1 item left')
  assert.equal(itemsLeftLabel(addTodo(addTodo([], 'a'), 'b')), '2 items left')
})

test('itemsLeftLabel ignores done todos and does not mutate', () => {
  const before = toggleTodo(addTodo(addTodo(addTodo([], 'a'), 'b'), 'c'), 2)
  const copy = structuredClone(before)
  assert.equal(itemsLeftLabel(before), '2 items left')
  assert.equal(itemsLeftLabel(toggleTodo(before, 1)), '1 item left')
  assert.deepEqual(before, copy)
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

test('editTodo updates and trims the text of one todo', () => {
  const after = editTodo(sample(), 2, '  b2  ')
  assert.deepEqual(after, [
    { id: 1, text: 'a', done: false },
    { id: 2, text: 'b2', done: true },
    { id: 3, text: 'c', done: false },
  ])
})

test('editTodo removes the todo when the text is empty or only spaces', () => {
  assert.deepEqual(editTodo(sample(), 2, '').map((t) => t.id), [1, 3])
  assert.deepEqual(editTodo(sample(), 2, '   ').map((t) => t.id), [1, 3])
})

test('editTodo leaves other todos untouched', () => {
  const before = sample()
  const after = editTodo(before, 2, 'x')
  assert.equal(after[0], before[0])
  assert.equal(after[2], before[2])
})

test('editTodo with an unknown id returns an equal copy', () => {
  const before = sample()
  const after = editTodo(before, 99, 'x')
  assert.deepEqual(after, before)
  assert.notEqual(after, before)
})

test('editTodo does not mutate its input', () => {
  const before = sample()
  const copy = structuredClone(before)
  editTodo(before, 2, 'changed')
  editTodo(before, 1, '')
  assert.deepEqual(before, copy)
})

test('completeAll marks every todo done and keeps ids and texts', () => {
  const todos = toggleTodo(addTodo(addTodo(addTodo([], 'a'), 'b'), 'c'), 2)
  assert.deepEqual(completeAll(todos), [
    { id: 1, text: 'a', done: true },
    { id: 2, text: 'b', done: true },
    { id: 3, text: 'c', done: true },
  ])
})

test('completeAll does not mutate its input', () => {
  const before = addTodo(addTodo([], 'a'), 'b')
  const snapshot = structuredClone(before)
  const after = completeAll(before)
  assert.notEqual(after, before)
  assert.deepEqual(before, snapshot)
})

test('completeAll of an empty list is an empty array', () => {
  assert.deepEqual(completeAll([]), [])
})
