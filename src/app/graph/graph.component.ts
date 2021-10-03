import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {interval, Subject, Subscription} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {Account, Product, Ticker} from "../interfaces";

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit, OnDestroy {

  @Input() USDEUR: number = 1;

  @Input() set ticker(ticker: Ticker) {
    if (ticker && this.selected.includes(ticker.product_id)) {
      this.addTicker(ticker);
      this.calculateData();
    }
  }

  @Input() selected: string[] = [];

  @Input() products: Product[] = [];
  @Input() accounts: Account[] = [];

  @Output() added: EventEmitter<string> = new EventEmitter();
  @Output() removed: EventEmitter<string> = new EventEmitter();


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

  average: any = {};
  rate: any = {};

  chartData: any[] = [];

  @ViewChild('symbolsInput') symbolsInput: ElementRef<HTMLInputElement> | undefined;

  private intervalSub: Subscription = new Subscription();
  protected destroy$ = new Subject();

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
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

  getTickersProductsId(): string[] {
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
    const productsId = this.getTickersProductsId();
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

      this.buildChartData();
    }

  }

  calculateData() {
    this.getTickersProductsId().forEach((symbol: string) => {
      this.average[symbol] = this.getAverage(symbol);
      this.rate[symbol] = this.getRate(symbol);
    });
  }

  buildChartData() {

    let chartData: any[] = [];

    this.getTickersProductsId().forEach((symbol: string) => {

      let data: any = {
        name: symbol,
        series: []
      };

      const rows = [...this.history].reverse();
      let firstTicker = rows[0][symbol];
      rows.forEach((item: any, i: number) => {

        if(!item[symbol]) {
          item[symbol] = this.tickers[symbol][0];
          firstTicker = item[symbol];
        }

        const ticker = item[symbol];

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
    this.added.emit(event.option.viewValue);
    if (this.symbolsInput) {
      this.uiForm.get('symbols')?.patchValue(null);
    }
  }

  removeSelectedManagedSymbols(symbol: string): void {
    this.removed.emit(symbol);

    delete this.tickers[symbol];

    this.history = this.history.map((item) => {
      delete item[symbol];
      return item;
    });

    this.chartData = this.chartData.filter((item) => {
      return item.name !== symbol;
    });
  }

  getFilteresManagedSymbols(): any[] {
    return this.products.filter((item: any) => {
      return item.id.toLowerCase().includes(this.uiForm.get('symbols')?.value?.toLowerCase());
    });
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
}
