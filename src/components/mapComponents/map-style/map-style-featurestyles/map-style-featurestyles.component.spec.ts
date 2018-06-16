import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapStyleFeaturestylesComponent } from './map-style-featurestyles.component';

describe('MapStyleFeaturestylesComponent', () => {
  let component: MapStyleFeaturestylesComponent;
  let fixture: ComponentFixture<MapStyleFeaturestylesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapStyleFeaturestylesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapStyleFeaturestylesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
