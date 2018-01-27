import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { FilterGeometryAdapter } from "../../../services/FilterGeometryAdapter";
import { Observable } from "rxjs/Observable";
import { MapService } from "../../../services/MapService";
import { SelectedFeatureService } from "../../../services/SelectedFeatureService";
import { OverLaysService } from "../../../services/OverLaysService";
@Component({
	selector: "filter-geometry-result-list",
	templateUrl: "./filter-geometry-result-list.component.html",
	styleUrls: ["./filter-geometry-result-list.component.css"]
})
export class FilterGeometryResultListComponent implements OnInit, OnDestroy {
	@Input() isActive: boolean;
	public filteredList: any[];
	public activeFilterLayer: { id: string; labelName: string; visible: boolean; };
	public avaliableFilterLayers: { id: string; labelName: string; visible: boolean; }[];
	constructor(
		public _filterGeometryAdapter: FilterGeometryAdapter,
		public MapService: MapService,
		public _selectedFeatureService: SelectedFeatureService,
		public OverLaysService: OverLaysService
	) {
		// TEMP
		this.avaliableFilterLayers = this.OverLaysService.getLayerIdsAndLabelNames();
		this.activeFilterLayer = this.avaliableFilterLayers[0];
	}

	ngOnInit() {
		this._filterGeometryAdapter.filteredObjects.subscribe(data => {
			this.filteredList = data;
		});
	}

	ngOnDestroy() {
		this._filterGeometryAdapter.filteredObjects.unsubscribe();
	}

	showItemOnMap(item) {
		let onLoadData = () => {
			this.OverLaysService.setTempSelectedFeature(this.activeFilterLayer.id, item.id);
		};
		let onmoveEnd = () => {
			this.MapService.getMap().once("layer:load", onLoadData);
		};
		this.MapService.getMap().once("moveend", onmoveEnd);
		this.MapService.TDMapManager.updateMapPosition(L.Projection.SphericalMercator.unproject(L.point(item.center.x, item.center.y)), 16);
	}
}
