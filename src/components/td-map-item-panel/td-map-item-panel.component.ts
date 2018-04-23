import { Component, Inject, AfterViewInit, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, AfterContentInit, ViewChild, ElementRef } from '@angular/core';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService, LayerSchema, LayersLinks } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";
import { MatTabHeader } from "@angular/material/tabs"
import { Subject } from 'rxjs/subject'
import { Observable } from 'rxjs/observable'
import 'rxjs/add/operator/debounceTime.js';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  template: `
      <div mat-dialog-content>
        <p>Удалить дополнительный атрибут?</p>
      </div>
      <div mat-dialog-actions>
        <button mat-button color="accent" (click)="no()" cdkFocusInitial>Отмена</button>
        <button mat-button color="accent" (click)="yes()">Да</button>
      </div>`
}) export class ConfirmRemoveDialodDialog {
  constructor(public dialogRef: MatDialogRef<ConfirmRemoveDialodDialog>) { }
  no = () => this.dialogRef.close(false);
  yes = () => this.dialogRef.close(true);
}


//// TO DO pipe to null if empty
//// TO DO validations 

@Component({
  selector: 'td-map-item-panel',
  templateUrl: './td-map-item-panel.component.html',
  styleUrls: ['./td-map-item-panel.component.css']
})
export class TdMapItemPanelComponent implements OnInit {
  public activeLayer: LayerSchema;
  public avaliableLayers: LayerSchema[];
  public attributeColumns: any[] = [];
  public onLayersChange: Subscription;
  public subscriptions: object = {};
  public featuresFlow: any;
  public subscriberOnfeaturesFlow: any;
  public lastLayerId: any;
  public feature: any;
  public cadFeature: any;
  public cadSchema: any[] = [];
  public editMode: boolean = false;
  public saveEnable: boolean = true;
  public differentBetweenInputDataAndInspectFeature: boolean = false;
  public differentBetweenInputDataAndAdditionalFeature: boolean = false;
  public orderForm: FormGroup;
  public subscriberOnOrderForm: any;
  public additionalForm: FormGroup;
  public subscriberOnAdditionalForm: any;
  public featureAdditionalCharacters: any[] = [];
  public compareFn = (f1: any, f2: any) => f1.code === f2.code;
  public onSaveMessageSubject: Subject<any>;
  public onSaveSubscriber: Subscription;

  @ViewChild('tabs', { read: ElementRef }) tabs: ElementRef;
  constructor(
    public http: HttpClient,
    public OverLaysService: OverLaysService,
    public MapService: MapService,
    public formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    public MatDialog: MatDialog
  ) {
    this.featuresFlow = new Subject();
    this.subscriberOnfeaturesFlow = this.featuresFlow
      .asObservable()
      .subscribe(data => this.getFeatureInfo(data));
  }

  ngOnInit() {
    this.orderForm = this.formBuilder.group({});
    this.additionalForm = this.formBuilder.group({});
    this.subscriberOnOrderForm = this.orderForm.valueChanges
      .debounceTime(300)
      .filter(this.isValidForm)
      .map(this.pipeFiltersToNumber)
      .map(this.detectOnEditFeatureDifferents.bind(this))
      .subscribe();

    this.subscriberOnAdditionalForm = this.additionalForm.valueChanges
      .debounceTime(300)
      .map(this.detectOnEditAdditionalFeatureDifferents.bind(this))
      .subscribe();

    this.onSaveMessageSubject = new Subject();
    this.onSaveSubscriber = this.onSaveMessageSubject.debounceTime(300).subscribe(
      success => this.succesOnSave('Атрибуты обновлены'),
      error => this.errorMessage('Ошибка при обновлении атрибутов'));
    this.onLayersChange = this.OverLaysService.layersChange.subscribe(change => { if (change) this.onLayersChangeConsumer(); });
  }


  onLayersChangeConsumer() {
    this.avaliableLayers = this.OverLaysService.layersSchemas.map((item) => {
      this.subscribeMapLayersOnFeatureSelectionsChange(item);
      this.getColumnNamesForLayer(item);
      return item;
    });
    this.getCadColumnNamesForLayer();
    let header = this.tabs.nativeElement.getElementsByTagName('mat-tab-header')[0];
    header.style.width = 'calc(100% - 48px)';
  }

