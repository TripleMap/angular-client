import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { OverLaysService, LayersLinks, StyleLinks } from "../../../../services/OverLaysService";
import 'rxjs/add/operator/debounceTime.js';
import { MatDialogRef } from '@angular/material';
import { MessageService } from '../../../../services/MessageService';
import { MatDialog } from '@angular/material';
import { ConfirmDialogDialog } from '../../../confirm-dialog/confirm-dialog.component';

import { BehaviorSubject } from 'rxjs';
interface SchemaWithData {
  id: string;
  name: string;
  properties: any;
  labelName: any;
}

interface Style {
  layer_id: string;
  user_id: string | boolean;
  field_to_style: string;
  options: { fill: string; stroke: string; strokeWidth: number; }[],
  other: { fill: string; stroke: string; strokeWidth: number; },
  nope: { fill: string; stroke: string; strokeWidth: number; },
  active: boolean;
}

interface WorkStyle extends Style {
  id: string;
  selectedLayer: any;
  avaliableProperties: any[];
  currentProp: any;
  currentPropWithData: any;
  action: string;
}


interface StyleFromServer extends Style {
  id: string;
}

@Component({
  selector: 'map-style-featurestyles',
  templateUrl: './map-style-featurestyles.component.html',
  styleUrls: ['./map-style-featurestyles.component.css'],
  host: {
    style: `height: 100%;
      width: 100 %;
      flex-direction: column;
      display: flex;
      justify-content: space-between;
    `
  }
})
export class MapStyleStylesComponent implements OnInit {
  public saveEnable: boolean;
  public layersSchemas: SchemaWithData[] = [];
  public userStyles: WorkStyle[] = [];
  public constantUserStyles: BehaviorSubject<any[]> = new BehaviorSubject([]);
  @ViewChild('styleTabs') styleTabs;

  constructor(
    public http: HttpClient,
    public MessageService: MessageService,
    public OverLaysService: OverLaysService,
    public matDialog: MatDialog,
    public dialogRef: MatDialogRef<MapStyleStylesComponent>
  ) {

    this.OverLaysService.layersSchemas.map(schema => this.http.get(LayersLinks.schemaInfoUrl(schema.id))
      .subscribe(
        (schema: any) => this.layersSchemas.push(schema),
        error => console.log(error)
      ));
  }

  ngOnInit() {
    this.saveEnable = false;
    this.http.get(StyleLinks.getUserStyles()).subscribe(
      (data: Style[]) => {
        this.constantUserStyles.next(data.map(item => {
          let o = {};
          for (const k in item) { o[k] = item[k]; }
          return o;
        }));
        this.userStyles = data.map((style: any) => this.processStyleToWorkStyle(style));
      },
      error => console.log(error)
    )
  }

  processStyleToWorkStyle(style) {
    for (const layerSchema of this.layersSchemas) {
      if (layerSchema.id === style.layer_id) {
        style.selectedLayer = layerSchema;
        style.avaliableProperties = [];
        for (const key in style.selectedLayer.properties) {
          style.avaliableProperties.push(style.selectedLayer.properties[key]);
          if (style.field_to_style === key) style.currentProp = style.selectedLayer.properties[key];
        }
      }
    }
    return style;
  }

  createStyle() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    const guid = () => s4() + s4();

