import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, forkJoin, interval, Observable, of, Subject, Subscription, throwError, timer} from "rxjs";
import {concatMap, filter, finalize, map, mergeMap, retry, take, takeUntil, tap} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {CoinbaseProService} from "../coinbase-pro.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {WebsocketService} from "../websocket.service";
import {Alert, Candle, Periods, Product, Ticker, TrendObserver} from "../interfaces";
import {UtilsService} from "../utils.service";
import {PatternService} from "../pattern.service";


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  public USDEUR: number = 1;

  public productsTicker: string[] = [];
  public productsGraph: string[] = [];
  public trendObserver: TrendObserver[] = [];
  public alerts: Alert[] = [];

  public period: number = 60;

  public currencies$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public products$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public accounts$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public orders$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public fills$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public ticker$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public candles$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public graph$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public percentage$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public ema$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private intervalSub: Subscription = new Subscription();

  protected destroy$ = new Subject();

  public startedAt: number = new Date().valueOf();
  public swapLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private coinbaseProService: CoinbaseProService,
    private wsService: WebsocketService,
    private notify: MatSnackBar,
    private utils: UtilsService,
    private patternService: PatternService,
  ) {}

  ngOnInit(): void {

    const storage = this.getStorage();
    timer(0, 2000).subscribe((x: number) => {
      this.setStorage();
    });


    this.productsGraph = storage.productsGraph || [];
    this.trendObserver = storage.trendObserver || [];
    this.alerts = storage.alerts || [];
    this.productsTicker = storage.productsTicker || [];
    this.subscribeWsTickers([
      ...this.productsTicker,
      ...this.productsGraph
    ]);

    this.loadCurrencies();
    this.loadProducts();
    this.loadAccounts();
    this.loadOrders();

    this.loadTickers();
    this.loadWsTickers();

    this.loadIntervalCandle(60);

    this.candles$.pipe(
      filter(v => v !== null),
      tap((results) => {
        this.graph$.next({
          ...results,
          name: results.productId,
          data: results.candles,
          type: 'candlestick',
        });
      }),
      tap((results: any) => {
        const emaPeriods = [12,26,90];
        emaPeriods.forEach((period, i) => {
          const ema = this.ema([...results.candles].reverse(), period);

          this.utils.sleep(10).then(() => {
            this.graph$.next({
              ...results,
              name: `${results.productId}-ema${period}`,
              type: 'line',
              color: ['#FAD02C', '#2cdbfa', '#136978'][i],
              data: ema
            });
          });

        });
      }),
      tap((results: any) => {
        // test patterns
        const candles = results.candles;
        const productId = results.productId;

        const detect = this.patternService.check(candles);
        if (detect) {
          console.log(productId)
        }

      }),
      tap((results: any) => {
        const percentage = results.candles.map((item: any, i: number) => {
          const [timestamp , open, high, low, close] = item;
          return [timestamp, this.utils.diff(close, results.candles[results.candles.length - 1][4]), close];
        });

        this.percentage$.next({
          ...results,
          name: results.productId,
          data: percentage,
          type: 'line',
        });
      })
    ).subscribe();

  }

  stopIntervalCandle() {
    if (this.intervalSub) this.intervalSub.unsubscribe();
  }
  restartItervalCandle() {
    this.loadIntervalCandle(<Periods>this.period);
  }
  loadIntervalCandle(granularity: Periods = 60) {
    if (this.intervalSub) this.intervalSub.unsubscribe();
    this.intervalSub = timer(0, granularity * 1000).subscribe((x: number) => {
      this.productsGraph.forEach(productId => {
        this.loadCandles(productId, granularity);
      });
    });
  }

  setPeriod(period: number) {
    this.period = period;
    this.candles$.next(null);
    this.graph$.next(null);
    this.percentage$.next(null);
    this.loadIntervalCandle(<Periods>period);
  }

  opendCandles(productId: string) {
    this.loadCandles(productId, <Periods>this.period);
  }

  loadCandles(productId: string, granularity: Periods = 60) {

    const period = 300 * granularity * 1000;
    const start = Date.now();
    const end = start - period;

    this.coinbaseProService.getProductCandles(productId, {
      granularity: granularity,
      start: new Date(end).toUTCString(),
      end: new Date(start).toUTCString()
    }).pipe(
      concatMap((v1: any[]) => {

        const start = v1[v1.length-1][0] + ((new Date()).getTimezoneOffset() * 60 * 1000);
        const end = start - period;

        return this.coinbaseProService.getProductCandles(productId, {
          granularity: granularity,
          start: new Date(end).toUTCString(),
          end: new Date(start).toUTCString()
        }).pipe(
          map(v2 => [...v1, ...v2])
        )
      })
    ).subscribe(
      (results) => {
        this.candles$.next({
          productId: productId,
          candles: results
        });
      },
      (err) => {
        this.candles$.error(err);
      }
    );
  }

  loadPastAverage(productId: string, days: number, granularity: 60 | 300 | 900 | 3600 | 21600 | 86400 = 60, candles: any[], color?: string) {

    const maxResults = 300;
    const period = maxResults * granularity * 1000;
    const daysx = (days * 86400) * 1000;

    const start = Date.now() - daysx - period;
    const end = Date.now() - daysx;

    this.coinbaseProService.getProductCandles(productId, {
      granularity: granularity,
      start: new Date(start+1).toUTCString(),
      end: new Date(end-1).toUTCString()
    }).pipe(
      map((v: any[]) => {
        return v.map((item: any, i) => {
          const [time, low, high, open, close] = item;
          const timestamp = candles[i][0];
          const r = (candles[i][4] + close) / 2;
          return [timestamp, r];
        });

      })
    ).subscribe(
      (result) => {

        this.candles$.next({
          name: `${productId}-average${days}`,
          type: 'line',
          color: color,
          data: result
        });

      },
      (err) => {
        this.ema$.error(err)
      }
    );
  }

  ema(candles: any[], time_period: number) {

    const sum = candles.reduce((a, b) => a + b[4], 0);
    const sma = sum / candles.length;

    const k = 2/(time_period + 1);

    let ema: any[] = [];
    ema.push([candles[0][0], sma]); //candles[0][4];
    candles.forEach((candle, i) => {
      if (!i) return;
      const [timestamp , open, high, low, close] = candle;
      const point: number = (close * k) + (ema[i-1][1] * (1-k));
      ema.push([timestamp, point]);
    });

    return ema;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intervalSub.unsubscribe();
  }

  addProductOnGraph(productId: string) {
    if (!this.productsGraph.includes(productId)) {
      this.productsGraph.push(productId);
      this.opendCandles(productId);
      this.addProductTicker(productId);
    }
  }
  removeProductOnGraph(productId: string) {
    const index = this.productsGraph.indexOf(productId);
    if (index >= 0) {
      this.productsGraph.splice(index, 1);
      this.removeProductTicker(productId);
    }
  }

  addAlert(item: any) {
    this.alerts.unshift(item);
    this.addProductTicker(item.product_id);
  }
  removeAlert(index: number) {
    const item = this.alerts.splice(index, 1)[0];
    this.removeProductTicker(item.product_id);
  }

  addTrendObserver(item: any) {
    this.trendObserver.unshift(item);
    this.trendObserver = [...this.trendObserver];
    this.addProductTicker(item.product_id);
  }
  updateTrendObserver(item: any) {
    const updated = this.trendObserver.map(ob => {
      if (ob.product_id === item.product_id && ob.price === item.price) {
        return item;
      }

      return ob;
    });
    this.trendObserver = [...updated];
  }
  removeTrendObserver(index: number) {
    const item = this.trendObserver.splice(index, 1)[0];
    this.trendObserver = [...this.trendObserver];
    this.removeProductTicker(item.product_id);
  }

  addProductTicker(productId: string) {
    if (!this.productsTicker.includes(productId)) {
      this.productsTicker.push(productId);
      this.subscribeWsTickers([productId]);
    }
  }

  removeProductTicker(productId: string) {
    this.productsTicker = this.productsTicker.filter(
      (v: string) => v !== productId
    );
    this.unsubscribeWsTickers([productId]);
  }

  getProductsTicker() {
    return this.productsTicker;
  }

  subscribeWsTickers(productIds: string[]) {
    if (!productIds.length) return;

    this.wsService.send({
      "type": "subscribe",
      "product_ids": productIds,
      "channels": [
        "ticker"
      ]
    });
  }

  unsubscribeWsTickers(productIds: string[]) {
    productIds = productIds.filter(v => v !== 'USDT-EUR');
    if (!productIds.length) {
      return;
    }

    this.wsService.send({
      "type": "unsubscribe",
      "product_ids": productIds,
      "channels": [
        "ticker"
      ]
    });
  }

  loadWsTickers() {
    this.wsService.connect();

    this.subscribeWsTickers(['USDT-EUR']);

    this.products$.pipe(
      filter(v => v !== null),
      take(1),
      map(products => products.map((product: Product) => product.id)),
      tap((results) => this.subscribeWsTickers(results))
    ).subscribe();


    this.wsService.wsSubject$.pipe(
      retry()
    ).subscribe(
      (v: any) => {
        if (v.type === 'ticker') {
          if (v.product_id === 'USDT-EUR') {
            this.USDEUR = v.price;
          }

          this.ticker$.next(v);
        }

        if (v.type === 'subscriptions') {
          const tickerChannel = v.channels.filter((item: any) => item.name === 'ticker');
          if (tickerChannel[0]) {
            this.productsTicker = tickerChannel[0].product_ids;
          }
        }

      }
    );
  }

  loadTickers() {
    // per tutti gli account con soldi
    // più quelli che voglio osservare
    const accountsWithMoney = this.accounts$.getValue().filter(
      (item: any) => item.available > 0 && !['EUR','USDT'].includes(item.currency)
    ).map(
      (item: any) => item.currency + '-USDT'
    );

    const productsTrendObserver = this.trendObserver.map(v => v.product_id);

    const products = [...new Set([
      ...accountsWithMoney,
      ...this.productsGraph,
      ...productsTrendObserver
    ])];

    products.forEach((productId: string) => {
      this.coinbaseProService.getProductTicker(productId).pipe(
        takeUntil(this.destroy$),
      ).subscribe(
        result => this.ticker$.next({
          ...result,
          product_id: productId
        }),
        err => this.ticker$.error(err)
      );
    });

  }

  loadAccounts() {
    this.coinbaseProService.getAccounts().pipe(
      map((r: any) => {
        return r.sort((a: any, b: any) => {
          return b.available - a.available;
        });
      }),
      map((r: any) => {
        // add tickers
        r.filter(
          (item: any) => item.available > 0 && !['EUR','USDT'].includes(item.currency)
        ).map(
          (item: any) => {
            this.subscribeWsTickers([item.currency + '-EUR']);
            this.subscribeWsTickers([item.currency + '-USDT']);
          }
        );

        return r;
      }),
    ).subscribe(
      result => this.accounts$.next(result),
      err => this.accounts$.error(err)
    );
  }

  loadOrders() {
    this.coinbaseProService.getOrders().subscribe(
      result => this.orders$.next(result),
      err => this.orders$.error(err)
    );
  }

  loadFills(product: any) {
    this.coinbaseProService.getFills({product_id: product.id, limit: 10}).subscribe(
      result => this.fills$.next(result),
      err => this.fills$.error(err)
    );
  }

  loadProducts() {
    this.coinbaseProService.getProducts().pipe(
      map((results: any) => {
        return results.filter(
          (item: any) => ['USDT','EUR'].includes(item.quote_currency)
        ).sort(
          (a: any, b: any) => a.id.localeCompare(b.id)
        );
      })
    ).subscribe(
      result => this.products$.next(result),
      err => this.products$.error(err)
    );
  }

  loadCurrencies() {
    this.coinbaseProService.getCurrencies().subscribe(
      result => this.currencies$.next(result),
      err => this.currencies$.error(err)
    );
  }

  fees() {
    this.coinbaseProService.getFees().subscribe((result) => {
        console.log(result);
      },
      error => console.log(error.error.message));
  }

  isUSDT(product: any) {
    return product.quote_currency === 'USDT';
  }

  isEUR(product: any) {
    return product.quote_currency === 'EUR';
  }

  extractCurrency(productId: string) {
    return productId.split('-')[1];
  }

  getAccountAvailableSize(currency: string) {
    const accounts = this.accounts$.getValue().filter(
      (item: any) => item.currency === currency
    ).map(
      (item: any) => item.available
    );

    return accounts.length ? accounts[0] : null;
  }

  swap($event: any) {

    const sellProduct = $event.sellProduct;
    const buyProduct = $event.buyProduct;
    const sellSize = $event.size;

    const sellCurrency = sellProduct.quote_currency;
    const accountPrevAvailable = this.getAccountAvailableSize(sellCurrency);

    this.swapLoading = true;
    this.coinbaseProService.sellMarket(sellProduct.id, {size: sellSize}).pipe(
      tap((r) => {
        this.notify.open(sellProduct.id  + ' selled!', 'Ok', {
          duration: 5000
        });
        console.log('response sell', r);
      }),

      mergeMap((r) => {
        return this.coinbaseProService.getAccounts().pipe(
          map((accounts: any[]) => {

            const accountsFiltered = accounts.filter(
              (r: any) => r.currency === sellCurrency
            );

            if (accountsFiltered[0]) {
              return accountsFiltered[0].available;
            }

            return 0;
          })
        );
      })
    ).subscribe(
      (accountAvailable) => {

        console.log('accountPrevAvailable', accountPrevAvailable);
        console.log('accountAvailable', accountAvailable);

        let funds = accountAvailable - accountPrevAvailable;
        funds = this.utils.getFundsIncrement(buyProduct, funds);

        this.coinbaseProService.buyMarket(buyProduct.id, {funds: funds}).pipe(
          finalize(() => {
            this.loadAccounts();
            this.swapLoading = false;
          })
        ).subscribe(
          (result) => {
            this.notify.open(buyProduct.id  + ' buyed!', 'Ok', {
              duration: 5000
            });
            console.log('response buy', result);
          },
          error => {
            console.log(error.error.message);
            this.notify.open('Buy error: ' + error.error.message, 'Ok', {
              duration: 5000
            });
          });

      },
      error => {
        console.log(error.error.message);
        this.notify.open('Sell error: ' + error.error.message, 'Ok', {
          duration: 5000
        });
      });

  }

  sell($event: any) {

    const sellProductId = $event.sellProduct.id;
    const size = $event.size;

    this.swapLoading = true;

    this.coinbaseProService.sellMarket(sellProductId, {size: size}).pipe(
      finalize(() => {
        this.loadAccounts();
        this.swapLoading = false;

        this.trendObserver = [...this.trendObserver].map(item => {
          if (item.product_id === sellProductId) {
            return {
              ...item,
              size: 0,
              sellOnStop: false
            };
          }

          return item;
        });

      })
    ).subscribe(
      (r) => {
        this.notify.open(sellProductId  + ' selled!', 'Ok', {
          duration: 5000
        });
      },
      error => {
        console.log(error.error.message);
        this.notify.open('Sell error: ' + error.error.message, 'Ok', {
          duration: 5000
        });
      });

  }

  buy($event: any) {

    const buyProductId = $event.buyProduct.id;
    const funds = $event.funds;

    this.swapLoading = true;

    this.coinbaseProService.buyMarket(buyProductId, {funds: funds}).pipe(
      finalize(() => {
        this.loadAccounts();
        this.swapLoading = false;
      })
    ).subscribe(
      (result) => {
        this.notify.open(buyProductId  + ' buyed!', 'Ok', {
          duration: 5000
        });
      },
      error => {
        console.log(error.error.message);
        this.notify.open('Buy error: ' + error.error.message, 'Ok', {
          duration: 5000
        });
      });
  }

  setStorage() {
    const storage: any = {
      trendObserver: this.trendObserver,
      alerts: this.alerts,
      productsGraph: this.productsGraph,
      productsTicker: this.productsTicker
    }
    localStorage.setItem('cryptoz.storage', JSON.stringify(storage));
  }
  getStorage(): any {
    const storage = localStorage.getItem('cryptoz.storage') || '{}';
    const storageValue: any = JSON.parse(storage);

    return storageValue;
  }

}
