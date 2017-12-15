import { Component, ViewChild, OnInit, OnDestroy } from "@angular/core";
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";

import { FilterGeometryFirstLineComponent } from './filter-geometry-first-line/filter-geometry-first-line.component';

@Component({
  selector: "filter-geometry",
  templateUrl: "./filter-geometry.component.html",
  styleUrls: ["./filter-geometry.component.css"]
})
export class FilterGeometryComponent implements OnInit, OnDestroy {
  isFiltersActive: boolean;
  isResultPaneAvalible: boolean;
  isResultPaneCounts: number;
  @ViewChild(FilterGeometryFirstLineComponent) firstLine: FilterGeometryFirstLineComponent;

  constructor(public _filterGeometryAdapter: FilterGeometryAdapter) {
    this.isFiltersActive = true;
    this.isResultPaneAvalible = false;
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
}
