import { Injectable } from '@angular/core';
import {Candle, Ticker} from "./interfaces";
import {UtilsService} from "./utils.service";
import {TickersComponent} from "./tickers/tickers.component";

@Injectable({
  providedIn: 'root'
})
export class PatternService {

  constructor(private utils: UtilsService) {
  }

  check(items: Candle[]) {
    const candles = items;

    //console.log(candles);
    if (candles.length < 6) return false;

    const morningStar = this.morningStar(candles);
    const threeInsideUp = this.threeInsideUp(candles);
    const threeLineStrike = this.threeLineStrike(candles);
    const threeWhiteShoulder = this.threeWhiteShoulder(candles);

    if (morningStar || threeInsideUp || threeLineStrike || threeWhiteShoulder) {
      console.table({
        morningStar,
        threeInsideUp,
        threeLineStrike,
        threeWhiteShoulder
      });

      return true;
    }

    return false;
  }

  private candleObj(candle: any) {
    const [timestamp , open, high, low, close] = candle;
    return {
      timestamp, open, high, low, close
    }
  }

  private up(candle: any) {
    return candle.close > candle.open;
  }

  private down(candle: any) {
    return candle.close < candle.open;
  }

  private big(candle: any) {
    return true;
    const result = this.utils.diff(Math.abs(candle.high - candle.low), Math.abs(candle.close - candle.open));
    console.log('BIG', candle, result);
    return result < 10;
    //return this.utils.diff(candle.close, candle.open) > 50;
  }

  private small(candle: any) {
    return true;
    return this.utils.diff(Math.abs(candle.high - candle.low), Math.abs(candle.close - candle.open)) > 75;
    //return this.utils.diff(candle.close, candle.open) < 15;
  }

  private half(candle: any) {
    return (candle.open + candle.close) / 2;
  }

  private weight(candle: any) {
    const max = Math.max(candle.open, candle.close);
    const min = Math.min(candle.open, candle.close);
    return max - min;
  }

  private openAndCloseUp(candleLast: any, candlePrev: any) {
    return candleLast.close > candlePrev.close && candleLast.open > candlePrev.open;
  }

  private openAndCloseDown(candleLast: any, candlePrev: any) {
    return !this.openAndCloseUp(candleLast, candlePrev);
  }

  threeInsideUp(candles: Candle[]) {
    const c1 = this.candleObj(candles[0]);
    const c2 = this.candleObj(candles[1]);
    const c3 = this.candleObj(candles[2]);
    const c4 = this.candleObj(candles[3]);

    if (
      (this.up(c1) && (c1.close > c3.open) && (c1.open >= c2.open)) &&
      (this.up(c2) && (c2.open > c3.close) && (c2.close >= this.half(c3))) &&
      (this.down(c3) && this.big(c3)) &&
      (this.down(c4))
    ) {
      return true;
    }

    return false;
  }

  threeLineStrike(candles: Candle[]) {
    const c1 = this.candleObj(candles[0]);
    const c2 = this.candleObj(candles[1]);
    const c3 = this.candleObj(candles[2]);
    const c4 = this.candleObj(candles[3]);

    if (
      (this.up(c1) && (c1.close > c4.open) && (c1.open < c4.close) && (c1.open > c3.close)) &&
      (this.down(c2) && this.openAndCloseDown(c2, c3)) &&
      (this.down(c3) && this.openAndCloseDown(c3, c4)) &&
      (this.down(c4))
    ) {
      return true;
    }

    return false;
  }

  threeWhiteShoulder(candles: Candle[]) {
    const c1 = this.candleObj(candles[0]);
    const c2 = this.candleObj(candles[1]);
    const c3 = this.candleObj(candles[2]);
    const c4 = this.candleObj(candles[3]);

    if (
      (this.up(c1) && this.openAndCloseUp(c1, c2)) &&
      (this.up(c2) && this.openAndCloseUp(c2, c3) && (c2.close >= this.half(c1))) &&
      (this.up(c3) && (c3.close >= this.half(c2))) &&
      (this.down(c4) && (c4.close <= this.half(c2)))
    ) {
      return true;
    }

    return false;
  }

  morningStar(candles: Candle[]) {
    const c1 = this.candleObj(candles[0]);
    const c2 = this.candleObj(candles[1]);
    const c3 = this.candleObj(candles[2]);
    const c4 = this.candleObj(candles[3]);

    if (
      (this.up(c1) && this.big(c1) && (c1.open <= c3.close) && (c1.close >= this.half(c3))) &&
      (this.up(c2) && this.small(c2) && (c2.close <= c3.close) && (c2.close <= c1.open)) &&
      (this.down(c3) && this.big(c3)) && this.weight(c3) >= (this.weight(c2) * 4) &&
      (this.down(c4))
    ) {
      return true;
    }

    return false;
  }
}
