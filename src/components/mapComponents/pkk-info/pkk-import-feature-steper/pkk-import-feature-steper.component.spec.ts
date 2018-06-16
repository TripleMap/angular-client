import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PkkImportFeatureSteperComponent } from './pkk-import-feature-steper.component';

describe('PkkImportFeatureSteperComponent', () => {
  let component: PkkImportFeatureSteperComponent;
  let fixture: ComponentFixture<PkkImportFeatureSteperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PkkImportFeatureSteperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PkkImportFeatureSteperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
