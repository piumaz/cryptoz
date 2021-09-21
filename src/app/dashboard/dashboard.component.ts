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

  public fromAccount: any;
  public toAccount: any;

  public products$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public accounts$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public orders$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  protected destroy$ = new Subject();

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private coinbaseProService: CoinbaseProService,
    private notify: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
    this.loadProducts();
    this.loadOrders();

    this.orders$.subscribe();

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  fees() {
    this.coinbaseProService.getFees().subscribe((result) => {
        console.log(result);
      },
      error => console.log(error.error.message));
  }

  swap(sellCurrency: string, buyCurrency: string, size: number) {

    const sellProductId = sellCurrency + '-USDT';
    const buyProductId = buyCurrency + '-USDT';

    this.coinbaseProService.sellMarket(sellProductId, {size: size}).pipe(
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
