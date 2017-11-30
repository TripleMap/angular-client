import { Component, OnInit, ElementRef } from '@angular/core';
import { MapService } from '../../../services/MapService';

@Component({
  selector: 'measure-controls',
  templateUrl: './measure.component.html',
  styleUrls: ['./measure.component.css']
})
export class MeasureComponent implements OnInit {
	private isActive = false;
	private measureToolsIsActive = false;
	private _measureTool: any;

	constructor(_element: ElementRef, private _mapService: MapService) {
		console.log(_element);
	}

	ngOnInit() {
	
	}

	showMeasureTools = (event) => this.isActive = !this.isActive;

	startPolylineMeasure() {
      if (this._measureTool) {
         this._measureTool.abortDrawing();
      } else {
         this._measureTool = new TDMap.Utils.Measurment(this._mapService.map);
      }
      this._measureTool.startPolylineMeasure();
      this.measureToolsIsActive = true;
    };

   startPolygonMeasure() {
    	if (this._measureTool) {
    	   this._measureTool.abortDrawing();
    	} else {
    	   this._measureTool = new TDMap.Utils.Measurment(this._mapService.map);
    	}
    	this._measureTool.startPolygonMeasure();
    	this.measureToolsIsActive = true;
   }

   stopMeasure() {
      if (this._measureTool) {
        	this._measureTool.abortDrawing();
        	this._measureTool.map.fireEvent('stopmeasure');
        	this._measureTool.checkAndClearAllLabels();
        	this._measureTool = undefined;
      }
      this.measureToolsIsActive = false;
   };
}
