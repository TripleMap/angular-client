import { Component, Output, Input, EventEmitter, ViewChild, ViewChildren, OnChanges, ElementRef } from "@angular/core";
import { FormControl } from '@angular/forms';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService } from "../../services/OverLaysService";
import { IPageChangeEvent } from '@covalent/core';
import { MapService } from "../../services/MapService";
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';

interface AvaliableLayer {
	id: string;
	labelName: string;
	visible: boolean;
	displayedColumns: string[];
	columns: any[];
	attributes: any[];
	selection: any;
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

export class TdMapPanelComponent {
	@Output() public closeTdmapPanelSidenav: EventEmitter<string> = new EventEmitter<string>();
	@Input() public tdMapPanel: boolean;
	@ViewChild(MatSort) sort: MatSort;
	@ViewChild('paginatorVisibleFeaturesPerPage') paginatorVisibleFeaturesPerPage: MatPaginator;
	@ViewChild('sortVisibleFeaturesPerPage') sortVisibleFeaturesPerPage: MatSort;

	@ViewChild('parcels') parcels: MatPaginator;
	@ViewChildren('matHeaderCellDef', { read: ElementRef }) matHeaderCellDef: any;
	@ViewChildren('tables') tables: any;
	public isResizing: boolean = false;
	public activeLayer: AvaliableLayer;
	public avaliableLayers: AvaliableLayer[];
	public inspectLayerAttributeTable = new FormControl();

	constructor(
		public OverLaysService: OverLaysService,
		public http: HttpClient,
		public MapService: MapService,
		private elementRef: ElementRef
	) {
		this.avaliableLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions().map((item: AvaliableLayer) => {
			item.attributes = [];
			item.columns = [];
			item.displayedColumns = [];
			item.total = 0;
			item.selection = new SelectionModel();
			item.visibleFeaturesPerPage = new MatTableDataSource();
			return item;
		});

		for (let i = 0; i < this.avaliableLayers.length; i++) {
			this.getColumnNamesForLayer(this.avaliableLayers[i]);
			this.subscribeLayers(this.avaliableLayers[i]);
		}

		this.inspectLayerAttributeTable.valueChanges.subscribe(avaliableLayerId => {
			this.activeLayer = this.avaliableLayers.filter(item => item.id === avaliableLayerId ? item : false)[0];

			if (this.activeLayer) {
				this.activeLayer.visibleFeaturesPerPage.paginator = this.paginatorVisibleFeaturesPerPage;
				this.activeLayer.visibleFeaturesPerPage.sort = this.sortVisibleFeaturesPerPage;
			}
		});

		this.OverLaysService.visibleLayers.subscribe(layerIdsUpdate => {
			if (!layerIdsUpdate.length) {
				this.clearAttributes(false);
				return;
			}

			let shouldUpdate = true;
			for (let i = 0; i < layerIdsUpdate.length; i++) {
				if (this.activeLayer && layerIdsUpdate[i] === this.activeLayer.id) {
					shouldUpdate = false;
				}
				for (let avaliableLayersIndex = 0; avaliableLayersIndex < this.avaliableLayers.length; avaliableLayersIndex++) {
					if (layerIdsUpdate[i] === this.avaliableLayers[avaliableLayersIndex].id) {
						this.avaliableLayers[avaliableLayersIndex].visible = true;
					}
				}
			}

			if (layerIdsUpdate.length && shouldUpdate) this.inspectLayerAttributeTable.setValue(this.avaliableLayers[0].id);
		});
	}


	clearAttributes(layerId) {
		if (!layerId) {
			this.avaliableLayers = this.avaliableLayers.map(item => {
				item.attributes = [];
				return item;
			});
			return;
		}
		this.avaliableLayers.filter(item => item.id === layerId ? item : false)[0].attributes = [];
	}

	ngOnChanges(changes) {
		if (changes.tdMapPanel.currentValue && this.activeLayer) {
			this.avaliableLayers.map(layer => {
				this.getColumnDataForLayer(layer);
			});
			this.activeLayer.visibleFeaturesPerPage.paginator = this.paginatorVisibleFeaturesPerPage;
			this.activeLayer.visibleFeaturesPerPage.sort = this.sortVisibleFeaturesPerPage;
		}
	};
	changeColumnSize(column, size) {
		column.rowWidth = size;
	}
	getColumnNamesForLayer(layer) {
		this.http.get(layer.schemaInfo).subscribe((data: { properties: object; }) => {
			let columns = [];
			let displayedColumns = ['select'];
			for (let key in data.properties) {
				if (key !== 'id' && key !== 'geometry') {
					columns.push({
						name: key,
						label: data.properties[key].label || key,
						rowWidth: '240px'
					});
					displayedColumns.push(key);
				}
			}
			layer.columns = columns;
			layer.displayedColumns = displayedColumns;
		});
	}

