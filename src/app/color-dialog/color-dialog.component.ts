import { Component, OnInit, Inject, EventEmitter, NgModule, Input, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog, MatFormFieldModule, MatInputModule } from '@angular/material';
import { ColorSketchModule } from './sketch/sketch.component';

import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'color-dialog',
  template: `
    <div style="width: 100%;height: 100%;display: flex;flex-direction: column;justify-content: space-between;">
      <mat-dialog-content>
       <color-sketch [color]="colorOnInit" (onChangeComplete)="changeComplete($event)" ></color-sketch>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button color="primary" (click)="no()" cdkFocusInitial>Отмена</button>
        <button mat-button color="primary" (click)="yes()">Выбрать</button>
      </mat-dialog-actions>
  </div>
      `
})
export class ColorDialogComponent implements OnInit {
  public color: any;
  public colorOnInit: string;
  constructor(
    public dialogRef: MatDialogRef<ColorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }
  ngOnInit(): void {
    this.colorOnInit = this.data.color ? this.data.color : '#2952c2';
  }
  changeComplete = (e) => this.color = e
  no = () => this.dialogRef.close(false);
  yes = () => this.dialogRef.close(this.color);
}

@Component({
  selector: 'color-picker',
  template: `
    <mat-form-field (click)="openColorDialog()">
      <div matPrefix style="top: 6px;margin-right: 8px;position:relative;">
        <div style="width: 36px; height:36px;border-radius:50%;position:relative; z-index:50;border: 1px solid rgba(0, 0, 0, 0.2);" [style.backgroundColor]="color"></div>
        <div 
        style='background:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQAWJ84A0+ScZRAxiGSRgQSAb40wkoDAgBvAlt1AAGcEIiBGgbiAAgXwixcH9GzgAAAABJRU5ErkJggg==") left center;
        position: absolute;width: 36px;height: 36px;z-index: 0;top: 0;border-radius: 50%;'></div>
       </div>
       
       <input matInput [placeholder]="colorPlaceHolder" disabled/>
    </mat-form-field>
  `
})
export class ColorPickerComponent implements OnInit {
  public message: any;

  @Output() colorChange: EventEmitter<string | boolean> = new EventEmitter();
  @Input() colorPlaceHolder: string;
  @Input() color: string;
  constructor(
    public matDialg: MatDialog
  ) { }
  ngOnInit(): void {
    this.colorPlaceHolder = this.colorPlaceHolder ? this.colorPlaceHolder : 'Цвет';
    this.color = this.color ? this.color : '#2952c2';
  }
  openColorDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.height = '80vh';
    dialogConfig.width = '280px';
    dialogConfig.data = {
      color: this.color
    }

    this.matDialg
      .open(ColorDialogComponent, dialogConfig)
      .afterClosed()
      .subscribe(colorEvent => {
        if (colorEvent) {
          this.color = `rgba(${colorEvent.color.rgb.r},${colorEvent.color.rgb.g},${colorEvent.color.rgb.b},${colorEvent.color.rgb.a})`;
          this.colorChange.emit(colorEvent.color);
        }
      })
  }
}


@NgModule({
  declarations: [
    ColorPickerComponent,
    ColorDialogComponent
  ],
  exports: [
    ColorPickerComponent,
    ColorDialogComponent
  ],
  entryComponents: [
    ColorDialogComponent
  ],
  imports: [
    ColorSketchModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class ColorPickerModule { }