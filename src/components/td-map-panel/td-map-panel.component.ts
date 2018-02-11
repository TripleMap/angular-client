import { Component, Output, Input, EventEmitter, ViewChild, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChildren } from "@angular/core";
import { FormControl } from '@angular/forms';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';

import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";
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
	data: any;
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

	public subscriptions: {};
	public filteredList: any[];
	constructor(
		public OverLaysService: OverLaysService,
		public http: HttpClient,
		public MapService: MapService,
		public FilterGeometryAdapter: FilterGeometryAdapter,
		public changeDetectorRef: ChangeDetectorRef
	) { this.subscriptions = {}; }

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

		const map = this.MapService.getMap();
		map.on('moveend', this.subscribeOnMapMoved, this);

		let filterSubscriber = this.FilterGeometryAdapter.filteredObjects.subscribe(data => {
			this.filteredList = data;
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
		if (!this.table.first) return;
		let tableRef = this.table.first.nativeElement
		const tableViewHeight = tableRef.offsetHeight
		const tableScrollHeight = tableRef.scrollHeight
		const scrollLocation = tableRef.scrollTop;
		let rowHeigth = 48;
		let elementPreView = Math.ceil(tableViewHeight / rowHeigth) + 3;
		let firstElement = Math.ceil(scrollLocation / rowHeigth)

		let scrollElement = tableRef.getElementsByClassName('table-sroll-wrapper')[0];
		scrollElement.style.height = data.length * rowHeigth + 'px';

		layer.data = data;
		layer.total = data.length;
		layer.visibleFeaturesPerPage.data = data.slice(firstElement, firstElement + elementPreView);
		layer.visibleFeaturesPerPage.sort = this.sortVisibleFeaturesPerPage;
		this.changeDetectorRef.detectChanges();
		let delta = scrollLocation > 48 ? 1 : 0;
		let matRows = tableRef.getElementsByTagName('mat-row');
		for (let i = 0; i < matRows.length; i++) {
			matRows[i].style.position = 'absolute';
			matRows[i].style.zIndex = 0;
			matRows[i].style.transform = `translate3d(0,${(firstElement + i - delta) * rowHeigth}px,0)`
		}
	}

	onTableScroll(e, layer) {
		if (!e.target) return;
		const tableViewHeight = e.target.offsetHeight // viewport: ~500px
		const tableScrollHeight = e.target.scrollHeight // length of all table
		const scrollLocation = e.target.scrollTop; // how far user scrolled
		let rowHeigth = 48;
		let elementPreView = Math.ceil(tableViewHeight / rowHeigth) + 3;
		let firstElement = Math.ceil(scrollLocation / rowHeigth);
		layer.visibleFeaturesPerPage.data = layer.data.slice(firstElement, firstElement + elementPreView);
		let delta = scrollLocation > 48 ? 1 : 0;
		this.changeDetectorRef.detectChanges();
		let matRows = e.target.getElementsByTagName('mat-row');
		for (let i = 0; i < matRows.length; i++) {
			matRows[i].style.position = 'absolute';
			matRows[i].style.zIndex = 0;
			matRows[i].style.transform = `translate3d(0,${(firstElement + i - delta) * rowHeigth}px,0)`
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
						label: data.properties[key].label || key,
						rowWidth: 240
					});
					layer.displayedColumns.push(key);
				}
			}
			this.changeDetectorRef.detectChanges();
		});
	}

	changeColumnSize = (column, size) => column.rowWidth = size;
	toggleSideNav = () => this.closeTdmapPanelSidenav.emit('close-tdmap-panel-sidenav');
	isAllSelected() {
		if (!this.activeLayer.selectedFeatures.selected.length) return false;
		let isAllFeaturesOnCurrentViewSelected = true;
		for (let i = 0, len = this.activeLayer.data.length; i < len; i++) {
			if (this.activeLayer.selectedFeatures.selected.indexOf(this.activeLayer.data[i].id) === -1) {
				isAllFeaturesOnCurrentViewSelected = false;
			}
		}
		return isAllFeaturesOnCurrentViewSelected;
	}

	masterToggle() {
		if (this.isAllSelected()) {
			this.activeLayer.selectedFeatures.clear();
			const maplayer = this.OverLaysService.getLayerById(this.activeLayer.id);
			if (maplayer && maplayer.selections) {
				maplayer.selections.clearSelections();
			}
		} else {
			this.activeLayer.data.forEach(row => this.activeLayer.selectedFeatures.select(row.id));
		}
		this.changeDetectorRef.detectChanges();
	}

	subscribeMapLayersOnFeatureSelectionsChange(layer) {
		const maplayer = this.OverLaysService.getLayerById(layer.id);
		if (!maplayer && !maplayer.selections) return;

		let subscriber = maplayer.selections.changeSelection.subscribe(featureSelectionsEvent => {
			if (featureSelectionsEvent.added && featureSelectionsEvent.added.length) {
				featureSelectionsEvent.added.map(feature => {
					if (!layer.selectedFeatures.isSelected(feature.feature.properties.id)) {
						layer.selectedFeatures.select(feature.feature.properties.id)
					}
				});
			}
			if (featureSelectionsEvent.removed && featureSelectionsEvent.removed.length) {
				featureSelectionsEvent.removed.map(feature => {
					if (layer.selectedFeatures.isSelected(feature.feature.properties.id)) {
						layer.selectedFeatures.deselect(feature.feature.properties.id)
					}
				});
			}
			this.changeDetectorRef.detectChanges();
		});
		this.subscriptions[`${layer.id}_subscribeMapLayersOnFeatureSelectionsChange`] = subscriber;
	}

	updateMapLayerOnFeatureSelectionChange(selectionChangeDataEvent, layer) {
		const mapLayer = this.OverLaysService.getLayerById(layer.id);
		if (!mapLayer && !mapLayer.selections) return;

		selectionChangeDataEvent.added.map(item => {
			mapLayer.eachLayer(feature => {
				if (!mapLayer.selections.isInSelections(feature) && feature.feature && feature.feature.properties && feature.feature.properties.id === item) {
					mapLayer.selections.addSelections(feature, false, true);
				}
			});
		});

		selectionChangeDataEvent.removed.map(item => {
			mapLayer.eachLayer(feature => {
				if (feature.feature && feature.feature.properties && feature.feature.properties.id === item) {
					mapLayer.selections.removeSelectionLayer(feature);
				}
			})
		});
		this.changeDetectorRef.detectChanges();
	}
}
