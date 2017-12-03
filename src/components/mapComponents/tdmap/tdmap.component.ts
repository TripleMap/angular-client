import { Component, AfterViewInit } from '@angular/core';
import { BaseLayersService } from '../../../services/BaseLayersService';
import { OverLaysService } from '../../../services/OverLaysService';

// прикрутить хэш строки в браузере
@Component({
  selector: 'td-map',
  templateUrl: './tdmap.component.html',
  styleUrls: ['./tdmap.component.css']
})
export class TdmapComponent implements AfterViewInit {

  constructor(public _baseLayersService: BaseLayersService, public _overLayService: OverLaysService) {

  }

  ngAfterViewInit() {
    const map = L.map('map', {
      editable: true,
      center: [59.950, 30.21],
      zoom: 11,
      zoomControl: false,
    });
    this._baseLayersService.setMap(map);
    this._overLayService.setMap(map);
    let zoom, lat, lng;

    const zoomState = window.localStorage.getItem('MAP_STATE_ZOOM');
    const latState = window.localStorage.getItem('MAP_STATE_COORDINATES_LAT');
    const lngState = window.localStorage.getItem('MAP_STATE_COORDINATES_LNG');

    if (zoomState && zoomState) {
      zoom = Number(zoomState);
    }

    if (latState && lngState) {
      lat = Number(latState);
      lng = Number(lngState);
    }

    if (zoom && lat && lng) {
      map.setView([lat, lng], zoom);
    }

    function saveMapState() {
      window.localStorage.setItem('MAP_STATE_ZOOM', map.getZoom());
      window.localStorage.setItem('MAP_STATE_COORDINATES_LAT', map.getCenter().lat);
      window.localStorage.setItem('MAP_STATE_COORDINATES_LNG', map.getCenter().lng);
      return null;
    } 

    window.addEventListener('beforeunload', (e) => saveMapState());

    this._overLayService.addLayerToMap();
  }
}
