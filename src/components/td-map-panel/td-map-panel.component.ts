import { Component, Output, Input, EventEmitter, ViewChild, SimpleChanges, OnDestroy, ChangeDetectorRef, ElementRef, ViewChildren, ChangeDetectionStrategy, QueryList, OnInit } from "@angular/core";
import { FormControl } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { OverLaysService, LayerSchema, LayersLinks } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";
import { PkkInfoService } from '../../services/PkkInfoService'
import { MatSort, MatTableDataSource, MatDialog, MatDialogConfig } from '@angular/material';
import { _isNumberValue } from '@angular/cdk/coercion';
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";
import 'rxjs/add/operator/debounceTime.js';
import { MultipleFeatureEditComponent } from '../multiple-feature-edit/multiple-feature-edit.component';
import { AttributeDataTableFilterComponent } from './attribute-data-table-filter/attribute-data-table-filter.component';
import { ContextMenuComponent } from './context-menu/context-menu.component'

interface AvaliableLayer {
	id: string;
	labelName: string;
	visible: boolean;
	displayedColumns: string[];
	columns: any[];
	selectedFeatures: any;
	total: number;
	visibleFeaturesPerPage: any;
	data: any;
	visibleFeatures: any[];
	tableFilterColumnsData: { column: string; values: any; }[];
	showOnlySelected: boolean;
}

@Component({
	selector: "td-map-panel",
	templateUrl: "./td-map-panel.component.html",
	styleUrls: ["./td-map-panel.component.css"],
	changeDetection: ChangeDetectionStrategy.Default
})
export class TdMapPanelComponent implements OnInit, OnDestroy {
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

	constructor(
		public OverLaysService: OverLaysService,
		public http: HttpClient,
		public MapService: MapService,
		public PkkInfoService: PkkInfoService,
		public FilterGeometryAdapter: FilterGeometryAdapter,
		public MatDialog: MatDialog,
		public changeDetection: ChangeDetectorRef
	) { }

	ngOnInit() {
		this.OverLaysService.layersChange.subscribe(change => {
			if (!change) return;
			this.avaliableLayers = this.OverLaysService.layersSchemas.map((item: LayerSchema) => {
				let mapLayer = this.OverLaysService.getLeafletLayerById(item.id);
				let avaliableLayer = {
					id: item.id,
					labelName: item.layer_schema.labelName,
					visible: item.layer_schema.options.visible,
					displayedColumns: [],
					columns: [],
					selectedFeatures: mapLayer.selections.selectedFeatures,
					total: 0,
					visibleFeaturesPerPage: new MatTableDataSource(),
					data: [],
					visibleFeatures: [],
					tableFilterColumnsData: [],
					showOnlySelected: false
				}
				mapLayer.selections.selectedFeatures.onChange.subscribe(featureSelectionsEvent => {
					this.updateTableData(this.activeLayer, true);
					this.changeDetection.detectChanges();
				});
				return avaliableLayer;
			});

			this.avaliableLayers.map(layer => this.getColumnNamesForLayer(layer));
		});


		this.subscriptions[`OverLaysService_inspectLayerAttributeTable`] = this.inspectLayerAttributeTable.valueChanges.subscribe(avaliableLayerId => {
			if (avaliableLayerId && avaliableLayerId !== 'None') {
				this.activeLayer = this.avaliableLayers.filter(item => item.id === avaliableLayerId ? item : false)[0];
				this.getColumnDataForLayer(this.activeLayer, false);
			}
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
		});

		this.subscriptions[`filterSubscriber`] = this.FilterGeometryAdapter.filteredLayerId.subscribe(layerIdAndData => {
			if (layerIdAndData && layerIdAndData.layerId) {
				let inspectLayer = this.avaliableLayers.filter(layer => layer.id === layerIdAndData.layerId ? layer : false)[0]
				this.updateTableData(inspectLayer, false);
			}
		});

		this.subscriptions['newInstanceCreatedSubscription'] = this.PkkInfoService.newInstanceCreated.subscribe(data => this.addLayerData(data))
	}

	ngOnDestroy() {
		for (const key in this.subscriptions) {
			if (this.subscriptions.hasOwnProperty(key)) this.subscriptions[key].unsubscribe();
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.tdMapPanel && this.activeLayer) this.getColumnDataForLayer(this.activeLayer, false);
	}

