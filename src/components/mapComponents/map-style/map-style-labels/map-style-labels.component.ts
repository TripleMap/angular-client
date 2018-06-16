
import { Component, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { LayersLinks, OverLaysService, LayerSchema } from "../../../../services/OverLaysService";
import 'rxjs/add/operator/debounceTime.js';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { MessageService } from '../../../../services/MessageService';



interface Label {
  id: string;
  user_id: string;
  layerId: string;
  fieldToLabel: string;
  labelColor: string;
  labelFontSize: string;
  haloColor: string;
  haloSize: string;


  selectedLayer: any;
  avaliableProperties: any[];
  currentProp: any;
}

@Component({
  selector: 'app-map-style-labels',
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
  public saveEnable: boolean = false;
  public layersSchemas: LayerSchema[];


  public userLabels: Label[] = [];
  constructor(
    public http: HttpClient,
    public MessageService: MessageService,
    public OverLaysService: OverLaysService,
    public dialogRef: MatDialogRef<MapStyleLabelsComponent>
  ) {
    this.layersSchemas = this.OverLaysService.layersSchemas;
  }

  ngOnInit() {

  }

  createLabel() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    const guid = () => s4() + s4();

    let label: Label = {
      id: guid(),
      user_id: '',
      layerId: '',
      fieldToLabel: '',
      labelColor: '#2952c2',
      labelFontSize: '12',
      haloColor: '#fff',
      haloSize: '2',
      avaliableProperties: [],
      currentProp: null,
      selectedLayer: null
    }
    this.userLabels.push(label);
  }


  getLabelById = (id) => {
    let label: Label;
    for (let i = 0; i < this.userLabels.length; i++) {
      if (this.userLabels[i].id === id) label = this.userLabels[i];
    }
    return label
  }

  layerChange(label) {
    label.avaliableProperties = [];
    for (const key in (label.selectedLayer as LayerSchema).layer_schema.properties) {
      label.avaliableProperties.push((label.selectedLayer as LayerSchema).layer_schema.properties[key]);
      label.currentProp = label.avaliableProperties[0];
    }
  }
  colorChange(label, e, type) {
    label[`${type}Color`] = `rgba(${e.rgb.r},${e.rgb.g},${e.rgb.b},${e.rgb.a})`;
    console.log(label);
  }

  saveLabel() {
    this.dialogRef.close();

  }

  close = () => this.dialogRef.close();
}
