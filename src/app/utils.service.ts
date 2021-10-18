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

  timeOffset(time?: number | null) {
    const t = time ? time * 1000 : Date.now();
    return t - ((new Date()).getTimezoneOffset() * 60 * 1000);
  }

  beepNegative() {
    let a = new Audio('assets/alarm-down.mp3');
    a.currentTime = 0;
    return a.play();
  }

  beepPositive() {
    let a = new Audio('assets/alarm-up.mp3');
    a.currentTime = 0;
    return a.play();
  }

  async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ema(prices: number[], time_period: number) {
    const sum: number = prices.reduce((a, b) => {
      return Number(a) + Number(b);
    }, 0);
    const sma = sum / prices.length;

    const k = 2/(time_period + 1);

    let ema: any[] = [];
    ema.push(sma);
    prices.forEach((price, i) => {
      if (!i) return;
      const point: number = (Number(price) * k) + (ema[i-1] * (1-k));
      ema.push(point);
    });

    return ema;
  }

  productSymbol(productId: string) {
    return productId.split('-')[0];
  }
}
