import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleFeatureEditComponent } from './multiple-feature-edit.component';

describe('MultipleFeatureEditComponent', () => {
  let component: MultipleFeatureEditComponent;
  let fixture: ComponentFixture<MultipleFeatureEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MultipleFeatureEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleFeatureEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
