import { Component, Output, Input, EventEmitter, ViewChild, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChildren, NgZone } from "@angular/core";
import { FormControl } from '@angular/forms';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';

import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";
import { Subject } from 'rxjs/subject'
import { Observable } from 'rxjs/observable'
import 'rxjs/add/operator/debounceTime.js';
import { Subscriber } from "rxjs/Subscriber";


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
}

@Component({
	selector: "td-map-panel",
	templateUrl: "./td-map-panel.component.html",
	styleUrls: ["./td-map-panel.component.css"]
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
	public subscriberChangeDetectionTick: any;
	constructor(
		public OverLaysService: OverLaysService,
		public http: HttpClient,
		public MapService: MapService,
		public FilterGeometryAdapter: FilterGeometryAdapter,
		public changeDetectorRef: ChangeDetectorRef,
		public zone: NgZone
	) {
		this.changeDetectionTick = new Subject()
		this.subscriberChangeDetectionTick = this.changeDetectionTick.asObservable().debounceTime(100).subscribe(data => {
			this.changeDetectorRef.detectChanges();
		});
	}

	ngAfterViewInit() {
		this.avaliableLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions().map((item: AvaliableLayer) => {
			item.visibleFeaturesPerPage = new MatTableDataSource();
			item.selectedFeatures = new SelectionModel(true);
			item.data = [];
			let onChangeSelectedSubscriber = item.selectedFeatures.onChange.subscribe(data => {
				this.updateMapLayerOnFeatureSelectionChange(data, item);
			});
			this.subscriptions[`${item.id}_updateMapLayerOnFeatureSelectionChange`] = onChangeSelectedSubscriber;
			this.subscribeMapLayersOnFeatureSelectionsChange(item);
			return item;
		});

		this.avaliableLayers.map(layer => this.getColumnNamesForLayer(layer));

		let inspectLayerAttributeTableSubscriber = this.inspectLayerAttributeTable.valueChanges.subscribe(avaliableLayerId => {
			if (avaliableLayerId && avaliableLayerId !== 'None') {
				this.activeLayer = this.avaliableLayers.filter(item => item.id === avaliableLayerId ? item : false)[0];
				this.getColumnDataForLayer(this.activeLayer, false);
			}

			this.changeDetectorRef.detectChanges();
			if (this.table.first) {
				let scrollElement = document.createElement('div');
				scrollElement.classList.add('table-sroll-wrapper');
				this.table.first.nativeElement.appendChild(scrollElement);
			}
		});

		this.subscriptions[`OverLaysService_visibleLayers`] = inspectLayerAttributeTableSubscriber;

		let visibleSubscriber = this.OverLaysService.visibleLayers.subscribe(layerIdsUpdate => {
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
		this.subscriptions[`OverLaysService_visibleLayers`] = visibleSubscriber;

		// const map = this.MapService.getMap();
		// map.on('moveend', this.subscribeOnMapMoved, this);

		let filterSubscriber = this.FilterGeometryAdapter.filteredObjects.subscribe(layerIdAndData => {
			let inspectLayer = this.avaliableLayers.filter(layer => layer.id === layerIdAndData.layerId ? layer : false)[0]
			inspectLayer.filteredList = layerIdAndData.data ? layerIdAndData.data.map(item => item.id) : [];
			this.onFilterListSubscriberNext(inspectLayer, false);
		});
		this.subscriptions[`filterSubscriber`] = filterSubscriber;

	}

	subscribeOnMapMoved(e) {
		if (this.activeLayer) {
			this.getColumnDataForLayer(this.activeLayer, true);
		}
	}

	ngOnDestroy() {
		const map = this.MapService.getMap();
		map.off('moveend', this.subscribeOnMapMoved, this);
		for (let key in this.subscriptions) {
			this.subscriptions[key].unsubscribe();
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.tdMapPanel && this.activeLayer) {
			this.getColumnDataForLayer(this.activeLayer, false);
		}
	}

	getColumnDataForLayer(layer, force) {
		let nw = this.MapService.getMap().getBounds().getNorthWest();
		let se = this.MapService.getMap().getBounds().getSouthEast();
		let params = new HttpParams().set('bbox', [nw.lng, se.lat, se.lng, nw.lat].toString());
		this.http.get(layer.featureInfoUrl, { params }).subscribe((data: any[]) => {
			this.loadDataVirtualScroll(layer, data)
		});
	}

	loadDataVirtualScroll(layer, data) {
		if (!this.table.first || !data) return;
		let filteredData;
		if (layer.filteredList && layer.filteredList.length) {
			filteredData = data.map(item => {
				layer.filteredList.indexOf(item.id) === -1 ? item.filteFlag = true : item.filteFlag = false;
				return item
			});
		} else {
			filteredData = data;
		}

		let tableRef = this.table.first.nativeElement;
		const tableViewHeight = tableRef.offsetHeight;
		const tableScrollHeight = tableRef.scrollHeight;
		const scrollLocation = tableRef.scrollTop;
		let rowHeigth = 48;
		let elementPreView = Math.ceil(tableViewHeight / rowHeigth);
		let firstElement = Math.floor(scrollLocation / rowHeigth);

		let scrollElement = tableRef.getElementsByClassName('table-sroll-wrapper')[0];
		scrollElement.style.height = filteredData.length * rowHeigth + 'px';

		layer.data = data;
		layer.total = filteredData.length;
		layer.visibleFeaturesPerPage.data = filteredData.slice(firstElement, firstElement + elementPreView);
		layer.visibleFeaturesPerPage.sort = this.sortVisibleFeaturesPerPage;

		let delta = scrollLocation > 56 ? 1 : 0;
		let matRows = tableRef.getElementsByTagName('mat-row');
		for (let i = 0; i < matRows.length; i++) {
			matRows[i].style.position = 'absolute';
			matRows[i].style.zIndex = 0;
			matRows[i].style.transform = `translate3d(0,${(firstElement + i - delta) * rowHeigth}px,0)`;
		}
	}

	onFilterListSubscriberNext(layer, onScroll) {
		let tableRef = this.table.first.nativeElement;
		let inspectLayer = layer || this.activeLayer;
		let data = inspectLayer.data;
		if (!tableRef || !inspectLayer || !data) return;

		let filteredData;
		if (layer.filteredList && layer.filteredList.length) {
			filteredData = data.map(item => {
				layer.filteredList.indexOf(item.id) === -1 ? item.filteFlag = true : item.filteFlag = false;
				return item
			});
		} else {
			filteredData = data;
		}
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
		this.changeDetectorRef.markForCheck();
		let matRows = tableRef.getElementsByTagName('mat-row');
		for (let i = 0; i < matRows.length; i++) {
			matRows[i].style.position = 'absolute';
			matRows[i].style.zIndex = 0;
			matRows[i].style.transform = `translate3d(0,${(firstElement + i - delta) * rowHeigth}px,0)`;
		}
	}

	onTableScroll(e, layer) {
		this.onFilterListSubscriberNext(layer, true);
	}


	getColumnNamesForLayer(layer) {
		this.http.get(layer.schemaInfoUrl).subscribe((data: { properties: object; }) => {
			layer.columns = [];
			layer.displayedColumns = ['select'];
			for (let key in data.properties) {
				if (key !== 'id' && key !== 'geometry') {
					layer.columns.push({
						name: key,
						label: data.properties[key].label || key,
						rowWidth: 240
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
		} else {
			const numSelected = this.activeLayer.selectedFeatures.selected.length;
			const numRows = this.activeLayer.data.length;
			return numSelected == numRows;
		}


		// if (!this.activeLayer.selectedFeatures.selected.length) return false;
		// let isAllFeaturesOnCurrentViewSelected = true;
		// for (let i = 0, len = this.activeLayer.data.length; i < len; i++) {
		// 	if (this.activeLayer.selectedFeatures.selected.indexOf(this.activeLayer.data[i].id) === -1) {
		// 		isAllFeaturesOnCurrentViewSelected = false;
		// 	}
		// }
		// return isAllFeaturesOnCurrentViewSelected;
	}

	masterToggle() {
		if (this.isAllSelected()) {
			this.activeLayer.selectedFeatures.clear();
			const maplayer = this.OverLaysService.getLayerById(this.activeLayer.id);
			if (maplayer && maplayer.options.selectable) maplayer.clearSelections();
		} else {

			this.zone.runOutsideAngular(
				() => {
					let i, len = this.activeLayer.data.length
					for (let i = 0; i < len; i++) {
						this.activeLayer.selectedFeatures.select(this.activeLayer.data[i].id);
					}
				}
			)

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
}
