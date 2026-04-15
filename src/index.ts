// src/index.ts — library public API surface.
//
// Rules:
//   - Export every component you want consumers to be able to import individually.
//   - The side-effect of each import is that @customElement() registers the tag globally.
//   - Keep drawing-app last: it imports the others internally, but we still export it
//     so library consumers can extend or re-use it.
//
// To add a new component:
//   1. Create src/components/my-new-element.ts
//   2. Add: export * from './components/my-new-element.js';
//   3. Import it inside drawing-app.ts so it is composed into the app shell.
//   index.html and this file are the only two files you never have to change for new components —
//   only drawing-app.ts and index.ts.

export * from './components/drawing-toolbar.js';
export * from './components/drawing-board.js';
export * from './components/drawing-store.js';
export * from './components/drawing-app.js';
