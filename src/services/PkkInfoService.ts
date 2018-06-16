import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";
import { MapService } from './MapService';
import { OverLaysService, LayersLinks } from "./OverLaysService";
import { HttpClient } from "@angular/common/http";
import { MatDialog } from '@angular/material';
import { PkkImportFeatureSteperComponent } from '../components/mapComponents/pkk-info/pkk-import-feature-steper/pkk-import-feature-steper.component';
import { LoadUpdateCadastralInfoDialogComponent } from '../components/mapComponents/pkk-info/load-update-cadastral-info-dialog/load-update-cadastral-info-dialog.component';

import { MessageService } from './MessageService';


export interface SearchProviderData {
  type: string;
  labelName: string;
}

@Injectable()
export class PkkInfoService {
  public seachProvidersData: SearchProviderData[] = [{ type: 'PARCEL', labelName: 'Земельные участки' }, { type: 'OKS', labelName: 'Объекты капитального строительства' }];
  public activeSearchProviderData: SearchProviderData;
  public CadastralFeatureInfo: BehaviorSubject<any> = new BehaviorSubject(false);
  public newInstanceCreated: BehaviorSubject<any> = new BehaviorSubject(false);
  public cadastralTools: any;

  constructor(public MapService: MapService,
    public MatDialog: MatDialog,
    public OverLaysService: OverLaysService,
    public http: HttpClient,
    public MessageService: MessageService
  ) {
    this.MapService.mapReady.subscribe(ready => {
      if (!ready) return;
      this.cadastralTools = new TDMap.CadastralUtils.CadastralSearchDataService(this.MapService.getMap());
    });
  }

  getSearchProvidersData = () => this.seachProvidersData;
  setActiveSearchProviderData = (providerData: SearchProviderData) => this.activeSearchProviderData = providerData;
  getActiveSearchProviderData = () => this.activeSearchProviderData;


  startSearch(e) {
    let lat = e.latlng.lat.toFixed(6).toString().replace('.', ',');
    let lng = e.latlng.lng.toFixed(6).toString().replace('.', ',');
    let type = this.getActiveSearchProviderData().type;
    this.removeTempCadastralLayers();
    this.cadastralTools.getFeaturesByLocation(`${lat} ${lng}`, type)
      .subscribe(data => {
        if (data && data.length > 0) {
          this.cadastralTools.getGeoJsonByCadNum(`${data[0].properties.cn}`, type)
            .subscribe(
              data => this.addGeoJSONToMap(data),
              error => (error && error.status) ? this.MessageService.errorMessage('Ошибка получения данных') : this.MessageService.errorMessage('Ошибка обработки данных')
            );
        }
      }, error => (error && error.status) ? this.MessageService.errorMessage('Ошибка получения данных') : this.MessageService.errorMessage('Ошибка обработки данных'))
  }

  addGeoJSONToMap(data) {
    this.removeTempCadastralLayers();
    if (!(data && data.data)) return;
    let layer = L.imageOverlay(data.url, data.bounds, { opacity: 0.5 });
    layer.tempCadastralLayer = true;
    layer.addTo(this.MapService.getMap());
    this.CadastralFeatureInfo.next(data.data);
  }

  removeTempCadastralLayers() {
    this.MapService.getMap().eachLayer(layer => {
      if (layer.tempCadastralLayer) {
        layer.remove();
        this.CadastralFeatureInfo.next(false);
      }
    })
  }

  startSpatialSearch() {
    const map = this.MapService.getMap();
    map.on('click', this.startSearch, this);
    this.MapService.getMap().getContainer().classList.add("map-cursor-pointer")
  }

  stopSpatialSearch() {
    const map = this.MapService.getMap();
    map.off('click', this.startSearch, this);
    this.MapService.getMap().getContainer().classList.remove("map-cursor-pointer");
    this.removeTempCadastralLayers();
  }

  loadCadastralFeatureIntoSystem() {
    let cn = this.CadastralFeatureInfo.getValue().cn
    let type = this.getActiveSearchProviderData().type;
    this.cadastralTools.getGeoJsonByCadNum(cn, type, true)
      .subscribe(
        data => this.importDataIntoSystem(data),
        error => (error && error.status) ? this.MessageService.errorMessage('Ошибка получения данных') : this.MessageService.errorMessage('Ошибка обработки данных')
      );
  }

