import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Observable } from "rxjs";
import "rxjs/add/operator/debounceTime";
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import { MapService } from "../../services/MapService";
import { PkkInfoService, SearchProviderData } from '../../services/PkkInfoService';


@Component({
	selector: "app-search-autocomplete",
	templateUrl: "./search-autocomplete.component.html",
	styleUrls: ["./search-autocomplete.component.css"]
})
export class SearchAutocompleteComponent implements OnInit {
	public pkkCtrl: FormControl;
	public filteredPkkObject: Observable<any[]>;
	public avaliableProvidersData: SearchProviderData[];
	public _activeSearchProvider: SearchProviderData
	get activeSearchProvider() {
		return this._activeSearchProvider;
	}
	set activeSearchProvider(_activeSearchProvider) {
		this._activeSearchProvider = _activeSearchProvider;
		this.PkkInfoService.setActiveSearchProviderData(_activeSearchProvider);
	}

	public matAutocomplete: any;
	public cadastralTools: any;
	public activeMediaQuery = "";
	constructor(
		public MapService: MapService,
		public PkkInfoService: PkkInfoService
	) {
		this.pkkCtrl = new FormControl();
		this.avaliableProvidersData = this.PkkInfoService.getSearchProvidersData();
		this.filteredPkkObject = this.pkkCtrl.valueChanges
			.debounceTime(300)
			.switchMap((term: string) => term.length > 1 ? this.cadastralTools.getTypeAheadFeatures(term, 10, this.PkkInfoService.getActiveSearchProviderData().type) : Observable.of<any>('filter'))
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
			this.activeSearchProvider = this.PkkInfoService.getSearchProvidersData()[0];
			this.cadastralTools = new TDMap.CadastralUtils.CadastralSearchDataService(this.MapService.getMap())
		});
	}

	minimalLength = (term: string) => (term && term.length < 6 ? "" : term);
	forceSeacheCadObject(cadObj) {
		if (!cadObj) return;
		this.cadastralTools.getFeatureByCadastralNumber(cadObj.value, this.PkkInfoService.getActiveSearchProviderData().type)
			.subscribe(cadData => this.setViewOnCadData(cadData));
	}

	setViewOnCadData = cadObjGeoJSON => {
		if (!cadObjGeoJSON || !cadObjGeoJSON.data || !cadObjGeoJSON.data.geometry) return;
		let geometry = cadObjGeoJSON.data.geometry;
		let position = L.latLng(geometry.coordinates[1], geometry.coordinates[0])
		this.MapService.TDMapManager.updateMapPosition(position, 16);
		let marker = new this.MapService.TDMap.Tools.PulseMarker(
			position,
			{
				fillColor: '#2952c2',
				color: '#2952c2',
				timeout: 9000,
				iconSize: [90, 90],
				radius: 5
			}
		);
		marker.addTo(this.MapService.getMap())
	};

	clearAutocomplete = () => this.pkkCtrl.setValue('');
	stopOnEnterPress(e) {
		if (e.keyCode === 13) {
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	}
}
