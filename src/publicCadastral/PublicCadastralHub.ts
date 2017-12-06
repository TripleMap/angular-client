import { Observable } from "rxjs/Observable";
import { HttpModule, HttpClient } from "@angular/common/http";
import 'rxjs/add/operator/map';

class SearchItem {
  constructor(public val: string) {
  }
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
		return this.http.get(fullUrl).map(res => {
          return res.json().results.map(item => {
            return new SearchItem(item);
          });
        });
	}
}