	getColumnDataForLayer(layer, force) {
		this.http.get(LayersLinks.featuresEdit.getAllInfo(layer.id)).subscribe(data => {
			layer.data = data;
			this.updateTableData(layer, false)
		});
	}

	addLayerData(newInstanceData: { layerId: string; instance: any; }) {
		if (!newInstanceData) return;
		this.http.get(LayersLinks.featuresEdit.getInfo(newInstanceData.layerId, newInstanceData.instance.properties.id)).subscribe(data => {
			let layer = this.avaliableLayers.filter(layer => layer.id === newInstanceData.layerId ? layer : false)[0];
			layer.data.push(data);
			this.updateTableData(layer, false);
		});
	}

	setOnlySelected(activeLayer: AvaliableLayer) {
		this.FilterGeometryAdapter.setOnlySelected(activeLayer.id, activeLayer.showOnlySelected);
		this.updateTableData(activeLayer, false)
	}

	compareOnFilterList(layer: AvaliableLayer, data) {
		let filterDictionary = {};
		let filterIndex;
		let filterLayer = this.FilterGeometryAdapter.getLayerById(layer.id);
		let filterLen = filterLayer && filterLayer.filteredList ? filterLayer.filteredList.length : null;
		if (filterLen !== null) {
			for (let filterIndex = 0; filterIndex < filterLen; filterIndex++) {
				filterDictionary[filterLayer.filteredList[filterIndex].id] = 1;
			}
		}

		let selectedFeaturesDictionary = {};
		let index, dataLen = data.length, result = [];
		if (filterLen !== null || layer.showOnlySelected) {
			let selectedIndex, selectedLength = layer.selectedFeatures.selected.length;
			for (let selectedIndex = 0; selectedIndex < selectedLength; selectedIndex++) {
				selectedFeaturesDictionary[layer.selectedFeatures.selected[selectedIndex]] = 1;
			}

			for (index = 0; index < dataLen; index++) {
				if (layer.showOnlySelected) {

					if (filterLen && !filterDictionary[data[index].id] && selectedFeaturesDictionary[data[index].id]) {
						selectedFeaturesDictionary[data[index].id] = false;
					}

					if (selectedFeaturesDictionary[data[index].id]) {
						data[index].filteFlag = false;
						result.push(data[index]);
					} else if (!filterDictionary[data[index].id] && !selectedFeaturesDictionary[data[index].id]) {
						data[index].filteFlag = true;
					}
				} else if (!layer.showOnlySelected) {
					if (filterDictionary[data[index].id]) {
						data[index].filteFlag = false;
						result.push(data[index]);
					} else if (!filterDictionary[data[index].id]) {
						data[index].filteFlag = true;
					}
				} else {
					data[index].filteFlag = true;
				}
			}
		}

		if (filterLen === null && !layer.showOnlySelected) {
			for (index = 0; index < dataLen; index++) {
				data[index].filteFlag = false;
			}
			result = data;
		}
		return result;
	}

	updateTableData(layer, onScroll) {

		const throttle = () => {
			if (!this.table || !this.table.first) return;
			let tableRef = this.table.first.nativeElement;
			let inspectLayer = layer || this.activeLayer;
			let data = inspectLayer.data;
			if (!tableRef || !inspectLayer || !data) return;
			let filteredData = this.compareOnFilterList(layer, data)
			layer.visibleFeatures = filteredData;
			const tableViewHeight = tableRef.offsetHeight;
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
			this.changeDetection.detectChanges();
			let matRows = tableRef.getElementsByTagName('mat-row');
			for (let i = 0; i < matRows.length; i++) {
				matRows[i].style.position = 'absolute';
				matRows[i].style.zIndex = 0;
				matRows[i].style.transform = `translate3d(0,${(firstElement + i - delta) * rowHeigth}px,0)`;
			}
		}

		if (!onScroll) {
			setTimeout(() => {
				throttle.call(this);
			}, 50);
		} else {
			throttle();
		}

	}

	getColumnNamesForLayer(layer: AvaliableLayer) {
		this.http.get(LayersLinks.schemaInfoUrl(layer.id)).subscribe((data: { properties: object; }) => {
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
		});
	}

	changeColumnSize = (column, size) => { column.rowWidth = size; }
	toggleSideNav = () => this.closeTdmapPanelSidenav.emit('close-tdmap-panel-sidenav');
	isAllSelected() {
		if (!this.activeLayer) return false;

		const numSelected = this.activeLayer.selectedFeatures.selected.length;
		const numRows = this.activeLayer.visibleFeatures ? this.activeLayer.visibleFeatures.length : null;
		return numSelected == numRows;
	}

