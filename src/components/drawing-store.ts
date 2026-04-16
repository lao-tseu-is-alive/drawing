import { Circle, Line, Point, Triangle } from 'ts-simple-2d-geometry';
import type {DrawState, Drawable, Tool, PointRole} from './drawing-types';
import { DEFAULT_STYLE, makeId } from './drawing-types';
import { log } from '../utils/logger.js';

type Listener = () => void;

export class DrawStore {
    private listeners = new Set<Listener>();

    private _state: DrawState = {
        items: [
            {
                id: makeId(),
                kind: 'point',
                geometry: new Point(10, 10, 'A'),
                style: { ...DEFAULT_STYLE, stroke: '#d32f2f', fill: '#d32f2f' },
            },
            {
                id: makeId(),
                kind: 'point',
                geometry: new Point(20, 20, 'B'),
                style: { ...DEFAULT_STYLE, stroke: '#388e3c', fill: '#388e3c' },
            },
            {
                id: makeId(),
                kind: 'circle',
                geometry: new Circle(new Point(50,50,'Center'),20, 'Circle'),
                style: { ...DEFAULT_STYLE, stroke: '#000022', fill: '#0000ff60' },
            }
        ],
        selectedId: null,
        tool: 'select',
        draft: {
            points: [],
            current: null,
        },
        draggingId: null,
        draggingPointRole: null,
        gridSize: 10,
        showGrid: true,
        snapToGrid: true,
    };

    get state(): DrawState {
        return this._state;
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        for (const listener of this.listeners) listener();
    }

    setTool(tool: Tool): void {
        log.info(`Tool changed to: ${tool}`);
        this._state = {
            ...this._state,
            tool,
            draft: { points: [], current: null },
            draggingId: null,
            draggingPointRole: null,
        };
        this.notify();
    }

    setGridSize(size: number): void {
        this._state = { ...this._state, gridSize: size };
        this.notify();
    }

    setShowGrid(show: boolean): void {
        this._state = { ...this._state, showGrid: show };
        this.notify();
    }

    setSnapToGrid(snap: boolean): void {
        this._state = { ...this._state, snapToGrid: snap };
        this.notify();
    }

    select(id: string | null): void {
        log.debug(`Selected item: ${id}`);
        this._state = { ...this._state, selectedId: id };
        this.notify();
    }

    addPoint(x: number, y: number, name?: string): void {
        log.info(`Adding point at (${x}, ${y})`, name);
        const point = new Point(x, y, name);
        const item: Drawable = {
            id: makeId(),
            kind: 'point',
            geometry: point,
            style: { ...DEFAULT_STYLE, stroke: '#d32f2f', fill: '#d32f2f' },
        };
        this._state = { ...this._state, items: [...this._state.items, item] };
        this.notify();
    }

    addLine(start: Point, end: Point): void {
        log.info(`Adding line from ${start} to ${end}`);
        const item: Drawable = {
            id: makeId(),
            kind: 'line',
            geometry: new Line(start.clone(), end.clone()),
            style: { ...DEFAULT_STYLE, stroke: '#6a1b9a', fill: 'none' },
        };
        this._state = { ...this._state, items: [...this._state.items, item] };
        this.notify();
    }

    addCircle(center: Point, edge: Point): void {
        const radius = center.distanceTo(edge);
        log.info(`Adding circle center: ${center}, radius:${radius}`);
        const item: Drawable = {
            id: makeId(),
            kind: 'circle',
            geometry: new Circle(center.clone(), radius),
            style: { ...DEFAULT_STYLE, stroke: '#ef6c00', fill: 'rgba(239,108,0,0.1)' },
        };
        this._state = { ...this._state, items: [...this._state.items, item] };
        this.notify();
    }

    addTriangle(pA: Point, pB: Point, pC: Point): void {
        log.info(`Adding triangle from ${pA}, ${pB}, ${pC}`);
        try {
            const item: Drawable = {
                id: makeId(),
                kind: 'triangle',
                geometry: new Triangle(pA.clone(), pB.clone(), pC.clone()),
                style: { ...DEFAULT_STYLE, stroke: '#2e7d32', fill: 'rgba(46,125,50,0.1)' },
            };
            this._state = { ...this._state, items: [...this._state.items, item] };
        } catch(e) {
            log.error('Could not create triangle (collinear points?)', e);
        }
        this.notify();
    }

