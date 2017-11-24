import { Component, OnInit } from '@angular/core';
import { MapService } from "../../services/MapService";

@Component({
  selector: 'layer-selection',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.css']
})

export class LayerComponent implements OnInit {
	isActive: boolean = false;

  constructor(private _mapService: MapService) {
    this.baseLayers = this._mapService.getBaseLayers().map(layer =>({name: layer.name, imageType: layer.imageType, images: layer.images}));
    this.cadastrOverLayers = this._mapService.getCadastrOverLayers().map(layer =>({name: layer.name, checked: false}));
    console.log(this.cadastrOverLayers);
  }

  ngOnInit(){   
    this._mapService.getActiveBaseLayer();
  }

  transformMaterial(event){
  	this.isActive = !this.isActive;
  }

  cadastrOverLayerChecked(e, item){
console.log(e, item);
  }
}
