import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { LayerSchema, LayersLinks } from "../../services/OverLaysService";
import { Subject, Subscription } from 'rxjs';
import 'rxjs/add/operator/debounceTime.js';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { MessageService } from '../../services/MessageService';

@Component({
  selector: 'multiple-feature-edit',
  templateUrl: './multiple-feature-edit.component.html',
  styleUrls: ['./multiple-feature-edit.component.css'],
  host: {
    style: `height: 100%;
      width: 100 %;
      flex-direction: column;
      display: flex;
      justify-content: space-between;
    `
  }
})
export class MultipleFeatureEditComponent implements OnInit, OnDestroy {
  public saveEnable: boolean = false;
  public layerSchema: LayerSchema;
  public feature: any;
  public featuresIds: string[];
  public onSaveMessageSubject: Subject<any>;
  public onSaveSubscriber: Subscription;
  public orderForm: FormGroup;
  public subscriberOnOrderForm: Subscription;
  public columns: any;
  public compareFn = (f1: any, f2: any) => f1.code === f2.code;
  constructor(
    public http: HttpClient,
    public MessageService: MessageService,
    public formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<MultipleFeatureEditComponent>
  ) {
    this.onSaveMessageSubject = new Subject();
    this.onSaveSubscriber = this.onSaveMessageSubject.debounceTime(300)
      .subscribe(success => success ? this.MessageService.succesMessage('Атрибуты обновлены') : this.MessageService.errorMessage('Ошибка при обновлении атрибутов'));
  }

  ngOnInit() {
    this.orderForm = this.formBuilder.group({});
    this.subscriberOnOrderForm = this.orderForm.valueChanges
      .debounceTime(300)
      .filter(this.isValidForm)
      .map(this.pipeFiltersToNumber)
      .map(this.detectOnEditFeatureDifferents.bind(this))
      .subscribe();
    this.addFeatureAttributesControls(this.layerSchema);
  }
  ngOnDestroy() {
    this.onSaveMessageSubject.complete();
    this.onSaveSubscriber.unsubscribe();
    this.subscriberOnOrderForm.unsubscribe();
  }

  isValidForm = () => {
    this.orderForm.status === "VALID" ? this.saveEnable = true : this.saveEnable = false;
    return this.orderForm.status === "VALID";
  }

  getFormControl = (formControlName) => this.orderForm.get(formControlName);

  addFeatureAttributesControls(layerSchema: LayerSchema) {
    for (const key in layerSchema.layer_schema.properties) {
      if (key !== 'id') {
        const attribute = layerSchema.layer_schema.properties[key];
        let fatureValue;
        if (attribute.columnType === 'findDate') {
          fatureValue = new Date(Number(this.feature[`${key}`]))
        } else if (attribute.columnType === 'findMany' || attribute.columnType === 'findOne') {
          fatureValue = this.feature[`_${key}`];
        } else {
          fatureValue = this.feature[`${key}`];
        }
        let validators = this.addValidators(attribute)
        let control = new FormControl(fatureValue, validators);
        this.orderForm.addControl(`${key}`, control);
      }
    }
  }

  addValidators(column) {
    let validators = [];
    if (column.required) validators.push(Validators.required);

    if (column.columnType === 'findNumber') {
      if (column.length) validators.push(Validators.max(column.length));
      if (column.tableType === 'double') validators.push(Validators.pattern("^[0-9]{1,40}([,.][0-9]{0,20})?$"));
      if (column.tableType === 'integer') validators.push(Validators.pattern("^[0-9]{1,40}?$"));
    }

    if (column.columnType === 'findSimple') {
      if (column.length && column.tableType === 'varchar') validators.push(Validators.max(column.length));
    }
    return validators;
  }


  pipeFiltersToNumber = data => {
    for (let key in this.layerSchema.layer_schema.properties) {
      let column = this.layerSchema.layer_schema.properties[key];
      if (column.columnType === 'findSimple' || column.columnType === 'findDate') {
        if (this.feature[key] === "") this.feature[key] = null;
        if (data[key] === "") data[key] = null;
      }

      if (column.columnType === 'findNumber' && typeof data[key] === 'string') {
        data[key] = data[key] ? Number(data[key].replace(",", ".")) : null;
      }
    }
    return data;
  }

