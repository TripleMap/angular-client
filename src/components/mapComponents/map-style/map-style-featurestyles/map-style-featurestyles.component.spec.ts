import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapStyleStylesComponent } from './map-style-featurestyles.component';

describe('MapStyleFeaturestylesComponent', () => {
  let component: MapStyleStylesComponent;
  let fixture: ComponentFixture<MapStyleStylesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MapStyleStylesComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapStyleStylesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
