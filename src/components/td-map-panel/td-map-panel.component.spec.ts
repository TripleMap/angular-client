import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TdMapPanelComponent } from './td-map-panel.component';

describe('TdMapPanelComponent', () => {
  let component: TdMapPanelComponent;
  let fixture: ComponentFixture<TdMapPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TdMapPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TdMapPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
