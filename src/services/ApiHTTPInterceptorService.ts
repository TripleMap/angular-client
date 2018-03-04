import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import { environment } from "../environments/environment";
import { MatSnackBar } from '@angular/material';
import { AppComponent } from '../components/app.component';


@Injectable()
export class ApiHTTPInterceptorService implements HttpInterceptor {
	constructor(public snackBar: MatSnackBar) { }

	errorSnack(message) {
		this.snackBar.open(message, null, {
			duration: 3000,
			panelClass: ['error-snack'],
			horizontalPosition: 'right'
		});
	}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		let apiReq;
		(req.url.indexOf("http") === -1) ? apiReq = req.clone({ url: `${environment.baseUrl}/${req.url}` }) : apiReq = req.clone({ url: `${req.url}` });

		return next.handle(apiReq).do((event: HttpEvent<any>) => { }, (err: any) => {
			if (err.status === 401) this.errorSnack('Вы не авторизованы');
			if (err.status === 404) this.errorSnack('Запрашиваемый ресурс не найден');
			if (err.status === 500) this.errorSnack('Проблемы с интернет соединением');
		});
	}
}
