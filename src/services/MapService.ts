import {Injectable} from "@angular/core";
import * as L from "leaflet";

@Injectable() export class MapService {
  public map: L.Map;
  public baseMaps: any;

  constructor() {
    this.baseMaps = {
        openStreetMap: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        })
    };
  }
}