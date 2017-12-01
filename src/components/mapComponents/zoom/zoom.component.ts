import { Component } from '@angular/core';
import { MapService } from '../../../services/MapService';

@Component({
  selector: 'zoom-controls',
  templateUrl: './zoom.component.html',
  styleUrls: ['./zoom.component.css']
})
export class ZoomComponent {

  	constructor(public _mapService: MapService) { }
	
  	zoomIn(e){
  		if (this._mapService.map._zoom < this._mapService.map.getMaxZoom()) {
			this._mapService.map.zoomIn(this._mapService.map.options.zoomDelta * (e.shiftKey ? 3 : 1));
		}
  	}
  	zoomOut(e){
		if (this._mapService.map._zoom > this._mapService.map.getMinZoom()) {
			this._mapService.map.zoomOut(this._mapService.map.options.zoomDelta * (e.shiftKey ? 3 : 1));
		}
  	}
}
