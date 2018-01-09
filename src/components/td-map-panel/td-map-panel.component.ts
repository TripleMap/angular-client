import { Component, AfterViewInit, Output, EventEmitter} from "@angular/core";
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

	@Output()
  	closeTdmapPanelSidenav: EventEmitter<string> = new EventEmitter<string>();

	constructor(public _overLaysService: OverLaysService) {
	}

	ngAfterViewInit() {
		this._overLaysService.mainLayer.featuresFlow.subscribe(data =>{
			this.visibleFeatures = data;
			console.log(data)
		});
	}

	toggleSideNav() {
    	this.closeTdmapPanelSidenav.emit('close-tdmap-panel-sidenav');
  	}
}
