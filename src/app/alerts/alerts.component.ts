import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Alert, Ticker, TrendObserver} from "../interfaces";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UtilsService} from "../utils.service";
import {isNumeric} from "rxjs/internal-compatibility";

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {

  @Input() USDEUR: number = 1;

  @Input() set ticker(value: Ticker) {
    if (value) {
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

    this.alerts.map(alert => {
      if (alert.product_id !== ticker.product_id) {
        return alert;
      }

      if (alert.activated = this.isActivated(alert, ticker)) {
        if (!alert.paused){
          this.utils.beep();
        }
      }

      return alert;
    });

    //this.updated.emit(this.alerts);
  }

}
