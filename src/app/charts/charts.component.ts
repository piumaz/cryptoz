import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss']
})

export class ChartsComponent implements OnInit, OnDestroy {

  @Input() type: 'pie' | 'bars' | 'line' = 'line';

  @Input() results: any;
  @Input() scheme: any = {
    domain: ['#547fa4', '#db3b5b', '#e1e550', '#ce90ce']
  };
  @Input() legend: boolean = true;
  @Input() legendPosition: any = 'below';
  @Input() legendTitle: string = 'Legenda';
  @Input() labels: boolean = false;

  @Input() showGridLines: boolean = true;
  @Input() xAxis: boolean = true;
  @Input() yAxis: boolean = true;
  @Input() showXAxisLabel: boolean = true;
  @Input() showYAxisLabel: boolean = true;
  @Input() xAxisLabel: string = 'xAxisLabel';
  @Input() yAxisLabel: string = 'yAxisLabel';

  @Output() select: EventEmitter<any> = new EventEmitter();
  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() deactivate: EventEmitter<any> = new EventEmitter();

  constructor() {

  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }
}
