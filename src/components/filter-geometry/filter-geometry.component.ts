import { Component, ViewChild, OnInit, OnDestroy, Output, EventEmitter } from "@angular/core";
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { FilterGeometryFirstLineComponent } from './filter-geometry-first-line/filter-geometry-first-line.component';

// Track by Id

@Component({
  selector: "filter-geometry",
  templateUrl: "./filter-geometry.component.html",
  styleUrls: ["./filter-geometry.component.css"]
})
export class FilterGeometryComponent implements OnInit, OnDestroy {
  isFiltersActive: boolean;
  isResultPaneAvalible: boolean;
  isResultPaneCounts: number;
  public activeMediaQuery: string = "";
  @ViewChild(FilterGeometryFirstLineComponent) firstLine: FilterGeometryFirstLineComponent;
  @Output()
  closesidenav: EventEmitter<string> = new EventEmitter<string>();

  constructor(public _filterGeometryAdapter: FilterGeometryAdapter, public media: ObservableMedia) {
    this.isFiltersActive = true;
    this.isResultPaneAvalible = false;
    media.subscribe((change: MediaChange) => (this.activeMediaQuery = change ? change.mqAlias : ""));
  }

  ngOnInit() {
    this._filterGeometryAdapter.filteredObjects.subscribe(
      this.toogleAvaliableResultPane
    );
  }

  changeFilterOrResultPane() {
    this.isFiltersActive = !this.isFiltersActive;
  }

  toogleAvaliableResultPane = data => {
    this.isResultPaneAvalible = data && data.length > 0;
    this.isResultPaneCounts = data && data.length > 0 ? data.length : null;
  };

  clearFilters() {
    this._filterGeometryAdapter.clearData();
    this.firstLine.clearForm();
  }

  ngOnDestroy() {
    this._filterGeometryAdapter.filteredObjects.unsubscribe();
  }
  toggleSideNav() {
    this.closesidenav.emit('close-sidenav');
  }
}
