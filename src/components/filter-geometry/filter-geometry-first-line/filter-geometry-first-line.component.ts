import { Component, AfterViewInit,OnDestroy, Input } from "@angular/core";
import {
	FormControl,
	FormGroup,
	FormBuilder,
	Validators
} from "@angular/forms";

import { SelectedFeatureService } from "../../../services/SelectedFeatureService";
import { FilterGeometryAdapter } from "../../../services/FilterGeometryAdapter";
import "rxjs/add/operator/filter";

@Component({
	selector: "filter-geometry-first-line",
	templateUrl: "./filter-geometry-first-line.component.html",
	styleUrls: ["./filter-geometry-first-line.component.css"]
})
export class FilterGeometryFirstLineComponent implements AfterViewInit, OnDestroy {
	public firstLine: FormGroup;
	public squareUnits: { ru: string; eng: string }[];
	@Input() isActive: boolean;
	constructor(
		public _selectedFeatureService: SelectedFeatureService,
		public _filterGeometryAdapter: FilterGeometryAdapter,
		public fb: FormBuilder
	) {
		this.squareUnits = [{
				ru: "м\xB2",
				eng: "m"
			}, {
				ru: "Га",
				eng: "ga"
			}, {
				ru: "км\xB2",
				eng: "km"
			}
		];

		this.firstLine = this.fb.group({
			survey: true,
			segmented: true,
			squareFrom: [null,[Validators.min(0),Validators.pattern("^[0-9]{1,7}([,.][0-9]{0,7})?$")]],
			squareTo: [null,[Validators.min(0),Validators.pattern("^[0-9]{1,7}([,.][0-9]{0,7})?$")]],
			squareUnit: this.squareUnits[1].eng,
			distanceFrom: [null,[Validators.min(0),Validators.pattern("^[0-9]{1,7}([,.][0-9]{0,7})?$")]],
			distanceTo: [null,[Validators.min(0),Validators.pattern("^[0-9]{1,7}([,.][0-9]{0,7})?$")]]
		});
	}

	ngAfterViewInit(): void {
		this.firstLine.valueChanges
			.debounceTime(300)
			.distinctUntilChanged()
			.filter(this.isValidForm)
			.map(this.pipeFiltersToNumber)
			.subscribe(this._filterGeometryAdapter.mainFlow);
	}
	getErrorMessage = elem => this.firstLine.get(elem).hasError("min") ? "Недопустимое минимальное значение" : this.firstLine.get(elem).hasError("pattern") ? "Значение должно быть числовым" : "";
	isValidForm = () => this.firstLine.status === "VALID";

	pipeFiltersToNumber = filters => {
		filters.squareFrom = filters.squareFrom ? Number(filters.squareFrom.replace(",", ".")) : null;
		filters.squareTo = filters.squareTo ? Number(filters.squareTo.replace(",", ".")) : null;
		filters.distanceFrom = filters.distanceFrom ? Number(filters.distanceFrom.replace(",", ".")) : null;
		filters.distanceTo = filters.distanceTo ? Number(filters.distanceTo.replace(",", ".")) : null;

		return filters;
	};

	ngOnDestroy() {
		
	}
}
