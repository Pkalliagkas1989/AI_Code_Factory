import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addTodo, toggleTodo, removeTodo, remaining, itemsLeftLabel, filterTodos, clearCompleted, completeAll, editTodo, listNameError, addList, renameList, removeList, setListTodos, initialState } from '../src/todos.js'

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

const twoLists = () => addList(addList([], 'My todos'), 'Work')

test('listNameError rejects empty and spaces-only names', () => {
  assert.equal(listNameError([], ''), 'empty')
  assert.equal(listNameError([], '   '), 'empty')
})

test('listNameError allows 40 characters after trimming and rejects 41', () => {
  assert.equal(listNameError([], ` ${'a'.repeat(40)} `), null)
  assert.equal(listNameError([], 'a'.repeat(41)), 'too-long')
})

test('listNameError rejects another list\'s name in any case', () => {
  assert.equal(listNameError(twoLists(), ' work '), 'duplicate')
  assert.equal(listNameError(twoLists(), 'MY TODOS', 2), 'duplicate')
})

test('listNameError lets a list keep its own name in another case', () => {
  assert.equal(listNameError(twoLists(), 'WORK', 2), null)
})

test('addList appends a trimmed list with the next id and no todos', () => {
  assert.deepEqual(addList(addList([], 'My todos'), '  Work  '), [
    { id: 1, name: 'My todos', todos: [] },
    { id: 2, name: 'Work', todos: [] },
  ])
})

test('addList returns the same lists for an invalid name', () => {
  const lists = twoLists()
  assert.equal(addList(lists, 'work'), lists)
  assert.equal(addList(lists, ''), lists)
  assert.equal(addList(lists, 'a'.repeat(41)), lists)
})

test('renameList changes only the name and refuses invalid names', () => {
  const lists = setListTodos(twoLists(), 2, addTodo([], 'x'))
  const renamed = renameList(lists, 2, ' WORK ')
  assert.deepEqual(renamed[1], { id: 2, name: 'WORK', todos: lists[1].todos })
  assert.equal(renameList(lists, 2, 'my todos'), lists)
  assert.equal(renameList(lists, 2, ' '), lists)
})

test('removeList removes a list but never the last one', () => {
  assert.deepEqual(removeList(twoLists(), 2).map((l) => l.id), [1])
  const one = addList([], 'Only')
  assert.equal(removeList(one, 1), one)
})

test('setListTodos replaces the todos of one list only', () => {
  const lists = setListTodos(twoLists(), 2, addTodo([], 'x'))
  assert.deepEqual(lists[0].todos, [])
  assert.deepEqual(lists[1].todos, [{ id: 1, text: 'x', done: false }])
})

test('list functions do not mutate their input', () => {
  const before = setListTodos(twoLists(), 1, addTodo([], 'a'))
  const snapshot = structuredClone(before)
  addList(before, 'New')
  renameList(before, 1, 'Renamed')
  removeList(before, 1)
  setListTodos(before, 1, [])
  listNameError(before, 'x', 1)
  assert.deepEqual(before, snapshot)
})

test('initialState moves old todos unchanged into My todos', () => {
  const old = [{ id: 1, text: 'a', done: false }, { id: 2, text: 'b', done: true }]
  assert.deepEqual(initialState(null, JSON.stringify(old)), {
    lists: [{ id: 1, name: 'My todos', todos: old }],
    openId: 1,
  })
})

test('initialState starts with an empty My todos on missing or bad data', () => {
  const empty = { lists: [{ id: 1, name: 'My todos', todos: [] }], openId: 1 }
  assert.deepEqual(initialState(null, null), empty)
  assert.deepEqual(initialState('{bad', '[oops'), empty)
  assert.deepEqual(initialState('{"lists":[]}', '{"not":"a list"}'), empty)
  assert.deepEqual(initialState('[1,2]', '[]'), empty)
})

test('initialState prefers saved lists and opens the saved list', () => {
  const lists = setListTodos(twoLists(), 2, addTodo([], 'x'))
  const raw = JSON.stringify({ lists, openId: 2 })
  assert.deepEqual(initialState(raw, '[{"id":9,"text":"old","done":false}]'), { lists, openId: 2 })
})

test('initialState opens the first list when the saved id is gone or missing', () => {
  const lists = twoLists()
  assert.equal(initialState(JSON.stringify({ lists, openId: 7 }), null).openId, 1)
  assert.equal(initialState(JSON.stringify({ lists }), null).openId, 1)
})
