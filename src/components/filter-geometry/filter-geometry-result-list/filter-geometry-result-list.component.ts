import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { FilterGeometryAdapter } from "../../../services/FilterGeometryAdapter";
import { Observable } from "rxjs/Observable";
import { MapService } from "../../../services/MapService";
import { OverLaysService } from "../../../services/OverLaysService";
import { Subscription } from 'rxjs/Subscription';



@Component({
	selector: "filter-geometry-result-list",
	templateUrl: "./filter-geometry-result-list.component.html",
	styleUrls: ["./filter-geometry-result-list.component.css"]
})
export class FilterGeometryResultListComponent implements OnInit, OnDestroy {
	@Input() isActive: boolean;
	public filteredList: any[];
	public activeFilterLayerId: string;
	public avaliableFilterLayers: any[];
	public trackByFn = (index, item) => item.id;
	public filterSubscriber: Subscription;
	constructor(
		public filterGeometryAdapter: FilterGeometryAdapter,
		public MapService: MapService,
		public OverLaysService: OverLaysService
	) { }

	ngOnInit() {
		this.avaliableFilterLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions();
		this.filterSubscriber = this.filterGeometryAdapter.filteredLayerId.subscribe(layerIdAndData => {
			if (layerIdAndData && layerIdAndData.data) {
				this.filteredList = this.avaliableFilterLayers.filter(item => item.id === layerIdAndData.layerId ? item : false)[0].filteredList;
			}
		});
	}

	ngOnDestroy() {
		this.filterSubscriber.unsubscribe();
	}


	showItemOnMap(item) {
		let onLoadData = () => {
			this.OverLaysService.setTempSelectedFeature(this.activeFilterLayerId, item.id);
		};
		let onmoveEnd = () => {
			this.MapService.getMap().once("layer:load", onLoadData);
		};
		this.MapService.getMap().once("moveend", onmoveEnd);
		this.MapService.TDMapManager.updateMapPosition(L.Projection.SphericalMercator.unproject(L.point(item.center.x, item.center.y)), 16);
	}

	setResultListLayer(layerId) {
		this.activeFilterLayerId = layerId
	}
}
