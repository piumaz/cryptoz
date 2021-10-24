import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {map} from "rxjs/operators";
import {UtilsService} from "./utils.service";


@Injectable({
  providedIn: 'root'
})
export class CoinbaseProService {

  constructor(
    private http: HttpClient,
    private utils: UtilsService) { }

  start() {

    /*
    - osserva i tickers
    - se ema12 > ema26 compra
    - se prezzo scende sotto (prezzo + x) vende
    - se prezzo sale, x aumenta in percentuale
    - torna al punto 1
     */

  }


}
