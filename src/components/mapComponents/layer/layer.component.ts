import { Component, AfterViewInit } from '@angular/core';
import { BaseLayersService } from '../../../services/BaseLayersService';
import { MapService } from '../../../services/MapService';
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

  constructor(public BaseLayersService: BaseLayersService,public MapService: MapService) {
    this.baseLayers = this.BaseLayersService.getBaseLayers();
    this.cadastrOverLayers = this.BaseLayersService.getCadastrOverLayers();

    this.watcher = this.BaseLayersService.activeBaseLayer.subscribe((change) => {
      if (change) change.layer.addTo(this.MapService.getMap());
    });
  }

  ngAfterViewInit() {
    this.setBaseLayerOnInit();
    this.setCadastrOverLaersOnInit();
    const saveMapState = () => {
      window.localStorage.setItem("MAP_STATE_ACTIVE_BASEMAP", this.BaseLayersService.getActiveBaseLayerName());
      window.localStorage.setItem('MAP_STATE_VISIBLE_CAD_LAYERS', this.BaseLayersService.getActiveCadastrLayersName().toString());
      return null;
    }
    window.addEventListener("beforeunload", (e) => saveMapState());
  }

  setBaseLayerOnInit() {
    const baseMapName = window.localStorage.getItem('MAP_STATE_ACTIVE_BASEMAP');
    if (baseMapName) {
      const baseLayerFromMapState = this.BaseLayersService.getBaseLayers().filter(baseLayer => baseLayer.name === baseMapName);
      if (baseLayerFromMapState.length) this.BaseLayersService.changeActiveBaseLayer(baseLayerFromMapState.pop().name);
    } else {
      this.BaseLayersService.changeActiveBaseLayer('Open Street Map');
    }
  }

  setCadastrOverLaersOnInit() {
    const cadlayersName = window.localStorage.getItem('MAP_STATE_VISIBLE_CAD_LAYERS');
    if (cadlayersName) {
      cadlayersName.split(',').map(item => {
        let array = this.BaseLayersService.getCadastrOverLayersNames();
        for (let i = 0; i < array.length; i++) {
          if (item === array[i]) {
            this.BaseLayersService.getCadastrOverLayerByName(item).visible = true;
            this.BaseLayersService.addCadLayerToMap(item)
          };
        }
      })
    }
  }

  transformMaterial = (event) => this.isActive = !this.isActive;
  changeBaseMapLayer = (name) => this.BaseLayersService.changeActiveBaseLayer(name);

  cadastrOverLayerChecked(e, item) {
    e.checked ? this.BaseLayersService.addCadLayerToMap(item.name) : this.BaseLayersService.removeCadLayerFromMap(item.name);
  }
}
