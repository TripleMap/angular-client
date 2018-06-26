import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";
import { Observable, Subject, Subscription } from "rxjs";
import { MessageService } from '../services/MessageService';
import 'rxjs/add/operator/debounceTime.js';

export let AUTH_LINKS = {
  login: 'api/Accounts/login',
  logout: 'api/Accounts/logout',
  registration: 'api/Accounts/registration',
  getMyInfo: 'api/Accounts/GetMyInfo'
};

interface loginCreditals {
  email: string;
  password: string;
}
interface registerCreaditals {
  username: string;
  email: string;
  password: string;
}
interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role_id: string;
    group_id: string;
    role: {
      id: string;
      name: string;
      description: string;
    },
    group: {
      id: string;
      name: string;
      access: true
    }
  }
}


@Injectable()
export class AuthService {
  public onSubscriber: Subscription;
  constructor(
    public http: HttpClient,
    public router: Router,
    public MessageService: MessageService
  ) {
  }

  login(creditals: loginCreditals) {
    this.http.post(AUTH_LINKS.login, creditals).subscribe((response: LoginResponse) => {
      this.setUserId(response.user.id);
      this.setUserToken(response.token);
      this.setUserRole(response.user.role);
      this.setUserRole(response.user.group);
      this.router.navigate(['tdmap']);
    }, error => {
      if (error.status === 422) {
        this.MessageService.errorMessage('Данные не прошли проверку');
      } else if (error.status !== 500 && error.status !== 401 && error.status !== 404 && error.status !== 0) {
        this.MessageService.errorMessage('Не удалось войти в систему');
      }
    });
  }

  registration(creditals: registerCreaditals) {
    this.http.post(AUTH_LINKS.registration, creditals).subscribe((response: LoginResponse) => {
      this.setUserId(response.user.id);
      this.setUserToken(response.token);
      this.setUserRole(response.user.role);
      this.setUserRole(response.user.group);
      this.router.navigate(['tdmap']);
    }, error => {
      if (error.error.message.message === "Пользователь с таким email уже существует") {
        this.MessageService.errorMessage('Пользователь с таким email уже существует');
      } else {
        this.MessageService.errorMessage('Данные не прошли проверку');
      }
    });
  }

  logout() {
    this.destroyUserCreditals();
    this.router.navigate(['login']);
  }

  setUserId = (id) => window.localStorage.setItem("LOCAL_STORAGE_USER_ID", id);
  getUserId = () => window.localStorage.getItem("LOCAL_STORAGE_USER_ID") ? window.localStorage.getItem("LOCAL_STORAGE_USER_ID") : null

  setUserToken = (token) => window.localStorage.setItem("LOCAL_STORAGE_KEY_ID", token);
  getUserToken = () => window.localStorage.getItem("LOCAL_STORAGE_KEY_ID") ? window.localStorage.getItem("LOCAL_STORAGE_KEY_ID") : null;

  setUserRole = (role) => window.localStorage.setItem("LOCAL_STORAGE_USER_ROLE", role);
  getUserRole = () => window.localStorage.getItem("LOCAL_STORAGE_USER_ROLE") ? window.localStorage.getItem("LOCAL_STORAGE_USER_ROLE") : null;

  setUserGroup = (role) => window.localStorage.setItem("LOCAL_STORAGE_USER_GROUP", role);
  getUserGroup = () => window.localStorage.getItem("LOCAL_STORAGE_USER_GROUP") ? window.localStorage.getItem("LOCAL_STORAGE_USER_GROUP") : null;

  destroyUserCreditals() {
    window.localStorage.removeItem("LOCAL_STORAGE_USER_ID");
    window.localStorage.removeItem("LOCAL_STORAGE_KEY_ID");
    window.localStorage.removeItem("LOCAL_STORAGE_USER_ROLE");
    window.localStorage.removeItem("LOCAL_STORAGE_USER_GROUP");
  }
}



@Injectable()
export class AuthHttpInterceptorService implements HttpInterceptor {
  constructor(public AuthService: AuthService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.AuthService.getUserToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          authorization: `JWT ${token}`
        }
      });
    }

    return next.handle(request);
  }
}
