import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

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
  MatToolbarModule,
  MatIconRegistry,
  MatTooltipModule
} from "@angular/material";

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
// services
import { MapService } from "../services/MapService";
import { BaseLayersService } from "../services/BaseLayersService";
import { OverLaysService } from "../services/OverLaysService";
import { SelectedFeatureService } from "../services/SelectedFeatureService";

import { PkkTypeAheadFactory } from "../publicCadastral/PublicCadastralHub";

// mapComponents
import { TdmapComponent } from "../components/mapComponents/tdmap/tdmap.component";
import { LayerComponent } from "../components/mapComponents/layer/layer.component";
import { ZoomComponent } from "../components/mapComponents/zoom/zoom.component";
import { MeasureComponent } from "../components/mapComponents/measure/measure.component";
import { SearchAutocompleteComponent } from "../components/search-autocomplete/search-autocomplete.component";

// covalent
import {
  CovalentCommonModule,
  CovalentLayoutModule,
  CovalentMediaModule,
  CovalentExpansionPanelModule,
  CovalentStepsModule,
  CovalentLoadingModule,
  CovalentDialogsModule,
  CovalentSearchModule,
  CovalentPagingModule,
  CovalentNotificationsModule,
  CovalentMenuModule,
  CovalentDataTableModule,
  CovalentMessageModule
} from "@covalent/core";

@NgModule({
  declarations: [
    AppComponent,
    TdmapComponent,
    LayerComponent,
    ZoomComponent,
    MeasureComponent,
    SearchAutocompleteComponent
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
    CovalentCommonModule,
    CovalentLayoutModule,
    CovalentMediaModule,
    CovalentExpansionPanelModule,
    CovalentStepsModule,
    CovalentLoadingModule,
    CovalentDialogsModule,
    CovalentSearchModule,
    CovalentPagingModule,
    CovalentNotificationsModule,
    CovalentMenuModule,
    CovalentDataTableModule,
    CovalentMessageModule
  ],
  providers: [
    MatIconRegistry,
    MapService,
    BaseLayersService,
    OverLaysService,
    SelectedFeatureService,
    PkkTypeAheadFactory
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
