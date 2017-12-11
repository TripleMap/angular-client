import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BaseLayersService } from "./BaseLayersService";
import { OverLaysService } from "./OverLaysService";

import { Observable } from "rxjs/Observable";
import "rxjs/add/operator/merge";

@Injectable()
export class FilterGeometryAdapter {
	mainFlow: Observable<any[]>;

	constructor() {
		this.mainFlow = new Observable();
	}

	mergeMainFlow(observers) {
		this.mainFlow = this.mainFlow.merge(...observers);
		//this.mainFlow.subscribe(data => {
		//	console.log(data);
		//});
	}
}
