import { Request, XHRBackend, XHRConnection } from '@angular/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';


@Injectable() export class ApiHTTPInterseptor extends XHRBackend {
    createConnection(request: Request): XHRConnection {
        if (request.url.startsWith('/')) {
            request.url = environment.baseUrl + request.url;     // prefix base url
        }
        return super.createConnection(request);
    }
}