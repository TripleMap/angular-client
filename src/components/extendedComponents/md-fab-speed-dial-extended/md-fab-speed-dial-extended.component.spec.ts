import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MdFabSpeedDialExtendedComponent } from './md-fab-speed-dial-extended.component';

describe('MdFabSpeedDialExtendedComponent', () => {
  let component: MdFabSpeedDialExtendedComponent;
  let fixture: ComponentFixture<MdFabSpeedDialExtendedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MdFabSpeedDialExtendedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MdFabSpeedDialExtendedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
