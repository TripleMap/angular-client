import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import { environment } from "../environments/environment";
import { MatSnackBar } from '@angular/material';
import { AppComponent } from '../components/app.component';

import { Subject } from 'rxjs/subject'
import 'rxjs/add/operator/debounceTime.js';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export class ApiHTTPInterceptorService implements HttpInterceptor {
	public onSaveMessageSubject: Subject<any>;
	public onSaveSubscriber: Subscription;
	constructor(public snackBar: MatSnackBar) {
		this.onSaveMessageSubject = new Subject();
		this.onSaveSubscriber = this.onSaveMessageSubject
			.debounceTime(300)
			.subscribe(success => { }, error => {
				this.errorSnack(error);
			});
	}

	errorSnack(message) {
		this.snackBar.open(message, null, {
			duration: 5000,
			panelClass: ['error-snack'],
			horizontalPosition: 'right'
		});
	}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		let apiReq;
		(req.url.indexOf("http") === -1) ? apiReq = req.clone({ url: `${environment.baseUrl}/${req.url}` }) : apiReq = req.clone({ url: `${req.url}` });

		return next.handle(apiReq).do((event: HttpEvent<any>) => { }, (err: any) => {
			if (err.status === 401) this.onSaveMessageSubject.error('Вы не авторизованы');
			if (err.status === 404) this.onSaveMessageSubject.error('Запрашиваемый ресурс не найден');
			if (err.status === 500) this.onSaveMessageSubject.error('Проблемы с интернет соединением');
			if (err.status === 0) this.onSaveMessageSubject.error('Сервер не отвечает');
		});
	}
}
