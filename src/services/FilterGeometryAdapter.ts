import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from "@angular/common/http";
import { BaseLayersService } from "./BaseLayersService";
import { OverLaysService, LayersLinks, LayerSchema } from "./OverLaysService";
import { Subject } from "rxjs/Subject";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import "rxjs/add/operator/filter";

import { MatSnackBar } from '@angular/material';

interface AvaliableLayer {
	id: string;
	filteredList: any[];
	previousFilterParams: any;
}

const errorOnSave = (message) => {
	this.snackBar.open(message, null, {
		duration: 2000,
		panelClass: ['error-snack'],
		horizontalPosition: 'right'
	});
}

@Injectable()
export class FilterGeometryAdapter {
	public mainFlow: Subject<any>;
	public filteredLayerId: BehaviorSubject<any>;
	public filteredLayer: AvaliableLayer;
	public avaliableLayers: AvaliableLayer[];

	constructor(public http: HttpClient, public OverLaysService: OverLaysService, public snackBar: MatSnackBar) {
		this.mainFlow = new Subject();
		this.filteredLayerId = new BehaviorSubject(false);
		this.mainFlow
			.map(this.concatenateAllFilters)
			.filter(this.checkForEmptyFilters)
			.subscribe(this.updateLayerFilters);

		this.OverLaysService.layersChange.subscribe(change => {
			if (!change) return;
			this.avaliableLayers = this.OverLaysService.layersSchemas.map((item: LayerSchema) => ({
				id: item.id,
				filteredList: null,
				previousFilterParams: {}
			}));
		});
	};

	updateLayerFilters = requestParams => {
		this.http
			.post(LayersLinks.featuresFilterUrl(this.filteredLayer.id), { filterParams: requestParams })
			.subscribe((data: any[]) => {
				if (this.filteredLayer) {
					this.filteredLayer.filteredList = data;
					this.filteredLayerId.next({ layerId: this.filteredLayer.id, data: true });
				}
			}, (error: HttpErrorResponse) => {
				if (error.status <= 400) errorOnSave.call(this, 'Не удалось обработать фильтры');
			});
	};

	getLayerById = (id) => this.avaliableLayers.filter(item => item.id === id ? item : false)[0];

	concatenateAllFilters = filters => {
		if (!this.filteredLayer) return {};
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
				if (this.filteredLayer.previousFilterParams[key].length === 0) emptyCounter--;
			} else if (!this.filteredLayer.previousFilterParams[key]) {
				emptyCounter--;
			}
		}
		if (emptyCounter === 0) this.clearData();

		return emptyCounter !== 0;
	};

	concatenateTableFilters(columnData, filterValue, layer) {
		if (layer.previousFilterParams) {
			this.http
				.post(LayersLinks.featuresFilterUrl(this.filteredLayer.id), layer.previousFilterParams)
				.subscribe((data: any[]) => {
					if (this.filteredLayer) this.filteredLayer.filteredList = data;
					this.filteredLayerId.next({ layerId: this.filteredLayer.id, data: true });
				}, (error: HttpErrorResponse) => {
					if (error.status <= 400) errorOnSave.call(this, 'Не удалось обработать фильтры');
				});
		}
	};
}
