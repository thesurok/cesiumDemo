import {
  Component,
  ElementRef,
  viewChild,
  type OnInit,
} from '@angular/core';
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer } from 'cesium';
import { environment } from '../../environments/environment';

// Workers, Assets, ThirdParty, and Widgets are served from /cesium (see angular.json).
(globalThis as { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = '/cesium/';

Ion.defaultAccessToken = environment.cesiumIonToken;

@Component({
  selector: 'app-cesium-container',
  templateUrl: './cesium-container.html',
  styleUrl: './cesium-container.css',
})
export class CesiumContainer implements OnInit {
  container = viewChild.required<ElementRef<HTMLDivElement>>('cesiumContainer');
  viewer!: Viewer


  async ngOnInit() {
    this.viewer = new Viewer(this.container().nativeElement)
    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: CesiumMath.toRadians(-15.0),
      }
    });

    const buildingTileset = await createOsmBuildingsAsync();
    this.viewer.scene.primitives.add(buildingTileset);
  }
}
