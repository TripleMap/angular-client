import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  template: `
      <div mat-dialog-content>
        <p>{{message}}</p>
      </div>
      <div mat-dialog-actions>
        <button mat-button color="accent" (click)="no()" cdkFocusInitial>Отмена</button>
        <button mat-button color="accent" (click)="yes()">Да</button>
      </div>`
})
export class ConfirmDialogDialog implements OnInit {
  public message: any;
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }
  ngOnInit() {
    this.message = this.data && this.data.message ? this.data.message : '';
  }
  no = () => this.dialogRef.close(false);
  yes = () => this.dialogRef.close(true);
}