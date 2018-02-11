import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { BaseLayersService } from "./BaseLayersService";
import { OverLaysService } from "./OverLaysService";

import { Subject } from "rxjs/Subject";
@Injectable()
export class FilterGeometryAdapter {
	public mainFlow: Subject<any>;
	public filteredObjects: Subject<any>;
	public filters: object;
	public filteredLayer: any;

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
			.post(this.filteredLayer.featureFilterUrl, requestParams)
			.subscribe(data => this.filteredObjects.next(data));
	};


	concatenateAllFilters = filters => {
		let params = new HttpParams()
		for (let key in filters) {
			this.filters[key] = filters[key];
		}

		for (let key in this.filters) {
			if (key === 'spatialFilter') {
				params = params.set(key, JSON.stringify(this.filters[key]));
			} else {
				params = params.set(key, this.filters[key]);
			}
		}

		return this.filters;
	};

	clearData = () => this.filteredObjects.next([]);

	setFilteredLayer(layer) {
		this.filteredLayer = layer;
	}
}
