import { Component, OnInit } from '@angular/core';
import {UtilsService} from "../utils.service";
import {PatternService} from "../pattern.service";

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

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
      id: "test",
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

  public series: any[] = [];

  constructor(
    private utils: UtilsService,
    private pattern: PatternService
  ) { }

  ngOnInit(): void {

    const data = this.testCandles();
    console.log('threeWhiteShoulder?', this.pattern.threeWhiteShoulder(data.reverse()));

    this.series = [{
      productId: 'PMZ-EUR',
      data: data
    }];
  }

  testCandles() {
    // const [timestamp , open, high, low, close] = candle;

/*    //morning star
    const data = [
      [30, null, null, 120],
      [10, null, null, 30],
      [140, null, null, 40],
      [160, null, null, 120],
    ];*/

/*    //threeInsideUp
    const data = [
      [50, null, null, 150],
      [20, null, null, 80],
      [140, null, null, 10],
      [160, null, null, 120],
    ];*/

/*    //threeLineStrike
    const data = [
      [50, null, null, 161],
      [50, null, null, 10],
      [100, null, null, 40],
      [160, null, null, 80],
    ];*/

    //threeWhiteShoulder
    const data = [
      [60, null, null, 200],
      [40, null, null, 140],
      [10, null, null, 90],
      [160, null, null, 80],
    ];

    return data.reverse().map((v, i) => [i, ...v]);
  }
}
