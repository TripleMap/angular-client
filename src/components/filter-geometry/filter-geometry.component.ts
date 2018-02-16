import { Component, ViewChild, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { FilterGeometryFirstLineComponent } from './filter-geometry-first-line/filter-geometry-first-line.component';
import { FilterGeometryResultListComponent } from './filter-geometry-result-list/filter-geometry-result-list.component';
import { OverLaysService } from "../../services/OverLaysService";
import { Subscription } from 'rxjs/Subscription';
import { FormControl } from '@angular/forms'


@Component({
  selector: "filter-geometry",
  templateUrl: "./filter-geometry.component.html",
  styleUrls: ["./filter-geometry.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterGeometryComponent implements OnInit, OnDestroy {
  public isFiltersActive: boolean;
  public isResultPaneAvalible: boolean;
  public isResultPaneCounts: number;
  public activeMediaQuery: string = "";
  public avaliableLayers: any[];
  public filterSubscription: Subscription;
  public filterLayerFormControlSubscriber: Subscription;
  public mediaSubscription: Subscription;
  public filterLayerFormControl = new FormControl();
  @Output() closesidenav: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild(FilterGeometryFirstLineComponent) firstLine: FilterGeometryFirstLineComponent;
  @ViewChild(FilterGeometryResultListComponent) resultPane: FilterGeometryResultListComponent;
  constructor(
    public OverLaysService: OverLaysService,
    public _filterGeometryAdapter: FilterGeometryAdapter,
    public media: ObservableMedia,
    public changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.isFiltersActive = true;
    this.isResultPaneAvalible = false;
    this.mediaSubscription = this.media.subscribe((change: MediaChange) => (this.activeMediaQuery = change ? change.mqAlias : ""));
    this.filterSubscription = this._filterGeometryAdapter.filteredLayerId.subscribe(this.toogleAvaliableResultPane);
  }

  ngAfterViewInit() {
    this.avaliableLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions();
    this.filterLayerFormControlSubscriber = this.filterLayerFormControl.valueChanges.subscribe(avaliableLayer => {
      this._filterGeometryAdapter.setFilteredLayer(avaliableLayer.id);
      this.resultPane.setResultListLayer(avaliableLayer.id);
    });
    this.filterLayerFormControl.setValue(this.avaliableLayers[0])
  }

  changeFilterOrResultPane() {
    this.isFiltersActive = !this.isFiltersActive;
  }

  toogleAvaliableResultPane = (layerIdAndData) => {
    let inspectLayer
    if (layerIdAndData) {
      inspectLayer = this.avaliableLayers.filter(item => (item.id === layerIdAndData.layerId) ? item : false)[0];
    }

    this.isResultPaneAvalible = layerIdAndData && layerIdAndData.data && inspectLayer.filteredList.length > 0;
    this.isResultPaneCounts = layerIdAndData && layerIdAndData.data && inspectLayer.filteredList.length > 0 ? inspectLayer.filteredList.length : null;
    if (layerIdAndData && layerIdAndData.data) {
      this.OverLaysService.refreshFilteredIds(this.filterLayerFormControl.value.id, inspectLayer.filteredList.map(item => item.id))
    } else {
      if (this.filterLayerFormControl.value && this.filterLayerFormControl.value.id) {
        this.OverLaysService.removeFilteredIds(this.filterLayerFormControl.value.id);
      }
    }
    this.changeDetectorRef.detectChanges();
  };

  clearFilters() {
    this._filterGeometryAdapter.clearData();
    this.firstLine.clearForm();
    this.OverLaysService.removeFilteredIds(this.filterLayerFormControl.value.id);
  }

  ngOnDestroy() {
    this.filterSubscription.unsubscribe();
    this.filterLayerFormControlSubscriber.unsubscribe();
    this.mediaSubscription.unsubscribe();
  }

  toggleSideNav() {
    this.closesidenav.emit('close-sidenav');
  }

}
