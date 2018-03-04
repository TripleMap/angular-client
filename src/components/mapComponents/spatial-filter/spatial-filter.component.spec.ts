import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpatialFilterComponent } from './spatial-filter.component';

describe('SpatialFilterComponent', () => {
  let component: SpatialFilterComponent;
  let fixture: ComponentFixture<SpatialFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpatialFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpatialFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
