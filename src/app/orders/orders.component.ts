import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl} from "@angular/forms";
import {Product, TrendObserver} from "../interfaces";

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {

  @Input() USDEUR: number = 1;
  @Input() orders: any[] = [];
  @Input() fills: any[] = [];
  @Input() products: any[] = [];

  @Output() productSelected: EventEmitter<Product> = new EventEmitter();
  @Output() addTrendObserver: EventEmitter<TrendObserver> = new EventEmitter();

  public product: FormControl = new FormControl(null);

  constructor() { }

  ngOnInit(): void {
    this.product.valueChanges.subscribe((value) => {
      this.productSelected.emit(value);
    })
  }

  observe(item: any) {
    const observe: TrendObserver = {
      product_id: item.product_id,
      price: Number(item.price),
      size: Number(item.size)
    }

    this.addTrendObserver.emit(observe);
  }
}
