import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BaseLayersService } from '../../../services/BaseLayersService';
import { OverLaysService, LayerSchema } from '../../../services/OverLaysService';
import { MapService } from '../../../services/MapService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'layer-selection',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LayerComponent {
  public cadastrOverLayers: any = [];
  public baseLayers: any = [];
  public overlayLayers: LayerSchema[] = [];
  public isActive = false;
  public onActiveBaseLayerChange: Subscription;

  constructor(
    public BaseLayersService: BaseLayersService,
    public MapService: MapService,
    public OverLaysService: OverLaysService,
    public ChangeDetectorRef: ChangeDetectorRef
  ) {
    MapService.mapReady.subscribe(ready => {
      if (!ready) return;
      this.baseLayers = this.BaseLayersService.getBaseLayers();
      this.cadastrOverLayers = this.BaseLayersService.getCadastrOverLayers();
      this.OverLaysService.layersChange.subscribe(change => {
        if (!change) return;
        this.overlayLayers = this.OverLaysService.layersSchemas;
        this.setOverlayLaersOnInit();
      });

      this.onActiveBaseLayerChange = this.BaseLayersService.activeBaseLayer.subscribe((change) => {
        if (change) change.layer.addTo(this.MapService.getMap());
      });

      this.setBaseLayerOnInit();
      this.setCadastrOverLaersOnInit();

      const saveMapState = () => {
        window.localStorage.setItem("MAP_STATE_ACTIVE_BASEMAP", this.BaseLayersService.getActiveBaseLayerName());
        window.localStorage.setItem('MAP_STATE_VISIBLE_CAD_LAYERS', this.BaseLayersService.getActiveCadastrLayersName().toString());
        window.localStorage.setItem('MAP_STATE_VISIBLE_OVERLAY_LAYERS', this.OverLaysService.getActiveOverlayLayersId().toString());
        return null;
      }
      window.addEventListener("beforeunload", (e) => saveMapState());
    })
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

  setOverlayLaersOnInit() {
    const overlayLayers = window.localStorage.getItem('MAP_STATE_VISIBLE_OVERLAY_LAYERS');
    if (!overlayLayers) return;
    overlayLayers.split(',').map(item => {
      this.overlayLayers.map(mapItem => {
        if (item === mapItem.id) { this.OverLaysService.addLayerToMap(item); }
        mapItem.layer_schema.options.visible = this.OverLaysService.getLeafletLayerById(mapItem.id).options.visible;
      });
    });
    this.ChangeDetectorRef.detectChanges();
  }

  transformMaterial = event => this.isActive = !this.isActive;
  changeBaseMapLayer = name => this.BaseLayersService.changeActiveBaseLayer(name);
  cadastrOverLayerChecked = (e, item) => e.checked ? this.BaseLayersService.addCadLayerToMap(item.name) : this.BaseLayersService.removeCadLayerFromMap(item.name);
  changeOverLayLayer = overlayLayer => overlayLayer.layer_schema.options.visible ? this.OverLaysService.addLayerToMap(overlayLayer.id) : this.OverLaysService.removeLayerFromMap(overlayLayer.id);
}
