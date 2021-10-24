import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Alert, Ticker, TrendObserver} from "../interfaces";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UtilsService} from "../utils.service";
import {isNumeric} from "rxjs/internal-compatibility";
import {from, of} from "rxjs";
import {debounceTime, delay, filter, map, tap} from "rxjs/operators";

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {

  @Input() USDEUR: number = 1;

  @Input() set ticker(value: Ticker) {
    if (value && this.getProductsId().includes(value.product_id)) {
      this.prices[value.product_id] = value.price;
      this.alert(value);
    }
  }

  @Input() alerts!: Alert[];

  @Input() products: any[] = [];

  @Output() added: EventEmitter<Alert> = new EventEmitter();
  @Output() alertsChange: EventEmitter<Alert[]> = new EventEmitter();
  @Output() removed: EventEmitter<number> = new EventEmitter();

  public prices: any = {};
  public paused: number[] = [];
  public timeAlert: any;

  public form: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
    public utils: UtilsService,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      product_id: [null, Validators.required],
      up: [null],
      down: [null],
    });
  }

  getProductsId() {
    return this.alerts.reduce((accumulator: string[], item) => {
      accumulator.push(item.product_id);
      return accumulator;
    }, []);
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

  getPrice(item: Alert) {
    return this.prices[item.product_id];
  }

  isDown(item: Alert) {
    return item.down >= this.prices[item.product_id];
  }

  isUp(item: Alert) {
    return item.up <= this.prices[item.product_id];
  }

  getPriceColor(next: number, prev: number) {
    return this.utils.getColor(next, prev);
  }

  isActivated(alert: Alert, ticker: Ticker) {
    if (isNumeric(alert.up) && ticker.price > alert.up) {
      return true;
    }
    else if (isNumeric(alert.down) && ticker.price < alert.down) {
      return true;
    }

    return false;
  }

  alert(ticker: Ticker) {

    from(this.alerts).pipe(
      filter(v => v.product_id === ticker.product_id),
      //tap(v => console.log(v)),
      map(alert => {
        if (alert.activated = this.isActivated(alert, ticker)) {
          if (!alert.paused){
            if (this.isUp(alert)) this.utils.beepPositive().then().catch();
            if (this.isDown(alert)) this.utils.beepNegative().then().catch();
          }
        }

      }),
      debounceTime(1000),
    ).subscribe();
/*

    this.alerts.forEach(alert => {
      if (alert.product_id !== ticker.product_id) {
        return alert;
      }

      if (alert.activated = this.isActivated(alert, ticker)) {
        if (!alert.paused){
            this.utils.sleep(1000).then(() => {
              if (this.isUp(alert)) this.utils.beepPositive().then().catch();
              if (this.isDown(alert)) this.utils.beepNegative().then().catch();
            });
        }
      }

      return alert;
    });
*/

    //this.updated.emit(this.alerts);
  }

}
