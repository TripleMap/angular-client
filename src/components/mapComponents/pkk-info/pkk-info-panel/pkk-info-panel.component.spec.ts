import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PkkInfoPanelComponent } from './pkk-info-panel.component';

describe('PkkInfoPanelComponent', () => {
  let component: PkkInfoPanelComponent;
  let fixture: ComponentFixture<PkkInfoPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PkkInfoPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PkkInfoPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
