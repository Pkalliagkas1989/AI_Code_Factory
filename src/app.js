// Wires the todo logic to the page and keeps the list in localStorage.
import { addTodo, toggleTodo, removeTodo, remaining, itemsLeftLabel, filterTodos, clearCompleted, completeAll, editTodo } from './todos.js'

const KEY = 'todos'
const form = document.querySelector('#new-todo')
const input = document.querySelector('#new-todo input')
const list = document.querySelector('#list')
const count = document.querySelector('#count')
const filterButtons = document.querySelectorAll('.filter')
const clearButton = document.querySelector('#clear-completed')
const completeAllButton = document.querySelector('#complete-all')

let todos = load()
let filter = 'all'
// A click on a label waits this long before toggling, so a double-click
// can cancel it and open the editor instead.
const TOGGLE_DELAY = 250
const toggleTimers = new Map()

function cancelToggle(id) {
  clearTimeout(toggleTimers.get(id))
  toggleTimers.delete(id)
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? [] } catch { return [] }
}

function update(next) {
  todos = next
  try { localStorage.setItem(KEY, JSON.stringify(todos)) } catch {}
  render()
}

function render() {
  list.replaceChildren(...filterTodos(todos, filter).map((t) => {
    const li = document.createElement('li')
    li.className = t.done ? 'done' : ''

    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = t.done
    box.id = `todo-${t.id}`
    box.addEventListener('change', () => update(toggleTodo(todos, t.id)))

    const label = document.createElement('label')
    label.htmlFor = box.id
    label.textContent = t.text
    label.addEventListener('click', (e) => {
      if (e.detail === 0) return
      e.preventDefault()
      cancelToggle(t.id)
      if (e.detail !== 1) return
      toggleTimers.set(t.id, setTimeout(() => {
        toggleTimers.delete(t.id)
        update(toggleTodo(todos, t.id))
      }, TOGGLE_DELAY))
    })
    label.addEventListener('dblclick', () => {
      cancelToggle(t.id)
      startEdit(label, t)
    })

    const del = document.createElement('button')
    del.type = 'button'
    del.className = 'delete'
    del.textContent = '×'
    del.setAttribute('aria-label', `Delete ${t.text}`)
    del.addEventListener('click', () => update(removeTodo(todos, t.id)))

    li.append(box, label, del)
    return li
  }))
  count.textContent = itemsLeftLabel(todos)
  clearButton.disabled = remaining(todos) === todos.length
  completeAllButton.disabled = remaining(todos) === 0
  filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)))
}

function startEdit(label, t) {
  const field = document.createElement('input')
  field.type = 'text'
  field.className = 'edit'
  field.value = t.text
  field.setAttribute('aria-label', `Edit ${t.text}`)

  // Enter, Escape and the blur from re-rendering can all end an edit; only the first counts.
  let finished = false
  function finish(save) {
    if (finished) return
    finished = true
    if (save) update(editTodo(todos, t.id, field.value))
    else render()
  }

  field.addEventListener('keydown', (e) => {
    if (e.isComposing) return
    if (e.key !== 'Enter' && e.key !== 'Escape') return
    finish(e.key === 'Enter')
    document.querySelector(`#todo-${t.id}`)?.focus()
  })
  field.addEventListener('blur', () => finish(true))

  label.replaceWith(field)
  field.focus()
  field.select()
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  update(addTodo(todos, input.value))
  input.value = ''
})

filterButtons.forEach((b) => b.addEventListener('click', () => {
  filter = b.dataset.filter
  render()
}))

clearButton.addEventListener('click', () => update(clearCompleted(todos)))
completeAllButton.addEventListener('click', () => update(completeAll(todos)))

render()
