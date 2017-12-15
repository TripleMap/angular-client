import { Component } from "@angular/core";
import { BaseLayersService } from "../../../services/BaseLayersService";

@Component({
  selector: "zoom-controls",
  templateUrl: "./zoom.component.html",
  styleUrls: ["./zoom.component.css"]
})
export class ZoomComponent {
  constructor(public _baseLayersService: BaseLayersService) {}

  zoomIn(e) {
    if (
      this._baseLayersService.map._zoom <
      this._baseLayersService.map.getMaxZoom()
    ) {
      this._baseLayersService.map.zoomIn(
        this._baseLayersService.map.options.zoomDelta * (e.shiftKey ? 3 : 1)
      );
    }
  }
  zoomOut(e) {
    if (
      this._baseLayersService.map._zoom >
      this._baseLayersService.map.getMinZoom()
    ) {
      this._baseLayersService.map.zoomOut(
        this._baseLayersService.map.options.zoomDelta * (e.shiftKey ? 3 : 1)
      );
    }
  }
}
