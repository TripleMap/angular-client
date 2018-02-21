import { Component, AfterViewInit, OnInit, ChangeDetectionStrategy, NgZone } from "@angular/core";
import { MapService } from "../../services/MapService";

// прикрутить хэш строки в браузере
//   background: #284360;

@Component({
    selector: "td-map",
    templateUrl: "./tdmap.component.html",
    styleUrls: ["./tdmap.component.css"]
})
export class TdmapComponent implements AfterViewInit {
    constructor(public MapService: MapService, public zone: NgZone) { }

    ngAfterViewInit() {
        this.MapService.createLeafletMap("map");
        const map = this.MapService.getMap()
        setTimeout(map.invalidateSize.bind(map), 0)
    }
}
