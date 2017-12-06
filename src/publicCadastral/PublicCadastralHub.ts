import { HttpClient, HttpResponse } from "@angular/common/http";

import { Observable } from "rxjs/Observable";
import { of } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';

export class SearchItem {
	id: number;
	name: string;
}
export class PkkTypeAhead {
	pkkObjType: number;
	limit: number;
	apiUrl: string;
	http: HttpClient;

	constructor(type: number, lim: number) {
		this.pkkObjType = type;
		this.limit = lim;
		this.apiUrl = "https://pkk5.rosreestr.ru/api/typeahead?";
		this.http = new HttpClient();
	}

	getData(text: string): Observable<SearchItem[]>{
		let fullUrl = `${this.apiUrl}text=${text}&limit=${this.limit}&type=${this.pkkObjType}`;
		console.log(text)
		return this.http.get<SearchItem[]>(fullUrl)
			.pipe(
			tap(heroes => console.log(`fetched heroes`))
			);
	}

	
}
