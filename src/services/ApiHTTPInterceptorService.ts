import { Injectable } from "@angular/core";
import {
	HttpEvent,
	HttpInterceptor,
	HttpHandler,
	HttpRequest
} from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import { environment } from "../environments/environment";

@Injectable()
export class ApiHTTPInterceptorService implements HttpInterceptor {
	intercept(
		req: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {
		let apiReq;
		if (req.url.indexOf("http") === -1) {
			apiReq = req.clone({
				url: `${environment.baseUrl}/${req.url}`
			});
		} else {
			apiReq = req.clone({
				url: `${req.url}`
			});
		}

		return next.handle(apiReq);
	}
}
