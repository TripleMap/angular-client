import { Component, AfterViewInit } from '@angular/core';
import { BaseLayersService } from '../../../services/BaseLayersService';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'layer-selection',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.css']
})

export class LayerComponent implements AfterViewInit {
  public cadastrOverLayers: any;
  public baseLayers: any;
  public isActive = false;
  watcher: Subscription;

  constructor(public _baseLayersService: BaseLayersService) {
    this.baseLayers = this._baseLayersService.getBaseLayers();
    this.cadastrOverLayers = this._baseLayersService.getCadastrOverLayers();

    this.watcher = this._baseLayersService.activeBaseLayer.subscribe((change) => {
      if (change) change.layer.addTo(this._baseLayersService.map);
    });
  }

  ngAfterViewInit() {
    this.setBaseLayerOnInit();
    this.setCadastrOverLaersOnInit();
    const saveMapState = () => {
      window.localStorage.setItem("MAP_STATE_ACTIVE_BASEMAP", this._baseLayersService.getActiveBaseLayerName());
      window.localStorage.setItem('MAP_STATE_VISIBLE_CAD_LAYERS', this._baseLayersService.getActiveCadastrLayersName().toString());
      return null;
    }
    window.addEventListener("beforeunload", (e) => saveMapState());
  }

  setBaseLayerOnInit() {
    const baseMapName = window.localStorage.getItem('MAP_STATE_ACTIVE_BASEMAP');
    if (baseMapName) {
      const baseLayerFromMapState = this._baseLayersService.getBaseLayers().filter(baseLayer => baseLayer.name === baseMapName);
      if (baseLayerFromMapState.length) this._baseLayersService.changeActiveBaseLayer(baseLayerFromMapState.pop().name);
    } else {
      this._baseLayersService.changeActiveBaseLayer('Open Street Map');
    }
  }

  setCadastrOverLaersOnInit() {
    const cadlayersName = window.localStorage.getItem('MAP_STATE_VISIBLE_CAD_LAYERS');
    if (cadlayersName) {
      cadlayersName.split(',').map(item => {
        let array = this._baseLayersService.getCadastrOverLayersNames();
        for (let i = 0; i < array.length; i++) {
          if (item === array[i]) {
            this._baseLayersService.getCadastrOverLayerByName(item).visible = true;
            this._baseLayersService.addCadLayerToMap(item)
          };
        }
      })
    }
  }

  transformMaterial = (event) => this.isActive = !this.isActive;
  changeBaseMapLayer = (name) => this._baseLayersService.changeActiveBaseLayer(name);

  cadastrOverLayerChecked(e, item) {
    e.checked ? this._baseLayersService.addCadLayerToMap(item.name) : this._baseLayersService.removeCadLayerFromMap(item.name);
  }
}
