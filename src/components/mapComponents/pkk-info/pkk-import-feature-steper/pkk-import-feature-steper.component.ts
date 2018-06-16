import { Component, OnInit, OnDestroy } from '@angular/core';
import { OverLaysService, LayerSchema } from "../../../../services/OverLaysService";
import { Subscription } from 'rxjs';
import 'rxjs/add/operator/debounceTime.js';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'pkk-import-feature-steper',
  templateUrl: './pkk-import-feature-steper.component.html',
  styleUrls: ['./pkk-import-feature-steper.component.css'],
  host: {
    style: `
    height: 100%;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    `
  }
})
export class PkkImportFeatureSteperComponent implements OnInit, OnDestroy {

  public avaliableLayers: LayerSchema[];
  public selectedLayer: LayerSchema;
  public importForm: FormGroup;
  public importFormSubscription: Subscription;
  public canImport: boolean = false;
  constructor(
    public OverLaysService: OverLaysService,
    public formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<PkkImportFeatureSteperComponent>
  ) { }

  ngOnInit() {
    this.avaliableLayers = this.OverLaysService.layersSchemas;
    this.importForm = this.formBuilder.group({
      selectedLayer: [null, [Validators.required]],
    });
    this.importFormSubscription = this.importForm.valueChanges.subscribe(changes => this.importForm.valid ? this.canImport = true : this.canImport = false);
  }

  ngOnDestroy() {
    this.importFormSubscription.unsubscribe();
  }

  cancel = () => this.dialogRef.close(false);
  sendData = () => { if (this.canImport) this.dialogRef.close({ layer: this.selectedLayer }); }
}
