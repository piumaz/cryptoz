import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {

  @Input() accounts: any;
  @Input() currencies: any[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  getCurrencyName(symbol: string) {
    const filtered: any[] = this.currencies?.filter((item: any) => item.id == symbol);
    return filtered.length ? filtered[0].name : null;
  }
}
