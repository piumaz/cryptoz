import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, forkJoin, interval, Observable, of, Subject, Subscription} from "rxjs";
import {filter, finalize, map, mergeMap, retry, takeUntil, tap} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {CoinbaseProService} from "../coinbase-pro.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {WebsocketService} from "../websocket.service";


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  public productsGraphSelectd: string[] = [];

  public currencies$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public products$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public accounts$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public orders$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public prices$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  public ticker$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private intervalSub: Subscription = new Subscription();
  private intervalMinutes = 0.1;

  protected destroy$ = new Subject();

  startedAt: number = new Date().valueOf();

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private coinbaseProService: CoinbaseProService,
    private wsService: WebsocketService,
    private notify: MatSnackBar
  ) {}

  ngOnInit(): void {

    this.loadCurrencies();
    this.loadProducts();
    this.loadAccounts();
    this.loadOrders();

    this.loadTickers();
/*    this.intervalSub = interval(this.intervalMinutes * 60 * 1000).subscribe((x: number) => {
      this.loadPrices();
    });*/
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intervalSub.unsubscribe();
  }

  addProductsGraphSelected(productId: string) {
    this.productsGraphSelectd.push(productId);
    this.subscribeWsTickers([productId]);
  }

  removeProductsGraphSelected(productId: string) {
    this.productsGraphSelectd = this.productsGraphSelectd.filter(
      (v: string) => v !== productId
    );
    this.unsubscribeWsTickers([productId]);
  }

  getProductsGraphSelected() {
    return this.productsGraphSelectd;
  }

  subscribeWsTickers(productIds: string[]) {
    this.wsService.send({
      "type": "subscribe",
      "product_ids": productIds,
      "channels": [
        "ticker"
      ]
    });
  }

  unsubscribeWsTickers(productIds: string[]) {
    this.wsService.send({
      "type": "unsubscribe",
      "product_ids": productIds,
      "channels": [
        "ticker"
      ]
    });
  }

  loadTickers() {
    this.wsService.connect();
    this.wsService.wsSubject$.pipe(
      retry()
    ).subscribe(
      (v: any) => {
        if (v.type === 'ticker') {
          this.ticker$.next(v);
        }
      }
    );
  }

  loadPrices() {

    let observables: any = {};

    // per tutti gli account con soldi
    // più quelli che voglio osservare
    const accountsWithMoney = this.accounts$.getValue().filter(
      (item: any) => item.available > 0 && !['EUR','USDT'].includes(item.currency)
    ).map(
      (item: any) => item.currency + '-USDT'
    );

    const productsGraphSelected = this.getProductsGraphSelected();

    const products = [...new Set([
      ...accountsWithMoney,
      ...productsGraphSelected
    ])];

    products.forEach((productId: string) => {
      observables[productId] = this.coinbaseProService.getProductTicker(productId).pipe(
        map((result: any) => {
          return {
            symbol: productId,
            price: Number(result.price)
          };
        })
      );
    });


    forkJoin(observables).pipe(
      takeUntil(this.destroy$),
      map((result: any) => {

        let rows: any[] = [];

        const symbols = Object.keys(result);

        symbols.forEach((symbol: string) => {
          rows.push(result[symbol]);
        });

        return rows;
      })
    ).subscribe(
      result => this.prices$.next(result),
      err => this.prices$.error(err)
    );

  }

  loadAccounts() {
    this.coinbaseProService.getAccounts().pipe(
      map((r: any) => {
        return r.sort((a: any, b: any) => {
          return b.available - a.available;
        });
      })
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

  loadProducts() {
    this.coinbaseProService.getProducts().subscribe(
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

  isRightSize(product: any, size: number) {
    return size > product.base_min_size && size < product.base_max_size;
  }
  isRightFunds(product: any, funds: number) {
    return funds > product.min_market_funds && funds < product.max_market_funds;
  }

  isRightIncrementSize(product: any, size: number) {
    return Math.round(size / product.base_increment) / (1 / product.base_increment) === size;
  }
  isRightIncrementFunds(product: any, funds: number) {
    return Math.round(funds / product.quote_increment) / (1 / product.quote_increment) === funds;
  }

  getSizeIncrement(product: any, size: number) {
    return Math.round(size / product.base_increment) / (1 / product.base_increment);
  }
  getFundsIncrement(product: any, funds: number) {
    return Math.round(funds / product.quote_increment) / (1 / product.quote_increment);
  }

  swap($event: any) {

    const sellProduct = $event.sellProduct;
    const buyProduct = $event.buyProduct;
    const sellSize = $event.size;

    const sellCurrency = sellProduct.quote_currency;
    const accountPrevAvailable = this.getAccountAvailableSize(sellCurrency);

    this.coinbaseProService.sellMarket(sellProduct.id, {size: sellSize}).pipe(
      tap((r) => {
        this.notify.open(sellProduct.id  + ' selled!');
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
        funds = this.getFundsIncrement(buyProduct, funds);

        this.coinbaseProService.buyMarket(buyProduct.id, {funds: funds}).pipe(
          finalize(() => this.loadAccounts())
        ).subscribe(
          (result) => {
            this.notify.open(buyProduct.id  + ' buyed!');
            console.log('response buy', result);
          },
          error => {
            console.log(error.error.message);
            this.notify.open('Buy error: ' + error.error.message);
          });

      },
      error => {
        console.log(error.error.message);
        this.notify.open('Sell error: ' + error.error.message);
      });

  }

  _swap($event: any) {

    const sellProduct = $event.sellProduct;
    const buyProduct = $event.sellProduct;
    const sellSize = $event.size;

    const sellCurrency = sellProduct.quote_currency;
    const accountPrevAvailable = this.getAccountAvailableSize(sellCurrency);

    this.coinbaseProService.sellMarket(sellProduct.id, {size: sellSize}).pipe(
      tap((r) => {
        this.notify.open(sellProduct.id  + ' selled!');
        console.log(r);
      }),
      mergeMap((r) => {
        return this.coinbaseProService.getAccounts().pipe(
          map((accounts: any[]) => {
            return accounts.filter(
              (r: any) => r.currency === sellCurrency
            )[0];
          })
        );
      })
    ).subscribe(
      (accountAvailable) => {

        let funds = accountAvailable - accountPrevAvailable;
        funds = this.getFundsIncrement(buyProduct, funds);

        this.coinbaseProService.buyMarket(buyProduct.id, {funds: funds}).subscribe(
          (result) => {
            this.notify.open(buyProduct.id  + ' buyed!');
            this.loadAccounts();
          },
          error => {
            console.log(error.error.message);
            this.notify.open('Buy error: ' + error.error.message);
          });

      },
      error => {
        console.log(error.error.message);
        this.notify.open('Sell error: ' + error.error.message);
      });

  }

  sell($event: any) {

    const sellProductId = $event.sellProduct.id;
    const size = $event.size;

    this.coinbaseProService.sellMarket(sellProductId, {size: size}).subscribe(
      (r) => {
        this.notify.open(sellProductId  + ' selled!');
        this.loadAccounts();
      },
      error => {
        console.log(error.error.message);
        this.notify.open('Sell error: ' + error.error.message);
      });

  }

  buy($event: any) {

    const buyProductId = $event.buyProduct.id;
    const funds = $event.funds;

    this.coinbaseProService.buyMarket(buyProductId, {funds: funds}).subscribe(
      (result) => {
        this.notify.open(buyProductId  + ' buyed!');
        this.loadAccounts();
      },
      error => {
        console.log(error.error.message);
        this.notify.open('Buy error: ' + error.error.message);
      });
  }
}
