// Wires the todo logic to the page and keeps the list in localStorage.
import { addTodo, toggleTodo, removeTodo, remaining, filterTodos, clearCompleted } from './todos.js'

const KEY = 'todos'
const form = document.querySelector('#new-todo')
const input = document.querySelector('#new-todo input')
const list = document.querySelector('#list')
const count = document.querySelector('#count')
const filterButtons = document.querySelectorAll('.filter')
const clearButton = document.querySelector('#clear-completed')

let todos = load()
let filter = 'all'

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

    const del = document.createElement('button')
    del.type = 'button'
    del.className = 'delete'
    del.textContent = '×'
    del.setAttribute('aria-label', `Delete ${t.text}`)
    del.addEventListener('click', () => update(removeTodo(todos, t.id)))

    li.append(box, label, del)
    return li
  }))
  const n = remaining(todos)
  count.textContent = `${n} ${n === 1 ? 'item' : 'items'} left`
  clearButton.disabled = n === todos.length
  filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)))
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

render()
