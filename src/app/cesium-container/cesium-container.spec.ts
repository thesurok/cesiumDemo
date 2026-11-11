import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CesiumContainer } from './cesium-container';

describe('CesiumContainer', () => {
  let component: CesiumContainer;
  let fixture: ComponentFixture<CesiumContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CesiumContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(CesiumContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
