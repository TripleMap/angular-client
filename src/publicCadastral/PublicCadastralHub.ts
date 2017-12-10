import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { Observable } from "rxjs/Observable";
import { catchError, map } from "rxjs/operators";

export class PkkTypeAhead {
	pkkObjType: number;
	limit: number;
	typeAheadUrl: string;
	featuresUrl: string;
	http: HttpClient;
	displayName: string;

	constructor(type: number, limit: number, displayName: string, http: any) {
		this.typeAheadUrl = "http://pkk5.rosreestr.ru/api/typeahead";
		this.featuresUrl = "http://pkk5.rosreestr.ru/api/features";
		this.pkkObjType = type;
		this.limit = limit;
		this.displayName = displayName;
		this.http = http;
	}

	getTypeAheadData(text: string): Observable<any> {
		if (!text) return;
		return this.http
			.get<any[]>(this.typeAheadUrl, {
				params: new HttpParams()
					.set("text", text)
					.set("limit", this.limit.toString())
					.set("type", this.pkkObjType.toString())
			})
			.map((data: any) => data.results);
	}

	getFeatureData(cadNum: string): Observable<any> {
		if (!cadNum) return;
		let clearCadNum = cadNum.split(':').map(elem => Number(elem)).join(':');
		let fullUrl = `${this.featuresUrl}/${this.pkkObjType}/${clearCadNum}`;
		return this.http
			.get<any[]>(fullUrl, {})
			.map((data: any) => data.feature);
	}
}

@Injectable()
export class PkkTypeAheadFactory {
	constructor(private http: HttpClient) { }
	createPkkTypeAhead(type, limit, displayName) {
		return new PkkTypeAhead(type, limit, displayName, this.http);
	}
}
