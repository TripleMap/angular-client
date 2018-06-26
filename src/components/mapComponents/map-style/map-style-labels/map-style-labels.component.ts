
import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { OverLaysService, LayerSchema, LabelLinks } from "../../../../services/OverLaysService";
import 'rxjs/add/operator/debounceTime.js';
import { MatDialogRef } from '@angular/material';
import { MessageService } from '../../../../services/MessageService';
import { MatDialog } from '@angular/material';
import { ConfirmDialogDialog } from '../../../confirm-dialog/confirm-dialog.component';

import { BehaviorSubject } from 'rxjs';


interface Label {
  layer_id: string;
  user_id: string | boolean;
  field_to_label: string;
  label_color: string;
  label_font_size: string;
  halo_color: string;
  halo_size: string;
  active: boolean;
}

interface WorkLabel extends Label {
  id: string;
  selectedLayer: any;
  avaliableProperties: any[];
  currentProp: any;
  action: string;
}
interface LabelFromServer extends Label {
  id: string;
}

@Component({
  selector: 'map-style-labels',
  templateUrl: './map-style-labels.component.html',
  styleUrls: ['./map-style-labels.component.css'],
  host: {
    style: `height: 100%;
      width: 100 %;
      flex-direction: column;
      display: flex;
      justify-content: space-between;
    `
  }
})
export class MapStyleLabelsComponent implements OnInit {
  public saveEnable: boolean;
  public layersSchemas: LayerSchema[];
  public userLabels: WorkLabel[] = [];
  public constantUserLabels: BehaviorSubject<any[]> = new BehaviorSubject([]);
  @ViewChild('labelTabs') labelTabs;

  constructor(
    public http: HttpClient,
    public MessageService: MessageService,
    public OverLaysService: OverLaysService,
    public matDialog: MatDialog,
    public dialogRef: MatDialogRef<MapStyleLabelsComponent>
  ) {
    this.layersSchemas = this.OverLaysService.layersSchemas;
  }

  ngOnInit() {
    this.saveEnable = false;
    this.http.get(LabelLinks.getUserLabels()).subscribe(
      (data: Label[]) => {
        this.constantUserLabels.next(data.map(item => {
          let o = {};
          for (const k in item) { o[k] = item[k]; }
          return o;
        }));
        this.userLabels = data.map((label: any) => this.processLabelToWorkLabel(label));
      },
      error => console.log(error)
    )
  }

  processLabelToWorkLabel(label) {
    for (const layerSchema of this.layersSchemas) {
      if (layerSchema.id === label.layer_id) {
        label.selectedLayer = layerSchema;
        label.avaliableProperties = [];
        for (const key in (label.selectedLayer as LayerSchema).layer_schema.properties) {
          label.avaliableProperties.push((label.selectedLayer as LayerSchema).layer_schema.properties[key]);
          if (label.field_to_label === key) label.currentProp = (label.selectedLayer as LayerSchema).layer_schema.properties[key];
        }
      }
    }
    return label;
  }

  createLabel() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    const guid = () => s4() + s4();

