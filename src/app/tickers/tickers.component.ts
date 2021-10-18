import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ApexAxisChartSeries, ChartComponent} from "ng-apexcharts";
import {Product, Ticker} from "../interfaces";
import {UtilsService} from "../utils.service";
import {interval, Subscription} from "rxjs";

@Component({
  selector: 'app-tickers',
  templateUrl: './tickers.component.html',
  styleUrls: ['./tickers.component.css']
})
export class TickersComponent implements OnInit {

  @Input() set ticker(ticker: Ticker) {
    if (ticker) {
      this.addTicker(ticker);
    }
  }

  @ViewChild("chart") chart?: ChartComponent;

  private intervalSub: Subscription = new Subscription();

  public series: any[] = [];
  public data: any[] = [];

  public options: any = {
    xaxis: {
      type: "category",
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
      height: 680,
      animations: {
        enabled: true,
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
    public utils: UtilsService
  ) { }

  ngOnInit(): void {

    this.intervalSub = interval(1000).subscribe((x: number) => {
      this.series = [{
        data: this.data
          .filter(v => {
            // console.log(v);
            return v.ema12 > v.ema26;
          })
          .sort((a, b) => a.x.localeCompare(b.x))
      }];
    });

  }

  addTicker(ticker: Ticker) {
    const price: number = Number(ticker.price);
    const symbol: string = this.utils.productSymbol(ticker.product_id);

    const item = {
      x: symbol,
      y: 0,
      product_id: ticker.product_id,
      ema12: 0,
      ema26: 0,
      prices: [price],
    }

    let done = false;
    let data = this.data.map((v: any) => {
      if (v.product_id === ticker.product_id) {
        done = true;
        v.prices.push(price);
        const limit = 10;
        if (v.prices.length > 60) {
          v.prices.splice(0, 1);
        }
        const prices = v.prices;
        const ema12 = this.utils.ema(prices, 12).reverse()[0];
        const ema26 = this.utils.ema(prices, 26).reverse()[0];

        //console.log(price, ema12[0]);
        return {
          ...item,
          //y: Math.abs(this.utils.diff(price, prices[0])),
          y: Number(this.utils.diff(ema12, ema26, 3)),
          prices: prices,
          ema12: ema12,
          ema26: ema26
        };
      }
      return v;
    });

    if (!done) data.push(item);

    this.data = data;
  }

  score(score: number, a: number, b: number) {
/*    if (b > a) {
      return score + 1;
    }
    if (b < a) {
      return score - 0.5;
    }*/
    return score + this.utils.diff(a, b);
  }
}
