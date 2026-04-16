import {svg, type TemplateResult} from 'lit';
import {type RenderDriver, type RenderOptions, Point, Line, Circle, Triangle} from 'ts-simple-2d-geometry';

export class LitRenderDriver implements RenderDriver<TemplateResult> {
    private attrs(options: RenderOptions) {
        return svg`
      stroke=${options.stroke} 
      stroke-width=${options.strokeWidth} 
      fill=${options.fill} 
      opacity=${options.opacity}
    `;
    }
    private getStyle(options: RenderOptions): string {
        return `stroke: ${options.stroke}; stroke-width: ${options.strokeWidth}; fill: ${options.fill}; opacity: ${options.opacity};`;
    }
    /**
     * Resolves a Y-coordinate for SVG output.
     * When invertY is true, negates the value so Cartesian "up = +Y" renders correctly on screen.
     */
    private resolveY(y: number, invertY: boolean): number {
        return invertY ? -y : y;
    }


    renderPoint(point: Point, options: RenderOptions, invertY: boolean): TemplateResult {
        const cx = point.x;
        const cy = this.resolveY(point.y, invertY);
        return svg`<circle cx=${cx} cy=${cy} r=${options.pointRadius} style=${this.getStyle(options)}></circle>`;
    }

    renderLine(line: Line, options: RenderOptions, invertY: boolean): TemplateResult {
        const x1 = line.start.x;
        const y1 = this.resolveY(line.start.y, invertY);
        const x2 = line.end.x;
        const y2 = this.resolveY(line.end.y, invertY);
        return svg`<line x1=${x1} y1=${y1} x2=${x2} y2=${y2} style=${this.getStyle(options)}></line>`;
    }

    renderCircle(circle: Circle, options: RenderOptions, invertY: boolean): TemplateResult {
        const cx = circle.center.x;
        const cy = this.resolveY(circle.center.y, invertY);
        return svg`<circle cx=${cx} cy=${cy} r=${circle.radius} style=${this.getStyle(options)}></circle>`;
    }

    renderTriangle(triangle: Triangle, options: RenderOptions, invertY: boolean): TemplateResult {
        const points = [triangle.pA, triangle.pB, triangle.pC]
            .map(p => `${p.x},${this.resolveY(p.y, invertY)}`)
            .join(" ");
        return svg`<polygon points="${points}" style=${this.getStyle(options)}/>`;
    }

    // La méthode compose n'est pas forcément utile ici car Lit gère déjà l'assemblage
    compose(elements: TemplateResult[]): TemplateResult {
        return svg`${elements}`;
    }
}
