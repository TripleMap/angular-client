import { Component, OnInit, ViewChild } from "@angular/core";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { FormControl, Validators } from "@angular/forms";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";

import { MatAutocompleteTrigger } from "@angular/material";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/map";
import "rxjs/add/observable/of";
import "rxjs/add/operator/catch";

import { PkkTypeAheadFactory } from "../../publicCadastral/PublicCadastralHub";
import { MapService } from "../../services/MapService";

@Component({
	selector: "app-search-autocomplete",
	templateUrl: "./search-autocomplete.component.html",
	styleUrls: ["./search-autocomplete.component.css"]
})
export class SearchAutocompleteComponent implements OnInit {
	pkkCtrl: FormControl;
	filteredPkkObject: Observable<any[]>;
	seachProviders: any[] = [];
	activeSearchProvider: any;
	matAutocomplete: any;

	constructor(
		public _pkkTypeAheadFactory: PkkTypeAheadFactory,
		public _mapService: MapService
	) {
		this.pkkCtrl = new FormControl();
		this.filteredPkkObject = this.pkkCtrl.valueChanges
			.debounceTime(300)
			.distinctUntilChanged()
			.filter((term: string) => term.length > 6)
			.switchMap((term: string) =>
				this.activeSearchProvider.getTypeAheadData(term)
			)
			.map(
				(data: any) =>
					data.results && data.results.length > 0
						? data.results
						: [{ value: "Ничего не найдено", type: "warn" }]
			)
			.catch(
				e =>
					e.status === 500
						? Observable.of<any>([
								{
									value: "Не удалось получить данные",
									type: "warn"
								}
							])
						: Observable.of<any>([
								{ value: "Ошибка запроса", type: "warn" }
							])
			);
	}

	ngOnInit() {
		this.seachProviders.push(
			this._pkkTypeAheadFactory.createPkkTypeAhead(1, 10, "ЗУ")
		);
		this.seachProviders.push(
			this._pkkTypeAheadFactory.createPkkTypeAhead(5, 10, "ОКС")
		);
		this.activeSearchProvider = this.seachProviders[0];
	}

	minimalLength = (term: string) => (term && term.length < 6 ? "" : term);

	forceSeacheCadObject(cadObj) {
		if (!cadObj) return;
		this.activeSearchProvider
			.getFeatureData(cadObj.value)
			.subscribe(cadData => this.setViewOnCadData(cadData));
	}

	setViewOnCadData = cadData => {
		if (!cadData) return;
		if (!cadData.center) return;
		this._mapService.updateMapPosition(
			L.Projection.SphericalMercator.unproject(
				L.point(cadData.center.x, cadData.center.y)
			),
			16
		);
	};

	clearAutocomplete = () => this.pkkCtrl.setValue("");
	stopOnEnterPress(e) {
		if (e.keyCode === 13) {
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	}
}
