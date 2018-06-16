import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import 'rxjs/add/operator/debounceTime.js';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'load-update-cadastral-info-dialog',
  templateUrl: './load-update-cadastral-info-dialog.component.html',
  styleUrls: ['./load-update-cadastral-info-dialog.component.css']
})
export class LoadUpdateCadastralInfoDialogComponent implements OnInit, OnDestroy {

  public avaliableTypes: any[];
  public selectedType: any;
  public cadastralNumber: string;
  public importForm: FormGroup;
  public importFormSubscription: Subscription;
  public canImport: boolean = false;
  public onUpdateCadastralFeature: boolean = false;
  public onLoadCadastralFeature: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<LoadUpdateCadastralInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.onLoadCadastralFeature = this.data.onLoadCadastralFeature;
    this.onUpdateCadastralFeature = this.data.onUpdateCadastralFeature;
    this.avaliableTypes = this.data.avaliableTypes;

    this.importForm = this.formBuilder.group({
      selectedType: [null, [Validators.required]],
    });
    if (this.onLoadCadastralFeature) {
      let cnFormControl = new FormControl(null, [Validators.required])
      this.importForm.addControl('cadastralNumber', cnFormControl)
    }
    this.importFormSubscription = this.importForm.valueChanges.subscribe(changes => this.importForm.valid ? this.canImport = true : this.canImport = false);
  }

  ngOnDestroy() {
    this.importFormSubscription.unsubscribe();
  }

  cancel = () => this.dialogRef.close(false);
  sendData = () => {
    if (!this.canImport) return;

    this.dialogRef.close(this.importForm.value);

  }
}