  findDatesMomentBeforeSave(savedItem) {
    for (let columnName in savedItem) {
      for (let key in this.layerSchema.layer_schema.properties) {
        let attributeColumn = this.layerSchema.layer_schema.properties[key];
        if (key === columnName && attributeColumn.columnType === 'findDate') {
          savedItem[columnName] = savedItem[columnName].valueOf();
        }
      }
    }
  }

  detectOnEditFeatureDifferents(data) {
    let differents = false;
    let differentColumns = [];
    for (let key in this.layerSchema.layer_schema.properties) {
      let column = this.layerSchema.layer_schema.properties[key];
      if ((this.feature.hasOwnProperty(key) && data.hasOwnProperty(key)) || (this.feature.hasOwnProperty(`_${key}`) && data.hasOwnProperty(key))) {
        if (column.columnType === 'findSimple') {
          if (this.feature[key] !== data[key]) {
            differentColumns.push(key);
            differents = true;
          }
        }
        if (column.columnType === 'findBoolean' || column.columnType === 'findNumber') {
          if (this.feature[key] !== data[key]) {
            differentColumns.push(key);
            differents = true;
          }
        }
        if (column.columnType === 'findDate') {
          if (Number(this.feature[key]) !== new Date(data[key]).getTime()) {
            differentColumns.push(key);
            differents = true;
          }
        }
        if (column.columnType === 'findOne') {
          if (!data[key] && !this.feature[`_${key}`]) { }
          else if (!data[key] && this.feature[`_${key}`] || data[key] && !this.feature[`_${key}`]) {
            differents = true;
            differentColumns.push(key);
          } else if (data[key].code !== this.feature[`_${key}`].code) {
            differents = true;
            differentColumns.push(key);
          }
        }


        if (column.columnType === 'findUser') {
          if (!data[key] && !this.feature[`_${key}`]) { }
          else if (!data[key] && this.feature[`_${key}`] || data[key] && !this.feature[`_${key}`]) {
            differents = true;
            differentColumns.push(key);
          } else if (data[key].id !== this.feature[`_${key}`].id) {
            differents = true;
            differentColumns.push(key);
          }
        }

        if (column.columnType === 'findMany') {
          if (!data[key] && !this.feature[`_${key}`]) {
          } else if (!data[key] && this.feature[`_${key}`] || data[key] && !this.feature[`_${key}`]) {
            differents = true;
            differentColumns.push(key);
          } else {
            if (data[key].length !== this.feature[`_${key}`].length) {
              differents = true;
              differentColumns.push(key);
            } else {
              let codesInData = data[key].map(item => item.code);
              let codesInFeature = this.feature[`_${key}`].map(item => item.code);
              codesInData.map(code => {
                if (codesInFeature.indexOf(code) === -1) {
                  differents = true;
                  differentColumns.push(key);
                }
              });
              codesInFeature.map(code => {
                if (codesInData.indexOf(code) === -1) {
                  differents = true;
                  differentColumns.push(key);
                }
              });
            }
          }
        }
      }
    }

    this.saveEnable = differents;
    return { data, differentColumns };
  }

  save() {
    if (!this.saveEnable) this.MessageService.warnMessage('Проверьте корректность введеных данных');

    if (this.saveEnable) {
      let editResult = this.detectOnEditFeatureDifferents(this.orderForm.value);
      if (!editResult.differentColumns.length) return;

      let patchObj = {};
      for (let index = 0; index < editResult.differentColumns.length; index++) {
        const column = editResult.differentColumns[index];
        patchObj[column] = editResult.data[column];
      }

      this.findDatesMomentBeforeSave(patchObj);
      this.http.patch(LayersLinks.featuresEdit.updateByIds(this.layerSchema.id), { ids: this.featuresIds, feature: patchObj })
        .subscribe(
          data => {
            console.log(data);
            this.onSaveMessageSubject.next(true);
            this.dialogRef.close()
          },
          error => {
            console.log(error);
            (error.status <= 400) ? this.onSaveMessageSubject.next(false) : ''
          }
        );

    }
  }

  close() {
    this.dialogRef.close()
  }
}
