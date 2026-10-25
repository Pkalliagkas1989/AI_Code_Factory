import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addTodo, toggleTodo, removeTodo, remaining } from '../src/todos.js'

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
