// Wires the todo logic to the page and keeps the named lists in localStorage.
import { addTodo, toggleTodo, removeTodo, remaining, itemsLeftLabel, filterTodos, clearCompleted, completeAll, editTodo, MAX_LIST_NAME, listNameError, addList, renameList, removeList, setListTodos, initialState } from './todos.js'

// Lists live under LISTS_KEY. OLD_KEY holds the pre-lists todos; it is only read, for migration.
const LISTS_KEY = 'todoLists'
const OLD_KEY = 'todos'
const NAME_ERRORS = {
  'empty': 'Enter a name for the list.',
  'too-long': `List names can be at most ${MAX_LIST_NAME} characters.`,
  'duplicate': 'Another list already has that name.',
}
const form = document.querySelector('#new-todo')
const input = document.querySelector('#new-todo input')
const list = document.querySelector('#list')
const count = document.querySelector('#count')
const filterButtons = document.querySelectorAll('.filter')
const clearButton = document.querySelector('#clear-completed')
const completeAllButton = document.querySelector('#complete-all')
const listTabs = document.querySelector('.list-tabs')
const addListButton = document.querySelector('#add-list')
const renameListButton = document.querySelector('#rename-list')
const deleteListButton = document.querySelector('#delete-list')
const nameForm = document.querySelector('#list-name')
const nameInput = document.querySelector('#list-name-text')
const nameLabel = document.querySelector('label[for="list-name-text"]')
const nameCancel = document.querySelector('#list-name-cancel')
const listMessage = document.querySelector('#list-message')

let { lists, openId } = load()
let filter = 'all'
// 'add', 'rename' or null while the list-name field is closed.
let nameMode = null
// A click on a label waits this long before toggling, so a double-click
// can cancel it and open the editor instead.
const TOGGLE_DELAY = 250
const toggleTimers = new Map()

function cancelToggle(id) {
  clearTimeout(toggleTimers.get(id))
  toggleTimers.delete(id)
}

function load() {
  let rawLists = null
  let rawTodos = null
  try {
    rawLists = localStorage.getItem(LISTS_KEY)
    rawTodos = localStorage.getItem(OLD_KEY)
  } catch {}
  return initialState(rawLists, rawTodos)
}

function todosOf(id) {
  return lists.find((l) => l.id === id)?.todos ?? []
}

function save(nextLists, nextOpenId) {
  lists = nextLists
  openId = nextOpenId
  try { localStorage.setItem(LISTS_KEY, JSON.stringify({ lists, openId })) } catch {}
  render()
}

// Replaces the todos of a list (the open one by default).
function update(next, id = openId) {
  save(setListTodos(lists, id, next), openId)
}

function render() {
  const todos = todosOf(openId)
  listTabs.replaceChildren(...lists.map((l) => {
    const tab = document.createElement('button')
    tab.type = 'button'
    tab.className = 'filter list-tab'
    tab.textContent = l.name
    tab.setAttribute('aria-pressed', String(l.id === openId))
    tab.addEventListener('click', () => {
      // The rename field names the open list, so it closes when another list opens.
      if (nameMode === 'rename' && l.id !== openId) {
        nameMode = null
        nameForm.hidden = true
        listMessage.textContent = ''
      }
      save(lists, l.id)
    })
    return tab
  }))
  deleteListButton.disabled = lists.length === 1

  list.replaceChildren(...filterTodos(todos, filter).map((t) => {
    const listId = openId
    const li = document.createElement('li')
    li.className = t.done ? 'done' : ''

    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = t.done
    box.id = `todo-${t.id}`
    box.addEventListener('change', () => update(toggleTodo(todosOf(listId), t.id), listId))

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
        update(toggleTodo(todosOf(listId), t.id), listId)
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
    del.addEventListener('click', () => update(removeTodo(todosOf(listId), t.id), listId))

    li.append(box, label, del)
    return li
  }))
  count.textContent = itemsLeftLabel(todos)
  clearButton.disabled = remaining(todos) === todos.length
  completeAllButton.disabled = remaining(todos) === 0
  filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)))
}

function startEdit(label, t) {
  const listId = openId
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
    if (save) update(editTodo(todosOf(listId), t.id, field.value), listId)
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

function openNameField(mode) {
  nameMode = mode
  const open = lists.find((l) => l.id === openId)
  nameLabel.textContent = mode === 'add' ? 'New list name' : `New name for ${open.name}`
  nameInput.value = mode === 'add' ? '' : open.name
  listMessage.textContent = ''
  nameForm.hidden = false
  nameInput.focus()
  nameInput.select()
}

function closeNameField() {
  const trigger = nameMode === 'add' ? addListButton : renameListButton
  nameMode = null
  nameForm.hidden = true
  listMessage.textContent = ''
  trigger.focus()
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  update(addTodo(todosOf(openId), input.value))
  input.value = ''
})

filterButtons.forEach((b) => b.addEventListener('click', () => {
  filter = b.dataset.filter
  render()
}))

clearButton.addEventListener('click', () => update(clearCompleted(todosOf(openId))))
completeAllButton.addEventListener('click', () => update(completeAll(todosOf(openId))))

addListButton.addEventListener('click', () => openNameField('add'))
renameListButton.addEventListener('click', () => openNameField('rename'))

nameForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const ownId = nameMode === 'rename' ? openId : undefined
  const error = listNameError(lists, nameInput.value, ownId)
  if (error) {
    listMessage.textContent = NAME_ERRORS[error]
    nameInput.focus()
    return
  }
  if (nameMode === 'add') {
    const next = addList(lists, nameInput.value)
    save(next, next[next.length - 1].id)
  } else {
    save(renameList(lists, openId, nameInput.value), openId)
  }
  closeNameField()
})

nameInput.addEventListener('keydown', (e) => {
  if (e.isComposing || e.key !== 'Escape') return
  closeNameField()
})
nameCancel.addEventListener('click', closeNameField)

deleteListButton.addEventListener('click', () => {
  const open = lists.find((l) => l.id === openId)
  if (lists.length === 1 || !window.confirm(`Delete the list "${open.name}" and all its todos?`)) return
  const next = removeList(lists, openId)
  save(next, next[0].id)
  listTabs.querySelector('[aria-pressed="true"]').focus()
})

render()
