import { Component, AfterViewInit } from "@angular/core";
import { OverLaysService } from "../../services/OverLaysService";

@Component({
	selector: "td-map-panel",
	templateUrl: "./td-map-panel.component.html",
	styleUrls: ["./td-map-panel.component.css"]
})
export class TdMapPanelComponent implements AfterViewInit {
	public selectedRows: any[] = [];
	public selectable: boolean = true;
	public multiple: boolean = true;
	public sortBy: string = 'id';
	public visibleFeatures: any[];
	constructor(public _overLaysService: OverLaysService) {
	}

	ngAfterViewInit() {
		this._overLaysService.mainLayer.featuresFlow.subscribe(data =>{
			this.visibleFeatures = data;
			console.log(data)
		});
	}
}
