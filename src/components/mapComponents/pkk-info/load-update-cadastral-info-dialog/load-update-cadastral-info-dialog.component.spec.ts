import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadUpdateCadastralInfoDialogComponent } from './load-update-cadastral-info-dialog.component';

describe('LoadUpdateCadastralInfoDialogComponent', () => {
  let component: LoadUpdateCadastralInfoDialogComponent;
  let fixture: ComponentFixture<LoadUpdateCadastralInfoDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoadUpdateCadastralInfoDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadUpdateCadastralInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
