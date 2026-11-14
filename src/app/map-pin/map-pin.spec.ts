import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapPin } from './map-pin';

describe('MapPin', () => {
  let component: MapPin;
  let fixture: ComponentFixture<MapPin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapPin],
    }).compileComponents();

    fixture = TestBed.createComponent(MapPin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
