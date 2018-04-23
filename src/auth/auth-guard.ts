import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService, AUTH_LINKS } from './auth-service';
import { Observable } from "rxjs/Observable";
import { HttpClient, HttpParams } from "@angular/common/http";
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(public AuthService: AuthService, public router: Router, public http: HttpClient) { }
  canActivate(): Observable<boolean> | boolean {
    const token = this.AuthService.getUserToken();
    if (!token) {
      this.router.navigate(['login']);
      return false;
    } else {
      return this.http.get(AUTH_LINKS.getMyInfo).map(user => {
        return true;
      }).catch((error) => {
        this.router.navigate(['login']);
        return Observable.of(false);
      });
    }
  }
}