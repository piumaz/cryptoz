import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {map} from "rxjs/operators";

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})
export class SwapComponent implements OnInit {

  @Input() USDEUR: number = 1;
  @Input() products: any[] = [];
  @Input() accounts: any[] = [];

  @Input() set loading(value: boolean) {
    if (value === true) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  @Output() swap: EventEmitter<any> = new EventEmitter();
  @Output() sell: EventEmitter<any> = new EventEmitter();
  @Output() buy: EventEmitter<any> = new EventEmitter();

  public form: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      type: ['swap', Validators.required],
      sell: [null, Validators.required],
      buy: [null, Validators.required],
      size: [null, Validators.required],
    });

    // type
    this.form.controls.type.valueChanges.subscribe((value) => {

      this.form.controls.sell.clearValidators();
      this.form.controls.buy.clearValidators();

      if (value === 'buy') {
        this.form.controls.buy.setValidators(Validators.required);
        this.form.controls.size.patchValue(null);

        const funds = this.getAccountAvailable(this.form.controls.buy.value?.quote_currency);
        this.form.controls.size.patchValue(funds);
      }
      if (value === 'sell' || value === 'swap') {
        this.form.controls.sell.setValidators(Validators.required);
        if (value === 'swap') {
          this.form.controls.buy.setValidators(Validators.required);
        }

        const size = this.getAccountAvailable(this.form.controls.sell.value?.base_currency);
        this.form.controls.size.patchValue(size);
      }

      this.form.controls.sell.updateValueAndValidity();
      this.form.controls.buy.updateValueAndValidity();
    });

    // sell
    this.form.controls.sell.valueChanges.subscribe((value) => {
      if (this.form.controls.type.value !== 'buy') {
        const size = this.getAccountAvailable(value?.base_currency);
        this.form.controls.size.patchValue(size);
      }
    });

    // buy
    this.form.controls.buy.valueChanges.subscribe((value) => {
      if (this.form.controls.type.value === 'buy') {
        const funds = this.getAccountAvailable(value?.quote_currency);
        this.form.controls.size.patchValue(funds);
      }
    });
  }

  invertSwap() {
    const sell = this.form.value.sell;
    const buy = this.form.value.buy;

    this.form.patchValue({
      sell: buy,
      buy: sell
    });
  }

  getAccountAvailable(currency: string) {
    const accounts = this.accounts.filter(
      (item) => item.currency === currency
    ).map(
      (item) => item.available
    );

    return accounts.length ? accounts[0] : null;
  }

  getAccountsCurrencyAvailable() {
    return this.accounts.filter(
      (item) => item.available > 0
    ).map(
      (item) => item.currency
    );
  }

  getProductsSell() {
    const currencies = this.getAccountsCurrencyAvailable();
    return this.products.filter(
      (item) => currencies.includes(item.base_currency) && ['USDT','EUR'].includes(item.quote_currency)
    ).sort(
      (a: any, b: any) => a.id.localeCompare(b.id)
    );
  }

  getProductsBuy() {
    return this.products.filter(
      (item) => ['USDT','EUR'].includes(item.quote_currency)
    ).sort(
      (a: any, b: any) => a.id.localeCompare(b.id)
    );
  }

  getProductsQuote(currency: string) {
    return this.products.filter(
      (item: any) => item.base_currency === currency
    ).map(
      (item: any) => item.quote_currency
    );
  }

  confirm() {
    if (this.form.invalid) {
      return;
    }

    if (!window.confirm(`${this.form.controls.type.value.toUpperCase()}: Are you sure?`)) {
      return;
    }

    switch (this.form.controls.type.value) {
      case 'swap':
        this.swap.emit({
          sellProduct: this.form.value.sell,
          buyProduct: this.form.value.buy,
          size: this.form.value.size
        });
        break;
      case 'sell':
        this.sell.emit({
          sellProduct: this.form.value.sell,
          size: this.form.value.size
        });
        break;
      case 'buy':
        this.buy.emit({
          buyProduct: this.form.value.buy,
          funds: this.form.value.size
        });
        break;
    }

  }
}
