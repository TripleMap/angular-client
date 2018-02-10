import { Component, Output, Input, EventEmitter, ViewChild, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { FormControl } from '@angular/forms';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

import { SelectionLayersService } from '../../services/SelectionLayersService'

interface AvaliableLayer {
	id: string;
	labelName: string;
	visible: boolean;
	displayedColumns: string[];
	columns: any[];
	selectedFeatures: any;
	total: number;
	visibleFeaturesPerPage: any;
	featureInfo: string;
	schemaInfo: string;
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
	@ViewChild('paginatorVisibleFeaturesPerPage') paginatorVisibleFeaturesPerPage: MatPaginator;
	@ViewChild('sortVisibleFeaturesPerPage') sortVisibleFeaturesPerPage: MatSort;
	@ViewChild('table') table;

	public activeLayer: AvaliableLayer;
	public avaliableLayers: AvaliableLayer[];
	public inspectLayerAttributeTable = new FormControl();
	public trackByFn = (index, item) => item.id;
	public inspectLayerAttributeTableSubcription: any;
	constructor(
		public OverLaysService: OverLaysService,
		public SelectionLayersService: SelectionLayersService,
		public http: HttpClient,
		public MapService: MapService,
		public changeDetectorRef: ChangeDetectorRef
	) {
		this.avaliableLayers = this.SelectionLayersService.getLayersSubscribers().map((item: AvaliableLayer) => {
			item.visibleFeaturesPerPage = new MatTableDataSource();
			return item;
		});

		this.avaliableLayers.map(layer => this.getColumnNamesForLayer(layer));
		this.inspectLayerAttributeTableSubcription = this.inspectLayerAttributeTable.valueChanges.subscribe(avaliableLayerId => {

			if (avaliableLayerId && avaliableLayerId !== 'None') {
				this.activeLayer = this.avaliableLayers.filter(item => item.id === avaliableLayerId ? item : false)[0];
				this.getColumnDataForLayer(this.activeLayer, false);
			}
		});
	}

	ngAfterViewInit() {
		this.OverLaysService.visibleLayers.subscribe(layerIdsUpdate => {
			let shouldUpdate = true;
			if (!layerIdsUpdate.length) {
				this.inspectLayerAttributeTable.setValue('None');
				this.activeLayer = null;
				shouldUpdate = false;
			}

			for (let i = 0; i < layerIdsUpdate.length; i++) {
				if (this.activeLayer && layerIdsUpdate[i] === this.activeLayer.id) shouldUpdate = false;
			}

			if (shouldUpdate) this.inspectLayerAttributeTable.setValue(layerIdsUpdate[0]);
		});

		const map = this.MapService.getMap();
		map.on('moveend', this.subscribeOnMapMoved, this);
	}

	subscribeOnMapMoved(e) {
		if (this.activeLayer) {
			this.getColumnDataForLayer(this.activeLayer, true);
		}
	}

	ngOnDestroy() {
		const map = this.MapService.getMap();
		map.off('moveend', this.subscribeOnMapMoved, this);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.tdMapPanel && this.activeLayer) {
			this.getColumnDataForLayer(this.activeLayer, false);
		}
	}

	getColumnDataForLayer(layer, force) {
		console.log('ere');
		let nw = this.MapService.getMap().getBounds().getNorthWest();
		let se = this.MapService.getMap().getBounds().getSouthEast();
		let params = new HttpParams().set('bbox', [nw.lng, se.lat, se.lng, nw.lat].toString());
		this.http.get(layer.featureInfo, { params }).subscribe((data: any[]) => {
			layer.total = data.length;
			layer.visibleFeaturesPerPage.data = data;
			layer.visibleFeaturesPerPage.paginator = this.paginatorVisibleFeaturesPerPage;
			layer.visibleFeaturesPerPage.sort = this.sortVisibleFeaturesPerPage;
		});
	}

	getColumnNamesForLayer(layer) {
		this.http.get(layer.schemaInfo).subscribe((data: { properties: object; }) => {
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
		});
	}

	changeColumnSize = (column, size) => column.rowWidth = size;
	toggleSideNav = () => this.closeTdmapPanelSidenav.emit('close-tdmap-panel-sidenav');
	isAllSelected = () => this.activeLayer.selectedFeatures.selected.length === this.activeLayer.visibleFeaturesPerPage.data.length;
	masterToggle = () => this.isAllSelected() ? this.activeLayer.selectedFeatures.clear() : this.activeLayer.visibleFeaturesPerPage.data.forEach(row => this.activeLayer.selectedFeatures.select(row.id));

}
