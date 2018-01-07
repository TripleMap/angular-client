import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BaseLayersService } from "./BaseLayersService";
import { OverLaysService } from "./OverLaysService";

import { Subject } from "rxjs/Subject";
@Injectable()
export class FilterGeometryAdapter {
	public mainFlow: Subject<any>;
	public filteredObjects: Subject<any>;
	public filters: object;
	constructor(public _http: HttpClient) {
		this.mainFlow = new Subject();
		this.filters = {};
		this.filteredObjects = new Subject();
		this.mainFlow
			.map(this.concatenateAllFilters)
			.subscribe(this.updateLayerFilters);
	}

	updateLayerFilters = requestParams => {
		this._http
			.post("api/zusklads/filtered", { params: requestParams })
			.subscribe(data => this.filteredObjects.next(data));
	};


	concatenateAllFilters = filters => {
		for (let key in filters) {
			this.filters[key] = filters[key];
		}

		return this.filters;
	};

	clearData = () => this.filteredObjects.next([]);
}
