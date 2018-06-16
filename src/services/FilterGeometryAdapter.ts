import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { OverLaysService, LayersLinks, LayerSchema } from "./OverLaysService";
import { Subject, BehaviorSubject } from "rxjs";
import { MessageService } from './MessageService';

interface AvaliableLayer {
	id: string;
	filteredList: any[];
	showOnlySelected: boolean;
	previousFilterParams: any;
}


@Injectable()
export class FilterGeometryAdapter {
	public mainFlow: Subject<any>;
	public filteredLayerId: BehaviorSubject<any>;
	public filteredLayer: AvaliableLayer;
	public avaliableLayers: AvaliableLayer[];

	constructor(
		public http: HttpClient,
		public OverLaysService: OverLaysService,
		public MessageService: MessageService
	) {
		this.mainFlow = new Subject();
		this.filteredLayerId = new BehaviorSubject(false);
		this.filteredLayerId.subscribe(this.onFilterListChange);

		this.mainFlow
			.map(this.concatenateAllFilters)
			.filter(this.checkForEmptyFilters)
			.subscribe(this.updateLayerFilters);

		this.OverLaysService.layersChange.subscribe(change => {
			if (!change) return;
			this.avaliableLayers = this.OverLaysService.layersSchemas.map((item: LayerSchema) => ({
				id: item.id,
				filteredList: null,
				showOnlySelected: false,
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
				if (error.status <= 400) this.MessageService.errorMessage.call(this, 'Не удалось обработать фильтры');
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


	setOnlySelected(id, showOnlySelected) {
		let inspectLayer = this.getLayerById(id);
		if (!inspectLayer) return;
		inspectLayer.showOnlySelected = showOnlySelected;
		if (showOnlySelected) {
			let maplayer = this.OverLaysService.getLeafletLayerById(id);
			let selectedFeatures = maplayer.selections.selectedFeatures.selected;
			this.refreshFilteredIds(id, selectedFeatures);
		} else {
			if (inspectLayer.filteredList) {
				this.refreshFilteredIds(id, inspectLayer.filteredList.map(item => item.id));
			} else {
				this.OverLaysService.removeFilteredIds(id);
			}
		}
	}

	onFilterListChange = (layerIdAndData) => {
		let inspectLayer = layerIdAndData ? this.getLayerById(layerIdAndData.layerId) : false;
		if (this.filteredLayer && inspectLayer && layerIdAndData && layerIdAndData.data) {
			let itemsToFilter;
			let maplayer = this.OverLaysService.getLeafletLayerById(this.filteredLayer.id);

			let selectedFeatures = maplayer.selections.selectedFeatures.selected;
			if (inspectLayer.showOnlySelected) {
				itemsToFilter = inspectLayer.filteredList
					.map(item => item.id)
					.filter(item => selectedFeatures.indexOf(item) !== -1 ? item : false);
			} else {
				itemsToFilter = inspectLayer.filteredList.map(item => item.id)
			}
			if (inspectLayer.filteredList) {
				selectedFeatures.map(item => {
					if (itemsToFilter.indexOf(item) === -1) maplayer.selections.selectedFeatures.deselect(item);
				});
			}

			this.refreshFilteredIds(this.filteredLayer.id, itemsToFilter);
		} else {
			if (this.filteredLayer && this.filteredLayer.id) this.OverLaysService.removeFilteredIds(this.filteredLayer.id);
		}
	};

	refreshFilteredIds(layerId, data) {
		this.OverLaysService.refreshFilteredIds(layerId, data);
	}
}
