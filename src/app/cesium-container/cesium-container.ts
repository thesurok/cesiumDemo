import {
  Component,
  ElementRef,
  viewChild,
  type OnInit,
} from '@angular/core';
import { Cartesian3, Ion, Math as CesiumMath, Viewer, Cesium3DTileset } from 'cesium';
import { environment } from '../../environments/environment';
import { ToolsPanel, type ToolName } from '../tools-panel/tools-panel';

// Workers, Assets, ThirdParty, and Widgets are served from /cesium (see angular.json).
(globalThis as { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = '/cesium/';
Ion.defaultAccessToken = environment.cesiumIonToken;

type Cartesian3Coordinates = readonly [lon: number, lat: number, height: number];

@Component({
  selector: 'app-cesium-container',
  templateUrl: './cesium-container.html',
  styleUrl: './cesium-container.css',
  imports: [ToolsPanel]
})
export class CesiumContainer implements OnInit {
  container = viewChild.required<ElementRef<HTMLDivElement>>('cesiumContainer');
  viewer!: Viewer
  zeroCoordinates: Cartesian3Coordinates = [144.963, -37.814, 400]
  activeAreaRadius: number = 7000;
  center: Cartesian3 = Cartesian3.fromDegrees(...this.zeroCoordinates);

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
    this.enableCameraControls(true);
    this.establishRestrictedCameraControls()
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
    switch (toolName) {
      case "pin": this.onPinSelected();
        break;
      case "ruler": this.onRulerSelected();
        break;
    }

  }

  onPinSelected(): void {
    console.log("pin selected");
  }

  onRulerSelected(): void {
    console.log("ruler selected");
  }
}
