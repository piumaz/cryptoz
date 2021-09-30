import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import {AppRoutingModule} from "./app-routing.module";
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChartsComponent } from './charts/charts.component';
import {HttpClientModule} from "@angular/common/http";
import {ReactiveFormsModule} from "@angular/forms";
import {NgxChartsModule} from "@swimlane/ngx-charts"
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

import {MaterialModule} from "./material.module";
import { GraphComponent } from './graph/graph.component'
import { WalletComponent } from './wallet/wallet.component';
import { SwapComponent } from './swap/swap.component';
import { OrdersComponent } from './orders/orders.component';
import { TrendObserverComponent } from './trend-observer/trend-observer.component'

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    GraphComponent,
    ChartsComponent,
    WalletComponent,
    SwapComponent,
    OrdersComponent,
    TrendObserverComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgxChartsModule,
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
