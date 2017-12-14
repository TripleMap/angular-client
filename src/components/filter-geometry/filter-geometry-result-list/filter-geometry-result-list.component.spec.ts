import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterGeometryResultListComponent } from './filter-geometry-result-list.component';

describe('FilterGeometryResultListComponent', () => {
  let component: FilterGeometryResultListComponent;
  let fixture: ComponentFixture<FilterGeometryResultListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterGeometryResultListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterGeometryResultListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
