import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {first, mergeMap} from 'rxjs/operators';
import {
    HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor() {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Consider only adding the auth header to API requests as this will add it to all HTTP requests.
    return next.handle(this.addToken(request));
  }

  private addToken(request: HttpRequest<any>): HttpRequest<any> {
    // NOTE: DO NOT try to immediately setup this selector in the constructor or as an assignment in a
    // class member variable as there's no stores available when this interceptor fires fires up and
    // as a result it'll throw a runtime error.
    const store = localStorage.getItem('cryptoz.CBAUTH') || '{}';
    const CBAUTH = JSON.parse(store);

    const timestamp = Date.now() / 1000;

    const requestPath = request.url;

    const method = request.method.toUpperCase();

    const data = request.body;
    const body = (method === 'GET' || !data) ? '' : JSON.stringify(data);

    // create the prehash string by concatenating required parts
    const what = timestamp + method + requestPath + body;

    const key       = CryptoJS.enc.Base64.parse(CBAUTH.secret);
    const sign      = CryptoJS.HmacSHA256(what, key).toString(CryptoJS.enc.Base64);



    request = request.clone({
      setHeaders: {
        //'CB-ACCESS-KEY': CBAUTH.public,
        //'CB-ACCESS-SIGN': sign,
        //'CB-ACCESS-TIMESTAMP': timestamp.toString(),
        //'CB-ACCESS-PASSPHRASE': CBAUTH.phrase
      }
    });


    return request;
  }

}


