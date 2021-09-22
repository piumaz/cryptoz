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

export interface Currency {
  symbol: string;
  price: number;
}

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit, OnDestroy {

  @Input() products: any[] = [];
  @Input() accounts: any[] = [];
  @Input() set prices(value: any[]) {
    if (value) {
      this.addHistory(value);
      this.calculateData();
    }
  }

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

  public history: any = {};
  public historyRows: any[] = [];

  public uiForm: FormGroup = new FormGroup({});
  public controlCheckSymbol: FormControl = new FormControl(null);

  startedAt: number = 0;

  average: any = {};
  rate: any = {};

  chartData: any[] = [];

  @ViewChild('symbolsInput') symbolsInput: ElementRef<HTMLInputElement> | undefined;
  selectedSymbols: string[] = [];

  protected destroy$ = new Subject();

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private coinbaseProService: CoinbaseProService
  ) {}

  ngOnInit(): void {
    this.uiForm = this.fb.group({
      symbols: [null, Validators.required],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getChartData() {

    let chartData: any[] = [];

    this.getSymbols().forEach((symbol: string) => {

      const history = {...this.history}[symbol].slice(-100);
      let rate = 0;

      let item = {
        name: symbol,
        series: history.map((price: number, i: number) => {

          if(price === null) {
            return {
              name: i.toString(),
              value: 0,
              price: null
            }
          }

          return {
            name: i.toString(),
            value: this.diff(price, history[0]),
            price: price
          }
        })
      }

      chartData.push(item);

    });

    return chartData;
  }

  calculateData() {
    this.getSymbols().forEach((symbol: string) => {
      this.average[symbol] = this.getAverage(symbol);
      this.rate[symbol] = this.getRate(symbol);
    });

    this.chartData = this.getChartData();
  }

  isCheckingSymbol(symbol: string) {
    return this.controlCheckSymbol.value === symbol;
  }

  getAverage(symbol: string) {
    let history = {...this.history}[symbol].reverse();
    let sum = 0;

    if (!history.length) return 0;

    history.forEach((item: number, i: number) => {
      sum = sum + item;
    });

    let fixed = history[0].toString().split('.');
    fixed = fixed[1] ? fixed[1].length : 0;

    const average = (sum / history.length).toFixed(fixed);

    return average;
  }

  getRate(symbol: string) {
    let history = {...this.history}[symbol].reverse();

    const last = history[0];
    const first = history[history.length - 1];

    return this.diff(first, last);
  }

  diff(from: number, to: number) {
    if (!to) {
      to = from;
    }
    return (((from - to) / from) * 100).toFixed(2);
  }

  getLast(symbol: string): any {
    return this.history[symbol] ? this.history[symbol].reverse()[0] : null;
  }

  selectedManagedSymbol(event: MatAutocompleteSelectedEvent): void {
    this.productAdded.emit(event.option.viewValue);
    this.selectedSymbols.push(event.option.viewValue);
    if (this.symbolsInput) {
      // this.symbolsInput.nativeElement.value = '';
      this.uiForm.get('symbols')?.patchValue(null);
    }
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

    delete this.history[symbol];
    this.historyRows = this.historyRows.map((item) => {
      delete item[symbol];
      return item;
    });

    this.chartData = this.chartData.filter((item) => {
      return item.name !== symbol;
    });

  }

  getFilteresManagedSymbols(): any[] {
    return this.getManagedSymbols()?.filter((item: any) => {
      return item.id.toLowerCase().includes(this.uiForm.get('symbols')?.value?.toLowerCase());
    });
  }

  getManagedSymbols(): any[] {
    return this.products.filter(
      (item) => ['USDC','EUR'].includes(item.quote_currency)
    ).sort(
      (a: any, b: any) => a.id.localeCompare(b.id)
    );
  }

  getSymbols(): string[] {
    return this.history ? Object.keys(this.history) : [];
  }

  addHistory(result: any[]) {

    result.forEach((item: any) => {
      if (!this.history[item.symbol]) {
        this.history[item.symbol] = new Array(this.historyRows.length).fill(item.price);
      }
      this.history[item.symbol].push(item.price);
    });

    this.addHistoryRows(result);
  }

  addHistoryRows(result: any[]) {

    const row: any = {};
    result.forEach((item: any) => {
      row[item.symbol] = item.price;
    });

    this.historyRows.unshift(row);
  }

  getPriceColor(price: number, next: number) {

    if (price > next) {
      return 'green';
    } else if (price < next) {
      return 'red';
    }

    return 'grey';
  }
}
