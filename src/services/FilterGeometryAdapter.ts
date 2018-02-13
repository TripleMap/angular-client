import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { BaseLayersService } from "./BaseLayersService";
import { OverLaysService } from "./OverLaysService";

import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/filter";
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
			.filter(this.checkForEmptyFilters)
			.subscribe(this.updateLayerFilters);

	}

	updateLayerFilters = requestParams => {
		this._http
			.post(this.filteredLayer.featureFilterUrl, requestParams)
			.subscribe(data => this.filteredObjects.next({ layerId: this.filteredLayer.id, data }));
	};


	concatenateAllFilters = filters => {
		let params = new HttpParams()
		for (let key in filters) {
			this.filters[key] = filters[key];
		}
		return this.filters;
	};

	clearData = () => this.filteredObjects.next(null);

	setFilteredLayer(layer) {
		this.filteredLayer = layer;
	}

	checkForEmptyFilters = () => {
		let emptyCounter = Object.keys(this.filters).length
		for (let key in this.filters) {
			if ((key === 'survey' || key === 'segmented') && this.filters[key]) {
				emptyCounter--;
			} else if (key === 'squareUnit') {
				emptyCounter--;
			} else if (!this.filters[key]) {
				emptyCounter--;
			}

		}
		if (emptyCounter === 0) {
			this.clearData();
		}

		return emptyCounter !== 0;
	}
}
