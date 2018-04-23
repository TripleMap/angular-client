import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import { environment } from "../environments/environment";
import { MatSnackBar } from '@angular/material';
import { AppComponent } from '../components/app.component';

import { Subject } from 'rxjs/subject'
import 'rxjs/add/operator/debounceTime.js';
import { Subscription } from 'rxjs/Subscription';
import { Router } from "@angular/router";

@Injectable()
export class ApiHTTPInterceptorService implements HttpInterceptor {
	public onRequestError: Subject<any>;
	public onRequestErrorSubscriber: Subscription;
	constructor(public snackBar: MatSnackBar, public router: Router) {
		this.onRequestError = new Subject();
		this.onRequestErrorSubscriber = this.onRequestError
			.debounceTime(300)
			.subscribe(message => this.errorSnack(message));
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
			if (err.status === 401) {
				const serverError = err.error.error;
				console.log(serverError);
				if (serverError.message === 'Группа пользователей не обслуживается') {
					this.onRequestError.next('Группа пользователей не обслуживается');
				} else if (serverError.message === 'Пользователя с таким email не существует') {
					this.onRequestError.next('Пользователя с таким email не существует');
				} else if (serverError.message === 'Пользователя не существует') {
					this.onRequestError.next('Пользователя не существует');
				} else if (serverError.message === "Не верный пароль") {
					this.onRequestError.next("Не верный пароль");
				} else {
					this.router.navigate(['login']);
					this.onRequestError.next('Вы не авторизованы');
				}
			}
			if (err.status === 404) this.onRequestError.next('Запрашиваемый ресурс не найден');
			if (err.status === 500) this.onRequestError.next('Проблемы с интернет соединением');
			if (err.status === 0) this.onRequestError.next('Сервер не отвечает');
		});
	}
}
