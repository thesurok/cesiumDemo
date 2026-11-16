import {
  ArcType,
  CallbackPositionProperty,
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Color,
  type Entity,
  type Viewer,
} from 'cesium';

export interface RulerPoint {
  id: number;
  position: Cartesian3;
}

export class PointsRuler {
  readonly points: RulerPoint[] = [];
  private readonly pointEntities: Entity[] = [];
  private readonly segmentLabels: Entity[] = [];
  private polyline?: Entity;
  private totalLabel?: Entity;
  private nextPointId = 0;

  constructor(private readonly viewer: Viewer) {}

  addPoint(position: Cartesian3): void {
    const previous = this.points.at(-1);
    this.points.push({ id: this.nextPointId++, position });
    this.pointEntities.push(this.viewer.entities.add({
      position,
      point: {
        pixelSize: 8,
        color: Color.TEAL,
        outlineColor: Color.WHITE,
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    }));

    if (!previous) {
      return;
    }

    if (this.points.length === 2) {
      this.polyline = this.viewer.entities.add({
        polyline: {
          positions: new CallbackProperty(
            () => this.points.map((point) => Cartesian3.clone(point.position)),
            false,
          ),
          width: 2,
          material: Color.TEAL,
          depthFailMaterial: Color.TEAL,
          arcType: ArcType.NONE,
        },
      });
      this.totalLabel = this.createTotalLabel();
    }

    this.segmentLabels.push(this.createSegmentLabel(previous.position, position));
  }

  undoPoint(): boolean {
    const pointEntity = this.pointEntities.pop();
    if (!pointEntity) {
      return false;
    }
    this.points.pop();
    this.viewer.entities.remove(pointEntity);

    const segmentLabel = this.segmentLabels.pop();
    if (segmentLabel) {
      this.viewer.entities.remove(segmentLabel);
    }

    if (this.points.length < 2) {
      this.removeMeasurementGraphics();
    }
    return true;
  }

  destroy(): void {
    for (const entity of [...this.pointEntities, ...this.segmentLabels]) {
      this.viewer.entities.remove(entity);
    }
    this.removeMeasurementGraphics();
    this.pointEntities.length = 0;
    this.segmentLabels.length = 0;
    this.points.length = 0;
  }

  private removeMeasurementGraphics(): void {
    if (this.polyline) {
      this.viewer.entities.remove(this.polyline);
      this.polyline = undefined;
    }
    if (this.totalLabel) {
      this.viewer.entities.remove(this.totalLabel);
      this.totalLabel = undefined;
    }
  }

  private createSegmentLabel(start: Cartesian3, end: Cartesian3): Entity {
    const length = Cartesian3.distance(start, end);
    return this.viewer.entities.add({
      position: Cartesian3.midpoint(start, end, new Cartesian3()),
      label: {
        text: `${length.toFixed(2)} m`,
        font: '14px sans-serif',
        fillColor: Color.WHITE,
        showBackground: true,
        backgroundColor: Color.BLACK.withAlpha(0.6),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        pixelOffset: new Cartesian2(0, -12),
      },
    });
  }

  private createTotalLabel(): Entity {
    return this.viewer.entities.add({
      position: new CallbackPositionProperty((time, result) => {
        const position = this.points.at(-1)?.position;
        if (!position) {
          return undefined;
        }
        return Cartesian3.clone(position, result);
      }, false),
      label: {
        text: new CallbackProperty(() => `${this.totalLength().toFixed(2)} m`, false),
        font: '14px sans-serif',
        fillColor: Color.WHITE,
        showBackground: true,
        backgroundColor: Color.BLACK.withAlpha(0.75),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        pixelOffset: new Cartesian2(0, -28),
      },
    });
  }

  private totalLength(): number {
    let total = 0;
    for (let index = 1; index < this.points.length; index++) {
      total += Cartesian3.distance(this.points[index - 1].position, this.points[index].position);
    }
    return total;
  }
}
