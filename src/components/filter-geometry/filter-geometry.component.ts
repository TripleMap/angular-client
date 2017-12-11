import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from "@angular/forms";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";

import { SelectedFeatureService } from "../../services/SelectedFeatureService";
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";

@Component({
  selector: 'filter-geometry',
  templateUrl: './filter-geometry.component.html',
  styleUrls: ['./filter-geometry.component.css']
})
export class FilterGeometryComponent implements OnInit {
  showSurveyCtrl: FormControl;
  showSurveyCtrlWatcher: Observable<any>;
  showSegmentedCtrl: FormControl;
  showSegmentedCtrlWatcher: Observable<any>;

  constructor(public _selectedFeatureService: SelectedFeatureService, public _filterGeometryAdapter: FilterGeometryAdapter) {
    this.showSurveyCtrl = new FormControl();
    this.showSegmentedCtrl = new FormControl();
    this.showSurveyCtrl.setValue(true);
    this.showSegmentedCtrl.setValue(true);
  }

  ngOnInit() {
    this.showSurveyCtrlWatcher = this.showSurveyCtrl.valueChanges.map(data => ({ a: 'showSurveyCtrl', d: data}));
    this.showSegmentedCtrlWatcher = this.showSegmentedCtrl.valueChanges.map(data => ({ a: 'showSegmentedCtrl', d: data }));
    this._filterGeometryAdapter.mergeMainFlow([this.showSurveyCtrlWatcher]);
    this._filterGeometryAdapter.mergeMainFlow([this.showSegmentedCtrlWatcher]);

  }
  clearFilter() {

  }
}
