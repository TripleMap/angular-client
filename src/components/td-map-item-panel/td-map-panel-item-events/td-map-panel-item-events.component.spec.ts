import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TdMapPanelItemEventsComponent } from './td-map-panel-item-events.component';

describe('TdMapPanelItemEventsComponent', () => {
  let component: TdMapPanelItemEventsComponent;
  let fixture: ComponentFixture<TdMapPanelItemEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TdMapPanelItemEventsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TdMapPanelItemEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
