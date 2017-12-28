import { Component, AfterViewInit } from "@angular/core";
import { OverLaysService } from "../../services/OverLaysService";

@Component({
	selector: "td-map-panel",
	templateUrl: "./td-map-panel.component.html",
	styleUrls: ["./td-map-panel.component.css"]
})
export class TdMapPanelComponent implements AfterViewInit {
	constructor(public _overLaysService: OverLaysService) {}

	ngAfterViewInit() {
		this._overLaysService.mainLayer.featuresFlow.subscribe(data =>
			data
		);
	}
}
