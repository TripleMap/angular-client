import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeometryEditorComponent } from './geometry-editor.component';

describe('GeometryEditorComponent', () => {
  let component: GeometryEditorComponent;
  let fixture: ComponentFixture<GeometryEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeometryEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeometryEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
