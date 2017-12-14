import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterGeometryFirstLineComponent } from './filter-geometry-first-line.component';

describe('FilterGeometryFirstLineComponent', () => {
  let component: FilterGeometryFirstLineComponent;
  let fixture: ComponentFixture<FilterGeometryFirstLineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterGeometryFirstLineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterGeometryFirstLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
