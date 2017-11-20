import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TdmapComponent } from './tdmap.component';

describe('TdmapComponent', () => {
  let component: TdmapComponent;
  let fixture: ComponentFixture<TdmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TdmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TdmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
