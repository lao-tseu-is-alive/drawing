import { LitElement, css, html, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Circle, Point } from 'ts-simple-2d-geometry';

import type { Drawable, Tool, PointRole } from './drawing-types';
import { POINT_EDIT_STYLE } from './drawing-types';
import {LitRenderDriver} from "./LitRenderDriver.ts";
import {log} from "../utils/logger.ts";

@customElement('drawing-board')
export class DrawingBoard extends LitElement {
    @property({ attribute: false })
    items: Drawable[] = [];

    @property({ type: String })
    tool: Tool = 'select';

    @property({ type: String })
    selectedId: string | null = null;

    @property({ attribute: false })
    draftPoints: Point[] = [];

    @property({ attribute: false })
    draftCurrent: Point | null = null;

    @property({ type: Number })
    width = 100;

    @property({ type: Number })
    @property({ type: Number })
    height = 100;

    @property({ type: Number })
    gridSize = 10;

    @property({ type: Boolean })
    showGrid = true;

    @property({ type: Boolean })
    snapToGrid = true;

    @state()
    private pointerCapturedId: string | null = null;

    static override styles = css`
    :host {
      display: block;
    }

    .frame {
      border: 1px solid #ccc;
      display: inline-block;
      background: white;
    }

    svg {
      width: 500px;
      height: 500px;
      display: block;
      cursor: crosshair;
      touch-action: none;
    }

    .selected {
      filter: drop-shadow(0 0 0.4px #000);
    }

    .draft {
      stroke-dasharray: 1 1;
    }
  `;

    private emit<T>(name: string, detail: T): void {
        this.dispatchEvent(new CustomEvent<T>(name, {
            detail,
            bubbles: true,
            composed: true,
        }));
    }

    private screenToWorld(clientX: number, clientY: number): Point | null {
        const svgEl = this.renderRoot.querySelector('svg');
        if (!svgEl) return null;

        const pt = svgEl.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;

        const ctm = svgEl.getScreenCTM();
        if (!ctm) return null;

        const p = pt.matrixTransform(ctm.inverse());
        return new Point(p.x, p.y);
    }

    private snap(p: Point): Point {
        if (!this.snapToGrid) return p;
        const size = Math.max(this.gridSize, 1);
        const x = Math.round(p.x / size) * size;
        const y = Math.round(p.y / size) * size;
        return new Point(x, y);
    }

    private onBoardClick(e: MouseEvent): void {
        const target = e.target as Element | null;
        const world = this.screenToWorld(e.clientX, e.clientY);
        if (!world) return;

        const p = this.snap(world);

        if (target?.closest('[data-item-id]')) return;

        if (this.tool === 'point') {
            this.emit('board-add-point', { point: p });
            return;
        }

        if (this.tool === 'line' || this.tool === 'circle' || this.tool === 'triangle') {
            this.emit('board-draft-click', { point: p });
            return;
        }

        if (this.tool === 'select') {
            this.emit('board-select-none', {});
        }
    }

    private onBoardPointerMove(e: PointerEvent): void {
        const world = this.screenToWorld(e.clientX, e.clientY);
        if (!world) return;

        const p = this.snap(world);

        if (this.pointerCapturedId) {
            this.emit('board-move-selected-to', { point: p });
            return;
        }

        if ((this.tool === 'line' || this.tool === 'circle' || this.tool === 'triangle') && this.draftPoints.length > 0) {
            this.emit('board-update-draft', { point: p });
        }
    }

    private onPointerUp(): void {
        if (this.pointerCapturedId) {
            this.pointerCapturedId = null;
            this.emit('board-stop-dragging', {});
        }
    }

    private onItemClick(item: Drawable, e: MouseEvent): void {
        e.stopPropagation();

        if (this.tool === 'delete') {
            this.emit('board-delete-item', { id: item.id });
            return;
        }

        this.emit('board-select-item', { id: item.id });
    }

    private onItemPointerDown(item: Drawable, e: PointerEvent, role: PointRole = 'all'): void {
        if (this.tool !== 'select') return;
        e.stopPropagation();

        const target = e.currentTarget as SVGElement;
        target.setPointerCapture(e.pointerId);
        this.pointerCapturedId = item.id;
        this.emit('board-start-dragging', { id: item.id, role });
    }

    private renderControlPoint(item: Drawable, role: PointRole, cx: number, cy: number) {
        const halfSize = POINT_EDIT_STYLE.size / 2;
        return svg`
      <rect
        data-item-id=${item.id}
        x=${cx - halfSize}
        y=${cy - halfSize}
        width=${POINT_EDIT_STYLE.size}
        height=${POINT_EDIT_STYLE.size}
        fill=${POINT_EDIT_STYLE.fill}
        stroke=${POINT_EDIT_STYLE.stroke}
        stroke-width=${POINT_EDIT_STYLE.strokeWidth}
        class="control-point"
        @pointerdown=${(e: PointerEvent) => this.onItemPointerDown(item, e, role)}
      ></rect>
    `;
    }

