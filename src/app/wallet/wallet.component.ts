import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Account, Currency, Ticker} from "../interfaces";

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, OnChanges {

  @Input() USDEUR: number = 1;
  @Input() accounts: Account[] = [];
  @Input() currencies: Currency[] = [];

  @Input() ticker: Ticker | null = null;

  public prices: any = {};
  public items: any[] = [];
  public errorsImages: string[] = [];

  public totEUR: number = 0;
  public totUSDT: number = 0;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes.accounts || changes.currencies) {
      this.buildItems();
    }

    if (changes.ticker && changes.ticker.currentValue) {
      const t = changes.ticker.currentValue;
      const exist = this.items.filter(item => [item.currency + '-EUR', item.currency + '-USDT'].includes(t.product_id));
      if (exist.length) {
        this.prices[t.product_id] = t.price;
        this.buildItems();
      }
    }
  }

  buildItems() {
    this.totEUR = 0;
    this.totUSDT = 0;

    this.items = this.accounts.filter(
      (item: any) => item.available > 0 || ['USDT','EUR'].includes(item.currency)
    ).map(
      (item: any) => {
        const enrich = {
          ...item,
          currencyName: this.getCurrencyName(item.currency),
          priceEUR: this.getPrice(item, 'EUR'),
          priceUSDT: this.getPrice(item, 'USDT'),
          fundsEUR: this.getFunds(item, 'EUR'),
          fundsUSDT: this.getFunds(item, 'USDT'),
        }

        this.totEUR += Number(enrich.fundsEUR);
        this.totUSDT += Number(enrich.fundsUSDT);

        return enrich;
      }
    );
  }

  getAccounts() {
    return this.accounts.filter(
      (item: any) => item.available > 0 || ['USDT','EUR'].includes(item.currency)
    );
  }

  errorImage(symbol: string) {
    this.errorsImages.push(symbol);
  }
  hasImage(symbol: string) {
    return !this.errorsImages.includes(symbol);
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
