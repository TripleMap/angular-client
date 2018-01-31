import { Component, AfterViewInit, OnInit, ChangeDetectionStrategy, NgZone } from "@angular/core";
import { MapService } from "../../services/MapService";

// прикрутить хэш строки в браузере
//   background: #284360;

@Component({
    selector: "td-map",
    templateUrl: "./tdmap.component.html",
    styleUrls: ["./tdmap.component.css"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TdmapComponent implements AfterViewInit, OnInit {
    constructor(public _mapService: MapService, public zone: NgZone) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.zone.runOutsideAngular(() => this._mapService.createLeafletMap("map"))
    }
}
