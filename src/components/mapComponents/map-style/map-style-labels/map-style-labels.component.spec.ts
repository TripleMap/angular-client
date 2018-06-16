import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapStyleLabelsComponent } from './map-style-labels.component';

describe('MapStyleLabelsComponent', () => {
  let component: MapStyleLabelsComponent;
  let fixture: ComponentFixture<MapStyleLabelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapStyleLabelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapStyleLabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
