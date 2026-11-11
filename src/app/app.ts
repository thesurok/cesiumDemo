import { Component, signal } from '@angular/core';
import { CesiumContainer } from './cesium-container/cesium-container';

@Component({
  selector: 'app-root',
  imports: [CesiumContainer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('cesiumDemo');
}
