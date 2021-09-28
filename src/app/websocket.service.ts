import { Injectable } from "@angular/core";
import {Observer, Subject, timer} from "rxjs";
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {delayWhen, retryWhen, tap} from "rxjs/operators";
import {WebSocketMessage} from "rxjs/internal/observable/dom/WebSocketSubject";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  public wsSubject$: WebSocketSubject<WebSocketMessage>;

  constructor() {
    const wsSubjectConfig = {
      url: 'wss://ws-feed.pro.coinbase.com',
      // added this to the config object
      closeObserver: {
        // this is triggered when connection is closed
        next: (event: any) => {
          if (!event.wasClean) {
            this.connect();
          }
        },
      },
    }
    this.wsSubject$ = webSocket(wsSubjectConfig);
  }

  connect() {
    this.wsSubject$
      .pipe(
        retryWhen((errors) => errors.pipe(delayWhen((val) => timer(val * 1000))))
      )
      .subscribe();
  }

  disconnect() {
    this.wsSubject$.complete();
  }

  send(message: any) {
    this.wsSubject$.next(message);
  }
}
