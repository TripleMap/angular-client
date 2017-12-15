import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// вынести опции слоев за пределы конструктора (JSON)

@Injectable() export class BaseLayersService {
    public activeBaseLayer = new BehaviorSubject<any>(false);
    public baseMapsModels: { name: string; layer: any; imageType: string; images: string[]; }[];
    public overLayersCadastrModels: { name: string; layer: any; visible:boolean }[];
    public map: any;
    public baseMaps: any;

    constructor() {
        this.baseMapsModels = [{
            name: 'Yandex - гибрид',
            layer: new TDMap.Service.YandexProvider('hybrid'),
            imageType: 'pan',
            images: ['./assets/tiles_y_sat.png', './assets/tiles_y_hib.png']
        }, {
            name: 'Yandex - спутник',
            layer: new TDMap.Service.YandexProvider('satellite'),
            imageType: 'single',
            images: ['./assets/tiles_y_sat.png']
        }, {
            name: 'Yandex - карта',
            layer: new TDMap.Service.YandexProvider('map'),
            imageType: 'single',
            images: ['./assets/tiles_y_map.png']
        }, {
            name: 'Google - гибрид',
            layer: TDMap.Service.googleMutant({
                type: 'hybrid'
            }),
            imageType: 'multi',
            images: ['./assets/tiles_g_1_hib.png', './assets/tiles_g_2_hib.png']
        }, {
            name: 'Google - спутник',
            layer: TDMap.Service.googleMutant({
                type: 'satellite'
            }),
            imageType: 'multi',
            images: ['./assets/tiles_g_1_sat.png', './assets/tiles_g_2_sat.png']
        }, {
            name: 'Open Street Map',
            layer: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }),
            imageType: 'multi',
            images: ['./assets/tiles_osm_1.png', './assets/tiles_osm_2.png']
        }];

        this.overLayersCadastrModels = [{
            name: 'Кадастровые границы',
            layer: L.tileLayer.Rosreestr('http://{s}.pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox}&size=256,256&bboxSR=3857&imageSR=3857&f=image&layers=show%3A22%2C36%2C37%2C23%2C24', {
                tileSize: 256,
                clickable: true,
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>'
            }),
            visible: false
        }, {
            name: 'Кадастровые округа',
            layer: L.tileLayer.Rosreestr('http://{s}.pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox}&size=512,512&bboxSR=3857&imageSR=3857&f=image&layers=show%3A1%2C2%2C3%2C4%2C5%2C6%2C7', {
                tileSize: 256,
                clickable: true,
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>'
            }),
            visible: false
        }, {
            name: 'Кадастровые районы',
            layer: L.tileLayer.Rosreestr('http://{s}.pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox}&size=256,256&bboxSR=3857&imageSR=3857&f=image&layers=show%3A9%2C10%2C11%2C12%2C13%2C14%2C15%2C16', {
                tileSize: 256,
                clickable: true,
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>'
            }),
            visible: false
        }, {
            name: 'Кадастровые кварталы',
            layer: L.tileLayer.Rosreestr('http://{s}.pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox}&size=256,256&bboxSR=3857&imageSR=3857&f=image&layers=show%3A18%2C19%2C20', {
                tileSize: 256,
                clickable: true,
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>'
            }),
            visible: false
        }, {
            name: 'Росреестр ЗОУИТ',
            layer: L.tileLayer.Rosreestr('http://pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/ZONES/MapServer/export?dpi=96&transparent=true&format=png32&layers=show:0&bbox={bbox}&size=256,256&bboxSR=3857&imageSR=3857&f=image', {
                tileSize: 256,
                clickable: true,
                attribution: '<a href="https://pkk5.rosreestr.ru/">Публичная кадастрвоая карта</a>'
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

    getActiveBaseLayerName = () => {
        if (this.activeBaseLayer.getValue()) return this.activeBaseLayer.getValue().name;
    }
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
        .pop().layer.addTo(this.map);
    };

    removeCadLayerFromMap = (layerName) => this.overLayersCadastrModels.filter(cadLayerModel => cadLayerModel.name === layerName ? cadLayerModel : false)
        .pop().layer.remove();

    setMap = (map: object) => this.map = map;
}