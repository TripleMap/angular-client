import { Component, OnInit } from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormBuilder,
  Validators
} from "@angular/forms";

import { SelectedFeatureService } from "../../services/SelectedFeatureService";
import { FilterGeometryAdapter } from "../../services/FilterGeometryAdapter";

import "rxjs/add/operator/filter";

@Component({
  selector: "filter-geometry",
  templateUrl: "./filter-geometry.component.html",
  styleUrls: ["./filter-geometry.component.css"]
})
export class FilterGeometryComponent implements OnInit {
  public firstLine: FormGroup;
  public squareUnits: { ru: string; eng: string }[];

  constructor(
    public _selectedFeatureService: SelectedFeatureService,
    public _filterGeometryAdapter: FilterGeometryAdapter,
    public fb: FormBuilder
  ) {
    this.squareUnits = [
      {
        ru: "м\xB2",
        eng: "m"
      },
      {
        ru: "Га",
        eng: "ga"
      },
      {
        ru: "км\xB2",
        eng: "km"
      }
    ];

    this.firstLine = this.fb.group({
      survey: true,
      segmented: true,
      squareFrom: [null, Validators.min(0)],
      squareTo: [null, Validators.min(0)],
      squareUnit: this.squareUnits[1],
      distanceFrom: [null, Validators.min(0)],
      distanceTo: [null, Validators.min(0)]
    });
  }

  ngOnInit() {}
  clearFilter() {}
  ngAfterViewInit(): void {
    this.firstLine.valueChanges
      .debounceTime(300)
      .distinctUntilChanged()
      .filter(this.isValidForm)
      .subscribe(this._filterGeometryAdapter.mainFlow);
  }

  isValidForm = () => this.firstLine.status === "VALID";
}
