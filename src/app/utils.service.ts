import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  isRightSize(product: any, size: number) {
    return size > product.base_min_size && size < product.base_max_size;
  }

  isRightFunds(product: any, funds: number) {
    return funds > product.min_market_funds && funds < product.max_market_funds;
  }

  isRightIncrementSize(product: any, size: number) {
    return Math.round(size / product.base_increment) / (1 / product.base_increment) === size;
  }

  isRightIncrementFunds(product: any, funds: number) {
    return Math.round(funds / product.quote_increment) / (1 / product.quote_increment) === funds;
  }

  getSizeIncrement(product: any, size: number) {
    return Math.round(size / product.base_increment) / (1 / product.base_increment);
  }

  getFundsIncrement(product: any, funds: number) {
    return Math.round(funds / product.quote_increment) / (1 / product.quote_increment);
  }

  diff(from: number, to: number, fixed: number = 2) {
    if (!to) {
      to = from;
    }
    return Number((((from - to) / from) * 100).toFixed(fixed));
  }

  getColor(next: number, prev: number) {
    if (next > prev) {
      return 'green';
    } else if (next < prev) {
      return 'red';
    }
    return 'grey';
  }

  beep() {
    const snd = new Audio('assets/alarm.mp3');
    snd.play();
  }

}
