import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TdmapSistem } from './tdmap-sistem.component';

describe('TdmapSistemComponent', () => {
  let component: TdmapSistem;
  let fixture: ComponentFixture<TdmapSistem>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TdmapSistem]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TdmapSistem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
