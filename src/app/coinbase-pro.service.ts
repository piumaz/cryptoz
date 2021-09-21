import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {map} from "rxjs/operators";

export interface OrdersMarketParams {
  size?: number;
  funds?: number;
}
export interface OrdersLimitParams {
  price: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class CoinbaseProService {

  private api = 'http://localhost:3000/coinbase';

  constructor(private http: HttpClient) { }


  getFees() {
    return this.http.get(`${this.api}/fees`);
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
    return this.http.get(`${this.api}/accounts`);
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
}
