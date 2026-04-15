import { Circle, Line, Point } from 'ts-simple-2d-geometry';

export type Tool = 'select' | 'point' | 'line' | 'circle' | 'delete';

export interface Style {
    stroke: string;
    fill: string;
    strokeWidth: number;
    pointRadius: number;
}

export interface PointItem {
    id: string;
    kind: 'point';
    geometry: Point;
    style: Style;
}

export interface LineItem {
    id: string;
    kind: 'line';
    geometry: Line;
    style: Style;
}

export interface CircleItem {
    id: string;
    kind: 'circle';
    geometry: Circle;
    style: Style;
}

export type Drawable = PointItem | LineItem | CircleItem;

export interface DraftState {
    start: Point | null;
    current: Point | null;
}

export interface DrawState {
    items: Drawable[];
    selectedId: string | null;
    tool: Tool;
    draft: DraftState;
    draggingId: string | null;
}

export const DEFAULT_STYLE: Style = {
    stroke: '#1976d2',
    fill: 'rgba(25,118,210,0.15)',
    strokeWidth: 1,
    pointRadius: 1.2,
};

export function makeId(): string {
    return crypto.randomUUID();
}
