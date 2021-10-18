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
import {installTempPackage} from "@angular/cli/utilities/install-package";

@Component({
  selector: 'app-percentage',
  templateUrl: './percentage.component.html',
  styleUrls: ['./percentage.component.css']
})
export class PercentageComponent implements OnInit {

  @Input() selected: string[] = [];

  @Input() set percentage(s: Partial<ApexAxisChartSeries>) {
    if (s) this.populate(s);
  }

  @ViewChild("chart") chart?: ChartComponent;

  public series: any[] = [];

  public options: any = {
    xaxis: {
      type: "datetime",
    },
    yaxis: {
      opposite: true
    },
    tooltip: {
      y: {
        formatter: function(value: any, config: {series: any, seriesIndex: number, dataPointIndex: number, w: number}) {
          return value
        }
      }
    },
    chart: {
      type: "line",
      height: 350,
      animations: {
        enabled: false,
      },
      toolbar: {
        show: false,
      }
    },
    stroke: {
      width: 1
    },
  };

  constructor() { }

  ngOnInit(): void {

  }

  populate(series: any) {
    if (!this.selected.includes(series.name)) {
      this.series = this.series
        .filter(item => !this.selected.includes(series.name));
      return;
    }

    let done = false;
    this.series = this.series.map((item: any, i: number) => {
        if (item.name === series.name) {
          done = true;
          return series;
        }
        return item;
      });

    if (!done) this.series.push(series);

    if (this.chart) {
      this.chart.updateOptions({
        series: this.series
      }, false, true);
    }

  }

}
