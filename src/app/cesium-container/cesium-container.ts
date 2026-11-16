import {
  Component,
  ElementRef,
  HostListener,
  signal,
  viewChild,
  type OnInit,
  viewChildren
} from '@angular/core';
import { Cartesian3, Ion, Math as CesiumMath, Viewer, Cesium3DTileset, ScreenSpaceEventHandler, Cartesian2, ScreenSpaceEventType, type Scene } from 'cesium';
import { environment } from '../../environments/environment';
import { ToolsPanel, type ToolName } from '../tools-panel/tools-panel';
import { MapPin, type MapPinData } from '../map-pin/map-pin';
import { PointsRuler } from '../points-ruler/points-ruler';


const baseHref = document.querySelector('base')?.getAttribute('href') ?? '/';
const normalizedBase = baseHref.endsWith('/') ? baseHref : `${baseHref}/`;
(globalThis as { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = `${normalizedBase}cesium/`;
Ion.defaultAccessToken = environment.cesiumIonToken;

type Cartesian3Coordinates = readonly [lon: number, lat: number, height: number];

@Component({
  selector: 'app-cesium-container',
  templateUrl: './cesium-container.html',
  styleUrl: './cesium-container.css',
  imports: [ToolsPanel, MapPin]
})
export class CesiumContainer implements OnInit {
  container = viewChild.required<ElementRef<HTMLDivElement>>('cesiumContainer');
  toolPanel = viewChild.required<ToolsPanel>('toolsPanel');
  viewer!: Viewer
  zeroCoordinates: Cartesian3Coordinates = [144.963, -37.814, 400]
  activeAreaRadius: number = 7000;
  center: Cartesian3 = Cartesian3.fromDegrees(...this.zeroCoordinates);
  private screenSpaceEventHandler?: ScreenSpaceEventHandler;
  private readonly rulers: PointsRuler[] = [];
  private activeRuler?: PointsRuler;
  selectedTool: ToolName = null;
  mapPins = signal<MapPinData[]>([]);
  activeSceneMapPins = viewChildren(MapPin);


  async ngOnInit() {
    this.initViewer();
    await this.loadTileset();
    this.flyCameraToZeroCoordinates();
  }

  initViewer() {
    this.viewer = new Viewer(this.container().nativeElement, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      infoBox: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      shouldAnimate: false,
      geocoder: false,
      homeButton: false
    });

    this.viewer.bottomContainer.setAttribute("style", "display:none");
    this.viewer.scene.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    this.viewer.scene.preRender.addEventListener(this.onSceneUpdate);
  }

  async loadTileset(): Promise<void> {
    const tileset = await Cesium3DTileset.fromIonAssetId(43978);
    this.viewer.scene.primitives.add(tileset);
    tileset.pointCloudShading.attenuation = true;
    tileset.pointCloudShading.eyeDomeLighting = true;
  }

  flyCameraToZeroCoordinates(): void {
    this.enableCameraControls(false);
    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(...this.zeroCoordinates),
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: CesiumMath.toRadians(-15.0),
      },
      complete: this.onInitialCameraFlyComplete
    });
  }

  enableCameraControls(enable: boolean): void {
    const controls = this.viewer.scene.screenSpaceCameraController;
    controls.enableRotate = enable;
    controls.enableTilt = enable;
    controls.enableLook = enable;
    controls.enableTranslate = enable;
    controls.enableZoom = enable;
  }

  onInitialCameraFlyComplete = (): void => {
    // this.mapPins.update(pins => [...pins, { id: 1, lon: 0, lat: 1, height: 1 }]);
    this.enableCameraControls(true);
    this.establishRestrictedCameraControls();
  }

  establishRestrictedCameraControls(): void {
    this.viewer.scene.preRender.addEventListener(this.enforceCameraRestrictions);
  }

  enforceCameraRestrictions = (e: any[]): void => {
    const { camera } = this.viewer;
    const distance = Cartesian3.distance(camera.position, this.center);
    if (distance <= this.activeAreaRadius) {
      return;
    }
    const direction = Cartesian3.subtract(camera.position, this.center, new Cartesian3());
    Cartesian3.divideByScalar(direction, distance, direction);
    const overshoot = distance - this.activeAreaRadius;
    Cartesian3.subtract(
      camera.position,
      Cartesian3.multiplyByScalar(direction, overshoot, new Cartesian3()),
      camera.position
    )
  }

  onToolSelected(toolName: ToolName): void {
    this.finishActiveRuler();
    this.destroyScreenSpaceEventHandler();
    this.selectedTool = toolName;
    switch (toolName) {
      case "pin": this.onPinSelected();
        break;
      case "ruler": this.onRulerSelected();
        break;
    }
  }

  private destroyScreenSpaceEventHandler(): void {
    const handler = this.screenSpaceEventHandler;
    this.screenSpaceEventHandler = undefined;
    if (handler && !handler.isDestroyed()) {
      handler.destroy();
    }
  }

  onPinSelected(): void {
    this.screenSpaceEventHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.screenSpaceEventHandler.setInputAction(this.activePinToolClickHandler, ScreenSpaceEventType.LEFT_CLICK);
  }

  onRulerSelected(): void {
    this.screenSpaceEventHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.screenSpaceEventHandler.setInputAction(this.activePointsRulerToolClickHandler, ScreenSpaceEventType.LEFT_CLICK);
    this.screenSpaceEventHandler.setInputAction(this.finishActiveRuler, ScreenSpaceEventType.RIGHT_CLICK);
  }

  activePinToolClickHandler = (e: { position: Cartesian2 }): void => {
    // const picked = this.viewer.scene.pick(e.position);
    const position: Cartesian3 = this.viewer.scene.pickPosition(e.position);
    if (!position) {
      return;
    }
    // const xy = SceneTransforms.worldToWindowCoordinates(this.viewer.scene, position);
    // const tile = picked?.content?.tile;
    this.mapPins.update(pins => [...pins, { id: Math.random(), position }]);
  }

  activePointsRulerToolClickHandler = (e: { position: Cartesian2 }): void => {
    const position: Cartesian3 = this.viewer.scene.pickPosition(e.position);
    if (!position) {
      return;
    }
    if (!this.activeRuler) {
      this.activeRuler = new PointsRuler(this.viewer);
      this.rulers.push(this.activeRuler);
    }
    this.activeRuler.addPoint(position);
  }

  finishActiveRuler = (): void => {
    if (this.activeRuler && this.activeRuler.points.length < 2) {
      this.discardActiveRuler();
    }
    this.activeRuler = undefined;
  }

  @HostListener('document:keydown', ['$event'])
  undoRulerPoint(event: KeyboardEvent): void {
    if (this.selectedTool !== 'ruler' || !this.isUndoShortcut(event) || this.isTypingTarget(event.target)) {
      return;
    }
    event.preventDefault();
    if (!this.activeRuler) {
      this.activeRuler = this.rulers.at(-1);
    }
    if (!this.activeRuler?.undoPoint()) {
      this.activeRuler = undefined;
      return;
    }
    if (this.activeRuler.points.length === 0) {
      this.discardActiveRuler();
    }
  }

  private isUndoShortcut(event: KeyboardEvent): boolean {
    return event.ctrlKey && !event.shiftKey && !event.altKey && event.code === 'KeyZ';
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || (target instanceof HTMLElement && target.isContentEditable);
  }

  private discardActiveRuler(): void {
    if (!this.activeRuler) {
      return;
    }
    this.activeRuler.destroy();
    const index = this.rulers.indexOf(this.activeRuler);
    if (index !== -1) {
      this.rulers.splice(index, 1);
    }
    this.activeRuler = undefined;
  }

  removeMapPin(id: number): void {
    this.mapPins.update(pins => pins.filter(pin => pin.id !== id));
  }

  onSceneUpdate = (scene: Scene): void => {
    this.syncMapPinsPositions();
  }

  syncMapPinsPositions(): void {
    this.activeSceneMapPins().forEach(pin => {
      pin.updateScreenPosition(this.viewer.scene);
    });
  }
}
