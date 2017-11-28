import { Component, OnInit } from '@angular/core';
import { MapService } from '../../services/MapService';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'layer-selection',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.css']
})

export class LayerComponent implements OnInit {
  private cadastrOverLayers: any;
  private baseLayers: any;
  private isActive = false;
  watcher: Subscription;

  constructor(private _mapService: MapService) {
    this.baseLayers = this._mapService.getBaseLayers();
    this.cadastrOverLayers = this._mapService.getCadastrOverLayers();

    this.watcher = this._mapService.activeBaseLayer.subscribe((change) => {
      if (change) {
        change.layer.addTo(this._mapService.map);
      }
    });
  }

  ngOnInit() {
    this.setBaseLayerOnInit();
    this.setCadastrOverLaersOnInit();
    const saveMapState = () => {
      window.localStorage.setItem("MAP_STATE_ACTIVE_BASEMAP", this._mapService.getActiveBaseLayerName());
      window.localStorage.setItem('MAP_STATE_VISIBLE_CAD_LAYERS', this._mapService.getActiveCadastrLayersName().toString());
    }
    window.addEventListener("beforeunload", (e) => saveMapState());
  }

  setBaseLayerOnInit() {
    const baseMapName = window.localStorage.getItem('MAP_STATE_ACTIVE_BASEMAP');
    if (baseMapName) {
      const baseLayerFromMapState = this._mapService.getBaseLayers().filter(baseLayer => baseLayer.name === baseMapName);
      if (baseLayerFromMapState.length) this._mapService.changeActiveBaseLayer(baseLayerFromMapState.pop().name);
    } else {
      this._mapService.changeActiveBaseLayer('Open Street Map');
    }
  }

  setCadastrOverLaersOnInit() {
    const cadlayersName = window.localStorage.getItem('MAP_STATE_VISIBLE_CAD_LAYERS');
    if (cadlayersName) {
      cadlayersName.split(',').map(item => {
        let array = this._mapService.getCadastrOverLayersNames();
        for (let i = 0; i < array.length; i++) {
          if (item === array[i]) {
            this._mapService.getCadastrOverLayerByName(item).visible = true;
            this._mapService.addCadLayerToMap(item)
          };
        }
      })
    }
  }

  transformMaterial = (event) => this.isActive = !this.isActive;
  changeBaseMapLayer = (name) => this._mapService.changeActiveBaseLayer(name);

  cadastrOverLayerChecked(e, item) {
    e.checked ? this._mapService.addCadLayerToMap(item.name) : this._mapService.removeCadLayerFromMap(item.name);
  }



}
