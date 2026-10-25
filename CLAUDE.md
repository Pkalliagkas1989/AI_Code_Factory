# Todos (factory test app)

A small todo-list web app used to test the AI code factory on a real project.
One page: add todos, tick them off, delete them. Data stays in the browser
(localStorage). This branch also holds the factory itself (`.claude/`,
`factory/`); factory jobs must not change those folders.

## Stack

- Language / framework: plain JavaScript (ES modules), HTML and CSS. No framework, no build step.
- Package manager: none needed. There are no dependencies; never add any.
- Backend / services: none.

## Layout

- `src/index.html`: the page.
- `src/app.js`: connects the page to the logic, renders the list, saves to localStorage.
- `src/todos.js`: pure functions for the todo list. Put all list logic here so it can be unit-tested.
- `src/styles.css`: all styles. Colours and spacing come from the tokens on `:root`.
- `test/`: unit tests for `src/todos.js`, using Node's built-in test runner.

## Fresh checkout setup

Nothing to install.

```bash
node --version   # needs Node 20 or newer
```

## Dev server

Serves `src/` as static files. Pass the port as the last argument:

```bash
npm run dev -- <port>
```

Then open `http://localhost:<port>/index.html`.

## Validation

They must pass before a job is READY.

```bash
npm test         # unit tests (node --test)
```

There is no linter or build. Check by hand that the page loads with no errors
in the browser console.

## Conventions

- Commit messages: Conventional Commits, `type(scope): summary` plus a body explaining what and why.
- Logic goes in `src/todos.js` as pure functions that return new arrays; `src/app.js` only handles the DOM and storage.
- Every new function in `src/todos.js` gets a test in `test/`.
- No semicolons, single quotes, 2-space indent, like the existing files.
- Colours, spacing and radii only through the CSS variables in `src/styles.css`; dark mode must keep working.
- Text from the user goes into the page with `textContent`, never `innerHTML`.
