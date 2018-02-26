import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TdMapItemPanelComponent } from './td-map-item-panel.component';

describe('TdMapItemPanelComponent', () => {
  let component: TdMapItemPanelComponent;
  let fixture: ComponentFixture<TdMapItemPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TdMapItemPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TdMapItemPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
