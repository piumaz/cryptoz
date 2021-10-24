import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ApexAxisChartSeries, ChartComponent} from "ng-apexcharts";
import {Product, Ticker} from "../interfaces";
import {UtilsService} from "../utils.service";
import {interval, Subscription} from "rxjs";
import {PatternService} from "../pattern.service";
import {tick} from "@angular/core/testing";

@Component({
  selector: 'app-tickers',
  templateUrl: './tickers.component.html',
  styleUrls: ['./tickers.component.css']
})
export class TickersComponent implements OnInit {

  @Input() set ticker(ticker: Ticker | null) {
    if (ticker !== null) {
      this.addTicker(ticker);
    }
  }

  @ViewChild("chart") chart?: ChartComponent;

  private intervalSub: Subscription = new Subscription();

  public series: any[] = [];
  public data: any[] = [];
  public tickerCandles: any = {};

  public options: any = {
    xaxis: {
      type: "category",
      labels: {
        show: false
      }
    },
    yaxis: {
      opposite: false
    },
    tooltip: {
      y: {
        formatter: function(value: any, config: {series: any, seriesIndex: number, dataPointIndex: number, w: number}) {
          return value + '%';
        }
      }
    },
    chart: {
      type: "bar",
      height: 500,
      animations: {
        enabled: false,
      },
      toolbar: {
        show: false,
      }
    },
    plotOptions: {
      bar: {
        horizontal: true
      }
    },
  };

  constructor(
    public utils: UtilsService,
    private patternService: PatternService,
  ) { }

  ngOnInit(): void {

    this.intervalSub = interval(1000).subscribe((x: number) => {

      const done: string[] = [];
      // const unique = [...new Set(data.map(item => item.group))]
      this.series = [{
        data: this.data
          .filter(v => {
            return v.ema12 > v.ema26 && (Date.now() - v.time) < 60000;
          })
          .reduce((accumulator: any[], item) => {
            if (!accumulator.includes(item.x)) {
              accumulator.push(item);
            }
            return accumulator;
          }, [])
          .sort((a, b) => b.y - a.y)
          .slice(0, 10)
          //.sort((a, b) => a.x.localeCompare(b.x))
      }];
    });

  }

  buildTickerCandles(ticker: Ticker) {
    // const [timestamp , open, high, low, close] = candle;
    const productId = ticker.product_id;

    if (!this.tickerCandles[productId]) {
      this.tickerCandles[productId] = [];
    }
    const productSeries = this.tickerCandles[productId];
    const prevTicker: Ticker = productSeries[0];
    this.tickerCandles[productId].unshift(
      [
        ticker.time,
        prevTicker?.price || ticker.price,
        ticker.best_bid,
        ticker.best_ask,
        ticker.price,
      ]
    );
  }

  addTicker(ticker: Ticker) {
    // const [timestamp , open, high, low, close] = candle;
    const productId = ticker.product_id;
    this.buildTickerCandles(ticker);

    const price: number = Number(ticker.price);
    const symbol: string = this.utils.productSymbol(productId);

    const item = {
      x: symbol,
      y: 0,
      product_id: productId,
      ema12: 0,
      ema26: 0,
      pattern: false,
      prices: [price],
      time: Date.now()
    }

    let done = false;
    let data = this.data.map((v: any) => {
      if (v.product_id === productId) {
        done = true;
        v.prices.push(price);
        const limit = 10;
        if (v.prices.length > 60) {
          v.prices.splice(0, 1);
        }
        const prices = v.prices;
        const ema12 = this.utils.ema(prices, 12).reverse()[0];
        const ema26 = this.utils.ema(prices, 26).reverse()[0];

        //const detectPattern = false;
        const detectPattern = this.patternService.check(this.tickerCandles[productId]);
        if (detectPattern) {
          console.log('TICKER PATTERN', productId);
        }

        //console.log(price, ema12[0]);
        return {
          ...item,
          y: Number(this.utils.diff(ema12, ema26, 3)),
          prices: prices,
          ema12: ema12,
          ema26: ema26,
          pattern: detectPattern,
        };
      }
      return v;
    });

    if (!done) data.push(item);

    this.data = data;
  }

  score(score: number, a: number, b: number) {
    return score + this.utils.diff(a, b);
  }
}
