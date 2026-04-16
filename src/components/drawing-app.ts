import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Point } from 'ts-simple-2d-geometry';
import './drawing-toolbar.ts';
import './drawing-board';
import { drawStore } from './drawing-store';
import type {DrawState, PointRole, Tool} from './drawing-types';
import { log } from '../utils/logger';

function parseColorStr(str: string): { hex: string, a: number } {
    if (!str || String(str).trim() === 'none' || String(str).trim() === 'transparent') {
        return { hex: '#000000', a: 0 };
    }
    const s = String(str).trim();
    if (s.startsWith('#')) {
        let hex = s;
        if (hex.length === 4) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }
        if (hex.length === 9) {
            const aHex = hex.substring(7, 9);
            const a = parseInt(aHex, 16) / 255;
            hex = hex.substring(0, 7);
            return { hex, a };
        }
        return { hex: hex.substring(0, 7), a: 1 };
    }
    const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (m) {
        const r = parseInt(m[1] as string).toString(16).padStart(2, '0');
        const g = parseInt(m[2] as string).toString(16).padStart(2, '0');
        const b = parseInt(m[3] as string).toString(16).padStart(2, '0');
        const a = m[4] !== undefined ? parseFloat(m[4] as string) : 1;
        return { hex: `#${r}${g}${b}`, a };
    }
    return { hex: '#000000', a: 1 };
}

