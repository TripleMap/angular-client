import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PkkInfoComponent } from './pkk-info.component';

describe('PkkInfoComponent', () => {
  let component: PkkInfoComponent;
  let fixture: ComponentFixture<PkkInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PkkInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PkkInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
