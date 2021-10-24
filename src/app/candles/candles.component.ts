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
import {UtilsService} from "../utils.service";

@Component({
  selector: 'app-candles',
  templateUrl: './candles.component.html',
  styleUrls: ['./candles.component.scss']
})
export class CandlesComponent implements OnInit {

  @Input() selected: string[] = [];

  @Input() set item(s: Partial<ApexAxisChartSeries>) {
    this.populate(s);
  }

  @Input() set show(productId: string) {
    if (this.showProductId !== productId) {
      this.showProductId = productId;
      this.productSeries = [];
      this.series = [];
    }
  }

  @ViewChild("chart") chart?: ChartComponent;
  @ViewChild("chartGuide") chartGuide?: ChartComponent;

  public series: any[] = [];
  public productSeries: any[] = [];
  public showProductId: string | null = null;
  public showGuide: any[] = [];

  public options: any = {
    xaxis: {
      type: "datetime",
    },
    yaxis: {
      opposite: true,
      forceNiceScale: false
    },
    stroke: {
      width: 1
    },
    chart: {
      id: "candles",
      type: "candlestick",
      height: 350,
      animations: {
        enabled: false,
      },
      toolbar: {
        autoSelected: "pan",
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    noData: {
      text: 'loading...',
    }
  };


  public optionsGuide: any = {
    chart: {
      height: 160,
      animations: {
        enabled: false,
      },
      type: "line",
      brush: {
        enabled: true,
        target: "candles",
        autoScaleYaxis: true
      },
      selection: {
        xaxis: {
          // 2 hours
          min: this.utils.timeOffset() - (2 * 3600),
          max: this.utils.timeOffset()
        },
        enabled: true,
        fill: {
          color: "#ccc",
          opacity: 0.4
        },
        stroke: {
          color: "#0D47A1"
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 1
    },
    xaxis: {
      type: "datetime",
    },
    yaxis: {
      labels: {
        show: false
      }
    }
  };


  constructor(private utils: UtilsService) { }

  ngOnInit(): void {

  }

  open() {
    if (this.chart) {
      this.chart.updateOptions({
        series: this.series
      }, false, false, true);
    }

    this.addGuide();
  }

  populate(series: any) {
    if (!series || !series.name.includes(this.showProductId)) {
      return;
    }

    let done = false;
    this.productSeries = this.productSeries.map((item: any, i: number) => {
      if (item.name === series.name) {
        done = true;
        return series;
      }
      return item;
    });

    if (!done) this.productSeries.push(series);

    if (this.productSeries.length >= 4) {
      this.series = [...this.productSeries];
      this.productSeries = [];
      this.open();
    }
  }

  addGuide() {
    const series = this.series.filter((v: any) => v.name === this.showProductId);
    if (series.length) {
      const guideData = series[0].data.map((candle: any) => {
        const [timestamp, open, high, low, close] = candle;
        return [timestamp, close];
      });

      if (this.chartGuide) {
        const d = new Date();
        const b = d.getTimezoneOffset() * 60 * 1000;
        const timestamp = d.valueOf() - b;


        this.chartGuide.updateOptions({
          chart: {
            selection: {
              xaxis: {
                //min: new Date(timestamp - (2 * 60 * 60 * 1000)).getTime(),
                min: guideData[0][0] - (guideData[0][0] - guideData[guideData.length - 1][0])/6,
                max: guideData[0][0]//timestamp
              }
            },
          }

        }, false, false, true);

      }

      this.showGuide = [{
        name: 'guide',
        type: 'line',
        data: guideData
      }];

    }
  }

}
