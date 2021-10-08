import {LOCALE_ID, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import {AppRoutingModule} from "./app-routing.module";
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChartsComponent } from './graph/charts/charts.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {ReactiveFormsModule} from "@angular/forms";
import {NgxChartsModule} from "@swimlane/ngx-charts"
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

import {MaterialModule} from "../shared/material.module";
import { GraphComponent } from './graph/graph.component'
import { WalletComponent } from './wallet/wallet.component';
import { SwapComponent } from './swap/swap.component';
import { OrdersComponent } from './orders/orders.component';
import { TrendObserverComponent } from './trend-observer/trend-observer.component'

import localeIt from '@angular/common/locales/it';
import localeItExtra from '@angular/common/locales/extra/it';
import {registerLocaleData} from "@angular/common";
registerLocaleData(localeIt, 'it-IT', localeItExtra);

import {TokenInterceptor} from "./token-interceptor";
import {NgApexchartsModule} from "ng-apexcharts";
import { CandlesComponent } from './candles/candles.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    GraphComponent,
    ChartsComponent,
    WalletComponent,
    SwapComponent,
    OrdersComponent,
    TrendObserverComponent,
    CandlesComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgxChartsModule,
    MaterialModule,
    NgApexchartsModule
  ],
  providers: [
    {provide: LOCALE_ID, useValue: 'it-IT' },
    //{ provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
