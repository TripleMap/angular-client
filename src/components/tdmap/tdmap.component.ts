import { Component, AfterViewInit } from "@angular/core";
import { MapService } from "../../services/MapService";

@Component({
    selector: "td-map",
    templateUrl: "./tdmap.component.html",
    styleUrls: ["./tdmap.component.css"]
})
export class TdmapComponent implements AfterViewInit {
    constructor(public MapService: MapService) { }

    ngAfterViewInit() {
        this.MapService.createLeafletMap("map");
        const map = this.MapService.getMap()
        setTimeout(map.invalidateSize.bind(map), 0)
    }
}