    let label: WorkLabel = {
      id: guid(),
      layer_id: '',
      user_id: false,
      field_to_label: '',
      label_color: '#2952c2',
      label_font_size: '12',
      halo_color: '#fff',
      halo_size: '2',
      active: false,
      avaliableProperties: [],
      currentProp: null,
      selectedLayer: null,
      action: 'created'
    }
    this.userLabels.push(label);
    this.checkSaveEnable();
  }


  getLabelById = (id) => {
    let label: Label;
    for (let i = 0; i < this.userLabels.length; i++) {
      if (this.userLabels[i].id === id) label = this.userLabels[i];
    }
    return label
  }

  layerChange(label: WorkLabel) {
    label.avaliableProperties = [];
    for (const key in (label.selectedLayer as LayerSchema).layer_schema.properties) {
      label.avaliableProperties.push((label.selectedLayer as LayerSchema).layer_schema.properties[key]);
      if (label.action === 'created') label.currentProp = label.avaliableProperties[0];
    }
    label.layer_id = (label.selectedLayer as LayerSchema).id;
  }

  propWasChange(label: WorkLabel) {
    for (const key in (label.selectedLayer as LayerSchema).layer_schema.properties) {
      if ((label.selectedLayer as LayerSchema).layer_schema.properties[key].description === label.currentProp.description) label.field_to_label = key;
    }
    this.checkSaveEnable();
  }

  removeLabel() {
    let index = this.labelTabs.selectedIndex;
    this.matDialog.open(ConfirmDialogDialog, {
      width: '250px',
      data: {
        message: 'Удалить подпись?'
      }
    }).afterClosed()
      .subscribe(confirm => {
        if (!confirm) return;
        if (this.userLabels[index].action === 'created') {
          this.userLabels.splice(index, 1);
          this.checkSaveEnable();
        } else {
          this.http.delete(LabelLinks.deleteUserLabel(this.userLabels[index].id))
            .subscribe(
              data => {
                this.constantUserLabels.next(this.constantUserLabels.getValue().filter(item => item.id === this.userLabels[index].id ? false : item));
                this.userLabels.splice(index, 1);
                this.emitToLabelLeafletLayer();
                this.checkSaveEnable();
              },
              error => console.log(error)
            );
        }
      });
  }

  colorChange = (label, e, type) => label[`${type}_color`] = `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`;

  labelWasChange(label) {
    this.checkSaveEnable();
    if (label.action === 'created' || label.action === 'removed') return;
    label.action = 'updated';
  }


  saveLabel() {
    if (!this.saveEnable) return;
    let saveProcessPromises: Promise<any>[] = [];
    for (let i = 0; i < this.userLabels.length; i++) {
      if (this.userLabels[i].action === "created") saveProcessPromises.push(this.createOnSave(this.userLabels[i], i));
      if (this.userLabels[i].action === 'updated') saveProcessPromises.push(this.patchOnSave(this.userLabels[i], i));
    }
    Promise.all(saveProcessPromises).then(data => { this.ngOnInit(); this.emitToLabelLeafletLayer(); })
  }

  createOnSave(label, index) {
    return new Promise((resolve, reject) => {
      for (const key in (label.selectedLayer as LayerSchema).layer_schema.properties) {
        if ((label.selectedLayer as LayerSchema).layer_schema.properties[key].description === label.currentProp.description) label.field_to_label = key;
      }

      let labelToCreate: Label = {
        layer_id: label.layer_id,
        user_id: null,
        field_to_label: label.field_to_label,
        label_color: label.label_color,
        label_font_size: label.label_font_size,
        halo_color: label.halo_color,
        halo_size: label.halo_size,
        active: label.active
      }

      this.http.post(LabelLinks.createUserLabel(), labelToCreate)
        .subscribe(
          data => {
            delete label.action;
            resolve(true);
            this.checkSaveEnable();
          },
          error => reject(error)
        );
    });
  }

  patchOnSave(label, index) {
    return new Promise((resolve, reject) => {
      for (const key in (label.selectedLayer as LayerSchema).layer_schema.properties) {
        if ((label.selectedLayer as LayerSchema).layer_schema.properties[key].description === label.currentProp.description) {
          label.field_to_label = key;
        }
      }

      let labelToUpdate: Label = {
        layer_id: label.layer_id,
        user_id: null,
        field_to_label: label.field_to_label,
        label_color: label.label_color,
        label_font_size: label.label_font_size,
        halo_color: label.halo_color,
        halo_size: label.halo_size,
        active: label.active
      }

      this.http.patch(LabelLinks.updateUserLabel(label.id), labelToUpdate)
        .subscribe(
          data => {
            delete label.action;
            resolve(true);
            this.checkSaveEnable();
          },
          error => reject(error)
        );
    });
  }

  checkSaveEnable() {
    let lastUserLabels = this.constantUserLabels.getValue();
    let differentsOnIds = false;
    let idsInLast = lastUserLabels.map((label: LabelFromServer) => label.id);
    let idsInCurrent = this.userLabels.map(label => label.id);
    for (let i = 0; i < lastUserLabels.length; i++) {
      if (idsInCurrent.indexOf(lastUserLabels[i].id) === -1) differentsOnIds = true;
    }
    for (let i = 0; i < this.userLabels.length; i++) {
      if (idsInLast.indexOf(this.userLabels[i].id) === -1) differentsOnIds = true;
    }
    if (differentsOnIds) { this.saveEnable = true; return; }

    let differentsOnProps = false;
    for (let i = 0; i < lastUserLabels.length; i++) {
      const last = lastUserLabels[i];
      let current = this.userLabels.filter(item => item.id === last.id ? item : false)[0];
      if (!current || !this.compareProps(last, current)) differentsOnProps = true;
    }

    if (differentsOnProps) { this.saveEnable = true; return; }
    this.saveEnable = false;
  }

  compareProps(first, second) {
    let identical = true;
    let propsToCheck = ['layer_id', 'field_to_label', 'label_color', 'label_font_size', 'halo_color', 'halo_size', 'active'];
    for (let i = 0; i < propsToCheck.length; i++) {
      const key = propsToCheck[i];
      if (first[key] !== second[key]) identical = false;
    }
    return identical;
  }


  getTabNameByLayerId(label: WorkLabel) {
    let tabLabel;
    if (label.layer_id) {
      for (let i = 0; i < this.layersSchemas.length; i++) {
        if (this.layersSchemas[i].id === label.layer_id) tabLabel = this.layersSchemas[i].layer_schema.labelName;
      }
    }

    if (!tabLabel) tabLabel = label.id;
    return tabLabel;
  }

  removeUserLabel() { }
  close = () => this.dialogRef.close();


  emitToLabelLeafletLayer() {
    this.OverLaysService.emitToLabelLeafletLayer();
  }

  layerCanBeChosen = (layerId, label) => {
    let can = true;
    let index = this.userLabels.map(item => item.layer_id).indexOf(layerId);
    index === -1 ? can = true : can = false;

    if (label.layer_id === layerId) can = true;
    return can;
  }
  allLayersAreChosen = () => {
    let schemas = this.OverLaysService.layersSchemas.map(item => item.id).sort();
    let labels = this.userLabels.map(item => item.layer_id).sort();
    if (schemas.length !== labels.length) return false;
    let equal = true;
    for (let i = 0; i < schemas.length; i++) {
      if (labels[i] !== schemas[i]) equal = false;
    }
    return equal;
  }
}
