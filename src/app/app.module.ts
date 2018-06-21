import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HTTP_INTERCEPTORS } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AppComponent } from "../components/app.component";
import { HttpModule } from "@angular/http";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

// materialComponents
import { MatIconRegistry, MatTooltipModule } from "@angular/material";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
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
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
//main
import { TdmapSistem } from '../components/tdmap-sistem/tdmap-sistem.component';

// services
import { ApiHTTPInterceptorService } from "../services/ApiHTTPInterceptorService";
import { MapService } from "../services/MapService";
import { BaseLayersService } from "../services/BaseLayersService";
import { OverLaysService } from "../services/OverLaysService";
import { FilterGeometryAdapter } from "../services/FilterGeometryAdapter";
import { PkkInfoService } from '../services/PkkInfoService';
import { GeometryEditorService } from '../services/GeometryEditorService';
import { MessageService } from '../services/MessageService';

// mapComponents
import { MainGridPanelComponent } from '../components/main-grid-panel/main-grid-panel.component';
import { TdmapComponent } from "../components/tdmap/tdmap.component";
import { TdMapPanelComponent } from '../components/td-map-panel/td-map-panel.component';
import { TdMapItemPanelComponent } from '../components/td-map-item-panel/td-map-item-panel.component';
import { TdMapPanelItemEventsComponent } from '../components/td-map-item-panel/td-map-panel-item-events/td-map-panel-item-events.component';
import { ContextMenuComponent } from '../components/td-map-panel/context-menu/context-menu.component';

import { VirtualScrollContainer } from '../components/td-map-panel/virtual-scroll-container.directive'
import { MultipleFeatureEditComponent } from '../components/multiple-feature-edit/multiple-feature-edit.component';


import { LayerComponent } from "../components/mapComponents/layer/layer.component";
import { ZoomComponent } from "../components/mapComponents/zoom/zoom.component";
import { MeasureComponent } from "../components/mapComponents/measure/measure.component";
import { SpatialFilterComponent } from '../components/mapComponents/spatial-filter/spatial-filter.component';
import { PkkInfoComponent } from '../components/mapComponents/pkk-info/pkk-info.component';
import { PkkInfoPanelComponent } from '../components/mapComponents/pkk-info/pkk-info-panel/pkk-info-panel.component';
import { PkkImportFeatureSteperComponent } from '../components/mapComponents/pkk-info/pkk-import-feature-steper/pkk-import-feature-steper.component';
import { GeometryEditorComponent } from '../components/mapComponents/geometry-editor/geometry-editor.component';
import { LoadUpdateCadastralInfoDialogComponent } from '../components/mapComponents//pkk-info/load-update-cadastral-info-dialog/load-update-cadastral-info-dialog.component';
import { MapStyleComponent } from '../components/mapComponents/map-style/map-style.component';
import { MapStyleLabelsComponent } from '../components/mapComponents/map-style/map-style-labels/map-style-labels.component';
import { MapStyleStylesComponent } from '../components/mapComponents/map-style/map-style-featurestyles/map-style-featurestyles.component';

import { SearchAutocompleteComponent } from "../components/search-autocomplete/search-autocomplete.component";
import { FilterGeometryComponent } from "../components/filter-geometry/filter-geometry.component";
import { FilterGeometryFirstLineComponent } from "../components/filter-geometry/filter-geometry-first-line/filter-geometry-first-line.component";
import { FilterGeometrySecondLineComponent } from '../components/filter-geometry/filter-geometry-second-line/filter-geometry-second-line.component';
import { FilterGeometryResultListComponent } from "../components/filter-geometry/filter-geometry-result-list/filter-geometry-result-list.component";


//others
import { GutterDirective } from '../components/td-map-panel/gutter.directive';
import { GridsterModule } from 'angular-gridster2';
import { AttributeDataTableFilterComponent } from '../components/td-map-panel/attribute-data-table-filter/attribute-data-table-filter.component';
import { DndModule } from 'ng2-dnd';


import { ColorPickerModule } from './color-dialog/color-dialog.component'
//auth
import { Login } from '../auth/login/login';
import { AuthService, AuthHttpInterceptorService } from '../auth/auth-service';
import { AuthGuard } from '../auth/auth-guard';
import { RoleGuard } from '../auth/role-guard';
import { Register } from '../auth/register/register.component';
import { NotFound } from './not-found/not-found.component';
import { ConfirmDialogDialog } from '../components/confirm-dialog/confirm-dialog.component';
import { UnionFeaturesDialogComponent } from '../components/union-features-dialog/union-features-dialog.component';





@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptorService,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiHTTPInterceptorService,
      multi: true
    },
    { provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    MatIconRegistry,
    MapService,
    BaseLayersService,
    OverLaysService,
    GeometryEditorService,
    FilterGeometryAdapter,
    PkkInfoService,
    MessageService,
    AuthService,
    AuthGuard,
    RoleGuard
  ],
  declarations: [
    TdmapSistem,
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
    AttributeDataTableFilterComponent,
    FilterGeometrySecondLineComponent,
    TdMapItemPanelComponent,
    Login,
    Register,
    NotFound,
    VirtualScrollContainer,
    MultipleFeatureEditComponent,
    PkkInfoComponent,
    PkkInfoPanelComponent,
    PkkImportFeatureSteperComponent,
    GeometryEditorComponent,
    ConfirmDialogDialog,
    UnionFeaturesDialogComponent,
    LoadUpdateCadastralInfoDialogComponent,
    TdMapPanelItemEventsComponent,
    ContextMenuComponent,
    MapStyleComponent,
    MapStyleLabelsComponent,
    MapStyleStylesComponent
  ],
  entryComponents: [
    ConfirmDialogDialog,
    UnionFeaturesDialogComponent,
    MultipleFeatureEditComponent,
    PkkImportFeatureSteperComponent,
    LoadUpdateCadastralInfoDialogComponent,
    MapStyleLabelsComponent,
    MapStyleStylesComponent
  ],
  imports: [
    BrowserModule,
    DndModule.forRoot(),
    HttpModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
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
    GridsterModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatDialogModule,
    MatStepperModule,
    ColorPickerModule,
    MatSliderModule,
    MatSlideToggleModule
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