    let style: WorkStyle = {
      id: guid(),
      layer_id: '',
      user_id: false,
      field_to_style: '',
      options: [],
      nope: {
        fill: "#673ab7",
        stroke: "rgba(0,0,0,0.5)",
        strokeWidth: 1
      },
      other: {
        fill: "#3f51b5",
        stroke: "rgba(0,0,0,0.5)",
        strokeWidth: 1
      },
      active: false,
      avaliableProperties: [],
      currentProp: null,
      currentPropWithData: null,
      selectedLayer: null,
      action: 'created'
    }
    this.userStyles.push(style);
    this.checkSaveEnable();
  }


  getStyleById = (id) => {
    let style: Style;
    for (let i = 0; i < this.userStyles.length; i++) {
      if (this.userStyles[i].id === id) style = this.userStyles[i];
    }
    return style
  }

  layerChange(style: WorkStyle) {
    style.avaliableProperties = [];
    for (const key in (style.selectedLayer as SchemaWithData).properties) {
      style.avaliableProperties.push((style.selectedLayer as SchemaWithData).properties[key]);
      if (style.action === 'created') style.currentProp = style.avaliableProperties[0];
    }
    style.layer_id = (style.selectedLayer as SchemaWithData).id;
  }

  propWasChange(style: WorkStyle) {
    const nopeProps = () => ({
      fill: "#673ab7",
      stroke: "rgba(0,0,0,0.5)",
      strokeWidth: 1
    });
    const otherProps = () => ({
      fill: "#3f51b5",
      stroke: "rgba(0,0,0,0.5)",
      strokeWidth: 1
    });
    const plainProps = () => ({
      fill: "#3f51b5",
      stroke: "rgba(0,0,0,0.5)",
      strokeWidth: 1
    });

    for (const key in (style.selectedLayer as SchemaWithData).properties) {
      if ((style.selectedLayer as SchemaWithData).properties[key].description === style.currentProp.description) style.field_to_style = key;
    }
    if (style.currentProp.columnType === 'findBoolean') {
      style.nope = nopeProps();
      style.other = otherProps();
      style.options = [plainProps(), plainProps()];
    }
    this.checkSaveEnable();
  }

  removeStyle() {
    let index = this.styleTabs.selectedIndex;
    this.matDialog.open(ConfirmDialogDialog, {
      width: '250px',
      data: {
        message: 'Удалить стиль?'
      }
    }).afterClosed()
      .subscribe(confirm => {
        if (!confirm) return;
        if (this.userStyles[index].action === 'created') {
          this.userStyles.splice(index, 1);
          this.checkSaveEnable();
        } else {
          this.http.delete(StyleLinks.deleteUserStyle(this.userStyles[index].id))
            .subscribe(
              data => {
                this.constantUserStyles.next(this.constantUserStyles.getValue().filter(item => item.id === this.userStyles[index].id ? false : item));
                this.userStyles.splice(index, 1);
                this.emitToStyleLeafletLayer();
                this.checkSaveEnable();
              },
              error => console.log(error)
            );
        }
      });
  }

  colorChange = (style, e, type) => style[`${type}_color`] = `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`;

  styleWasChange(style) {
    this.checkSaveEnable();
    if (style.action === 'created' || style.action === 'removed') return;
    style.action = 'updated';
  }


  saveStyle() {
    if (!this.saveEnable) return;
    let saveProcessPromises: Promise<any>[] = [];
    for (let i = 0; i < this.userStyles.length; i++) {
      if (this.userStyles[i].action === "created") saveProcessPromises.push(this.createOnSave(this.userStyles[i], i));
      if (this.userStyles[i].action === 'updated') saveProcessPromises.push(this.patchOnSave(this.userStyles[i], i));
    }
    Promise.all(saveProcessPromises).then(data => { this.ngOnInit(); this.emitToStyleLeafletLayer(); })
  }

  createOnSave(style, index) {
    return new Promise((resolve, reject) => {
      for (const key in (style.selectedLayer as SchemaWithData).properties) {
        if ((style.selectedLayer as SchemaWithData).properties[key].description === style.currentProp.description) style.field_to_style = key;
      }

      let styleToCreate: Style = {
        layer_id: style.layer_id,
        user_id: null,
        field_to_style: style.field_to_style,
        options: style.options,
        active: style.active,
        other: style.other,
        nope: style.nope
      }

      this.http.post(StyleLinks.createUserStyle(), styleToCreate)
        .subscribe(
          data => {
            delete style.action;
            resolve(true);
            this.checkSaveEnable();
          },
          error => reject(error)
        );
    });
  }

  patchOnSave(style, index) {
    return new Promise((resolve, reject) => {
      for (const key in (style.selectedLayer as SchemaWithData).properties) {
        if ((style.selectedLayer as SchemaWithData).properties[key].description === style.currentProp.description) {
          style.field_to_style = key;
        }
      }

      let styleToUpdate: Style = {
        layer_id: style.layer_id,
        user_id: null,
        field_to_style: style.field_to_style,
        options: style.options,
        active: style.active,
        other: style.other,
        nope: style.nope
      }

      this.http.patch(StyleLinks.updateUserStyle(style.id), styleToUpdate)
        .subscribe(
          data => {
            delete style.action;
            resolve(true);
            this.checkSaveEnable();
          },
          error => reject(error)
        );
    });
  }

  checkSaveEnable() {
    let lastuserStyles = this.constantUserStyles.getValue();
    let differentsOnIds = false;
    let idsInLast = lastuserStyles.map((style: StyleFromServer) => style.id);
    let idsInCurrent = this.userStyles.map(style => style.id);
    for (let i = 0; i < lastuserStyles.length; i++) {
      if (idsInCurrent.indexOf(lastuserStyles[i].id) === -1) differentsOnIds = true;
    }
    for (let i = 0; i < this.userStyles.length; i++) {
      if (idsInLast.indexOf(this.userStyles[i].id) === -1) differentsOnIds = true;
    }
    if (differentsOnIds) { this.saveEnable = true; return; }

    let differentsOnProps = false;
    for (let i = 0; i < lastuserStyles.length; i++) {
      const last = lastuserStyles[i];
      let current = this.userStyles.filter(item => item.id === last.id ? item : false)[0];
      if (!current || !this.compareProps(last, current)) differentsOnProps = true;
    }

    if (differentsOnProps) { this.saveEnable = true; return; }
    this.saveEnable = false;
  }

  compareProps(first, second) {
    let identical = true;
    let propsToCheck = ['layer_id', 'field_to_style', 'options', 'active'];
    for (let i = 0; i < propsToCheck.length; i++) {
      const key = propsToCheck[i];
      if (first[key] !== second[key]) identical = false;
    }
    return identical;
  }


  getTabNameByLayerId(style: WorkStyle) {
    let tabStyle;
    if (style.layer_id) {
      for (let i = 0; i < this.layersSchemas.length; i++) {
        if (this.layersSchemas[i].id === style.layer_id) tabStyle = this.layersSchemas[i].labelName;
      }
    }

    if (!tabStyle) tabStyle = style.id;
    return tabStyle;
  }

  close = () => this.dialogRef.close();


  emitToStyleLeafletLayer() {

  }

  layerCanBeChosen = (layerId, style) => {
    let can = true;
    let index = this.userStyles.map(item => item.layer_id).indexOf(layerId);
    index === -1 ? can = true : can = false;

    if (style.layer_id === layerId) can = true;
    return can;
  }
  allLayersAreChosen = () => {
    let schemas = this.OverLaysService.layersSchemas.map(item => item.id).sort();
    let styles = this.userStyles.map(item => item.layer_id).sort();
    if (schemas.length !== styles.length) return false;
    let equal = true;
    for (let i = 0; i < schemas.length; i++) {
      if (styles[i] !== schemas[i]) equal = false;
    }
    return equal;
  }
}