  succesOnSave(message) {
    this.snackBar.open(message, null, {
      duration: 2000,
      panelClass: ['success-snack'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  warnOnSave(message) {
    this.snackBar.open(message, null, {
      duration: 3000,
      panelClass: ['warn-snack'],
      horizontalPosition: 'right'
    });
  }

  errorMessage(message) {
    this.snackBar.open(message, null, {
      duration: 3000,
      panelClass: ['error-snack'],
      horizontalPosition: 'right'
    });
  }


  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) return;
    this.resetFormControl();
  }

  clearFormControls() {
    for (let control in this.orderForm.controls) {
      this.orderForm.removeControl(control)
    }
    for (let control in this.additionalForm.controls) {
      this.orderForm.removeControl(control)
    }
  }

  resetFormControl() {
    this.clearFormControls();
    this.addFeatureAttributesControls(this.activeLayer);
    this.featureAdditionalCharacters.map(item => this.addAdditionalCharactersControls(item));
  }

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

  addAdditionalCharactersControls(item) {
    this.additionalForm.addControl(this.generateFeatureAdditionalCharactersFormControlName(item.id, 'name'), new FormControl(item.character_name));
    this.additionalForm.addControl(this.generateFeatureAdditionalCharactersFormControlName(item.id, 'value'), new FormControl(item.character_value));
  }
  generateFeatureAdditionalCharactersFormControlName = (id, subName) => `${id}_${subName}`;

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

  getFormControl = (formControlName) => this.orderForm.get(formControlName);

  isValidForm = () => {
    this.orderForm.status === "VALID" ? this.saveEnable = true : this.saveEnable = false;
    return this.orderForm.status === "VALID";
  }

  saveData() {
    if (!this.saveEnable) this.warnOnSave('Проверьте корректность введеных данных');

    if (this.saveEnable && this.differentBetweenInputDataAndInspectFeature) {
      let editResult = this.detectOnEditFeatureDifferents(this.orderForm.value);
      if (!editResult.differentColumns.length) return;

      let patchObj = {};
      for (let index = 0; index < editResult.differentColumns.length; index++) {
        const column = editResult.differentColumns[index];
        patchObj[column] = editResult.data[column];
      }

      this.findDatesMomentBeforeSave(patchObj);
      this.http.patch(LayersLinks.featuresEdit.updateById(this.activeLayer.id, this.feature.id), patchObj)
        .subscribe(
          data => {
            this.onSaveMessageSubject.next(1);
            this.getInfo(this.feature.id);
          }, error => {
            if (error.status <= 400) this.onSaveMessageSubject.error(1)
          });
    }

    if (this.saveEnable && this.differentBetweenInputDataAndAdditionalFeature) {
      let additionalResult = this.detectOnEditAdditionalFeatureDifferents(this.additionalForm.value);
      for (let i = 0; i < additionalResult.differentAdditionalIds.length; i++) {
        const id = additionalResult.differentAdditionalIds[i];
        for (let additionalIndex = this.featureAdditionalCharacters.length - 1; additionalIndex >= 0; additionalIndex--) {
          let element = this.featureAdditionalCharacters[additionalIndex];
          this.activeLayer = this.avaliableLayers.filter(item => item.id === this.lastLayerId ? item : false)[0];
          if (element.id === id && this.activeLayer) {
            if (element.removed) {
              this.featureAdditionalCharacters.splice(additionalIndex, 1);
              this.http.delete(LayersLinks.additionalCharacters.deleteById(this.activeLayer.id, element.id)).subscribe(
                data => this.onSaveMessageSubject.next(1),
                error => {
                  if (error.status <= 400) this.onSaveMessageSubject.error(1)
                });
            } else if (element.added) {
              this.http.post(LayersLinks.additionalCharacters.create(this.activeLayer.id, this.feature.id), {
                character_name: this.additionalForm.get(`${element.id}_name`).value,
                character_value: this.additionalForm.get(`${element.id}_value`).value,
                feature_id: this.feature.id,
                user_id: ''
              }).subscribe(
                (data: any) => {
                  this.onSaveMessageSubject.next(1);
                  element.id = data.id;
                  element.character_name = data.character_name;
                  element.character_value = data.character_value;
                  element.feature_id = data.feature_id;
                  element.user_id = data.user_id;
                  delete element.added;
                }, error => {
                  if (error.status <= 400) this.onSaveMessageSubject.error(1)
                });
            } else if (element.updated && !element.added && !element.removed) {
              let putchObject = {
                character_name: this.additionalForm.get(`${element.id}_name`).value,
                character_value: this.additionalForm.get(`${element.id}_value`).value,
              }
              this.http.patch(LayersLinks.additionalCharacters.updateById(this.activeLayer.id, element.id), putchObject).subscribe(
                data => {
                  this.onSaveMessageSubject.next(1);
                  element.character_name = putchObject.character_name;
                  element.character_value = putchObject.character_value;
                  delete element.updated;
                }, error => {
                  if (error.status <= 400) this.onSaveMessageSubject.error(1)
                });
            }
          }
        }
      }
    }
    this.toggleEditMode();
  }

  findDatesMomentBeforeSave(savedItem) {
    for (let columnName in savedItem) {
      for (let key in this.activeLayer.layer_schema.properties) {
        let attributeColumn = this.activeLayer.layer_schema.properties[key];
        if (key === columnName && attributeColumn.columnType === 'findDate') {
          savedItem[columnName] = savedItem[columnName].valueOf();
        }
      }
    }
  }

  pipeFiltersToNumber = data => {
    for (let key in this.activeLayer.layer_schema.properties) {
      let column = this.activeLayer.layer_schema.properties[key];
      if (column.columnType === 'findSimple' || column.columnType === 'findDate') {
        if (this.feature[key] === "") this.feature[key] = null;
        if (data[key] === "") data[key] = null;
      }

      if (column.columnType === 'findNumber' && typeof data[key] === 'string') {
        data[key] = data[key] ? Number(data[key].replace(",", ".")) : null;
      }
    }
    return data;
  };

  detectOnEditFeatureDifferents(data) {

    if (!this.editMode) return;
    let differents = false;
    let differentColumns = [];
    for (let key in this.activeLayer.layer_schema.properties) {
      let column = this.activeLayer.layer_schema.properties[key];
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
    this.differentBetweenInputDataAndInspectFeature = differents;
    if (differents) this.saveEnable = true;
    return { data, differentColumns };
  }

  detectOnEditAdditionalFeatureDifferents(data) {
    if (!this.editMode) return;
    let differents = false;
    let differentAdditionalIds = [];
    for (let i = 0; i < this.featureAdditionalCharacters.length; i++) {
      const element = this.featureAdditionalCharacters[i];
      if (element.added || element.removed) {
        differentAdditionalIds.push(element.id);
        differents = true;
      } else {
        let elementNameChange = element.character_name !== data[`${element.id}_name`];
        let elementValueChange = element.character_value !== data[`${element.id}_value`];
        if (elementNameChange || elementValueChange) {
          element.updated = true;
          differentAdditionalIds.push(element.id);
          differents = true;
        } else {
          if (element.updated) delete element.updated;
        }
      }
    }
    this.differentBetweenInputDataAndAdditionalFeature = differents;
    if (differents) this.saveEnable = true;
    return { data: this.featureAdditionalCharacters, differentAdditionalIds };
  }

  removeAdditionalItem(item) {
    this.MatDialog.open(ConfirmRemoveDialodDialog, {
      width: '250px'
    }).afterClosed()
      .subscribe(confirm => {
        if (!confirm) return;
        if (item.added) {
          this.featureAdditionalCharacters.forEach((char, index) => {
            if (item.id === char.id) this.featureAdditionalCharacters.splice(index, 1);
            this.detectOnEditAdditionalFeatureDifferents(this.additionalForm.value);
          })
        } else {
          item.removed = true;
          this.differentBetweenInputDataAndAdditionalFeature = true;
        }
      });
  }

  addAdditionalItem() {
    const guid = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) + '-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    const newAdditionalCharacter = {
      id: guid(),
      character_name: ``,
      character_value: ``,
      feature_id: this.feature.id,
      user_id: '',
      added: true
    }

    this.featureAdditionalCharacters.push(newAdditionalCharacter);
    this.addAdditionalCharactersControls(newAdditionalCharacter);
    this.detectOnEditAdditionalFeatureDifferents(this.additionalForm.value);
  }

  getCadColumnNamesForLayer() {
    this.http.get('api/layers/GetGeoJSONLayerSchemaWithData?LayerId=a35a770e-2cd3-4ae1-bf25-79ed2b080efa').subscribe((data: { properties: object; }) => {
      this.cadSchema = [];
      for (let key in data.properties) {
        if (key !== 'id' && key !== 'center' && key !== 'extent') {
          this.cadSchema.push({
            name: key,
            dictionary: data.properties[key].dictionary,
            foreignTable: data.properties[key].foreignTable,
            label: data.properties[key].description || key,
            columnType: data.properties[key].columnType || 'findSimple'
          });
        }
      }
    }, error => {
      if (error.status <= 400) this.errorMessage('Ошибка при получении описания кадастровых данных');
    });
  }

  subscribeMapLayersOnFeatureSelectionsChange(layer: LayerSchema) {
    let mapLayer = this.OverLaysService.getLeafletLayerById(layer.id);
    if (!mapLayer) return;
    this.subscriptions[`${layer.id}_subscribeMapLayersOnFeatureSelectionsChange`] = mapLayer.selections.selectedFeatures.onChange.subscribe(featureSelectionsEvent => {
      let featureId = featureSelectionsEvent.added[featureSelectionsEvent.added.length - 1];
      this.lastLayerId = mapLayer.options.id;
      this.featuresFlow.next(featureId);
    });
  }

  getFeatureInfo(featureId) {
    this.editMode = false;
    this.clearFormControls();
    if (!featureId) {
      this.feature = null;
      this.cadFeature = null;
      this.featureAdditionalCharacters = [];
      return;
    }
    this.activeLayer = this.avaliableLayers.filter(item => item.id === this.lastLayerId ? item : false)[0];
    if (!this.activeLayer) return;
    this.getInfo(featureId);
    this.getCadInfo(featureId);
    this.getAdditionalCharacters(featureId);
  }

  getInfo(featureId) {
    this.http.get(LayersLinks.featuresEdit.getInfo(this.activeLayer.id, featureId)).subscribe((data) => {
      if (data) this.feature = data;
    }, error => { if (error.status <= 400) this.errorMessage('Ошибка при получении атрибутов'); });
  }

  getCadInfo(featureId) {
    this.http.get(LayersLinks.featuresEdit.getInfo('a35a770e-2cd3-4ae1-bf25-79ed2b080efa', featureId)).subscribe((data) => {
      if (data) this.cadFeature = data;
    }, error => { if (error.status <= 400) this.errorMessage('Ошибка при получении кадастровых атрибутов'); });
  }

  getAdditionalCharacters(featureId) {
    this.http.get(LayersLinks.additionalCharacters.getAll(this.activeLayer.id, featureId)).subscribe((data: any[]) => {
      if (data) this.featureAdditionalCharacters = data;
    }, error => { if (error.status <= 400) this.errorMessage('Ошибка при получении дополнительных атрибутов'); });
  }

  getColumnNamesForLayer(layerSchema: LayerSchema) {
    this.http.get(LayersLinks.schemaInfoUrl(layerSchema.id)).subscribe((data: { properties: object; }) => {
      this.attributeColumns = [];
      let localStorageOrder = window.localStorage.getItem(`attributesOrderForLayer_${layerSchema.id}`);
      if (localStorageOrder) {
        let localStorageOrderArray = localStorageOrder.split(',');
        for (let i = 0; i < localStorageOrderArray.length; i++) {
          for (let key in data.properties) {
            if (key !== 'id' && key !== 'geometry' && localStorageOrderArray[i] === key) {
              this.attributeColumns.push(this.accumulateAttributeColumn(data, key));
            }
          }
        }
        let notInOrderKeys = [];
        for (let notInOrderKey in data.properties) {
          if (notInOrderKey !== 'id' && notInOrderKey !== 'geometry' && localStorageOrderArray.indexOf(notInOrderKey) === -1) {
            notInOrderKeys.push(notInOrderKey);
          }
        }

        if (notInOrderKeys.length > 0) {
          for (let index = 0; index < notInOrderKeys.length; index++) {
            this.attributeColumns.push(this.accumulateAttributeColumn(data, notInOrderKeys[index]));
          }
        }
      } else {
        for (let key in data.properties) {
          if (key !== 'id' && key !== 'geometry') {
            this.attributeColumns.push(this.accumulateAttributeColumn(data, key));
          }
        }
      }
    });
  }

  accumulateAttributeColumn(data, key) {
    return {
      name: key,
      label: data.properties[key].description || key,
      columnType: data.properties[key].columnType || 'findSimple',
      columnValues: data.properties[key].values || null,
      avaliableProperties: data.properties[key].avaliableProperties || null,
      currentProperties: data.properties[key].currentProperties || null,
      tableType: data.properties[key].tableType,
      dataLength: data.properties[key].length,
      userFilling: data.properties[key].userFilling
    }
  }

  updateOrder() {
    let order = this.attributeColumns.map(item => item.name);
    window.localStorage.setItem(`attributesOrderForLayer_${this.activeLayer.id}`, order.toString());
  }

  linkDetector = (text: string) => (text && typeof text === 'string' && text.indexOf('http') > -1) ? true : false;
  ngOnDestroy() {
    for (let key in this.subscriptions) {
      this.subscriptions[key].unsubscribe();
    }
    this.subscriberOnOrderForm.unsubscribe();
    this.subscriberOnfeaturesFlow.unsubscribe();
    this.onSaveSubscriber.unsubscribe();
    this.onLayersChange.unsubscribe();
  }
}
