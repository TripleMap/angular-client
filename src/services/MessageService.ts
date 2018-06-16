import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';


@Injectable()
export class MessageService {

  constructor(public snackBar: MatSnackBar) { }

  succesMessage(message) {
    this.snackBar.open(message, null, {
      duration: 3000,
      panelClass: ['success-snack'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  errorMessage(message) {
    this.snackBar.open(message, null, {
      duration: 4000,
      panelClass: ['error-snack'],
      horizontalPosition: 'right'
    });
  }

  warnMessage(message) {
    this.snackBar.open(message, null, {
      duration: 4000,
      panelClass: ['warn-snack'],
      horizontalPosition: 'right'
    });
  }
}
