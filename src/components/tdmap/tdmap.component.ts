import { Component, AfterViewInit, OnInit } from "@angular/core";
import { MapService } from "../../services/MapService";

// прикрутить хэш строки в браузере
//   background: #284360;

@Component({
   selector: "td-map",
   templateUrl: "./tdmap.component.html",
   styleUrls: ["./tdmap.component.css"]
})
export class TdmapComponent implements AfterViewInit, OnInit {
   constructor(public _mapService: MapService) {}

   ngOnInit() {
   }

   ngAfterViewInit() {
      this._mapService.createLeafletMap("map");
   }
}
