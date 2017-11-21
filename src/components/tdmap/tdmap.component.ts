import { Component, OnInit } from '@angular/core';
import { MapService } from "../../services/MapService";

import * as L from "leaflet";

@Component({
  selector: 'tdmap',
  templateUrl: './tdmap.component.html',
  styleUrls: ['./tdmap.component.css']
})
export class TdmapComponent implements OnInit {

  constructor(private mapService: MapService) {

  }

  ngOnInit() {
  	let map = L.map('map',{
  		editable: true,
  		center: [59.950,30.21],
  		zoom: 11,
  		zoomControl: false,
  	});
    
    this.mapService.baseMaps.openStreetMap.addTo(map);
  }
}
