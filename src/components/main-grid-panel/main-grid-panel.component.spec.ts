import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainGridPanelComponent } from './main-grid-panel.component';

describe('MainGridPanelComponent', () => {
  let component: MainGridPanelComponent;
  let fixture: ComponentFixture<MainGridPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MainGridPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainGridPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
