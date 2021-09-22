import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, forkJoin, interval, Observable, of, Subject, Subscription} from "rxjs";
import {filter, first, map, mergeMap, takeUntil, tap} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {CoinbaseProService} from "../coinbase-pro.service";
import {MatSnackBar} from "@angular/material/snack-bar";


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

  private intervalSub: Subscription = new Subscription();
  private intervalMinutes = 0.1;

  protected destroy$ = new Subject();

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private coinbaseProService: CoinbaseProService,
    private notify: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCurrencies();
    this.loadProducts();
    this.loadAccounts();
    this.loadOrders();

    this.intervalSub = interval(this.intervalMinutes * 60 * 1000).subscribe((x: number) => {
      this.loadPrices();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intervalSub.unsubscribe();
  }

  addProductsGraphSelected(productId: string) {
    this.productsGraphSelectd.push(productId);
  }

  removeProductsGraphSelected(productId: string) {
    this.productsGraphSelectd = this.productsGraphSelectd.filter(
      (v: string) => v !== productId
    );
  }

  getProductsGraphSelected() {
    return this.productsGraphSelectd;
  }

  loadPrices() {

    let observables: any = {};

    // per tutti quelli nell'account con soldi
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
    this.coinbaseProService.getOrders().pipe(
      tap((r: any) => {
        console.log('orders', r);
      })
    ).subscribe(
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

  swap($event: any) {

    const sellProductId = $event.sellProductId;
    const buyProductId = $event.buyProductId;
    const sellSize = $event.sellSize;

    this.coinbaseProService.sellMarket(sellProductId, {size: sellSize}).pipe(
      tap((r) => {
        this.notify.open(sellProductId  + ' selled!');
        console.log(r);
      }),
      mergeMap((r) => {
        return this.coinbaseProService.getAccounts().pipe(
          filter((r: any) => r.currency === 'USDT'),
          map((r: any[]) => r[0].available)
        );
      })
    ).subscribe(
      (USDTsize) => {

        this.coinbaseProService.buyMarket(buyProductId, {size: USDTsize}).subscribe(
          (result) => {
            this.notify.open(buyProductId  + ' buyed!');
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

}
