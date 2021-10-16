import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {map} from "rxjs/operators";
import {UtilsService} from "./utils.service";

export interface OrdersMarketParams {
  size?: number;
  funds?: number;
}

export interface OrdersLimitParams {
  price: number;
  size: number;
}

export interface CandlesParams {
  granularity: number;
  start: any;
  end: any;
}

@Injectable({
  providedIn: 'root'
})
export class CoinbaseProService {

  private api = 'http://localhost:3000/coinbase';
  // private api = "https://api.pro.coinbase.com";

  constructor(
    private http: HttpClient,
    private utils: UtilsService) { }


  getFees() {
    return this.http.get(`${this.api}/fees`);
  }

  getFills(params: any) {
    return this.http.get(`${this.api}/fills`, {params: params});
  }

  getOrders() {
    return this.http.get(`${this.api}/orders`);
  }

  postOrders(params: any) {
    return this.http.post(`${this.api}/orders`, params);
  }

  buyMarket(productId: string, params: OrdersMarketParams) {
    const data = {
      ...params,
      product_id: productId,
      side: 'buy',
      type: 'market'
    }
    return this.postOrders(data);
  }

  buyLimit(productId: string, params: OrdersLimitParams) {
    const data = {
      ...params,
      product_id: productId,
      side: 'buy',
      type: 'limit'
    }
    return this.postOrders(params);
  }

  sellMarket(productId: string, params: OrdersMarketParams) {
    const data = {
      ...params,
      product_id: productId,
      side: 'sell',
      type: 'market'
  }
    return this.postOrders(data);
  }

  sellLimit(productId: string, params: OrdersLimitParams) {
    const data = {
      ...params,
      product_id: productId,
      side: 'sell',
      type: 'limit'
    }
    return this.postOrders(params);
  }

  postConversions(fromCurrencyId: string, toCurrencyId: string, amount: number) {
    return this.http.post(`${this.api}/conversions`, {
      from: fromCurrencyId,
      to: toCurrencyId,
      amount: amount
    });
  }

  getAccounts() {
    return this.http.get<any[]>(`${this.api}/accounts`);
  }

  getCurrencies() {
    return this.http.get(`${this.api}/currencies`);
  }

  getProducts() {
    return this.http.get(`${this.api}/products`);
  }

  getProduct(productId: string) {
    return this.http.get(`${this.api}/products/${productId}`);
  }

  getProductTicker(productId: string) {
    return this.http.get(`${this.api}/products/${productId}/ticker`);
  }

  getProductStats(productId: string) {
    return this.http.get(`${this.api}/products/${productId}/stats`);
  }

  getProductCandles(productId: string, params: Partial<CandlesParams>) {
    return this.http.get<any[]>(`${this.api}/products/${productId}/candles`, {params: params}).pipe(
      map(results => {
        return results.map(item => {
          const [time, low, high, open, close] = item;
          const timestamp = this.utils.timeOffset(time);
          //[Timestamp, O, H, L, C]
          return [timestamp , open, high, low, close];
        })
      })
    );
  }
}
