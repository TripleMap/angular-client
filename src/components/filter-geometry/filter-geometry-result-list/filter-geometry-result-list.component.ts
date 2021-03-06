import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { FilterGeometryAdapter } from "../../../services/FilterGeometryAdapter";
import { Subscription } from "rxjs";
import { MapService } from "../../../services/MapService";
import { OverLaysService, LayerSchema } from "../../../services/OverLaysService";



@Component({
	selector: "filter-geometry-result-list",
	templateUrl: "./filter-geometry-result-list.component.html",
	styleUrls: ["./filter-geometry-result-list.component.css"]
})
export class FilterGeometryResultListComponent implements OnInit, OnDestroy {
	@Input() isActive: boolean;
	public filteredList: any[];
	public activeFilterLayerId: string;
	public avaliableFilterLayers: LayerSchema[];
	public trackByFn = (index, item) => item.id;
	public filterSubscriber: Subscription;
	constructor(
		public filterGeometryAdapter: FilterGeometryAdapter,
		public MapService: MapService,
		public OverLaysService: OverLaysService
	) { }

	ngOnInit() {
		this.avaliableFilterLayers = this.OverLaysService.layersSchemas;
		this.filterSubscriber = this.filterGeometryAdapter.filteredLayerId.subscribe(layerIdAndData => {
			if (layerIdAndData && layerIdAndData.data) {
				let layer = this.filterGeometryAdapter.getLayerById(layerIdAndData.layerId);
				if (!layer) return;
				this.filteredList = layer.filteredList;
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
