import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BaseLayersService } from "./BaseLayersService";
import { OverLaysService } from "./OverLaysService";

import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/merge';

@Injectable()
export class FilterGeometryAdapter {
	mainFlow: Observable<any[]>;

	constructor() {

	}

	mergeMainFlow(observers) {
		this.mainFlow = Observable.merge(...observers);
		this.mainFlow.subscribe(data => {
			console.log(data);
		});
	}
}
