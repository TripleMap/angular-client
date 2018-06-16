import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnionFeaturesDialogComponent } from './union-features-dialog.component';

describe('UnionFeaturesDialogComponent', () => {
  let component: UnionFeaturesDialogComponent;
  let fixture: ComponentFixture<UnionFeaturesDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnionFeaturesDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnionFeaturesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
