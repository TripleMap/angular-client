import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterGeometryComponent } from './filter-geometry.component';

describe('FilterGeometryComponent', () => {
  let component: FilterGeometryComponent;
  let fixture: ComponentFixture<FilterGeometryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterGeometryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterGeometryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
