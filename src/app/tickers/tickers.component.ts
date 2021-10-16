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
          return value
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
          .filter(v => v.y > 0 && v.y > v.prev && v.count >= 3)
          .sort((a, b) => b.y-a.y)
      }];
    });

  }

  addTicker(ticker: Ticker) {
    const item = {
      x: ticker.product_id,
      y: this.utils.diff(ticker.price, ticker.open_24h),
      prev: this.utils.diff(ticker.price, ticker.open_24h),
      count: 3,
    }

    let done = false;
    let data = this.data.map(v => {
      if (v.x === item.x) {
        done = true;
        //return item;
        return {
          ...item,
          prev: v.y,
          count: item.y >= v.prev ? v.count++ : 0
        };

      }
      return v;
    });

    if (!done) data.push(item);

    this.data = data;
  }
}
