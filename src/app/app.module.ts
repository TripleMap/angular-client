import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgSwitch } from '@angular/common';
import { NgSwitchCase } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from '../components/app.component';
import { HttpModule } from "@angular/http";
import { FormsModule } from '@angular/forms';

// TDMap, Leaflet
import * as L from "leaflet";
import * as Editable from '../external/Leaflet.Editable.js'
import * as TDMap from '../external/TDMap.module.js'

//materialComponents
import { MatToolbarModule } from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatGridListModule } from '@angular/material/grid-list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';

//mapComponents
import { TdmapComponent } from '../components/tdmap/tdmap.component';
import { LayerComponent } from '../components/layer/layer.component';

//services 
import { MapService } from '../services/MapService';

@NgModule({
  declarations: [
    AppComponent,
    TdmapComponent,
    LayerComponent,
  ],
  imports: [
    HttpModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatExpansionModule,
    MatCheckboxModule
  ],
  providers: [MapService],
  bootstrap: [AppComponent]
})
export class AppModule { }
export L;
export Editable;
export TDMap;