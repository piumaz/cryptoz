import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {map} from "rxjs/operators";

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.css']
})
export class SwapComponent implements OnInit {

  @Input() products: any[] = [];
  @Input() accounts: any[] = [];

  @Output() swap: EventEmitter<any> = new EventEmitter();

  public form: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      sell: [null, Validators.required],
      buy: [null, Validators.required]
    });
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

    if (!window.confirm(`Are you sure?`)) {
      return;
    }

    this.swap.emit({
      sellProductId: this.form.value.sell.id,
      buyProductId: this.form.value.buy.id,
      sellSize: this.form.value.sell.available
    });
  }
}
