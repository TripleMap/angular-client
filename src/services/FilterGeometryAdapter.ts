import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { BaseLayersService } from "./BaseLayersService";
import { OverLaysService } from "./OverLaysService";
import { Subject } from "rxjs/Subject";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import "rxjs/add/operator/filter";


interface AvaliableLayer {
	id: string;
	labelName: string;
	visible: boolean;
	displayedColumns: string[];
	columns: any[];
	selectedFeatures: any;
	total: number;
	visibleFeaturesPerPage: any;
	featureInfoUrl: string;
	schemaInfoUrl: string;
	featureFilterUrl: string;
	data: any;
	filteredList: any[];
	previousFilterParams: any;
}

@Injectable()
export class FilterGeometryAdapter {
	public mainFlow: Subject<any>;
	public filteredLayerId: BehaviorSubject<any>;
	public filteredLayer: any;
	public avaliableLayers: any;

	constructor(public _http: HttpClient, public OverLaysService: OverLaysService) {
		this.mainFlow = new Subject();
		this.filteredLayerId = new BehaviorSubject(false);
		this.mainFlow
			.map(this.concatenateAllFilters)
			.filter(this.checkForEmptyFilters)
			.subscribe(this.updateLayerFilters);

		this.avaliableLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions().map((item: AvaliableLayer) => {
			item.previousFilterParams = {}
			item.filteredList = null;
			return item;
		});

	};

	updateLayerFilters = requestParams => {
		this._http
			.post(this.filteredLayer.featureFilterUrl, requestParams)
			.subscribe((data: any[]) => {
				if (this.filteredLayer) {
					this.filteredLayer.filteredList = data;
					this.filteredLayerId.next({ layerId: this.filteredLayer.id, data: true });
				}
			});
	};


	concatenateAllFilters = filters => {
		if (!this.filteredLayer) {
			return {};
		}
		for (let key in filters) {
			this.filteredLayer.previousFilterParams[key] = filters[key];
		}
		return this.filteredLayer.previousFilterParams;
	};

	clearData = () => {
		this.filteredLayer ? this.filteredLayer.filteredList = null : '';
		this.filteredLayer ? this.filteredLayerId.next({ layerId: this.filteredLayer.id, data: false }) : this.filteredLayerId.next(null);
	};

	setFilteredLayer(layerId) {
		this.filteredLayer = this.avaliableLayers.filter(item => item.id === layerId ? item : false)[0];
	};

	checkForEmptyFilters = () => {
		let emptyCounter = Object.keys(this.filteredLayer.previousFilterParams).length
		for (let key in this.filteredLayer.previousFilterParams) {
			if ((key === 'survey' || key === 'segmented') && this.filteredLayer.previousFilterParams[key]) {
				emptyCounter--;
			} else if (key === 'squareUnit') {
				emptyCounter--;
			} else if (key === 'sideFilters') {
				if (this.filteredLayer.previousFilterParams[key].length === 0) {
					emptyCounter--;
				}
			} else if (!this.filteredLayer.previousFilterParams[key]) {
				emptyCounter--;
			}

		}
		if (emptyCounter === 0) {
			this.clearData();
		}

		return emptyCounter !== 0;
	};

	concatenateTableFilters(columnData, filterValue, layer) {
		if (layer.previousFilterParams) {
			this._http
				.post(this.filteredLayer.featureFilterUrl, layer.previousFilterParams)
				.subscribe((data: any[]) => {
					if (this.filteredLayer) this.filteredLayer.filteredList = data;
					this.filteredLayerId.next({ layerId: this.filteredLayer.id, data: true });
				});
		}
	};
}
