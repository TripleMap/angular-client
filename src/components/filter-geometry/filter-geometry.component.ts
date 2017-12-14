import { Component, OnInit, OnDestroy } from "@angular/core";
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";
@Component({
  selector: "filter-geometry",
  templateUrl: "./filter-geometry.component.html",
  styleUrls: ["./filter-geometry.component.css"]
})
export class FilterGeometryComponent implements OnInit, OnDestroy {
  isFiltersActive: boolean;
  isResultPaneAvalible: boolean;
  isResultPaneCounts: number;
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

  clearFilters() {}

  ngOnDestroy() {
    this._filterGeometryAdapter.filteredObjects.unsubscribe();
  }
}
