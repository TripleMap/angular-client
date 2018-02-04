import { Component, Output, Input, EventEmitter, ViewChild, OnChanges, SimpleChanges, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
import { FormControl } from '@angular/forms';
import { HttpParams, HttpClient } from "@angular/common/http";
import { OverLaysService } from "../../services/OverLaysService";
import { MapService } from "../../services/MapService";
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';

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
	styleUrls: ["./td-map-panel.component.css"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TdMapPanelComponent implements AfterViewInit {
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


	constructor(
		public OverLaysService: OverLaysService,
		public http: HttpClient,
		public MapService: MapService,
		public ChangeDetectorRef: ChangeDetectorRef
	) { }

	ngAfterViewInit() {
		this.avaliableLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions().map((item: AvaliableLayer) => {
			item.visibleFeaturesPerPage = new MatTableDataSource();
			item.selectedFeatures = new SelectionModel(true);
			item.selectedFeatures.onChange.subscribe(data => {
				this.updateMapLayerOnFeatureSelectionChange(data, item);
			});
			this.subscribeMapLayersOnFeatureSelectionsChange(item);
			return item;
		});

		this.avaliableLayers.map(layer => this.getColumnNamesForLayer(layer));

		this.inspectLayerAttributeTable.valueChanges.subscribe(avaliableLayerId => {
			if (avaliableLayerId && avaliableLayerId !== 'None') {
				this.activeLayer = this.avaliableLayers.filter(item => item.id === avaliableLayerId ? item : false)[0];
				this.getColumnDataForLayer(this.activeLayer, false);
			}
		});

		this.OverLaysService.visibleLayers.subscribe(layerIdsUpdate => {
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

		//Also

		const map = this.MapService.getMap();
		map.on('moveend', (e) => {
			if (this.activeLayer) {
				this.getColumnDataForLayer(this.activeLayer, true);
			}
		})

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
		this.http.get(layer.featureInfo, { params }).subscribe((data: any[]) => {
			layer.total = data.length;
			layer.visibleFeaturesPerPage.data = data;
			layer.visibleFeaturesPerPage.paginator = this.paginatorVisibleFeaturesPerPage;
			layer.visibleFeaturesPerPage.sort = this.sortVisibleFeaturesPerPage;
			setTimeout(() => {
				this.ChangeDetectorRef.detectChanges();
			}, 100);

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
			this.ChangeDetectorRef.detectChanges();
		});
	}

	changeColumnSize = (column, size) => column.rowWidth = size;
	toggleSideNav = () => this.closeTdmapPanelSidenav.emit('close-tdmap-panel-sidenav');
	isAllSelected() {
		const numSelected = this.activeLayer.selectedFeatures.selected.length;
		const numRows = this.activeLayer.visibleFeaturesPerPage.data.length;
		return numSelected == numRows;
	}

	/** Selects all rows if they are not all selected; otherwise clear selectedFeatures. */
	masterToggle() {
		this.isAllSelected() ?
			this.activeLayer.selectedFeatures.clear() :
			this.activeLayer.visibleFeaturesPerPage.data.forEach(row => this.activeLayer.selectedFeatures.select(row.id));
		this.ChangeDetectorRef.detectChanges();
	}

	subscribeMapLayersOnFeatureSelectionsChange(layer) {
		const maplayer = this.OverLaysService.getLayerById(layer.id);
		if (!maplayer && !maplayer.selections) return;

		maplayer.selections.changeSelection.subscribe(featureSelectionsEvent => {
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
			this.ChangeDetectorRef.detectChanges();
		});
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
		this.ChangeDetectorRef.detectChanges();
	}
}
