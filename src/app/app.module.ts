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
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';


// services
import { ApiHTTPInterceptorService } from "../services/ApiHTTPInterceptorService";
import { MapService } from "../services/MapService";
import { BaseLayersService } from "../services/BaseLayersService";
import { OverLaysService } from "../services/OverLaysService";
import { SelectionLayersService } from "../services/SelectionLayersService";
import { FilterGeometryAdapter } from "../services/FilterGeometryAdapter";

// mapComponents

import { MainGridPanelComponent } from '../components/main-grid-panel/main-grid-panel.component';
import { TdmapComponent } from "../components/tdmap/tdmap.component";
import { TdMapPanelComponent } from '../components/td-map-panel/td-map-panel.component';
import { TDMApPanelMatPaginatorIntl } from '../components/td-map-panel/td-map-panel.paginator';
import { LayerComponent } from "../components/mapComponents/layer/layer.component";
import { ZoomComponent } from "../components/mapComponents/zoom/zoom.component";
import { MeasureComponent } from "../components/mapComponents/measure/measure.component";
import { SearchAutocompleteComponent } from "../components/search-autocomplete/search-autocomplete.component";
import { FilterGeometryComponent } from "../components/filter-geometry/filter-geometry.component";
import { FilterGeometryFirstLineComponent } from "../components/filter-geometry/filter-geometry-first-line/filter-geometry-first-line.component";
import { FilterGeometryResultListComponent } from "../components/filter-geometry/filter-geometry-result-list/filter-geometry-result-list.component";
import { SpatialFilterComponent } from '../components/filter-geometry/spatial-filter/spatial-filter.component';

//covalent
import { CovalentVirtualScrollModule, CovalentDataTableModule, CovalentPagingModule } from "@covalent/core";


import { GutterDirective } from '../components/td-map-panel/gutter.directive';
import { GridsterModule } from 'angular-gridster2';
import { AttributeDataTableFilterComponent } from '../components/td-map-panel/attribute-data-table-filter/attribute-data-table-filter.component';


@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiHTTPInterceptorService,
      multi: true
    },
    { provide: MatPaginatorIntl, useClass: TDMApPanelMatPaginatorIntl },
    MatIconRegistry,
    MapService,
    BaseLayersService,
    OverLaysService,
    SelectionLayersService,
    FilterGeometryAdapter
  ],
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
    TdMapPanelComponent,
    SpatialFilterComponent,
    GutterDirective,
    MainGridPanelComponent,
    AttributeDataTableFilterComponent
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
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatRadioModule,
    CovalentVirtualScrollModule,
    CovalentDataTableModule,
    CovalentPagingModule,
    GridsterModule,
    MatMenuModule
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
