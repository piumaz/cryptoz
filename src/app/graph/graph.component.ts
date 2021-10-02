import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {BehaviorSubject, forkJoin, interval, Observable, of, Subject, Subscription} from "rxjs";
import {filter, first, map, takeUntil, tap} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {CoinbaseProService} from "../coinbase-pro.service";

export interface Ticker {
  product_id: string;
  price: number;
  sequence: number;
}

/*
{
    "type": "ticker",
    "trade_id": 20153558,
    "sequence": 3262786978,
    "time": "2017-09-02T17:05:49.250000Z",
    "product_id": "BTC-USD",
    "price": "4388.01000000",
    "side": "buy", // Taker side
    "last_size": "0.03000000",
    "best_bid": "4388",
    "best_ask": "4388.01"
}
 */
@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit, OnDestroy {

  @Input() USDEUR: number = 1;

  @Input() set ticker(ticker: Ticker) {
    if (ticker && this.getSelectedManagedSymbols().includes(ticker.product_id)) {
      this.addTicker(ticker);
      this.calculateData();
    }
  }

  @Input() products: any[] = [];
  @Input() accounts: any[] = [];

  @Output() productAdded: EventEmitter<any> = new EventEmitter();
  @Output() productRemoved: EventEmitter<any> = new EventEmitter();


  public colorScheme = {
    domain: [
      '#FF8A80',
      '#EA80FC',
      '#9ba9f5',
      '#4ad2b3',
      '#f8c11a',
      '#FF9E80',
      '#8e4bdb',
      '#419a2d',
      '#e77fa3',
      '#ee5945',
      '#3288c9',
    ]
  };

  public tickers: any = {};
  public history: any[] = [];

  public uiForm: FormGroup = new FormGroup({});
  public controlCheckSymbol: FormControl = new FormControl(null);

  average: any = {};
  rate: any = {};

  chartData: any[] = [];

  @ViewChild('symbolsInput') symbolsInput: ElementRef<HTMLInputElement> | undefined;
  selectedSymbols: string[] = [];

  private intervalSub: Subscription = new Subscription();
  protected destroy$ = new Subject();

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private coinbaseProService: CoinbaseProService
  ) {}

  ngOnInit(): void {

    this.selectedSymbols = this.getStorage().selectedSymbols || [];
    this.selectedSymbols.forEach(symbol => this.productAdded.emit(symbol));

    this.uiForm = this.fb.group({
      symbols: [null, Validators.required],
    });

    this.intervalSub = interval(1000).subscribe((x: number) => {
      this.mergeTickers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getProductsId(): string[] {
    return this.tickers ? Object.keys(this.tickers) : [];
  }

  addTicker(ticker: Ticker) {
    const productId = ticker.product_id;
    if (!this.tickers[productId]) {
      this.tickers[productId] = [];
    }
    this.tickers[productId].unshift(ticker);

    const limit = 10;
    if (this.tickers[productId][limit]) {
      const first = this.tickers[productId].pop();
      this.tickers[productId].splice(limit, this.tickers[productId].length-2, first);
    }

  }

  mergeTickers() {
    let item: any = {};
    const productsId = this.getProductsId();
    if (productsId.length) {
      productsId.forEach((productId: string) => {
        item[productId] = this.tickers[productId][0]
      });

      if (!this.history[0] || JSON.stringify(this.history[0]) !== JSON.stringify(item)) {
        this.history.unshift(item);
      }

      const limit = 300;
      if (this.history[limit]) {
        const first = this.history.pop();
        this.history.splice(limit, this.history.length-2, first);
      }
    }

    this.buildChartData();
  }

  calculateData() {
    this.getProductsId().forEach((symbol: string) => {
      this.average[symbol] = this.getAverage(symbol);
      this.rate[symbol] = this.getRate(symbol);
    });
  }

  buildChartData() {

    let chartData: any[] = [];

    this.getProductsId().forEach((symbol: string) => {

      let data: any = {
        name: symbol,
        series: []
      };

      const rows = [...this.history].reverse();
      let firstTicker = rows[0][symbol];
      // console.log('symbol', symbol);
      rows.forEach((item: any, i: number) => {

        if(!item[symbol]) {
          item[symbol] = this.tickers[symbol][0];
          firstTicker = item[symbol];
        }

        const ticker = item[symbol];
        // console.log('first', firstTicker);
        // console.log('ticker', ticker);

        const itemSeries = {
          name: i,
          value: this.diff(ticker.price, firstTicker.price),
          price: ticker.price
        };

        data.series.unshift(itemSeries);
      });

      chartData.push(data);

    });

    this.chartData = chartData;
  }

  getAverage(symbol: string) {
    let history = {...this.tickers}[symbol].reverse();
    let sum = 0;

    if (!history.length) return 0;

    history.forEach((item: Ticker, i: number) => {
      sum = sum + Number(item.price);
    });

    let fixed = history[0].price.toString().split('.');
    fixed = fixed[1] ? fixed[1].length : 0;

    const average = (sum / history.length).toFixed(fixed);

    return average;
  }

  getRate(symbol: string) {
    let history: Ticker[] = {...this.tickers}[symbol].reverse();

    const first = history[0];
    const last = history[history.length - 1];

    return this.diff(first.price, last.price);
  }

  diff(from: number, to: number) {
    if (!to) {
      to = from;
    }
    return (((from - to) / from) * 100).toFixed(3);
  }

  selectedManagedSymbol(event: MatAutocompleteSelectedEvent): void {
    this.productAdded.emit(event.option.viewValue);
    this.selectedSymbols.push(event.option.viewValue);
    if (this.symbolsInput) {
      // this.symbolsInput.nativeElement.value = '';
      this.uiForm.get('symbols')?.patchValue(null);
    }
    this.setStorage();
  }

  getSelectedManagedSymbols() {
    // unique vals
    return [...new Set(this.selectedSymbols)];
  }

  removeSelectedManagedSymbols(symbol: string): void {
    this.productRemoved.emit(symbol);

    const index = this.selectedSymbols.indexOf(symbol);

    if (index >= 0) {
      this.selectedSymbols.splice(index, 1);
    }

    delete this.tickers[symbol];

    this.history = this.history.map((item) => {
      delete item[symbol];
      return item;
    });

    this.chartData = this.chartData.filter((item) => {
      return item.name !== symbol;
    });

    this.setStorage();
  }

  getFilteresManagedSymbols(): any[] {
    return this.getManagedSymbols()?.filter((item: any) => {
      return item.id.toLowerCase().includes(this.uiForm.get('symbols')?.value?.toLowerCase());
    });
  }

  getManagedSymbols(): any[] {
    return this.products.filter(
      (item) => ['USDT','EUR'].includes(item.quote_currency)
    ).sort(
      (a: any, b: any) => a.id.localeCompare(b.id)
    );
  }

  getPriceColor(price: number, next: number) {

    if (price > next) {
      return 'green';
    } else if (price < next) {
      return 'red';
    }

    return 'grey';
  }

  getPrice(price: number, productId: string, to: 'EUR' | 'USDT') {

    const currency = productId.split('-')[1];

    if (currency === 'EUR') {
      return to === 'EUR' ? price : price / this.USDEUR;
    }

    return to === 'USDT' ? price : price * this.USDEUR;

  }

  setStorage() {
    const storage: any = {
      selectedSymbols: this.selectedSymbols
    }
    localStorage.setItem('cryptoz.graph', JSON.stringify(storage));
  }
  getStorage(): any {
    const storage = localStorage.getItem('cryptoz.graph') || '{}';
    const storageValue: any = JSON.parse(storage);

    return storageValue;
  }

}