	toggleFeatureSelect(layer, id) {
		layer.selectedFeatures.toggle(id);
		this.updateTableData(layer, true);
	}

	masterToggle() {
		if (this.isAllSelected()) {
			this.activeLayer.selectedFeatures.clear();
			const mapLayer = this.OverLaysService.getLeafletLayerById(this.activeLayer.id);
			if (mapLayer) mapLayer.selections.selectedFeatures.clear();
		} else {
			let i, len = this.activeLayer.data.length;
			let featuresToSelect = []
			for (i = 0; i < len; i++) {
				if (!this.activeLayer.data[i].filteFlag) featuresToSelect.push(this.activeLayer.data[i].id);
			}
			this.activeLayer.selectedFeatures.select(...featuresToSelect);
		}
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

	public onClearTableFiltersCounterToStopMultyRequest: any = false;
	onColumnFilterChange(e, layer) {
		let valuesIsEmpty = false;
		let isExist = false;
		let index;
		if (!e.filterValues) valuesIsEmpty = true;
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
		if (this.onClearTableFiltersCounterToStopMultyRequest !== false) {
			this.onClearTableFiltersCounterToStopMultyRequest--;
			if (this.onClearTableFiltersCounterToStopMultyRequest === 0) {
				this.onClearTableFiltersCounterToStopMultyRequest = false;
			}
		}

		if (this.onClearTableFiltersCounterToStopMultyRequest === false) {
			this.FilterGeometryAdapter.mainFlow.next({
				sideFilters: layer.tableFilterColumnsData
			});
		}


	}

	hideOrShowColumns(columnName, layer: AvaliableLayer) {
		if (!layer && !layer.displayedColumns && !layer.displayedColumns.length) return;
		let index;
		for (index = 0; index < layer.columns.length; index++) {
			if (columnName === layer.columns[index].name) break;
		}
		if (index === undefined) return;
		index++;
		(layer.displayedColumns.indexOf(columnName) === -1) ? layer.displayedColumns.splice(index, 0, columnName) : layer.displayedColumns.splice(layer.displayedColumns.indexOf(columnName), 1);
	}

	@ViewChildren(ContextMenuComponent) ContextMenuComponents: QueryList<ContextMenuComponent>;

	openContextMenu(event, featureId, columnName, activeLayer) {
		const findFn = (item: ContextMenuComponent, index: number, array: ContextMenuComponent[]) => (item.featureId === featureId && item.columnName === columnName)
		let contextMenuToOpen = this.ContextMenuComponents.find(findFn);
		if (contextMenuToOpen) contextMenuToOpen.openContextMenu(event, activeLayer);
	}

	columnIsVisible(columnName) {
		if (!this.activeLayer.displayedColumns || !this.activeLayer.displayedColumns.length) return false;
		return this.activeLayer.displayedColumns.filter(item => columnName === item ? item : false)[0];
	}

	generateId = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) + '-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

	editSelected() {
		if (!this.activeLayer) return;
		let feature = {};
		this.activeLayer.columns.map(column => {
			feature[column.name] = null;
		});
		const dialogConfig = new MatDialogConfig();

		dialogConfig.disableClose = true;
		dialogConfig.autoFocus = true;
		dialogConfig.height = '80vh';
		dialogConfig.width = '80vw';
		let dialogRef = this.MatDialog.open(MultipleFeatureEditComponent, dialogConfig);

		dialogRef.componentInstance.layerSchema = this.OverLaysService.getLayerById(this.activeLayer.id);
		dialogRef.componentInstance.featuresIds = this.OverLaysService.getLeafletLayerById(this.activeLayer.id).selections.selectedFeatures.selected;
		dialogRef.componentInstance.columns = this.activeLayer.columns;
		dialogRef.componentInstance.feature = feature;
	}


	@ViewChildren(AttributeDataTableFilterComponent) attributeDataTableFilterComponents: QueryList<AttributeDataTableFilterComponent>;


	clearFilters() {
		this.onClearTableFiltersCounterToStopMultyRequest = this.attributeDataTableFilterComponents.length - 1;
		this.attributeDataTableFilterComponents.forEach(component => {
			component.clearForm();
		});
		this.updateTableData(this.activeLayer, false)
	}
}