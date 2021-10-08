import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Candle, Product, Ticker} from "../interfaces";

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle
} from "ng-apexcharts";
import {timeout} from "rxjs/operators";

@Component({
  selector: 'app-candles',
  templateUrl: './candles.component.html',
  styleUrls: ['./candles.component.css']
})
export class CandlesComponent implements OnInit {

  @Input() selected: string[] = [];

  @Input() set candles(s: Partial<ApexAxisChartSeries>) {
    if (s) this.populate(s);
  }

  @ViewChild("chart") chart?: ChartComponent;

  public series: any[] = [];
  public showSeries: any[] = [];

  public options: any = {
    xaxis: {
      type: "datetime",
/*      labels: {
        formatter: (value: any, timestamp: number) => {
          return new Date(timestamp).to() // The formatter function overrides format property
        },
      }*/
    },
    chart: {
      type: "candlestick",
      height: 350,
      animations: {
        enabled: false,
      },
    },
  };

  show(productId: string) {
    this.showSeries = this.series.filter((v: any) => v.name === productId);
    this.zoom();
  }

  populate(series: any) {
    this.series = this.series.filter((v: any) => v.name !== series.name);
    this.series.push(series);

    if (this.showSeries[0] && series.name === this.showSeries[0].name) {
      this.showSeries = [series];
      this.zoom();
    }
  }

  zoom(hours: number = 2) {

    setTimeout(() => {
      console.log('zoom');

      const dateFrom = new Date();
      const timeFrom = dateFrom.getTime() - dateFrom.getTimezoneOffset() * 60 * 1000;
      const timeTo = timeFrom - (hours * 60 * 60 * 1000);
      // console.log(new Date(timeFrom), new Date(timeTo));
      this.chart?.zoomX(timeTo, timeFrom);
    });

  }
/*
  buildDiffSeries() {

    let chartData: any[] = [];

    this.getTickersProductsId().forEach((symbol: string) => {

      let data: any = {
        name: symbol,
        series: []
      };

      const rows = [...this.history].reverse();
      let firstTicker = rows[0][symbol];
      rows.forEach((item: any, i: number) => {

        if(!item[symbol]) {
          item[symbol] = this.tickers[symbol][0];
          firstTicker = item[symbol];
        }

        const ticker = item[symbol];

        const itemSeries = {
          name: i,
          value: this.utils.diff(ticker.price, firstTicker.price),
          price: ticker.price
        };

        data.series.unshift(itemSeries);
      });

      chartData.push(data);

    });

    this.chartData = chartData;
  }
  */
  constructor() { }

  ngOnInit(): void {
  }
/*
  populateCandlesChart(productId: string) {

    if (!this.tickers[productId]) return;

    const ticker: Ticker = this.tickers[productId][0];
    const prevTicker: Ticker = this.tickers[productId][1] || ticker;

    let serie = this.candelsChartOptions.series?.filter(item => item.name === productId);
    if (serie && serie.length) {

      // api [timestamp, price_low, price_high, price_open, price_close]
      // graph [{ x: date, y: [O,H,L,C] }]
      let item: any = {
        // x: ticker.time,
        x: serie[0].data.length.toString(),
        y: [
          prevTicker.price,
          ticker.best_ask,
          ticker.best_bid,
          ticker.price
        ]
      };

      serie[0].data.push(item);
      this.candelsChartOptions.series = [serie[0]];
    }

  }
  */
}
