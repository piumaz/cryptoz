import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl} from "@angular/forms";

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

  @Output() productSelected: EventEmitter<any> = new EventEmitter();

  public product: FormControl = new FormControl(null);

  constructor() { }

  ngOnInit(): void {
    this.product.valueChanges.subscribe((value) => {
      this.productSelected.emit(value);
    })
  }

}
