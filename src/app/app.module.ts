import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgSwitch } from '@angular/common';
import { NgSwitchCase } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from '../components/app.component';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

// TDMap, Leaflet

// materialComponents
import { MatToolbarModule, MatIconRegistry, MatTooltipModule} from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';

// services
import { MapService } from '../services/MapService';

// mapComponents
import { TdmapComponent } from '../components/mapComponents/tdmap/tdmap.component';
import { LayerComponent } from '../components/mapComponents/layer/layer.component';
import { ZoomComponent } from '../components/mapComponents/zoom/zoom.component';
import { MeasureComponent } from '../components/mapComponents/measure/measure.component';
import { NgcFloatButtonModule } from 'ngc-float-button';




// covalent 
import {
  CovalentCommonModule, CovalentLayoutModule, CovalentMediaModule, CovalentExpansionPanelModule,
  CovalentStepsModule, CovalentLoadingModule, CovalentDialogsModule, CovalentSearchModule, CovalentPagingModule,
  CovalentNotificationsModule, CovalentMenuModule, CovalentDataTableModule, CovalentMessageModule
} from '@covalent/core';


@NgModule({
  declarations: [
    AppComponent,
    TdmapComponent,
    LayerComponent,
    ZoomComponent,
    MeasureComponent
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
    MatCheckboxModule,
    MatListModule,
    NgcFloatButtonModule,
    MatSidenavModule,
    MatTooltipModule,
    CovalentCommonModule, 
    CovalentLayoutModule,
    CovalentMediaModule, CovalentExpansionPanelModule,
  CovalentStepsModule, CovalentLoadingModule, CovalentDialogsModule, CovalentSearchModule, CovalentPagingModule,
  CovalentNotificationsModule, CovalentMenuModule, CovalentDataTableModule, CovalentMessageModule
  ],
  providers: [MatIconRegistry, MapService],
  bootstrap: [AppComponent]
})
export class AppModule { }