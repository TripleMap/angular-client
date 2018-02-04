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
			.get("api/parcels/GetFeaturesByFilters", { params: requestParams })
			.subscribe(data => this.filteredObjects.next(data));
	};


	concatenateAllFilters = filters => {
		let params = new HttpParams()
		for (let key in filters) {
			this.filters[key] = filters[key];
		}

		for (let key in this.filters) {
			params = params.set(key, JSON.stringify(this.filters[key]));
		}

		return params;
	};

	clearData = () => this.filteredObjects.next([]);
}