    deleteById(id: string): void {
        log.warn(`Deleting item: ${id}`);
        this._state = {
            ...this._state,
            items: this._state.items.filter((item) => item.id !== id),
            selectedId: this._state.selectedId === id ? null : this._state.selectedId,
        };
        this.notify();
    }

    addDraftPoint(at: Point): void {
        const { tool, draft } = this._state;
        const newPoints = [...draft.points, at.clone()];

        if (tool === 'line' || tool === 'circle') {
            if (newPoints.length >= 2) {
                if (tool === 'line') this.addLine(newPoints[0]!, newPoints[1]!);
                if (tool === 'circle') this.addCircle(newPoints[0]!, newPoints[1]!);
                this._state = { ...this._state, draft: { points: [], current: null } };
            } else {
                this._state = { ...this._state, draft: { points: newPoints, current: at.clone() } };
            }
        } else if (tool === 'triangle') {
            if (newPoints.length >= 3) {
                this.addTriangle(newPoints[0]!, newPoints[1]!, newPoints[2]!);
                this._state = { ...this._state, draft: { points: [], current: null } };
            } else {
                this._state = { ...this._state, draft: { points: newPoints, current: at.clone() } };
            }
        }
        this.notify();
    }

    updateDraft(at: Point): void {
        if (this._state.draft.points.length === 0) return;
        this._state = {
            ...this._state,
            draft: { ...this._state.draft, current: at.clone() },
        };
        this.notify();
    }

    cancelDraft(): void {
        this._state = {
            ...this._state,
            draft: { points: [], current: null },
        };
        this.notify();
    }

    startDragging(id: string, role: PointRole = 'all'): void {
        this._state = { ...this._state, draggingId: id, draggingPointRole: role, selectedId: id };
        this.notify();
    }

    stopDragging(): void {
        this._state = { ...this._state, draggingId: null, draggingPointRole: null };
        this.notify();
    }

    moveSelectedTo(x: number, y: number): void {
        const id = this._state.draggingId;
        const role = this._state.draggingPointRole;
        if (!id || !role) return;

        const items = this._state.items.map((item) => {
            if (item.id !== id) return item;

            if (item.kind === 'point') {
                item.geometry.moveTo(x, y);
            } else if (item.kind === 'line') {
                if (role === 'start') {
                    item.geometry.start.moveTo(x, y);
                } else if (role === 'end') {
                    item.geometry.end.moveTo(x, y);
                } else {
                    const [x1, y1] = item.geometry.start.toArray();
                    const dx = x - x1;
                    const dy = y - y1;
                    item.geometry.start.moveRel(dx, dy);
                    item.geometry.end.moveRel(dx, dy);
                }
            } else if (item.kind === 'circle') {
                if (role === 'center') {
                    item.geometry.center.moveTo(x, y);
                } else if (role === 'radius') {
                    item.geometry.radius = Math.max(item.geometry.center.distanceTo(new Point(x, y)), 1.0);
                } else {
                    item.geometry.center.moveTo(x, y);
                }
            } else if (item.kind === 'triangle') {
                if (role === 'pA') {
                    item.geometry.pA.moveTo(x, y);
                } else if (role === 'pB') {
                    item.geometry.pB.moveTo(x, y);
                } else if (role === 'pC') {
                    item.geometry.pC.moveTo(x, y);
                } else {
                    // Si un tel rôle arrivait on déplacerait tout
                    const [x1, y1] = item.geometry.pA.toArray();
                    const dx = x - x1;
                    const dy = y - y1;
                    item.geometry.pA.moveRel(dx, dy);
                    item.geometry.pB.moveRel(dx, dy);
                    item.geometry.pC.moveRel(dx, dy);
                }
            }

            return item;
        });

        this._state = { ...this._state, items };
        this.notify();
    }
}

export const drawStore = new DrawStore();
