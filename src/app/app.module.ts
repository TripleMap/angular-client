import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HTTP_INTERCEPTORS } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { XHRBackend } from "@angular/http";

import { AppComponent } from "../components/app.component";
import { HttpModule } from "@angular/http";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// TDMap, Leaflet

// materialComponents
import {
  MatIconRegistry,
  MatTooltipModule
} from "@angular/material";

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatListModule } from "@angular/material/list";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatCardModule } from "@angular/material/card";
import { MatTabsModule } from '@angular/material/tabs';

// services
import { ApiHTTPInterceptorService } from "../services/ApiHTTPInterceptorService";
import { MapService } from "../services/MapService";
import { BaseLayersService } from "../services/BaseLayersService";
import { OverLaysService } from "../services/OverLaysService";
import { SelectedFeatureService } from "../services/SelectedFeatureService";
import { FilterGeometryAdapter } from "../services/FilterGeometryAdapter";

// mapComponents
import { TdmapComponent } from "../components/tdmap/tdmap.component";
import { TdMapPanelComponent } from '../components/td-map-panel/td-map-panel.component';
import { LayerComponent } from "../components/mapComponents/layer/layer.component";
import { ZoomComponent } from "../components/mapComponents/zoom/zoom.component";
import { MeasureComponent } from "../components/mapComponents/measure/measure.component";
import { SearchAutocompleteComponent } from "../components/search-autocomplete/search-autocomplete.component";
import { FilterGeometryComponent } from "../components/filter-geometry/filter-geometry.component";
import { FilterGeometryFirstLineComponent } from "../components/filter-geometry/filter-geometry-first-line/filter-geometry-first-line.component";
import { FilterGeometryResultListComponent } from "../components/filter-geometry/filter-geometry-result-list/filter-geometry-result-list.component";



//covalent
import { CovalentVirtualScrollModule, CovalentDataTableModule, CovalentPagingModule } from "@covalent/core";
@NgModule({
  declarations: [
    AppComponent,
    TdmapComponent,
    LayerComponent,
    ZoomComponent,
    MeasureComponent,
    SearchAutocompleteComponent,
    FilterGeometryComponent,
    FilterGeometryFirstLineComponent,
    FilterGeometryResultListComponent,
    TdMapPanelComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatListModule,
    MatSidenavModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatTabsModule,
    CovalentVirtualScrollModule,
    CovalentDataTableModule,
    CovalentPagingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiHTTPInterceptorService,
      multi: true
    },
    MatIconRegistry,
    MapService,
    BaseLayersService,
    OverLaysService,
    SelectedFeatureService,
    FilterGeometryAdapter
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
