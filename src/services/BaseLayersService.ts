import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MapService } from './MapService';
// вынести опции слоев за пределы конструктора (JSON)

@Injectable() export class BaseLayersService {
    public activeBaseLayer = new BehaviorSubject<any>(false);
    public baseMapsModels: { name: string; layer: any; imageType: string; images: string[]; }[];
    public overLayersCadastrModels: { name: string; layer: any; visible: boolean }[];

    constructor(public MapService: MapService) {
        this.baseMapsModels = [{
            name: 'Yandex - гибрид',
            layer: new MapService.TDMap.Layers.YandexProvider('hybrid', {
                maxZoom: 24
            }),
            imageType: 'pan',
            images: ['./assets/tiles_y_sat.png', './assets/tiles_y_hib.png']
        }, {
            name: 'Yandex - спутник',
            layer: new MapService.TDMap.Layers.YandexProvider('satellite', {
                maxZoom: 24
            }),
            imageType: 'single',
            images: ['./assets/tiles_y_sat.png']
        }, {
            name: 'Yandex - карта',
            layer: new MapService.TDMap.Layers.YandexProvider('map', {
                maxZoom: 24
            }),
            imageType: 'single',
            images: ['./assets/tiles_y_map.png']
        }, {
            name: 'Google - гибрид',
            layer: new MapService.TDMap.Layers.GoogleProvider({
                type: 'hybrid',
                maxZoom: 24
            }),
            imageType: 'multi',
            images: ['./assets/tiles_g_1_hib.png', './assets/tiles_g_2_hib.png']
        }, {
            name: 'Google - спутник',
            layer: new MapService.TDMap.Layers.GoogleProvider({
                type: 'satellite',
                maxZoom: 24
            }),
            imageType: 'multi',
            images: ['./assets/tiles_g_1_sat.png', './assets/tiles_g_2_sat.png']
        }, {
            name: 'Open Street Map',
            layer: new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 24
            }),
            imageType: 'multi',
            images: ['./assets/tiles_osm_1.png', './assets/tiles_osm_2.png']
        }];

        this.overLayersCadastrModels = [{
            name: 'Земельные участки',
            layer: new MapService.TDMap.Layers.RosreestrProvider('http://pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export', {
                tileSize: 512,
                clickable: true,
                layers: "show:22,23,24,36,37",
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>',
                maxZoom: 24
            }),
            visible: false
        }, {
            name: 'Объекты капитального строительства',
            layer: new MapService.TDMap.Layers.RosreestrProvider('http://pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export', {
                tileSize: 512,
                clickable: true,
                layers: "show:26,27,28,29,30,31",
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>',
                maxZoom: 24
            }),
            visible: false
        }, {
            name: 'Кадастровые округа',
            layer: new MapService.TDMap.Layers.RosreestrProvider('http://pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export', {
                tileSize: 512,
                clickable: true,
                layers: "show:1,2,3,4,5,6,7",
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>',
                maxZoom: 24
            }),
            visible: false
        }, {
            name: 'Кадастровые районы',
            layer: new MapService.TDMap.Layers.RosreestrProvider('http://pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export', {
                tileSize: 512,
                clickable: true,
                layers: "show:9,10,11,12,13,14,15,16",
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>',
                maxZoom: 24
            }),
            visible: false
        }, {
            name: 'Кадастровые кварталы',
            layer: new MapService.TDMap.Layers.RosreestrProvider('http://pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export', {
                tileSize: 512,
                clickable: true,
                layers: "show:18,19,20",
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>',
                maxZoom: 24
            }),
            visible: false
        }, {
            name: 'Росреестр ЗОУИТ',
            layer: new MapService.TDMap.Layers.RosreestrProvider('http://pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/ZONES/MapServer/export', {
                tileSize: 512,
                clickable: true,
                layers: "show:0",
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>',
                maxZoom: 24
            }),
            visible: false
        }];
    }
    getBaseLayers = () => this.baseMapsModels;
    getCadastrOverLayers = () => this.overLayersCadastrModels;

    getBaseLayersNames = () => this.baseMapsModels.map(layerModel => layerModel.name);
    getCadastrOverLayersNames = () => this.overLayersCadastrModels.map(layerModel => layerModel.name);

    getBaseLayerByName = (name: string) => this.baseMapsModels.filter(layerModel => layerModel.name === name ? layerModel : false).pop();
    getCadastrOverLayerByName = (name: string) => this.overLayersCadastrModels.filter(layerModel => layerModel.name === name ? layerModel : false).pop();

    getActiveBaseLayerName = () => (this.activeBaseLayer.getValue()) ? this.activeBaseLayer.getValue().name : false;

    changeActiveBaseLayer(layerName: string) {
        if (!this.getBaseLayersNames().includes(layerName)) {
            return;
        }
        const baseLayer = this.getBaseLayerByName(layerName);

        if (baseLayer) {
            if (this.activeBaseLayer.getValue()) this.activeBaseLayer.getValue().layer.remove();
            this.activeBaseLayer.next(baseLayer);
        }
    }

    getActiveCadastrLayersName = () => this.overLayersCadastrModels.filter(cadLayerModel => cadLayerModel.visible ? true : false)
        .map(cadLayerModel => cadLayerModel.name);
    getActiveCadastrLayers = () => this.overLayersCadastrModels.filter(cadLayerModel => cadLayerModel.visible ? true : false);

    addCadLayerToMap = (layerName) => {
        this.overLayersCadastrModels.filter(cadLayerModel => cadLayerModel.name === layerName ? cadLayerModel : false)
            .pop().layer.addTo(this.MapService.getMap());
    };

    removeCadLayerFromMap = (layerName) => this.overLayersCadastrModels.filter(cadLayerModel => cadLayerModel.name === layerName ? cadLayerModel : false)
        .pop().layer.remove();
}