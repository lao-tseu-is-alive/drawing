# drawing

> A Lit Web Components library + interactive SVG demo, built with Bun.
> Used as a learning and experimentation ground for developers migrating from Vue to native Web Components.

---

## Tech Stack

| Tool | Role |
|---|---|
| [Bun](https://bun.sh) | Runtime, bundler, test runner, dev server |
| [Lit](https://lit.dev) | Web Components base library (reactive properties, Shadow DOM, tagged templates) |
| [TypeScript](https://www.typescriptlang.org) | Static typing with strict settings |

---

## Project Structure

```
.
├── index.html                   # App shell — never changes when adding components
├── build.ts                     # Production library bundler (ESM, CJS, IIFE, .d.ts)
├── tsconfig.json                # TypeScript config for IDE / type-checking (noEmit)
├── tsconfig.build.json          # TypeScript config for declaration emit (used by build.ts)
├── package.json
└── src/
    ├── index.ts                 # Library public API — re-exports all components
    └── components/
        ├── drawing-app.ts       # Root app shell component (<drawing-app>) — composition root
        └── drawing-canvas.ts    # SVG drawing canvas component (<drawing-canvas>)
```

### Key architectural decisions

**`drawing-app` is the composition root** (equivalent to `App.vue` in Vue).  
`index.html` only ever contains `<drawing-app>`. Adding a new component means:
1. Create `src/components/my-new-element.ts`
2. Import it in `drawing-app.ts` and add its tag to `render()`
3. Export it from `src/index.ts`

`index.html` is never touched again.

---

## Vue → Lit Cheat Sheet

| Vue concept | Lit equivalent |
|---|---|
| `defineComponent()` + `app.component('x', X)` | `@customElement('x')` decorator |
| `<style scoped>` | `static styles = css` (injected into Shadow DOM) |
| `ref()` / `reactive()` / `data()` | `@state()` (private reactive property) |
| `@property` / `defineProps()` | `@property()` (public reactive attribute) |
| `<template>` / `render()` / `h()` | `render()` returning `html` tagged template |
| `{{ expression }}` | `${expression}` inside `html` template |
| `@click="handler"` | `@click=${this.handler}` inside `html` template |
| `<Transition>` | Native CSS `transition:` in `static styles` |
| `App.vue` root component | `<drawing-app>` shell component |
| `app.mount('#app')` | `<drawing-app></drawing-app>` in HTML |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1

### Install

```bash
bun install
```

### Development

```bash
bun run dev
```

Starts Bun's built-in dev server at `http://localhost:3000` with:
- TypeScript transpilation on the fly (no pre-build step)
- Live reload via WebSocket (injected automatically by Bun)
- Full watch mode on `src/`

> **No `dist/` is needed in dev.** `index.html` loads `src/index.ts` directly.  
> Bun resolves and transpiles everything in memory.

### Type checking

```bash
bun run check
```

Runs `tsc --noEmit` — validates types without emitting any files.

### Tests

```bash
bun run test         # run once
bun run test:watch   # watch mode
```

### Production build (library)

```bash
bun run build
```

Produces the following in `dist/`:

| File | Format | Use case |
|---|---|---|
| `drawing.esm.js` | ESM | Modern bundlers (Vite, Webpack, Rollup) |
| `drawing.cjs.js` | CJS | Node.js / older bundlers |
| `drawing.umd.js` | IIFE | Direct `<script>` tag in any HTML page |
| `drawing.d.ts` | TypeScript declarations | Consumers using TypeScript |

---

## Components

### `<drawing-app>`

Root application shell. Composition root for all other components.  
Equivalent to `App.vue` — this is the only tag that appears in `index.html`.

```html
<drawing-app></drawing-app>
```

Shadow DOM is intentionally **disabled** on this component so global page styles
(typography, max-width, etc.) still apply to the layout shell.

---

### `<drawing-canvas>`

Interactive SVG canvas. Click anywhere on the canvas to move the circle.  
Crosshair guide lines follow the circle in real time using `@state()` reactive properties.

```html
<drawing-canvas></drawing-canvas>
```

**Reactive state:**

| Property | Type | Description |
|---|---|---|
| `cx` | `number` | Circle center X (updated on click) |
| `cy` | `number` | Circle center Y (updated on click) |
| `radius` | `number` | Circle radius |

**Lit concepts demonstrated:**
- `@state()` — private reactive properties triggering targeted DOM updates
- `static styles` — Shadow DOM scoped CSS
- `@click` event binding in `html` template
- `svg` tagged template for correct SVG namespace rendering
- `override` keyword required by `noImplicitOverride` tsconfig setting

---

## Adding a New Component

1. **Create the component file:**

```ts
// src/components/my-counter.ts
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('my-counter')
export class MyCounter extends LitElement {
  @state() private count = 0;

  override render() {
    return html`
      <button @click=${() => this.count++}>
        Clicked ${this.count} times
      </button>
    `;
  }
}
```

2. **Register it in the app shell** (`src/components/drawing-app.ts`):

```ts
import './my-counter.js';

// Then in render():
return html`
  <drawing-canvas></drawing-canvas>
  <my-counter></my-counter>
`;
```

3. **Export it from the library** (`src/index.ts`):

```ts
export * from './components/my-counter.js';
```

`index.html` remains untouched.

---

## tsconfig Setup

This project uses two TypeScript configs to avoid a conflict between IDE type-checking and declaration emit:

| File | Purpose | Key settings |
|---|---|---|
| `tsconfig.json` | IDE + `bun run check` | `noEmit: true` |
| `tsconfig.build.json` | Declaration emit in `build.ts` | `noEmit: false`, `emitDeclarationOnly: true` |

**Key Lit-specific settings** (both configs):

```json
"experimentalDecorators": true,   // required for @customElement, @state, @property
"useDefineForClassFields": false   // required: prevents TS from overwriting Lit's property descriptors
```

---

## Using the Library in Another Project

```bash
# If published to npm:
bun add drawing

# Or link locally:
bun link          # in this project
bun link drawing  # in the consumer project
```

```ts
// In your consumer project — import the whole library:
import 'drawing';

// Or import only what you need (tree-shakeable):
import 'drawing/dist/drawing-canvas.js';
```

```html
<!-- Then use the tags anywhere in your HTML: -->
<drawing-canvas></drawing-canvas>
```

---

## License

GNU General Public License v3.0 — see [LICENSE](./LICENSE).
