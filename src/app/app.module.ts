import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from '../components/app.component';
import { HttpModule } from "@angular/http";

//materialComponents
import { MatToolbarModule } from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from "@angular/flex-layout";

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
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [MapService],
  bootstrap: [AppComponent]
})
export class AppModule { }