function toRgba(hex: string, a: number): string {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

@customElement('drawing-app')
export class DrawingApp extends LitElement {
    @state()
    private state: DrawState = drawStore.state;

    private unsubscribe?: () => void;

    static override styles = css`
        :host {
            display: block;
        }

        .layout {
            display: grid;
            grid-template-columns: 1fr 280px;
            gap: 16px;
            align-items: start;
        }

        .panel {
            min-width: 250px;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            background: #e8e5ef;
            font-size: 14px;
        }

        ul {
            padding-left: 18px;
        }

        fieldset {
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 12px;
            padding: 8px;
        }

        legend {
            font-weight: 600;
            font-size: 0.9em;
            color: #555;
            padding: 0 4px;
        }

        .row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
        }

        .row label {
            flex: 1;
            font-size: 0.9em;
        }

        .row input[type="range"] {
            flex: 1;
            margin: 0 8px;
        }
    `;

    override connectedCallback(): void {
        super.connectedCallback();
        log.info('drawing-app connected');
        this.unsubscribe = drawStore.subscribe(() => {
            this.state = drawStore.state;
        });
    }

    override disconnectedCallback(): void {
        log.info('drawing-app disconnected');
        this.unsubscribe?.();
        super.disconnectedCallback();
    }

    private onToolChange(e: CustomEvent<{ tool: Tool }>): void {
        drawStore.setTool(e.detail.tool);
    }

    private onAddPoint(e: CustomEvent<{ point: Point }>): void {
        const p = e.detail.point;
        drawStore.addPoint(p.x, p.y, `P${this.state.items.length + 1}`);
    }

    private onDraftClick(e: CustomEvent<{ point: Point }>): void {
        drawStore.addDraftPoint(e.detail.point);
    }

    private onUpdateDraft(e: CustomEvent<{ point: Point }>): void {
        drawStore.updateDraft(e.detail.point);
    }

    private onSelectItem(e: CustomEvent<{ id: string }>): void {
        drawStore.select(e.detail.id);
    }

    private onSelectNone(): void {
        drawStore.select(null);
    }

    private onDeleteItem(e: CustomEvent<{ id: string }>): void {
        drawStore.deleteById(e.detail.id);
    }

    private onStartDragging(e: CustomEvent<{ id: string, role?: PointRole }>): void {
        drawStore.startDragging(e.detail.id, e.detail.role);
    }

    private onMoveSelectedTo(e: CustomEvent<{ point: Point }>): void {
        drawStore.moveSelectedTo(e.detail.point.x, e.detail.point.y);
    }

    private onStopDragging(): void {
        drawStore.stopDragging();
    }

    override render() {
        const selected = this.state.items.find((item) => item.id === this.state.selectedId) ?? null;

        return html`
      <h2>drawing-board starter with Bun + Lit + ts-simple-2d-geometry</h2>

      <drawing-toolbar
        .tool=${this.state.tool}
        @tool-change=${this.onToolChange}
      ></drawing-toolbar>

      <div class="layout">
        <drawing-board
          .items=${this.state.items}
          .tool=${this.state.tool}
          .selectedId=${this.state.selectedId}
          .draftPoints=${this.state.draft.points}
          .draftCurrent=${this.state.draft.current}
          .width=${100}
          .height=${100}
          .gridSize=${this.state.gridSize}
          .showGrid=${this.state.showGrid}
          .snapToGrid=${this.state.snapToGrid}
          @board-add-point=${this.onAddPoint}
          @board-draft-click=${this.onDraftClick}
          @board-update-draft=${this.onUpdateDraft}
          @board-select-item=${this.onSelectItem}
          @board-select-none=${this.onSelectNone}
          @board-delete-item=${this.onDeleteItem}
          @board-start-dragging=${this.onStartDragging}
          @board-move-selected-to=${this.onMoveSelectedTo}
          @board-stop-dragging=${this.onStopDragging}
        ></drawing-board>

        <div class="panel">
          <div><strong>Tool:</strong> ${this.state.tool}</div>
          <div><strong>Items:</strong> ${this.state.items.length}</div>
          <div><strong>Selected:</strong> ${selected?.kind ?? 'none'}</div>

          <h4>Grid Settings</h4>
          <ul>
            <li>
              <label>
                <input type="checkbox" ?checked=${this.state.showGrid} @change=${(e: Event) => drawStore.setShowGrid((e.target as HTMLInputElement).checked)}>
                Show Grid
              </label>
            </li>
            <li>
              <label>
                <input type="checkbox" ?checked=${this.state.snapToGrid} @change=${(e: Event) => drawStore.setSnapToGrid((e.target as HTMLInputElement).checked)}>
                Snap to Grid
              </label>
            </li>
            <li>
              <label>
                Grid Size:
                <input type="number" .value=${this.state.gridSize.toString()} @change=${(e: Event) => drawStore.setGridSize(Number((e.target as HTMLInputElement).value))} min="1" max="100" style="width: 50px;">
              </label>
            </li>
          </ul>

          <fieldset>
            <legend>General Settings</legend>
            <div class="row">
              <label>Point Radius:</label>
              <input type="number" .value=${this.state.currentStyle.pointRadius?.toString() || '1.5'} @change=${(e: Event) => drawStore.setGlobalPointRadius(Number((e.target as HTMLInputElement).value))} min="0.1" max="5" step="0.1" style="width: 60px;">
            </div>
          </fieldset>

          <fieldset>
            <legend>Stroke Settings</legend>
            <div class="row">
              <label>Color:</label>
              <input type="color" .value=${parseColorStr(this.state.currentStyle.stroke || '#000000').hex} @input=${(e: Event) => {
                  const hex = (e.target as HTMLInputElement).value;
                  const a = parseColorStr(this.state.currentStyle.stroke || '#000000').a;
                  drawStore.setCurrentStyle({ stroke: toRgba(hex, a) });
              }}>
            </div>
            <div class="row">
              <label>Opacity:</label>
              <input type="range" min="0.1" max="1" step="0.05" .value=${parseColorStr(this.state.currentStyle.stroke || '#000000').a.toString()} @input=${(e: Event) => {
                  const a = parseFloat((e.target as HTMLInputElement).value);
                  const hex = parseColorStr(this.state.currentStyle.stroke || '#000000').hex;
                  drawStore.setCurrentStyle({ stroke: toRgba(hex, a) });
              }}>
              <span style="font-size:0.8em;width:30px;text-align:right">${parseColorStr(this.state.currentStyle.stroke || '#000000').a.toFixed(2)}</span>
            </div>
            <div class="row">
              <label>Width:</label>
              <input type="number" .value=${this.state.currentStyle.strokeWidth?.toString() || '1'} @change=${(e: Event) => drawStore.setCurrentStyle({ strokeWidth: Number((e.target as HTMLInputElement).value) })} min="0.1" step="0.1" style="width: 60px;">
            </div>
          </fieldset>

          <fieldset>
            <legend>Fill Settings</legend>
            <div class="row">
              <label>Color:</label>
              <input type="color" .value=${parseColorStr(this.state.currentStyle.fill || 'none').hex} @input=${(e: Event) => {
                  const hex = (e.target as HTMLInputElement).value;
                  const a = parseColorStr(this.state.currentStyle.fill || 'none').a;
                  drawStore.setCurrentStyle({ fill: toRgba(hex, a) });
              }}>
            </div>
            <div class="row">
              <label>Opacity:</label>
              <input type="range" min="0.1" max="1" step="0.05" .value=${parseColorStr(this.state.currentStyle.fill || 'none').a.toString()} @input=${(e: Event) => {
                  const a = parseFloat((e.target as HTMLInputElement).value);
                  const hex = parseColorStr(this.state.currentStyle.fill || 'none').hex;
                  drawStore.setCurrentStyle({ fill: toRgba(hex, a) });
              }}>
              <span style="font-size:0.8em;width:30px;text-align:right">${parseColorStr(this.state.currentStyle.fill || 'none').a.toFixed(2)}</span>
            </div>
          </fieldset>

          <h4>How to use</h4>
          <ul>
            <li><strong>point</strong>: click to add a point</li>
            <li><strong>line</strong>: click start, move, click end</li>
            <li><strong>circle</strong>: click center, move, click edge</li>
            <li><strong>triangle</strong>: click three times for the three points</li>
            <li><strong>select</strong>: click to select, drag to move</li>
            <li><strong>delete</strong>: click an item to delete it</li>
          </ul>
        </div>
      </div>
    `;
    }
}
