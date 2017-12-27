import { Component, ElementRef } from "@angular/core";
import { BaseLayersService } from "../../../services/BaseLayersService";

@Component({
  selector: "measure-controls",
  templateUrl: "./measure.component.html",
  styleUrls: ["./measure.component.css"]
})
export class MeasureComponent{
  public isActive = false;
  public measureToolsIsActive = false;
  public _measureTool: any;
  constructor(
    public _element: ElementRef,
    public _baseLayersService: BaseLayersService
  ) {}

  showMeasureTools = event => (this.isActive = !this.isActive);

  startPolylineMeasure(event) {
    if (this._measureTool) {
      this._measureTool.abortDrawing();
    } else {
      this._measureTool = new TDMap.Utils.Measurment(
        this._baseLayersService.map
      );
    }
    this._measureTool.startPolylineMeasure();
    this.measureToolsIsActive = true;
  }

  startPolygonMeasure(event) {
    if (this._measureTool) {
      this._measureTool.abortDrawing();
    } else {
      this._measureTool = new TDMap.Utils.Measurment(
        this._baseLayersService.map
      );
    }
    this._measureTool.startPolygonMeasure();
    this.measureToolsIsActive = true;
  }

  stopMeasure(event) {
    if (this._measureTool) {
      this._measureTool.abortDrawing();
      this._measureTool.map.fireEvent("stopmeasure");
      this._measureTool.checkAndClearAllLabels();
      this._measureTool = undefined;
    }
    this.measureToolsIsActive = false;
  }
}
