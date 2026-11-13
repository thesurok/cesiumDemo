import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointsRuler } from './points-ruler';

describe('PointsRuler', () => {
  let component: PointsRuler;
  let fixture: ComponentFixture<PointsRuler>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PointsRuler],
    }).compileComponents();

    fixture = TestBed.createComponent(PointsRuler);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
