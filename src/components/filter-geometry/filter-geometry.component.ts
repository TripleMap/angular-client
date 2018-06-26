import { Component, ViewChild, OnInit, OnDestroy, Output, EventEmitter } from "@angular/core";
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";
import { FilterGeometryFirstLineComponent } from './filter-geometry-first-line/filter-geometry-first-line.component';
import { FilterGeometryResultListComponent } from './filter-geometry-result-list/filter-geometry-result-list.component';
import { OverLaysService, LayerSchema } from "../../services/OverLaysService";
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms'


@Component({
  selector: "filter-geometry",
  templateUrl: "./filter-geometry.component.html",
  styleUrls: ["./filter-geometry.component.css"]
})
export class FilterGeometryComponent implements OnInit, OnDestroy {
  public isFiltersActive: boolean;
  public isResultPaneAvalible: boolean;
  public isResultPaneCounts: number;
  public avaliableLayers: LayerSchema[];
  public filterSubscription: Subscription;
  public filterLayerFormControlSubscriber: Subscription;
  public mediaSubscription: Subscription;
  public filterLayerFormControl = new FormControl();
  @Output() closesidenav: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild(FilterGeometryFirstLineComponent) firstLine: FilterGeometryFirstLineComponent;
  @ViewChild(FilterGeometryResultListComponent) resultPane: FilterGeometryResultListComponent;
  constructor(
    public OverLaysService: OverLaysService,
    public FilterGeometryAdapter: FilterGeometryAdapter
  ) { }

  ngOnInit() {
    this.isFiltersActive = true;
    this.isResultPaneAvalible = false;
  }

  ngAfterViewInit() {
    this.OverLaysService.layersChange.subscribe(change => {
      if (!change) return;
      this.avaliableLayers = this.OverLaysService.layersSchemas;
      this.filterLayerFormControlSubscriber = this.filterLayerFormControl.valueChanges.subscribe(avaliableLayer => {
        this.FilterGeometryAdapter.setFilteredLayer(avaliableLayer.id);
        this.resultPane.setResultListLayer(avaliableLayer.id);
      });

      this.filterLayerFormControl.setValue(this.avaliableLayers[0])
    })
  }

  changeFilterOrResultPane = () => this.isFiltersActive = !this.isFiltersActive;

  // toogleAvaliableResultPane = (layerIdAndData) => {
  //   let inspectLayer
  //   if (layerIdAndData) {
  //     inspectLayer = this.FilterGeometryAdapter.getLayerById(layerIdAndData.layerId);
  //   }

  //   this.isResultPaneAvalible = layerIdAndData && layerIdAndData.data && inspectLayer.filteredList.length > 0;
  //   this.isResultPaneCounts = layerIdAndData && layerIdAndData.data && inspectLayer.filteredList.length > 0 ? inspectLayer.filteredList.length : null;
  //   if (layerIdAndData && layerIdAndData.data) {
  //     this.OverLaysService.refreshFilteredIds(this.filterLayerFormControl.value.id, inspectLayer.filteredList.map(item => item.id))
  //   } else {
  //     if (this.filterLayerFormControl.value && this.filterLayerFormControl.value.id) {
  //       this.OverLaysService.removeFilteredIds(this.filterLayerFormControl.value.id);
  //     }
  //   }
  // };

  clearFilters() {
    this.FilterGeometryAdapter.clearData();
    this.firstLine.clearForm();
    this.OverLaysService.removeFilteredIds(this.filterLayerFormControl.value.id);
  }

  ngOnDestroy() {
    if (this.filterSubscription) this.filterSubscription.unsubscribe();
    if (this.filterLayerFormControlSubscriber) this.filterLayerFormControlSubscriber.unsubscribe();
    if (this.mediaSubscription) this.mediaSubscription.unsubscribe();
  }

  toggleSideNav = () => this.closesidenav.emit('close-sidenav');

}
