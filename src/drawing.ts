import { LitElement, html, css, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

// @customElement('drawing-canvas') registers this class as a native Web Component.
// Think of it as the Lit equivalent of Vue's defineComponent() + app.component() in one step.
// The tag name MUST contain a hyphen (Web Components spec requirement).
@customElement('drawing-canvas')
export class Drawing extends LitElement {
  // @state() marks a private reactive property — equivalent to a ref() or reactive() field in Vue 3
  // (or data() in Vue 2). Lit will re-render only the parts of the template that depend on it
  // whenever it changes, without diffing the whole tree.
  @state() private cx = 150;
  @state() private cy = 150;
  @state() private radius = 20;

  // static styles is the Lit equivalent of a Vue <style scoped> block.
  // Styles are injected into the component's Shadow DOM, so they are fully isolated:
  // they cannot leak out to the page, and global styles cannot bleed in (unless you use CSS custom properties).
  // css`` is a tagged template literal that Lit uses to parse and adopt styles efficiently.
  // :host targets the custom element itself, like targeting the root element in Vue with :deep(:root) or just writing
  // styles on the component's outermost element.
  static override styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
    }
    .panel {
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f4f4f4;
      border-radius: 4px;
    }
    svg {
      border: 2px solid #2c3e50;
      width: 100%;
      height: 400px;
      cursor: crosshair;
      background: #ffffff;
    }
    circle {
      transition: r 0.2s ease-in-out; /* Native CSS animation — no need for Vue <Transition> here */
    }
    circle:hover {
      fill: #e74c3c;
      r: 30px;
    }
  `;

  // Plain class method used as an event handler — no special Lit API needed.
  // In Vue you would put this in the methods: {} option or write it as a function in <script setup>.
  // Note: Lit automatically binds event listeners declared in the template (see render() below),
  // so there is no need to call addEventListener() manually or use v-on / @click directives separately.
  private _handleCanvasClick(e: MouseEvent) {
    const svgElement = e.currentTarget as SVGSVGElement;

    // getBoundingClientRect() converts the mouse position from page-relative coordinates
    // to SVG-element-relative coordinates — equivalent to what you'd do in a Vue @click handler
    // when you need the position relative to the target element.
    const rect = svgElement.getBoundingClientRect();

    // Writing to @state() properties triggers a re-render automatically,
    // just like assigning to a Vue ref (myRef.value = ...) or a reactive() field.
    this.cx = e.clientX - rect.left;
    this.cy = e.clientY - rect.top;
  }

  // render() is the Lit equivalent of Vue's <template> block (or the render() function in Vue 3).
  // It is called by the Lit scheduler whenever a @state() or @property() dependency changes.
  // Lit uses its own efficient DOM diffing under the hood (via lit-html), so only the bindings
  // that actually changed are updated — similar to Vue's virtual DOM patching, but without a vDOM.
  // The override keyword is required because render() is declared in the LitElement base class
  // (enforced by noImplicitOverride in tsconfig.json — same concept as overriding a Java/Kotlin method).
  override render() {
    // html (tagged template literal) is Lit's equivalent of Vue's JSX or h() calls.
    // ${...} expressions inside it are reactive bindings, like {{ }} in a Vue template.
    return html`
      <div class="panel">
        <strong>Target position:</strong> X: ${Math.round(this.cx)} | Y: ${Math.round(this.cy)}
      </div>

      <!-- @click is Lit's event binding syntax — equivalent to Vue's @click / v-on:click directive -->
      <svg @click=${this._handleCanvasClick}>
        <!-- svg (tagged template) is a variant of html (tagged template) optimized for SVG context.
             In Vue you would just write SVG markup directly inside a template block; here the
             svg tag ensures Lit creates elements in the SVG namespace, not the HTML namespace. -->
        ${svg`
          <circle
            cx=${this.cx}
            cy=${this.cy}
            r=${this.radius}
            fill="#3498db"
          />
          <!-- Crosshair guide lines that follow the circle — purely declarative, no manual DOM manipulation -->
          <line x1="0" y1=${this.cy} x2="100%" y2=${this.cy} stroke="#bdc3c7" stroke-dasharray="4" />
          <line x1=${this.cx} y1="0" x2=${this.cx} y2="100%" stroke="#bdc3c7" stroke-dasharray="4" />
        `}
      </svg>
    `;
  }
}
