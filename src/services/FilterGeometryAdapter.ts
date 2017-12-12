import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BaseLayersService } from "./BaseLayersService";
import { OverLaysService } from "./OverLaysService";

import { Subject } from "rxjs/Subject";

@Injectable()
export class FilterGeometryAdapter {
	public mainFlow: Subject<any>;

	constructor() {
		this.mainFlow = new Subject();
		this.mainFlow.subscribe(this.updateFilters);
	}

	updateFilters(element){
		console.log(element);
	}
}
