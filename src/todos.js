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

export function editTodo(todos, id, text) {
  const trimmed = text.trim()
  if (!trimmed) return removeTodo(todos, id)
  return todos.map((t) => (t.id === id ? { ...t, text: trimmed } : t))
}
