import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BaseLayersService } from "./BaseLayersService";
import { OverLaysService } from "./OverLaysService";

import { Observable } from "rxjs/Observable";


@Injectable()
export class FilterGeometryAdapter {

    mainFlow: Observable<any[]>;

    constructor() {
        this.mainFlow = new Observable();
        this.mainFlow.subscribe(x => console.log(x));
    }
}
