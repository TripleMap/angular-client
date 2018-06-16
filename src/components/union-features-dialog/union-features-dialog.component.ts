import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { LayersLinks } from '../../services/OverLaysService';
import { HttpClient } from "@angular/common/http";
import { MessageService } from '../../services/MessageService';

@Component({
  selector: 'union-features-dialog',
  templateUrl: './union-features-dialog.component.html',
  styleUrls: ['./union-features-dialog.component.css']
})
export class UnionFeaturesDialogComponent implements OnInit {
  public layerId: any;
  public featureIds: string[];
  public mainFeatureIdToUnion: string;
  public featuresData: any[] = [];
  public attributeColumns: any[];
  constructor(
    public dialogRef: MatDialogRef<UnionFeaturesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public http: HttpClient,
    public MessageService: MessageService
  ) { }
  ngOnInit() {
    this.layerId = this.data && this.data.layerId ? this.data.layerId : '';
    this.featureIds = this.data && this.data.featureIds ? this.data.featureIds : [];
    this.mainFeatureIdToUnion = this.data && this.data.mainFeatureIdToUnion ? this.data.mainFeatureIdToUnion : '';
    this.featuresData = this.featureIds;

    this.http.get(LayersLinks.schemaInfoUrl(this.layerId))
      .subscribe((data: { properties: object; }) => {
        this.collectFeaturesData();
        this.collectColumnNamesForLayer(data);
      });
  }


  setMainFeatureIdToUnion(featureId) {
    this.mainFeatureIdToUnion = featureId;
  }

  collectColumnNamesForLayer(data) {
    this.attributeColumns = [];
    let localStorageOrder = window.localStorage.getItem(`attributesOrderForLayer_${this.layerId}`);
    if (localStorageOrder) {
      let localStorageOrderArray = localStorageOrder.split(',');
      for (let i = 0; i < localStorageOrderArray.length; i++) {
        for (let key in data.properties) {
          if (key !== 'id' && key !== 'geometry' && localStorageOrderArray[i] === key) this.attributeColumns.push(this.accumulateAttributeColumn(data, key));
        }
      }
      let notInOrderKeys = [];
      for (let notInOrderKey in data.properties) {
        if (notInOrderKey !== 'id' && notInOrderKey !== 'geometry' && localStorageOrderArray.indexOf(notInOrderKey) === -1) notInOrderKeys.push(notInOrderKey);
      }
      if (notInOrderKeys.length > 0) {
        for (let index = 0; index < notInOrderKeys.length; index++) {
          this.attributeColumns.push(this.accumulateAttributeColumn(data, notInOrderKeys[index]));
        }
      }
    } else {
      for (let key in data.properties) {
        if (key !== 'id' && key !== 'geometry') this.attributeColumns.push(this.accumulateAttributeColumn(data, key));

      }
    }
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


  collectFeaturesData() {
    for (let i = 0; i < this.featureIds.length; i++) {
      const featureId = this.featureIds[i];
      this.http.get(LayersLinks.featuresEdit.getInfo(this.layerId, featureId)).subscribe(
        (data: any) => {
          if (!data && !data.id) return;
          this.featuresData = this.featuresData.map(item => { return (data.id === item) ? data : item; });
        }, error => {
          if (error.status <= 400) this.MessageService.errorMessage('Ошибка при получении атрибутов');
        }
      );
    }
  }

  cancel = () => this.dialogRef.close(false);
  sendResult = () => {
    (!this.mainFeatureIdToUnion) ? this.MessageService.warnMessage('Необходимо выбрать объект.') : this.dialogRef.close(this.mainFeatureIdToUnion);
  }

  linkDetector = (text: string) => (text && typeof text === 'string' && text.indexOf('http') > -1) ? true : false;
}