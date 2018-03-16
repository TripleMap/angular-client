import { Component, Output, Input, EventEmitter, ViewChild, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChildren, NgZone, ChangeDetectionStrategy } from "@angular/core";
import { FormControl } from '@angular/forms';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';
import { _isNumberValue } from '@angular/cdk/coercion';
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";
import { Subject } from 'rxjs/subject'
import { Observable } from 'rxjs/observable'
import 'rxjs/add/operator/debounceTime.js';
import { Subscription } from "rxjs/Subscription";

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
	featuresInfoUrl: string;
	schemaInfoUrl: string;
	featuresFilterUrl: string;
	data: any;
	filteredList: any[];
	visibleFeatures: any[];
	tableFilterColumnsData: { column: string; values: any; }[];
	showOnlyFiltered: boolean;
	showOnlySelected: boolean;
}

@Component({
	selector: "td-map-panel",
	templateUrl: "./td-map-panel.component.html",
	styleUrls: ["./td-map-panel.component.css"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TdMapPanelComponent implements AfterViewInit, OnDestroy {
	@Input() public tdMapPanel: boolean;
	@Output() public closeTdmapPanelSidenav: EventEmitter<string> = new EventEmitter<string>();
	@ViewChild(MatSort) sort: MatSort;
	@ViewChild('sortVisibleFeaturesPerPage') sortVisibleFeaturesPerPage: MatSort;
	@ViewChildren('table', { read: ElementRef }) table;
	public activeLayer: AvaliableLayer;
	public avaliableLayers: AvaliableLayer[];
	public inspectLayerAttributeTable = new FormControl();
	public trackByFn = (index, item) => item.id;

	public subscriptions: object = {};
	public changeDetectionOnserver: Observable<any>;
	public changeDetectionTick: any;

	constructor(
		public OverLaysService: OverLaysService,
		public http: HttpClient,
		public MapService: MapService,
		public FilterGeometryAdapter: FilterGeometryAdapter,
		public changeDetectorRef: ChangeDetectorRef
	) {
		this.changeDetectionTick = new Subject();
		this.subscriptions[`subscriberChangeDetectionTick`] = this.changeDetectionTick.asObservable().debounceTime(100).subscribe(data => {
			this.changeDetectorRef.detectChanges();
			if (this.activeLayer) this.updateTableData(this.activeLayer, false);
		});
	}

	ngAfterViewInit() {
		this.avaliableLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions().map((item: AvaliableLayer) => {
			item.visibleFeaturesPerPage = new MatTableDataSource();
			item.selectedFeatures = new SelectionModel(true);
			item.data = [];
			item.showOnlyFiltered = true;
			item.showOnlySelected = false;
			item.tableFilterColumnsData = [];
			let onChangeSelectedSubscriber = item.selectedFeatures.onChange.subscribe(data => {
				this.updateMapLayerOnFeatureSelectionChange(data, item);
			});
			this.subscriptions[`${item.id}_updateMapLayerOnFeatureSelectionChange`] = onChangeSelectedSubscriber;
			this.subscribeMapLayersOnFeatureSelectionsChange(item);
			console.log(item)
			return item;
		});

		this.avaliableLayers.map(layer => this.getColumnNamesForLayer(layer));

		this.subscriptions[`OverLaysService_visibleLayers`] = this.inspectLayerAttributeTable.valueChanges.subscribe(avaliableLayerId => {
			if (avaliableLayerId && avaliableLayerId !== 'None') {
				this.activeLayer = this.avaliableLayers.filter(item => item.id === avaliableLayerId ? item : false)[0];
				this.getColumnDataForLayer(this.activeLayer, false);
			}

			this.changeDetectorRef.detectChanges();
			if (!this.table.first) return;

			let scrollElement = document.createElement('div');
			scrollElement.classList.add('table-sroll-wrapper');
			this.table.first.nativeElement.appendChild(scrollElement);
		});

		this.subscriptions[`OverLaysService_visibleLayers`] = this.OverLaysService.visibleLayers.subscribe(layerIdsUpdate => {
			let shouldUpdate = true;
			if (!layerIdsUpdate.length) {
				this.inspectLayerAttributeTable.setValue('None');
				this.activeLayer = null;
				shouldUpdate = false;
			}
			this.avaliableLayers.map(item => layerIdsUpdate.indexOf(item.id) !== -1 ? item.visible = true : item.visible = false);
			for (let i = 0; i < layerIdsUpdate.length; i++) {
				if (this.activeLayer && layerIdsUpdate[i] === this.activeLayer.id) shouldUpdate = false;
			}

			if (shouldUpdate) this.inspectLayerAttributeTable.setValue(layerIdsUpdate[0]);

			this.changeDetectorRef.detectChanges();
		});

		this.subscriptions[`filterSubscriber`] = this.FilterGeometryAdapter.filteredLayerId.subscribe(layerIdAndData => {
			if (layerIdAndData && layerIdAndData.layerId) {
				let inspectLayer = this.avaliableLayers.filter(layer => layer.id === layerIdAndData.layerId ? layer : false)[0]
				this.updateTableData(inspectLayer, false);
			}
		});
	}

	ngOnDestroy() {
		for (const key in this.subscriptions) {
			if (this.subscriptions.hasOwnProperty(key)) this.subscriptions[key].unsubscribe();
		}
		this.changeDetectorRef.detach();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.tdMapPanel && this.activeLayer) this.getColumnDataForLayer(this.activeLayer, false);
	}

	getColumnDataForLayer(layer, force) {
		this.http.get(layer.featuresInfoUrl).subscribe(data => { layer.data = data; this.updateTableData(layer, false) });
	}

	compareOnFilterList(layer, data) {
		let filterDictionary = {};
		let filterIndex;
		let filterLen = layer.filteredList ? layer.filteredList.length : null;
		if (filterLen !== null) {
			for (let filterIndex = 0; filterIndex < filterLen; filterIndex++) {
				filterDictionary[layer.filteredList[filterIndex].id] = 1;
			}
		}

		let selectedFeaturesDictionary = {};
		let index, dataLen = data.length, result = [];

		if ((layer.showOnlyFiltered && filterLen !== null) || (layer.showOnlySelected && layer.selectedFeatures.selected)) {
			let selectedIndex, selectedLength = layer.selectedFeatures.selected.length;
			for (let selectedIndex = 0; selectedIndex < selectedLength; selectedIndex++) {
				selectedFeaturesDictionary[layer.selectedFeatures.selected[selectedIndex]] = 1;
			}
			for (index = 0; index < dataLen; index++) {
				if (layer.showOnlyFiltered && layer.showOnlySelected && filterDictionary[data[index].id] && selectedFeaturesDictionary[data[index].id]) {
					data[index].filteFlag = false;
					result.push(data[index]);
				} else if (layer.showOnlyFiltered && !layer.showOnlySelected && filterDictionary[data[index].id]) {
					data[index].filteFlag = false;
					result.push(data[index]);
				} else if (!layer.showOnlyFiltered && layer.showOnlySelected && selectedFeaturesDictionary[data[index].id]) {
					data[index].filteFlag = false;
					result.push(data[index]);
				} else {
					data[index].filteFlag = true;
				}
			}
		}

		if (!(layer.showOnlyFiltered && filterLen !== null) && !(layer.showOnlySelected && layer.selectedFeatures.selected)) {
			for (index = 0; index < dataLen; index++) {
				data[index].filteFlag = false;
			}
			result = data;
		}
		return result;
	}

	updateTableData(layer, onScroll) {
		if (!this.table || !this.table.first) return;
		let tableRef = this.table.first.nativeElement;
		let inspectLayer = layer || this.activeLayer;
		let data = inspectLayer.data;
		if (!tableRef || !inspectLayer || !data) return;
		let filteredData = this.compareOnFilterList(layer, data)
		layer.visibleFeatures = filteredData;
		const tableViewHeight = tableRef.offsetHeight;
		const tableScrollHeight = tableRef.scrollHeight;
		const scrollLocation = tableRef.scrollTop;
		let rowHeigth = 48;
		if (!onScroll) {
			let scrollElement = tableRef.getElementsByClassName('table-sroll-wrapper')[0];
			scrollElement.style.height = filteredData.length * rowHeigth + 'px';
		}
		let elementPreView = Math.ceil(tableViewHeight / rowHeigth);
		let firstElement = Math.floor(scrollLocation / rowHeigth);
		inspectLayer.visibleFeaturesPerPage.data = filteredData.slice(firstElement, firstElement + elementPreView);
		let delta = scrollLocation > 56 ? 1 : 0;

		this.changeDetectorRef.detectChanges();
		let matRows = tableRef.getElementsByTagName('mat-row');
		for (let i = 0; i < matRows.length; i++) {
			matRows[i].style.position = 'absolute';
			matRows[i].style.zIndex = 0;
			matRows[i].style.transform = `translate3d(0,${(firstElement + i - delta) * rowHeigth}px,0)`;
		}

	}

	getColumnNamesForLayer(layer) {
		this.http.get(layer.schemaInfoUrl).subscribe((data: { properties: object; }) => {
			layer.columns = [];
			layer.displayedColumns = ['select'];
			for (let key in data.properties) {
				if (key !== 'id' && key !== 'geometry') {
					layer.columns.push({
						name: key,
						label: data.properties[key].description || key,
						columnType: data.properties[key].columnType || 'findSimple',
						columnValues: data.properties[key].values || null,
						avaliableProperties: data.properties[key].avaliableProperties || null,
						currentProperties: data.properties[key].currentProperties || null,
						columnFilters: [],
						rowWidth: data.properties[key].columnType === 'findBoolean' ? 140 : 200
					});
					layer.displayedColumns.push(key);
				}
			}
			this.changeDetectorRef.markForCheck();
		});
	}

	changeColumnSize = (column, size) => column.rowWidth = size;
	toggleSideNav = () => this.closeTdmapPanelSidenav.emit('close-tdmap-panel-sidenav');
	isAllSelected() {
		if (!this.activeLayer) {
			return false;
		}

		const numSelected = this.activeLayer.selectedFeatures.selected.length;
		const numRows = this.activeLayer.visibleFeatures ? this.activeLayer.visibleFeatures.length : null;
		return numSelected == numRows;
	}

	masterToggle() {
		if (this.isAllSelected()) {
			this.activeLayer.selectedFeatures.clear();
			const maplayer = this.OverLaysService.getLayerById(this.activeLayer.id);
			if (maplayer && maplayer.options.selectable) maplayer.clearSelections();
		} else {
			let i, len = this.activeLayer.data.length;
			for (let i = 0; i < len; i++) {
				if (!this.activeLayer.data[i].filteFlag) this.activeLayer.selectedFeatures.select(this.activeLayer.data[i].id);
			}
		}
		this.changeDetectionTick.next(0);
	}

	subscribeMapLayersOnFeatureSelectionsChange(layer) {
		const maplayer = this.OverLaysService.getLayerById(layer.id);
		if (!maplayer && !maplayer.options.selectable) return;

		let subscriber = maplayer.changeSelection.subscribe(featureSelectionsEvent => {
			featureSelectionsEvent.added.map(featureId => { if (!layer.selectedFeatures.isSelected(featureId)) { layer.selectedFeatures.select(featureId); this.changeDetectionTick.next(0); } });
			featureSelectionsEvent.removed.map(featureId => { if (layer.selectedFeatures.isSelected(featureId)) { layer.selectedFeatures.deselect(featureId); this.changeDetectionTick.next(1); } });
		});
		this.subscriptions[`${layer.id}_subscribeMapLayersOnFeatureSelectionsChange`] = subscriber;
	}

	updateMapLayerOnFeatureSelectionChange(selectionChangeDataEvent, layer) {
		const mapLayer = this.OverLaysService.getLayerById(layer.id);
		if (!mapLayer && !mapLayer.options.selectable) return;
		selectionChangeDataEvent.added.map(item => { if (!mapLayer.isInSelections(item)) mapLayer.addSelections(item, false, true); });
		selectionChangeDataEvent.removed.map(item => { if (mapLayer.isInSelections(item)) mapLayer.removeSelectionLayer(item); });
	}


	linkDetector = (text: string) => (text && typeof text === 'string' && text.indexOf('http') > -1) ? true : false;

	sortData(e, layer) {
		const sortingDataAccessor = (data, sortHeaderId: string) => {
			const value: any = data[sortHeaderId];
			return _isNumberValue(value) ? Number(value) : value;
		}
		const active = e.active;
		const direction = e.direction;
		let data = layer.data;
		if (!active || direction == '') return;

		data.sort((a, b) => {
			let valueA = sortingDataAccessor(a, active);
			let valueB = sortingDataAccessor(b, active);
			let comparatorResult = 0;
			if (valueA && valueB) {
				if (valueA > valueB) {
					comparatorResult = 1;
				} else if (valueA < valueB) {
					comparatorResult = -1;
				}
			} else if (valueA) {
				comparatorResult = 1;
			} else if (valueB) {
				comparatorResult = -1;
			}

			return comparatorResult * (direction == 'asc' ? 1 : -1);
		});

		this.updateTableData(layer, false);
	}


	onColumnFilterChange(e, layer) {
		let valuesIsEmpty = false;
		let isExist = false;
		let index;
		if (!e.filterValues) {
			valuesIsEmpty = true;
		}

		for (let i = 0; i < layer.tableFilterColumnsData.length; i++) {
			if (layer.tableFilterColumnsData[i].column === e.columnData.name) {
				isExist = true;
				index = i;
			}
		}

		if (isExist && !valuesIsEmpty) {
			layer.tableFilterColumnsData[index].values = e.filterValues
		} else if (isExist && valuesIsEmpty) {
			layer.tableFilterColumnsData.splice(index, 1);
		} else if (!isExist && !valuesIsEmpty) {
			layer.tableFilterColumnsData.push({
				column: e.columnData.name,
				values: e.filterValues
			});
		}
		this.FilterGeometryAdapter.setFilteredLayer(layer.id);
		this.FilterGeometryAdapter.mainFlow.next({
			sideFilters: layer.tableFilterColumnsData
		});
	}

	hideOrShowColumns(columnName, layer) {
		if (!layer) return;
		if (!layer.displayedColumns && !layer.displayedColumns.length) return;
		let index;
		for (index = 0; index < layer.columns.length; index++) {
			if (columnName === layer.columns[index].name) {
				break;
			}
		}
		if (index === undefined) return;
		index++;

		if (layer.displayedColumns.indexOf(columnName) === -1) {
			layer.displayedColumns.splice(index, 0, columnName);
		} else {
			layer.displayedColumns.splice(layer.displayedColumns.indexOf(columnName), 1);
		}

		this.changeDetectorRef.detectChanges();
	}

	columnIsVisible(columnName) {
		if (!this.activeLayer.displayedColumns || !this.activeLayer.displayedColumns.length) return false;
		return this.activeLayer.displayedColumns.filter(item => columnName === item ? item : false)[0];
	}
}