  importDataIntoSystem(data) {
    if (data.type === "withCoords") {
      this.MatDialog.open(PkkImportFeatureSteperComponent, {
        height: '210px',
        width: '410px'
      }).afterClosed()
        .subscribe(confirm => {
          if (!confirm) return;
          let geoJSONFeature = data.data;
          this.http.post(LayersLinks.featuresEdit.create(confirm.layer.id, true), geoJSONFeature)
            .subscribe(
              data => this.addInstanceToTDMapSystem(data, confirm.layer.id),
              error => this.MessageService.errorMessage('Ошибка обработки данных')
            )
        });
    }
  }

  loadCadastralIntoSystem(feature) {

    let layerId, featureId = feature.id;
    this.OverLaysService.leafletLayers.map(layer => {
      layer.getLayers().forEach(featureLayer => {
        if (featureLayer.feature && featureLayer.feature.properties && featureLayer.feature.properties.id === featureId) layerId = layer.options.id;
      });
    });
    if (!layerId) {
      this.MessageService.warnMessage('Не удается определить слой объекта.');
      return;
    }

    return this.MatDialog.open(LoadUpdateCadastralInfoDialogComponent, {
      height: '210px',
      width: '410px',
      data: {
        onLoadCadastralFeature: true,
        avaliableTypes: this.getSearchProvidersData()
      }
    }).afterClosed()
      .switchMap(next => {
        if (!next) return;
        return this.cadastralTools.getGeoJsonByCadNum(next.cadastralNumber, next.selectedType.type, false)
          .catch(error => (error && error.status) ? this.MessageService.errorMessage('Ошибка получения данных') : this.MessageService.errorMessage('Ошибка обработки данных'))
          .switchMap(response => this.createFeatureCadastralInfo(response, layerId, featureId));
      });
  }

  createFeatureCadastralInfo(response, layerId, featureId) {
    if (response.type !== "withCoords" || !response.data) {
      this.MessageService.warnMessage('Объект не имеет кадастровой информации.');
      return;
    }
    return this.http.post(LayersLinks.cadastralDataEdit.create(layerId, featureId), response.data);
  }

  updateCadastralIntoSystem(feature, cn) {
    let layerId, featureId = feature.id;
    this.OverLaysService.leafletLayers.map(layer => {
      layer.getLayers().forEach(featureLayer => {
        if (featureLayer.feature && featureLayer.feature.properties && featureLayer.feature.properties.id === featureId) layerId = layer.options.id;
      });
    });

    if (!layerId) {
      this.MessageService.warnMessage('Не удается определить слой объекта.');
      return;
    }

    return this.MatDialog.open(LoadUpdateCadastralInfoDialogComponent, {
      height: '210px',
      width: '410px',
      data: {
        onUpdateCadastralFeature: true,
        avaliableTypes: this.getSearchProvidersData()
      }
    }).afterClosed()
      .switchMap(next => {
        if (!next) return;
        return this.cadastralTools.getGeoJsonByCadNum(cn, next.selectedType.type, false)
          .catch(error => (error && error.status) ? this.MessageService.errorMessage('Ошибка получения данных') : this.MessageService.errorMessage('Ошибка обработки данных'))
          .switchMap(data => this.updateFeatureCadastralInfo(layerId, data));
      });

  }

  updateFeatureCadastralInfo(layerId, response) {
    if (response.type !== "withCoords" || !response.data) {
      this.MessageService.warnMessage('Объект не имеет кадастровой информации.');
      return false;
    }
    return this.http.post(LayersLinks.cadastralDataEdit.updateByCn(layerId, response.data.cn), response.data)
  }

  addInstanceToTDMapSystem(instance, layerId) {
    if (!instance) return;
    this.newInstanceCreated.next({ instance, layerId });
    const mapLayer = this.OverLaysService.getLeafletLayerById(layerId);
    mapLayer.addData(instance);
  }
}
