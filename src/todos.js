// Pure todo-list logic. No DOM here, so every function is unit-tested.
// A todo is { id, text, done }. Functions return new arrays and never mutate.

export function addTodo(todos, text) {
  const trimmed = text.trim()
  if (!trimmed) return todos
  const id = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1
  return [...todos, { id, text: trimmed, done: false }]
}

export function toggleTodo(todos, id) {
  return todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
}

export function removeTodo(todos, id) {
  return todos.filter((t) => t.id !== id)
}

export function remaining(todos) {
  return todos.filter((t) => !t.done).length
}

export function itemsLeftLabel(todos) {
  const n = remaining(todos)
  return `${n} ${n === 1 ? 'item' : 'items'} left`
}

export function filterTodos(todos, filter) {
  if (filter === 'active') return todos.filter((t) => !t.done)
  if (filter === 'completed') return todos.filter((t) => t.done)
  return [...todos]
}

export function clearCompleted(todos) {
  return todos.filter((t) => !t.done)
}

export function completeAll(todos) {
  return todos.map((t) => ({ ...t, done: true }))
}

export function editTodo(todos, id, text) {
  const trimmed = text.trim()
  if (!trimmed) return removeTodo(todos, id)
  return todos.map((t) => (t.id === id ? { ...t, text: trimmed } : t))
}

// Named lists. A list is { id, name, todos }; list ids follow the todo-id rule.
export const MAX_LIST_NAME = 40
export const DEFAULT_LIST_NAME = 'My todos'

// Returns the rule a list name breaks ('empty', 'too-long' or 'duplicate'),
// or null when it is fine. ownId is the list being renamed, if any.
export function listNameError(lists, name, ownId) {
  const trimmed = name.trim()
  if (!trimmed) return 'empty'
  if (trimmed.length > MAX_LIST_NAME) return 'too-long'
  const lower = trimmed.toLowerCase()
  if (lists.some((l) => l.id !== ownId && l.name.trim().toLowerCase() === lower)) return 'duplicate'
  return null
}

export function addList(lists, name) {
  if (listNameError(lists, name)) return lists
  const id = lists.reduce((max, l) => Math.max(max, l.id), 0) + 1
  return [...lists, { id, name: name.trim(), todos: [] }]
}

export function renameList(lists, id, name) {
  if (listNameError(lists, name, id)) return lists
  return lists.map((l) => (l.id === id ? { ...l, name: name.trim() } : l))
}

export function removeList(lists, id) {
  if (lists.length <= 1) return lists
  return lists.filter((l) => l.id !== id)
}

export function setListTodos(lists, id, todos) {
  return lists.map((l) => (l.id === id ? { ...l, todos } : l))
}

function parse(raw) {
  try { return JSON.parse(raw) } catch { return null }
}

function isList(l) {
  return typeof l?.id === 'number' && typeof l.name === 'string' && Array.isArray(l.todos)
}

// Builds { lists, openId } from the raw localStorage strings: the saved lists
// when valid, otherwise one 'My todos' list holding the old todos.
export function initialState(rawLists, rawTodos) {
  const saved = parse(rawLists)
  if (Array.isArray(saved?.lists) && saved.lists.length > 0 && saved.lists.every(isList)) {
    const open = saved.lists.find((l) => l.id === saved.openId) ?? saved.lists[0]
    return { lists: saved.lists, openId: open.id }
  }
  const old = parse(rawTodos)
  const todos = Array.isArray(old) ? old : []
  return { lists: [{ id: 1, name: DEFAULT_LIST_NAME, todos }], openId: 1 }
}
