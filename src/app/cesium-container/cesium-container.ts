import {
  Component,
  ElementRef,
  viewChild,
  type OnInit,
} from '@angular/core';
import { Cartesian3, Ion, Math as CesiumMath, Viewer, Cesium3DTileset } from 'cesium';
import { environment } from '../../environments/environment';

// Workers, Assets, ThirdParty, and Widgets are served from /cesium (see angular.json).
(globalThis as { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = '/cesium/';
Ion.defaultAccessToken = environment.cesiumIonToken;

type Cartesian3Coordinates = readonly [lon: number, lat: number, height: number];

@Component({
  selector: 'app-cesium-container',
  templateUrl: './cesium-container.html',
  styleUrl: './cesium-container.css',
})
export class CesiumContainer implements OnInit {
  container = viewChild.required<ElementRef<HTMLDivElement>>('cesiumContainer');
  viewer!: Viewer
  zeroCoordinates: Cartesian3Coordinates = [144.963, -37.814, 400]

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

  async loadTileset() {
    const tileset = await Cesium3DTileset.fromIonAssetId(43978);
    this.viewer.scene.primitives.add(tileset);
    tileset.pointCloudShading.attenuation = true;
    tileset.pointCloudShading.eyeDomeLighting = true;
  }

  flyCameraToZeroCoordinates() {
    this.disableCameraControls();
    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(...this.zeroCoordinates),
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: CesiumMath.toRadians(-15.0),
      }
    });
  }

  disableCameraControls() {
    const controls = this.viewer.scene.screenSpaceCameraController;
    controls.enableRotate = false;
    controls.enableTilt = false;
    controls.enableLook = false;
    controls.enableTranslate = false;
    controls.enableZoom = false;
  }
}
