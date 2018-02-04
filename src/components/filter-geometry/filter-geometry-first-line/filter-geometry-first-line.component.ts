import { Component, AfterViewInit, Input } from "@angular/core";
import {
	FormControl,
	FormGroup,
	FormBuilder,
	Validators
} from "@angular/forms";

import { FilterGeometryAdapter } from "../../../services/FilterGeometryAdapter";
import "rxjs/add/operator/filter";

@Component({
	selector: "filter-geometry-first-line",
	templateUrl: "./filter-geometry-first-line.component.html",
	styleUrls: ["./filter-geometry-first-line.component.css"]
})
export class FilterGeometryFirstLineComponent implements AfterViewInit {
	public firstLine: FormGroup;
	public squareUnits: { ru: string; eng: string }[];
	@Input() isActive: boolean;
	constructor(
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
	};

	ngAfterViewInit(): void {
		this.firstLine.valueChanges
			.debounceTime(300)
			.distinctUntilChanged()
			.filter(this.isValidForm)
			.map(this.pipeFiltersToNumber)
			.filter(this.isFormIsEmpty)
			.subscribe(this._filterGeometryAdapter.mainFlow);
	};
	getErrorMessage = elem => this.firstLine.get(elem).hasError("min") ? "Недопустимое минимальное значение" : this.firstLine.get(elem).hasError("pattern") ? "Значение должно быть числовым" : "";
	isValidForm = () => this.firstLine.status === "VALID";
	isFormIsEmpty = (data: any) => !(data.survey && data.segmented && !data.squareFrom && !data.squareTo && !data.distanceFrom && !data.distanceTo);

	pipeFiltersToNumber = filters => {
		filters.squareFrom = filters.squareFrom ? Number(filters.squareFrom.replace(",", ".")) : null;
		filters.squareTo = filters.squareTo ? Number(filters.squareTo.replace(",", ".")) : null;
		filters.distanceFrom = filters.distanceFrom ? Number(filters.distanceFrom.replace(",", ".")) : null;
		filters.distanceTo = filters.distanceTo ? Number(filters.distanceTo.replace(",", ".")) : null;
		return filters;
	};

	clearForm(): void{
		this.firstLine.get('survey').setValue(true);
		this.firstLine.get('segmented').setValue(true);
		this.firstLine.get('squareFrom').setValue(null);
		this.firstLine.get('squareTo').setValue(null);
		this.firstLine.get('squareUnit').setValue(this.squareUnits[1].eng);
		this.firstLine.get('distanceFrom').setValue(null);
		this.firstLine.get('distanceTo').setValue(null);
	};
}
