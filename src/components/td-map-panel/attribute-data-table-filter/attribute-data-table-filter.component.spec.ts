import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AttributeDataTableFilterComponent } from './attribute-data-table-filter.component';

describe('AttributeDataTableFilterComponent', () => {
  let component: AttributeDataTableFilterComponent;
  let fixture: ComponentFixture<AttributeDataTableFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AttributeDataTableFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttributeDataTableFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
