import { Component, OnInit } from "@angular/core";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { FormControl, Validators } from "@angular/forms";

import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';

import { PkkTypeAhead } from "publicCadastral/PublicCadastralHub";

@Component({
	selector: "app-search-autocomplete",
	templateUrl: "./search-autocomplete.component.html",
	styleUrls: ["./search-autocomplete.component.css"]
})
export class SearchAutocompleteComponent implements OnInit {
	stateCtrl: FormControl;
	filteredStates: Observable<any[]>;

	seachProviders: any[] = [new PkkTypeAhead(1, 10), new PkkTypeAhead(5, 10)];
	activeSearchProvider: any;

	constructor() {
		this.stateCtrl = new FormControl();
		this.filteredStates = this.stateCtrl.valueChanges
			.debounceTime(400)
			.distinctUntilChanged()
			.switchMap(term => {console.log(term); return this.activeSearchProvider.getData(term)})
			.subscribe(data => console.log(data));
	}

	filterStates(name: string) {}

	ngOnInit() {
		
		this.activeSearchProvider = this.seachProviders[0];
	}
}
