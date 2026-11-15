import { Component, ElementRef, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SceneTransforms, type Cartesian3, type Scene } from 'cesium';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, MapPin as MapPinIcon, X } from 'lucide-angular';

export interface MapPinData {
  id: number,
  position: Cartesian3
}

@Component({
  selector: 'app-map-pin',
  imports: [LucideAngularModule, FormsModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ MapPin: MapPinIcon, X }),
    },
  ],
  templateUrl: './map-pin.html',
  styleUrl: './map-pin.css',
})

export class MapPin {
  data = input.required<MapPinData>();
  removed = output<number>();
  description = '';
  private readonly host = inject(ElementRef<HTMLElement>);

  requestRemove(): void {
    if (!confirm('Remove this pin?')) {
      return;
    }
    this.removed.emit(this.data().id);
  }

  updateScreenPosition(scene: Scene): void {
    const element = this.host.nativeElement;
    const screenPosition = SceneTransforms.worldToWindowCoordinates(scene, this.data().position);
    if (!screenPosition) {
      element.style.display = 'none';
      return;
    }
    const canvasRect = scene.canvas.getBoundingClientRect();
    const parentRect = element.parentElement?.getBoundingClientRect();
    const x = screenPosition.x + canvasRect.left - (parentRect?.left ?? canvasRect.left);
    const y = screenPosition.y + canvasRect.top - (parentRect?.top ?? canvasRect.top);
    element.style.display = '';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }
}