	getColumnDataForLayer(layer) {
		let bounds = this.MapService.getMap().getBounds();
		let nw = bounds.getNorthWest();
		let se = bounds.getSouthEast();
		let bbox = [nw.lng, se.lat, se.lng, nw.lat].toString();
		let params = new HttpParams();
		params = params.set('bbox', bbox);
		this.http.get(layer.featureInfo, { params }).subscribe((data: any[]) => {
			layer.total = data.length;
			layer.visibleFeaturesPerPage.data = data;
		});
	}

	subscribeLayers(layer) {
		const maplayer = this.OverLaysService.getLayerById(layer.id);
		if (maplayer.selections) {
			maplayer.selections.changeSelection.subscribe(data => {
				if (data.added && data.added.length) {
					data.added.map(feature => {
						if (!layer.selection.isSelected(feature.feature.properties.id)) {
							layer.selection.toggle(feature.feature.properties.id)
						}
					});
				}

				if (data.removed && data.removed.length) {
					data.removed.map(feature => {
						if (layer.selection.isSelected(feature.feature.properties.id)) {
							layer.selection.toggle(feature.feature.properties.id)
						}
					});
				}
			});
		}

		layer.selection.onChange.subscribe(data => {
			this.addSelectionToLayer(layer.id, data);
		});
	}

	addSelectionToLayer(layerId: string, selectionChangeData) {
		if (layerId !== this.activeLayer.id) {
			return;
		}
		const layer = this.OverLaysService.getLayerById(layerId);
		if (!layer) return;
		if (layer.selections) {
			selectionChangeData.added.map(item => {
				layer.eachLayer(feature => {
					if (!layer.selections.isInSelections(feature) && feature.feature && feature.feature.properties && feature.feature.properties.id === item) {
						layer.selections.addSelections(feature, false, true);
					}
				});
			});

			selectionChangeData.removed.map(item => {
				layer.eachLayer(feature => {
					if (feature.feature && feature.feature.properties && feature.feature.properties.id === item) {
						layer.selections.removeSelectionLayer(feature);
					}
				})
			});
		}
	}

	toggleSideNav = () => this.closeTdmapPanelSidenav.emit('close-tdmap-panel-sidenav');
	isAllSelected = () => this.activeLayer.selection.selected.length === this.activeLayer.visibleFeaturesPerPage.data.length;
	masterToggle = () => this.isAllSelected() ? this.activeLayer.selection.clear() : this.activeLayer.visibleFeaturesPerPage.data.forEach(row => this.activeLayer.selection.select(row.id));


	addGutters(layer) {
		let self = this;
		let lastDownX = 0;
		let headerElements = this.matHeaderCellDef._results;
		const stopSortOnResize = (e) => {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
		for (let i = 0; i < headerElements.length; i++) {
			let shouldAdd = true;
			const element = headerElements[i].nativeElement;

			for (let elementIndex = 0; elementIndex < element.children.length; elementIndex++) {
				const el = element.children[elementIndex];
				if (el.className === 'gutter-header') {
					shouldAdd = false;
				}
			}
			if (!shouldAdd) {
				return;
			}
			let gutter = document.createElement('div');
			gutter.classList.add('gutter-header')
			element.appendChild(gutter);
			gutter.addEventListener('click', stopSortOnResize);
			gutter.addEventListener('mousedown', function (mouseDownEvent) {
				if (!i) return;
				self.isResizing = true;
				const elementWidth = this.offsetWidth;
				const onMouseMove = function (mouseMoveEvent) {
					if (!self.isResizing) return;
					layer.columns[i - 1].rowWidth = elementWidth - (mouseDownEvent.clientX - mouseMoveEvent.x + 16) + 'px';
				}.bind(this)
				document.addEventListener('mousemove', onMouseMove);
				document.addEventListener('mouseup', e => document.removeEventListener('mousemove', onMouseMove));
			}.bind(element));
		}
	}
}
