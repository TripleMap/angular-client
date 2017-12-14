import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { FilterGeometryAdapter } from "../../../services/FilterGeometryAdapter";
import { Observable } from "rxjs/Observable";
import { MapService } from "../../../services/MapService";
@Component({
	selector: "filter-geometry-result-list",
	templateUrl: "./filter-geometry-result-list.component.html",
	styleUrls: ["./filter-geometry-result-list.component.css"]
})
export class FilterGeometryResultListComponent implements OnInit, OnDestroy {
	@Input() isActive: boolean;
	public filteredList: any[];
	constructor(
		public _filterGeometryAdapter: FilterGeometryAdapter,
		public _mapService: MapService
	) {}

	ngOnInit() {
		this._filterGeometryAdapter.filteredObjects.subscribe(data => {
			this.filteredList = data;
		});
	}

	ngOnDestroy() {
		this._filterGeometryAdapter.filteredObjects.unsubscribe();
	}

	showItemOnMap(item) {
		console.log(item);
	}
}
