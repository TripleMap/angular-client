import { Component, OnInit } from '@angular/core';

import { MapService } from '../../../services/MapService';
@Component({
  selector: 'spatial-filter',
  templateUrl: './spatial-filter.component.html',
  styleUrls: ['./spatial-filter.component.css']
})
export class SpatialFilterComponent implements OnInit {
  public spatialFilterPoligonIsActive: boolean = false;
  public spatialFilterCircleIsActive: boolean = false;
  public spatialFilterGeometry: { type: string; geometry: any; };
  public spatialFilterTools: any;

  constructor(public MapService: MapService) { }

  ngOnInit() {
  }

  startPolygonSpatialFilter() {
    this.spatialFilterPoligonIsActive = !this.spatialFilterPoligonIsActive;
    this.spatialFilterCircleIsActive = false;

    this.spatialFilterGeometry = null;
    this.stopSpatialFilter();
    if (this.spatialFilterTools) {
      this.spatialFilterTools.abortDrawing();
      delete this.spatialFilterTools;
    }

    if (this.spatialFilterPoligonIsActive) {
      this.spatialFilterTools = new TDMap.Tools.SpatialFilter(this.MapService.getMap());
      this.spatialFilterTools.startPolygonSpatialFilter();
      this.spatialFilterTools.map.on('spatialfilter:bounds', e => {
        this.spatialFilterGeometry = {
          type: "bounds",
          geometry: e[0].map(item => `${item[0]} ${item[1]}`).join(',')
        };
      });
    }
  }

  startCircleSpatialFilter() {
    this.spatialFilterCircleIsActive = !this.spatialFilterCircleIsActive;
    this.spatialFilterPoligonIsActive = false;
    this.spatialFilterGeometry = null;
    this.stopSpatialFilter();
    if (this.spatialFilterTools) {
      this.spatialFilterTools.abortDrawing();
      delete this.spatialFilterTools;
    }

    if (this.spatialFilterCircleIsActive) {
      this.spatialFilterTools = new TDMap.Tools.SpatialFilter(this.MapService.getMap());
      this.spatialFilterTools.startCircleSpatialFilter();
      this.spatialFilterTools.map.on('spatialfilter:circle', e => {
        this.spatialFilterGeometry = {
          type: "circle",
          geometry: {
            radius: e.radius.toFixed(2).toString(),
            point: `${e.centerPoint.lng} ${e.centerPoint.lat}`
          }
        };
      });
    }
  }

  stopSpatialFilter() {
    if (this.spatialFilterTools) {
      this.spatialFilterGeometry = null;
      this.spatialFilterTools.abortDrawing();
      this.spatialFilterTools.map.fireEvent('spatialfilter:stop');
    }
  }
}