    private renderControlPoints(item: Drawable) {
        if (item.kind === 'line') {
            return svg`
        ${this.renderControlPoint(item, 'start', item.geometry.start.x, item.geometry.start.y)}
        ${this.renderControlPoint(item, 'end', item.geometry.end.x, item.geometry.end.y)}
      `;
        } else if (item.kind === 'circle') {
            return svg`
        ${this.renderControlPoint(item, 'center', item.geometry.center.x, item.geometry.center.y)}
        ${this.renderControlPoint(item, 'radius', item.geometry.center.x + item.geometry.radius, item.geometry.center.y)}
      `;
        } else if (item.kind === 'point') {
            return this.renderControlPoint(item, 'center', item.geometry.x, item.geometry.y);
        } else if (item.kind === 'triangle') {
            return svg`
        ${this.renderControlPoint(item, 'pA', item.geometry.pA.x, item.geometry.pA.y)}
        ${this.renderControlPoint(item, 'pB', item.geometry.pB.x, item.geometry.pB.y)}
        ${this.renderControlPoint(item, 'pC', item.geometry.pC.x, item.geometry.pC.y)}
      `;
        }
        return null;
    }
    private renderItem(item: Drawable) {
        const driver = new LitRenderDriver();
        const selected = this.selectedId === item.id;

        const content = item.geometry.accept(driver, item.style, false);
        log.info(`renderItem ${item.kind} : ${item.geometry.toString()}`)
        return svg`
        <g 
            class=${selected ? 'selected' : ''} 
            @click=${(e: MouseEvent) => this.onItemClick(item, e)}
            @pointerdown=${(e: PointerEvent) => this.onItemPointerDown(item, e)}>
            ${content}
            ${selected ? this.renderControlPoints(item) : ''}
        </g>
    `;
    }

    private renderDraft() {
        if (this.draftPoints.length === 0 || !this.draftCurrent) return null;

        const pts = this.draftPoints;
        const pt1 = pts[0]
        if (pt1 === undefined) return null;
        const current = this.draftCurrent;

        if (this.tool === 'line') {
            return svg`
        <line
          class="draft"
          x1=${pt1.x}
          y1=${pt1.y}
          x2=${current.x}
          y2=${current.y}
          stroke="#555"
          stroke-width="0.6"
        ></line>
      `;
        }

        if (this.tool === 'circle') {
            const radius = Math.max( Math.abs(pt1.distanceTo(current)), 1.0) ;
            const preview = new Circle(pt1.clone(), radius);

            return svg`
        <circle
          class="draft"
          cx=${preview.center.x}
          cy=${preview.center.y}
          r=${preview.radius}
          stroke="#555"
          stroke-width="0.6"
          fill="rgba(0,0,0,0.04)"
        ></circle>
      `;
        }

        if (this.tool === 'triangle') {
            let pointsStr = '';
            if (pts.length === 1) {
                return svg`
                  <line
                    class="draft"
                    x1=${pt1.x}
                    y1=${pt1.y}
                    x2=${current.x}
                    y2=${current.y}
                    stroke="#555"
                    stroke-width="0.6"
                  ></line>
                `;
            } else if (pts.length === 2) {
                const pt2 = pts[1]
                if (pt2 === undefined) return null;
                pointsStr = `${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${current.x},${current.y}`;
            }

            if (pointsStr) {
                return svg`
                  <polygon
                    class="draft"
                    points=${pointsStr}
                    stroke="#555"
                    stroke-width="0.6"
                    fill="rgba(0,0,0,0.04)"
                  ></polygon>
                `;
            }
        }

        return null;
    }

    override render() {
        return html`
          <div class="frame">
            <svg
                viewBox="0 0 ${this.width} ${this.height}"
                @click=${this.onBoardClick}
                @pointermove=${this.onBoardPointerMove}
                @pointerup=${this.onPointerUp}
                @pointercancel=${this.onPointerUp}
            >
              <defs>
                <pattern id="gridx" width=${this.gridSize} height=${this.gridSize} patternUnits="userSpaceOnUse">
                  <path d="M ${this.gridSize} 0 L 0 0 0 ${this.gridSize}" fill="none" stroke="#ececec"
                        stroke-width="0.3"></path>
                </pattern>
              </defs>
              ${this.showGrid ? svg`<rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#gridx)"></rect>` : ''}
              ${this.items.map((item) => this.renderItem(item))}
              ${this.renderDraft()}
            </svg>
          </div>
        `;
    }
}
