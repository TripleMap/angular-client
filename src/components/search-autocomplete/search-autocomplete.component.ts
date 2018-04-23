import { Component, ViewChild, OnInit } from "@angular/core";
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
import "rxjs/add/operator/do";
import "rxjs/add/operator/startWith";
import { MapService } from "../../services/MapService";

@Component({
	selector: "app-search-autocomplete",
	templateUrl: "./search-autocomplete.component.html",
	styleUrls: ["./search-autocomplete.component.css"]
})
export class SearchAutocompleteComponent implements OnInit {
	pkkCtrl: FormControl;
	filteredPkkObject: Observable<any[]>;
	seachProviders: any[] = ['Земельные участки', 'Объекты капитального строительства'];
	activeSearchProvider: any;
	matAutocomplete: any;
	cadastralTools: any;
	public activeMediaQuery = "";
	constructor(
		public MapService: MapService,
		public media: ObservableMedia
	) {
		media.subscribe((change: MediaChange) => (this.activeMediaQuery = change ? change.mqAlias : ""));
		this.pkkCtrl = new FormControl();


		this.filteredPkkObject = this.pkkCtrl.valueChanges
			.debounceTime(300)
			.distinctUntilChanged()
			.switchMap((term: string) => term.length > 1 ? this.cadastralTools.getTypeAheadFeatures(term, 10, this.activeSearchProvider === 'ЗУ' ? 'PARCEL' : 'OKS') : Observable.of<any>('filter'))
			.map((data: any) => data.results && data.results.length > 0 ? data.results : data === 'filter' ? [] : [{ value: "Ничего не найдено", type: "warn" }])
			.catch(e => e.status === 500 ? Observable.of<any>([{
				value: "Не удалось получить данные",
				type: "warn"
			}]) : Observable.of<any>([{ value: "Ошибка запроса", type: "warn" }])
			);
	}

	ngOnInit() {
		this.MapService.mapReady.subscribe(mapReady => {
			if (!mapReady) return;
			this.activeSearchProvider = this.seachProviders[0];
			this.cadastralTools = new TDMap.CadastralUtils.CadastralSearchDataService(this.MapService.getMap())
		});
	}

	minimalLength = (term: string) => (term && term.length < 6 ? "" : term);
	forceSeacheCadObject(cadObj) {
		if (!cadObj) return;
		this.cadastralTools.getFeatureByCadastralNumber(cadObj.value, this.activeSearchProvider === 'ЗУ' ? 'PARCEL' : 'OKS')
			.subscribe(cadData => this.setViewOnCadData(cadData));
	}

	setViewOnCadData = cadObjGeoJSON => {
		if (!cadObjGeoJSON || !cadObjGeoJSON.geometry) return;
		this.MapService.TDMapManager.updateMapPosition(
			L.latLng(cadObjGeoJSON.geometry.coordinates[1], cadObjGeoJSON.geometry.coordinates[0]), 16
		);
		new this.MapService.TDMap.Tools.PulseMarker(L.latLng(cadObjGeoJSON.geometry.coordinates[1], cadObjGeoJSON.geometry.coordinates[0]), { fillColor: '#1976d2', color: '#1976d2', timeout: 7000 })
			.addTo(this.MapService.getMap())
	};

	clearAutocomplete = () => this.pkkCtrl.setValue('');
	stopOnEnterPress(e) {
		if (e.keyCode === 13) {
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	}
}
