import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterGeometrySecondLineComponent } from './filter-geometry-second-line.component';

describe('FilterGeometrySecondLineComponent', () => {
  let component: FilterGeometrySecondLineComponent;
  let fixture: ComponentFixture<FilterGeometrySecondLineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterGeometrySecondLineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterGeometrySecondLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
