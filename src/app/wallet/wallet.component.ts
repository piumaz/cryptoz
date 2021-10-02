import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Ticker} from "../graph/graph.component";

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {

  @Input() USDEUR: number = 1;
  @Input() accounts: any[] = [];
  @Input() currencies: any[] = [];

  @Input() set ticker(value: Ticker) {
    if (value) {
      this.prices[value.product_id] = value.price;
    }
  }

  public prices: any = {};

  constructor() { }

  ngOnInit(): void {
  }

  getAccounts() {
    return this.accounts.filter(
      (item: any) => item.available > 0 || ['USDT','EUR'].includes(item.currency)
    );
  }

  getCurrencyName(symbol: string) {
    const filtered: any[] = this.currencies?.filter((item: any) => item.id == symbol);
    return filtered.length ? filtered[0].name : null;
  }

  getPrice(account: any, to: 'EUR' | 'USDT') {

    const currency = account.currency;

    let productId = currency + '-' + to;
    let price = this.prices[productId];
    if (price) {
      return Number(price);
    }

    if (to === 'EUR') {
      productId = account.currency + '-USDT';
      price = this.prices[productId];
      if (price) {
        return Number(price) * this.USDEUR;
      }
    }

    if (to === 'USDT') {
      productId = account.currency + '-EUR';
      price = this.prices[productId];
      if (price) {
        return Number(price) / this.USDEUR;
      }
    }

    return null;
  }

  getFunds(account: any, to: 'EUR' | 'USDT') {

    const currency = account.currency;

    if (currency === 'USDT') {
      return to === 'USDT' ? account.available : account.available * this.USDEUR;
    }
    if (currency === 'EUR') {
      return to === 'EUR' ? account.available : account.available / this.USDEUR;
    }

    let productId = account.currency + '-' + to;
    let price = this.prices[productId];
    if (price) {
      return price * account.available;
    }

    if (to === 'EUR') {
      productId = account.currency + '-USDT';
      price = this.prices[productId];
      if (price) {
        return price * account.available * this.USDEUR;
      }
    }

    if (to === 'USDT') {
      productId = account.currency + '-EUR';
      price = this.prices[productId];
      if (price) {
        return price * account.available / this.USDEUR;
      }
    }

    return null;
  }
}
