import { Component } from "@angular/core";
import { MapService } from '../../../services/MapService';

@Component({
  selector: "zoom-controls",
  templateUrl: "./zoom.component.html",
  styleUrls: ["./zoom.component.css"]
})
export class ZoomComponent {
  constructor(public MapService: MapService) {}

  zoomIn(e) {
    if (
      this.MapService.getMap()._zoom <
      this.MapService.getMap().getMaxZoom()
    ) {
      this.MapService.getMap().zoomIn(
        this.MapService.getMap().options.zoomDelta * (e.shiftKey ? 3 : 1)
      );
    }
  }
  zoomOut(e) {
    if (
      this.MapService.getMap()._zoom >
      this.MapService.getMap().getMinZoom()
    ) {
      this.MapService.getMap().zoomOut(
        this.MapService.getMap().options.zoomDelta * (e.shiftKey ? 3 : 1)
      );
    }
  }
}
