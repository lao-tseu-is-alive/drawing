import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Tool } from './drawing-types';

@customElement('drawing-toolbar')
export class DrawingToolbar extends LitElement {
    @property({ type: String })
    tool: Tool = 'select';

    static override styles = css`
    :host {
      display: block;
      margin-bottom: 12px;
    }

    .bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    button.active {
      font-weight: bold;
      outline: 2px solid #1976d2;
    }
  `;

    private choose(tool: Tool): void {
        this.dispatchEvent(new CustomEvent<{ tool: Tool }>('tool-change', {
            detail: { tool },
            bubbles: true,
            composed: true,
        }));
    }

    override render() {
        const tools: Tool[] = ['select', 'point', 'line', 'circle', 'triangle', 'delete'];

        return html`
      <div class="bar">
        ${tools.map(
            (tool) => html`
            <button
              class=${this.tool === tool ? 'active' : ''}
              @click=${() => this.choose(tool)}
            >
              ${tool}
            </button>
          `,
        )}
      </div>
    `;
    }
}
