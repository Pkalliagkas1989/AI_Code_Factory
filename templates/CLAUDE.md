# <Project name>

<!--
Copy this file to the root of the project the factory will work on and fill it
in. Every factory agent reads it: it is the only place they learn how your
project works. Delete these comments when done.
-->

One or two sentences: what this project is and who uses it.

## Stack

- Language / framework: <e.g. TypeScript + Vue 3 + Vite>
- Package manager: <e.g. npm>
- Backend / services: <e.g. Firebase, none>

## Layout

- `src/`: <what's here>
- `src/components/`: <what's here>
- `public/`: <what's here>

## Fresh checkout setup

The factory runs these in every new worktree:

```bash
npm install
```

## Dev server

Agents pass their own port, so the command must accept one:

```bash
npm run dev -- --port <port>
```

## Validation

Run these for the areas you changed. They must pass before a job is READY.

```bash
npm test             # tests
npm run build        # production build
npx eslint <files>   # lint only the changed files
```

## Conventions

- Commit messages: <your convention, or delete this line to use Conventional
  Commits: `type(scope): summary` + a body explaining what and why>
- <naming, formatting, how components are structured>
- <where styles and design tokens live>
- <anything an agent must never do, e.g. never edit generated files in dist/>
