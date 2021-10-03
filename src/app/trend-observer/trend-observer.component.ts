import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {TrendObserver, Ticker} from "../interfaces";

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

  @Input() observer: TrendObserver[] = [];

  @Input() currencies: any[] = [];
  @Input() products: any[] = [];
  @Input() accounts: any[] = [];
  @Input() orders: any[] = [];
  @Input() fills: any[] = [];

  @Output() added: EventEmitter<TrendObserver> = new EventEmitter();
  @Output() removed: EventEmitter<number> = new EventEmitter();
  @Output() addProductOnGraph: EventEmitter<string> = new EventEmitter();

  public prices: any = {};

  public form: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      product_id: [null, Validators.required],
      price: [null, Validators.required],
      size: [null],
    });
  }

  add() {
    const value = this.form.value;

    this.added.emit(value);

    this.form.reset();
  }

  remove(index: number) {

    if (!window.confirm(`Are you sure?`)) {
      return;
    }
    this.removed.emit(index);
  }

  oldFunds(item: any) {
    return Number((item.price * item.size).toFixed(2));
  }

  newFunds(item: any) {
    return Number((this.prices[item.product_id] * item.size).toFixed(2));
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

    const diff = this.diff(item.price, this.prices[item.product_id]);
    if (diff > 0) {
      return 'green';
    } else if (diff < 0) {
      return 'red';
    }

    return 'grey';
  }

}
