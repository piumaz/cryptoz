import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Ticker} from "../graph/graph.component";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-trend-observer',
  templateUrl: './trend-observer.component.html',
  styleUrls: ['./trend-observer.component.css']
})
export class TrendObserverComponent implements OnInit {

  @Input() USDEUR: number = 1;

  @Input() set ticker(value: Ticker) {
    if (value) {
      this.prices[value.product_id] = value.price;
    }
  }

  @Input() currencies: any[] = [];
  @Input() products: any[] = [];
  @Input() accounts: any[] = [];
  @Input() orders: any[] = [];
  @Input() fills: any[] = [];

  @Output() productAdded: EventEmitter<any> = new EventEmitter();
  @Output() productRemoved: EventEmitter<any> = new EventEmitter();

  public prices: any = {};

  public form: FormGroup = new FormGroup({});

  public observer: any[] = [];

  constructor(
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      product: [null, Validators.required],
      price: [null, Validators.required],
      size: [null],
    });

    this.observer = this.getStorage().observer || [];

    const products = this.observer.map(item => item.product.id);
    const uniqueProducts = new Set(products);

    uniqueProducts.forEach(productId => this.productAdded.emit(productId));

  }

  add() {
    const value = this.form.value;
    this.observer.unshift(value);

    const exist = this.observer.filter(item => item.product === value.product);
    if (!exist.length) {
      this.productAdded.emit(value.product);
    }

    this.form.reset();
    this.setStorage();
  }

  remove(index: number) {

    if (!window.confirm(`Are you sure?`)) {
      return;
    }

    const exist = this.observer.filter(item => item.product === this.observer[index].product);
    if (!exist.length) {
      this.productRemoved.emit(this.observer[index].product);
    }

    this.observer.splice(index, 1);
    this.setStorage();
  }

  oldFunds(item: any) {
    return Number((item.price * item.size).toFixed(2));
  }

  newFunds(item: any) {
    return Number((this.prices[item.product.id] * item.size).toFixed(2));
  }

  earn(from: number, to: number) {
    return Number((to - from).toFixed(2));
  }

  diff(from: number, to: number) {
    if (!to) {
      to = from;
    }
    return Number((((to - from) / to) * 100).toFixed(2));
  }

  getPriceColor(item: any) {

    const diff = this.diff(item.price, this.prices[item.product.id]);
    if (diff > 0) {
      return 'green';
    } else if (diff < 0) {
      return 'red';
    }

    return 'grey';
  }

  setStorage() {
    const storage: any = {
      observer: this.observer
    }
    localStorage.setItem('cryptoz.observer', JSON.stringify(storage));
  }
  getStorage(): any {
    const storage = localStorage.getItem('cryptoz.observer') || '{}';
    const storageValue: any = JSON.parse(storage);

    return storageValue;
  }

}
