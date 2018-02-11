import { Component, ViewChild, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { FilterGeometryFirstLineComponent } from './filter-geometry-first-line/filter-geometry-first-line.component';
import { OverLaysService } from "../../services/OverLaysService";
import { Subscription } from 'rxjs/Subscription';
import { FormControl } from '@angular/forms'
// Track by Id

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

  constructor(
    public OverLaysService: OverLaysService,
    public _filterGeometryAdapter: FilterGeometryAdapter,
    public media: ObservableMedia,
    public changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.isFiltersActive = true;
    this.isResultPaneAvalible = false;
    this.mediaSubscription = this.media.subscribe((change: MediaChange) => (this.activeMediaQuery = change ? change.mqAlias : ""));
    this.filterSubscription = this._filterGeometryAdapter.filteredObjects.subscribe(this.toogleAvaliableResultPane);
  }

  ngAfterViewInit() {
    this.avaliableLayers = this.OverLaysService.getLayersIdsLabelNamesAndHttpOptions();
    this.filterLayerFormControlSubscriber = this.filterLayerFormControl.valueChanges.subscribe(avaliableLayerId => { });
  }

  changeFilterOrResultPane() {
    this.isFiltersActive = !this.isFiltersActive;
  }

  toogleAvaliableResultPane = data => {
    this.isResultPaneAvalible = data && data.length > 0;
    this.isResultPaneCounts = data && data.length > 0 ? data.length : null;
    this.changeDetectorRef.detectChanges();
  };

  clearFilters() {
    this._filterGeometryAdapter.clearData();
    this.firstLine.clearForm();
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
