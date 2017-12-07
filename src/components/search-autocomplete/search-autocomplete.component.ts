import { Component, OnInit } from "@angular/core";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { FormControl, Validators } from "@angular/forms";
import { Subscription } from 'rxjs/Subscription';
import { Observable } from "rxjs/Observable";
import { debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import 'rxjs/add/operator/debounceTime'
import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/map'
import { PkkTypeAheadFactory } from "publicCadastral/PublicCadastralHub";

@Component({
	selector: "app-search-autocomplete",
	templateUrl: "./search-autocomplete.component.html",
	styleUrls: ["./search-autocomplete.component.css"]
})
export class SearchAutocompleteComponent implements OnInit {
	stateCtrl: FormControl;
	filteredPkkObject: Observable<any[]>;
	seachProviders: any[] = [];
	activeSearchProvider: any;

	constructor(public PkkTypeAheadFactory: PkkTypeAheadFactory) {
		this.stateCtrl = new FormControl();

		this.seachProviders.push(PkkTypeAheadFactory.createPkkTypeAhead(1, 10)); 
		this.seachProviders.push(PkkTypeAheadFactory.createPkkTypeAhead(5, 10)); 

		this.filteredPkkObject = this.stateCtrl.valueChanges
			.debounceTime(400)
			.distinctUntilChanged()
			.switchMap((term: string) => this.activeSearchProvider.getData(term))
	}
	
	ngOnInit() {
		this.activeSearchProvider = this.seachProviders[0];
	}
}
