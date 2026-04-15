import { Circle, Line, Point } from 'ts-simple-2d-geometry';
import type { DrawState, Drawable, Tool } from './drawing-types';
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
                geometry: new Point(20, 18, 'B'),
                style: { ...DEFAULT_STYLE, stroke: '#388e3c', fill: '#388e3c' },
            },
        ],
        selectedId: null,
        tool: 'select',
        draft: {
            start: null,
            current: null,
        },
        draggingId: null,
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
            draft: { start: null, current: null },
            draggingId: null,
        };
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

    deleteById(id: string): void {
        log.warn(`Deleting item: ${id}`);
        this._state = {
            ...this._state,
            items: this._state.items.filter((item) => item.id !== id),
            selectedId: this._state.selectedId === id ? null : this._state.selectedId,
        };
        this.notify();
    }

    beginDraft(at: Point): void {
        log.trace('Begin draft', at);
        this._state = {
            ...this._state,
            draft: { start: at.clone(), current: at.clone() },
        };
        this.notify();
    }

    updateDraft(at: Point): void {
        if (!this._state.draft.start) return;
        this._state = {
            ...this._state,
            draft: { ...this._state.draft, current: at.clone() },
        };
        this.notify();
    }

    commitDraft(): void {
        const { tool, draft } = this._state;
        if (!draft.start || !draft.current) return;

        if (tool === 'line') {
            this.addLine(draft.start, draft.current);
        } else if (tool === 'circle') {
            this.addCircle(draft.start, draft.current);
        }

        this._state = {
            ...this._state,
            draft: { start: null, current: null },
        };
        this.notify();
    }

    cancelDraft(): void {
        this._state = {
            ...this._state,
            draft: { start: null, current: null },
        };
        this.notify();
    }

    startDragging(id: string): void {
        this._state = { ...this._state, draggingId: id, selectedId: id };
        this.notify();
    }

    stopDragging(): void {
        this._state = { ...this._state, draggingId: null };
        this.notify();
    }

    moveSelectedTo(x: number, y: number): void {
        const id = this._state.draggingId;
        if (!id) return;

        const items = this._state.items.map((item) => {
            if (item.id !== id) return item;

            if (item.kind === 'point') {
                item.geometry.moveTo(x, y);
            } else if (item.kind === 'line') {
                const [x1, y1] = item.geometry.start.toArray();
                const dx = x - x1;
                const dy = y - y1;
                item.geometry.start.moveRel(dx, dy);
                item.geometry.end.moveRel(dx, dy);
            } else if (item.kind === 'circle') {
                item.geometry.center.moveTo(x, y);
            }

            return item;
        });

        this._state = { ...this._state, items };
        this.notify();
    }
}

export const drawStore = new DrawStore();
