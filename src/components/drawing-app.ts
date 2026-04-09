import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

// Import all child components so their custom elements are registered before render().
// This is the Lit equivalent of importing child components in a Vue App.vue <script setup>.
// The @customElement decorator on each file calls customElements.define() as a side effect,
// making the tag available globally in the document.
import './drawing-canvas.js';

// @customElement('drawing-app') is the root application shell.
// It plays the same role as App.vue in a Vue project:
// - it is the single tag placed in index.html
// - index.html never needs to change when you add new components
// - all composition happens here
//
// To add a new component tomorrow:
//   1. Create src/components/my-new-element.ts
//   2. Import it here: import './my-new-element.js'
//   3. Use its tag inside the render() template below
//   index.html stays untouched.
@customElement('drawing-app')
export class DrawingApp extends LitElement {
  // No Shadow DOM for the app shell — styles defined here apply to the light DOM,
  // letting global page styles (body, h1, etc.) still reach the shell's direct children.
  // Child components still have their own isolated Shadow DOM.
  // This mirrors the Vue pattern where App.vue typically does not use scoped styles
  // for its top-level layout, but child components do.
  protected override createRenderRoot() {
    return this; // disable Shadow DOM for the shell only
  }

  static override styles = css`
    :host {
      display: block;
    }

    .app-layout {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `;

  override render() {
    // This is your composition root — the Lit equivalent of the <template> in App.vue.
    // Add new component tags here as your library grows.
    return html`
      <div class="app-layout">
        <drawing-canvas></drawing-canvas>

        <!-- Add new components here, e.g.: -->
        <!-- <my-other-element></my-other-element> -->
      </div>
    `;
  }
}
