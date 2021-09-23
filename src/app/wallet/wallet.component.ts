import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {

  @Input() accounts: any[] = [];
  @Input() currencies: any[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  getAccounts() {
    return this.accounts.filter(
      (item: any) => item.available > 0 || ['USDT','EUR'].includes(item.currency)
    );
  }

  getCurrencyName(symbol: string) {
    const filtered: any[] = this.currencies?.filter((item: any) => item.id == symbol);
    return filtered.length ? filtered[0].name : null;
  }
}
