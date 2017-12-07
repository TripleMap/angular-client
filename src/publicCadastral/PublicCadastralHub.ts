import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { Observable } from "rxjs/Observable";
import { of } from "rxjs/observable/of";
import { catchError, map, tap } from "rxjs/operators";

export class SearchItem {
	id: number;
	name: string;
}
export class PkkTypeAhead {
	pkkObjType: number;
	limit: number;
	apiUrl: string;
	http: HttpClient;
	constructor(type: number, limit: number, http: any) {
		this.apiUrl = "http://pkk5.rosreestr.ru/api/typeahead";
		this.pkkObjType = type;
		this.limit = limit;
		this.http = http;
	}

	getData(text: string): Observable<any> {
		return this.http.get<any[]>(this.apiUrl, {
			params: new HttpParams()
				.set("text", text)
				.set("limit", this.limit.toString())
				.set("type", this.pkkObjType.toString())
		}).map((data:any) => data.results);
	}
}

@Injectable()
export class PkkTypeAheadFactory {
	constructor(private http: HttpClient) {}
	createPkkTypeAhead(type, limit) {
		return new PkkTypeAhead(type, limit, this.http);
	}
}
