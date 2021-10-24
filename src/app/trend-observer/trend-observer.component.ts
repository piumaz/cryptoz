import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {TrendObserver, Ticker, Product} from "../interfaces";
import {UtilsService} from "../utils.service";

@Component({
  selector: 'app-trend-observer',
  templateUrl: './trend-observer.component.html',
  styleUrls: ['./trend-observer.component.css']
})
export class TrendObserverComponent implements OnInit, OnChanges {

  @Input() USDEUR: number = 1;

  @Input() ticker: Ticker | null = null;
  @Input() observer: TrendObserver[] = [];

  @Input() currencies: any[] = [];
  @Input() products: Product[] = [];
  @Input() accounts: any[] = [];
  @Input() orders: any[] = [];
  @Input() fills: any[] = [];

  @Output() added: EventEmitter<TrendObserver> = new EventEmitter();
  @Output() update: EventEmitter<TrendObserver> = new EventEmitter();
  @Output() removed: EventEmitter<number> = new EventEmitter();
  @Output() addProductOnGraph: EventEmitter<string> = new EventEmitter();
  @Output() sell: EventEmitter<{sellProduct: any, size: number}> = new EventEmitter();

  private stopLimit: number = 0.15;

  public prices: any = {};

  public form: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
    public utils: UtilsService,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      product_id: [null, Validators.required],
      price: [null],
      size: [null],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.ticker && changes.ticker.currentValue) {
      const t = changes.ticker.currentValue;
      if (this.getProductsId().includes(t.product_id)) {
        this.prices[t.product_id] = t.price;
        this.enrich(t.product_id);
      }
    }

    if (changes.observer) {
      this.enrich();
    }
  }

  getProductsId() {
    return this.observer.reduce((accumulator: string[], item) => {
      accumulator.push(item.product_id);
      return accumulator;
    }, []);
  }

  getProductById(id: string): Product {
    return this.products.filter(item => item.id === id)[0];
  }

  enrich(productId?: string) {
    this.observer = this.observer.map((item) => {

      if (productId && item.product_id !== productId) {
        return item;
      }

      const product = this.products.filter(v => v.id === item.product_id)[0];

      const newPrice = this.prices[item.product_id];
      const oldPrice = item.newPrice ? item.newPrice : item.price;

      let stop = item.stop || item.price; //(item.price - (item.price * this.stopLimit));
      stop = this.stop(item.price, newPrice, oldPrice, stop);
      stop = product ? this.utils.getFundsIncrement(product, stop) : stop;

      let stopLoss = false;
      if (newPrice && item.size) {
        stopLoss = this.isStopLoss(item.price, newPrice, stop);
        if (stopLoss) {
          // sell now
          this.utils.beepStop();
          if (item.sellOnStop && item.size) {
            console.log('sellOnStop', item);
            this.sellOnStop(item);
          }
        }
      }


      return {
        ...item,
        newPrice: newPrice,
        oldPrice: oldPrice,
        stop: stop,
        stopLoss: stopLoss,

        oldFunds: item.size && newPrice ? this.oldFunds(item) : 0,
        newFunds: item.size && newPrice ? this.newFunds(item) : 0,
        earnFunds: item.size && newPrice ? this.earn(this.oldFunds(item), this.newFunds(item)) : 0,
        earnPrice: this.earn(item.price, newPrice),
        diffPrice: newPrice ? this.utils.diff(newPrice, item.price) : 0,
        color: this.getPriceColor(item),
      }
    });
  }

  isStopLoss(price: number, newPrice: number, stop: number) {
    if (newPrice < stop && newPrice > price) {
      return true;
    }

    return false;
  }

  sellOnStop(item: TrendObserver) {
    const product = this.getProductById(item.product_id);
    this.sell.emit({
      sellProduct: product,
      size: item.size
    });
  }

  sellByUser(item: TrendObserver) {
    if (!window.confirm(`Sell ${item.product_id}, are you sure?`)) {
      return;
    }
    this.sellOnStop(item);
  }

  stop(price: number, newPrice: number, oldPrice: number, oldStop: number) {
    if (price >= newPrice) {
      return price;
    }

    if (newPrice > oldPrice) {
      // increase the stop
      const diff = newPrice - ((newPrice - price) * this.stopLimit);
      return diff + ((newPrice - diff) * 0.5);
    }

    return oldStop;

  }

  add() {
    const value = this.form.value;

    this.added.emit(value);

    this.form.reset();
  }

  remove(index: number) {
    if (!window.confirm(`Remove row, are you sure?`)) {
      return;
    }
    this.removed.emit(index);
  }

  changeStop(item: TrendObserver, $event: any): boolean | void {
    $event.preventDefault();

    let txt = `Remove Stop loss`;
    if (item.sellOnStop !== true) {
      txt = `Add Stop loss`;
    }

    if (!window.confirm(`${txt} , are you sure?`)) {
      return false;
    }

    this.update.emit({
      ...item,
      sellOnStop: !item.sellOnStop
    });
  }

  oldFunds(item: any) {
    return Number((item.price * item.size).toFixed(2));
  }

  newFunds(item: any) {
    const price = this.prices[item.product_id] ? this.prices[item.product_id] : 0;
    return Number((price * item.size).toFixed(2));
  }

  earn(from: number, to: number) {
    return Number((to - from).toFixed(2));
  }

  getPriceColor(item: any) {
    const diff = this.utils.diff(this.prices[item.product_id], item.price, 2);
    return this.utils.getColor(diff, 0);
  }


}
