import { Component, OnInit } from "@angular/core";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { FormControl, Validators } from "@angular/forms";

import { Observable } from "rxjs/Observable";
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { PkkTypeAhead } from "publicCadastral/PublicCadastralHub";

@Component({
	selector: "app-search-autocomplete",
	templateUrl: "./search-autocomplete.component.html",
	styleUrls: ["./search-autocomplete.component.css"]
})
export class SearchAutocompleteComponent implements OnInit {
	stateCtrl: FormControl;
	filteredPkkObject: Observable<any[]>;

	seachProviders: any[] = [new PkkTypeAhead(1, 10), new PkkTypeAhead(5, 10)];
	activeSearchProvider: any;

	constructor() {
		this.stateCtrl = new FormControl();
		this.filteredPkkObject = this.stateCtrl.valueChanges.pipe(
			// wait 300ms after each keystroke before considering the term
			debounceTime(400),
			// ignore new term if same as previous term
			distinctUntilChanged(),
			// switch to new search observable each time the term changes
			switchMap((term: string) =>  this.activeSearchProvider.getData(term))
		);
	}

	filterStates(name: string) {}

	ngOnInit() {
		
		this.activeSearchProvider = this.seachProviders[0];
	}
}
