import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Point } from 'ts-simple-2d-geometry';
import './drawing-toolbar.ts';
import './drawing-board';
import { drawStore } from './drawing-store';
import type { DrawState, Tool } from './drawing-types';

@customElement('drawing-app')
export class CgilDrawApp extends LitElement {
    @state()
    private state: DrawState = drawStore.state;

    private unsubscribe?: () => void;

    static override styles = css`
    :host {
      display: block;
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr 260px;
      gap: 16px;
      align-items: start;
    }

    .panel {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
      background: #fafafa;
      font-size: 14px;
    }

    ul {
      padding-left: 18px;
    }
  `;

    override connectedCallback(): void {
        super.connectedCallback();
        this.unsubscribe = drawStore.subscribe(() => {
            this.state = drawStore.state;
        });
    }

    override disconnectedCallback(): void {
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

    private onBeginDraft(e: CustomEvent<{ point: Point }>): void {
        drawStore.beginDraft(e.detail.point);
    }

    private onUpdateDraft(e: CustomEvent<{ point: Point }>): void {
        drawStore.updateDraft(e.detail.point);
    }

    private onCommitDraft(): void {
        drawStore.commitDraft();
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

    private onStartDragging(e: CustomEvent<{ id: string }>): void {
        drawStore.startDragging(e.detail.id);
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
      <h2>cgil-draw starter with Bun + Lit + ts-simple-2d-geometry</h2>

      <cgil-toolbar
        .tool=${this.state.tool}
        @tool-change=${this.onToolChange}
      ></cgil-toolbar>

      <div class="layout">
        <cgil-draw-board
          .items=${this.state.items}
          .tool=${this.state.tool}
          .selectedId=${this.state.selectedId}
          .draftStart=${this.state.draft.start}
          .draftCurrent=${this.state.draft.current}
          .width=${100}
          .height=${100}
          @board-add-point=${this.onAddPoint}
          @board-begin-draft=${this.onBeginDraft}
          @board-update-draft=${this.onUpdateDraft}
          @board-commit-draft=${this.onCommitDraft}
          @board-select-item=${this.onSelectItem}
          @board-select-none=${this.onSelectNone}
          @board-delete-item=${this.onDeleteItem}
          @board-start-dragging=${this.onStartDragging}
          @board-move-selected-to=${this.onMoveSelectedTo}
          @board-stop-dragging=${this.onStopDragging}
        ></cgil-draw-board>

        <div class="panel">
          <div><strong>Tool:</strong> ${this.state.tool}</div>
          <div><strong>Items:</strong> ${this.state.items.length}</div>
          <div><strong>Selected:</strong> ${selected?.kind ?? 'none'}</div>

          <h4>How to use</h4>
          <ul>
            <li><strong>point</strong>: click to add a point</li>
            <li><strong>line</strong>: click start, move, click end</li>
            <li><strong>circle</strong>: click center, move, click edge</li>
            <li><strong>select</strong>: click to select, drag to move</li>
            <li><strong>delete</strong>: click an item to delete it</li>
          </ul>
        </div>
      </div>
    `;
    }
}
