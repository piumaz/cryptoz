import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, interval, Observable, of, Subscription} from "rxjs";
import {filter, first, map, tap} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";


export interface Currency {
  symbol: string;
  price: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public currencyMetaData: any = {
    BTC: {
      name: 'bitcoin'
    },
    ETH: {
      name: 'ethereum'
    },
    ADA: {
      name: 'cardano'
    },
    SOL: {
      name: 'solana'
    },
    MATIC: {
      name: 'matic-network'
    },
    DOGE: {
      name: 'dogecoin'
    },
    XTZ: {
      name: 'tezos'
    },
    SHIB: {
      name: 'shiba-inu'
    }
  }

  public colorScheme = {
    domain: [
      '#FF8A80',
      '#EA80FC',
      '#8C9EFF',
      '#80D8FF',
      '#A7FFEB',
      '#CCFF90',
      '#f8c11a',
      '#FF9E80',
      '#8e4bdb',
      '#e77fa3',
      '#419a2d',
      '#ee5945',
    ]
  };

  private intervalSub: Subscription = new Subscription();
  private prices$: BehaviorSubject<Currency[]> = new BehaviorSubject<Currency[]>([]);
  public history: any = {};
  public historyRows: any[] = [];
  public messages: any[] = [];

  public uiForm: FormGroup = new FormGroup({});
  public controlCheckSymbol: FormControl = new FormControl(null);

  isStarted: boolean = false;
  isLoading: boolean = false;

  average: any = {};
  rate: any = {};

  chartData: any[] = [];

  @ViewChild('symbolsInput') symbolsInput: ElementRef<HTMLInputElement> | undefined;
  selectedSymbols: string[] = [];

  constructor(private http: HttpClient,
              private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.uiForm = this.fb.group({
      minutes: [1, Validators.required],
      symbols: [null, Validators.required],
    });

    this.check();
  }

  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  getChartData() {

    let chartData: any[] = [];

    this.getSymbols().forEach((symbol: string) => {

      const history = {...this.history}[symbol];
      let rate = 0;

      let item = {
        name: symbol,
        series: history.map((price: number, i: number) => {
          const first = price;
          const last = history[i+1] || price;

          rate = rate + -(((first - last) / first) * 100);

          return {
            name: i.toString(),
            value: rate.toFixed(2),
            price: last
          }
        })
      }

      chartData.push(item);

    });

    return chartData;
  }

  clear() {
    console.log('clear');
    this.history = [];
    this.chartData = [];
  }

  stop() {
    console.log('stop');
    this.isStarted = false;
    this.intervalSub.unsubscribe();
  }

  start() {
    if (!this.getSelectedManagedSymbols().length) {
      return;
    }

    console.log('start');
    this.isStarted = true;
    const milliseconds = this.uiForm.value.minutes * 60 * 1000;
    const symbols = this.getSelectedManagedSymbols();
    this.loadPrices(symbols);
    this.intervalSub = interval(milliseconds).subscribe((x: number) => {
      console.log('Load prices:', x);
      this.loadPrices(symbols);
    });
  }

  check() {
    // controllo i prezzi del momento e li salvo
    this.prices$.pipe(
      filter((result: any) => result.length)
    ).subscribe((result: any) => {

      result.forEach((currency: any) => {

        if (this.isCheckingSymbol(currency.symbol)) {
          const lastCurrencyPrice = this.getLast(currency.symbol);

          if (!lastCurrencyPrice) return;

          if (currency.price < lastCurrencyPrice) {
            // se il nuovo prezzo è più basso di X

            // trovo la moneta che ha avuto il rialzo maggiore
            const suggestSymbol = this.findHigherRise();
            if (suggestSymbol) {
              // invio il messaggio
              this.message(`Cambia ${currency.symbol} con ${suggestSymbol}`);
            }
          }
        }


      });


      this.addHistory(result);

      this.calculateData();
    });

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

  message(message: string) {
    //alert(message);
    this.messages.unshift({
      date: Date.now(),
      message: message
    });
    this.messages.slice(0,4);
  }

  getAverage(symbol: string) {
    let history = {...this.history}[symbol].reverse();
    let sum = 0;

    if (!history.length) return 0;

    history.forEach((item: number) => {
      sum = sum + item;
    });

    const average = (sum / history.length).toFixed(2);

    return average;
  }

  getRate(symbol: string) {
    let history = {...this.history}[symbol].reverse();

    const last = history[0];
    const first = history[history.length - 1];

    // ((Valore finale-Valore iniziale)/Valore iniziale) x 100
    const rate = (((first - last) / first) * 100).toFixed(2);

    return rate;
  }

  /**
   * Ritorna la moneta che ha avuto il maggiore rialzo
   */
  findHigherRise(): string | null {
    const symbols = this.getSymbols();

    let topSymbol: string = '';
    let topSymbolScore: number = 0;

    let higher: any = {};

    symbols.forEach((symbol: string) => {

      higher[symbol] = 0;

      let history = {...this.history}[symbol].reverse();

      history.forEach((item: number, i: number) => {
        if (history[i+1]) {
          if (item > history[i+1]) {
            higher[symbol]++;
          }
          if (item < history[i+1]) {
            higher[symbol]--;
          }
        }

      });


      if (higher[symbol] > topSymbolScore) {
        topSymbolScore = {...higher[symbol]};
        topSymbol = symbol;
      }

    });

    console.log(higher);

    console.log(topSymbol);

    return topSymbol || null;
  }

  getLast(symbol: string): any {
    return this.history[symbol] ? this.history[symbol].reverse()[0] : null;
  }

  loadPrices(symbols: string[]): void {

    let ids: string = '';
    symbols.forEach((item: string) => {
      ids += this.currencyMetaData[item].name + ',';
    });

    const url = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=eur&ids=${ids}`;
    this.isLoading = true;
    this.http.get(url).pipe(
      map((result: any) => {

        let r: any[] = [];
        symbols.forEach((item: string) => {
          const name = this.currencyMetaData[item].name;
          r.push({
            symbol: item,
            price: result[name].eur
          });
        });

        return r;
      })
    ).subscribe((result) => {
      this.prices$.next(result);
      this.isLoading = false;
    });


  }

  selectedManagedSymbol(event: MatAutocompleteSelectedEvent): void {
    this.selectedSymbols.push(event.option.viewValue);
    if (this.symbolsInput) {
      this.symbolsInput.nativeElement.value = '';
      this.uiForm.get('symbols')?.patchValue(null);
    }
  }

  getSelectedManagedSymbols() {
    // unique vals
    return [...new Set(this.selectedSymbols)];
  }

  removeSelectedManagedSymbols(symbol: string): void {
    const index = this.selectedSymbols.indexOf(symbol);

    if (index >= 0) {
      this.selectedSymbols.splice(index, 1);
    }
  }

  getManagedSymbols(): string[] {
    return Object.keys(this.currencyMetaData).filter((value) => {
      return !this.getSelectedManagedSymbols().includes(value);
    });
  }

  getSymbols(): string[] {
    return this.history ? Object.keys(this.history) : [];
  }

  addHistory(result: any[]) {

    result.forEach((item: any) => {
      if (!this.history[item.symbol]) {
        this.history[item.symbol] = [];
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
