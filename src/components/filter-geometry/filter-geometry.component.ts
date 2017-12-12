import { Component, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";

import { SelectedFeatureService } from "../../services/SelectedFeatureService";
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";

@Component({
  selector: "filter-geometry",
  templateUrl: "./filter-geometry.component.html",
  styleUrls: ["./filter-geometry.component.css"]
})
export class FilterGeometryComponent implements OnInit {
  showSurveyCtrl: FormControl;
  showSegmentedCtrl: FormControl;
  showFromCtrl: FormControl;
  showToCtrl: FormControl;
  constructor(
    public _selectedFeatureService: SelectedFeatureService,
    public _filterGeometryAdapter: FilterGeometryAdapter
  ) {
    this.showSurveyCtrl = new FormControl();
    this.showSegmentedCtrl = new FormControl();
    this.showSurveyCtrl.setValue(true);
    this.showSegmentedCtrl.setValue(true);

    this.showFromCtrl = new FormControl();
    this.showToCtrl = new FormControl();
  }

  ngOnInit() {
    this.showSurveyCtrl.valueChanges
      .map(data => ({ a: "showSurvey", d: data }))
      .subscribe(this._filterGeometryAdapter.mainFlow);

    this.showSegmentedCtrl.valueChanges
      .map(data => ({ a: "showSegmented", d: data }))
      .subscribe(this._filterGeometryAdapter.mainFlow);
  }
  clearFilter() {}
}
