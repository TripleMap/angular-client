import { Component, ChangeDetectorRef, AfterViewInit } from "@angular/core";
import { MatIconRegistry } from "@angular/material";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.css"]
})
export class AppComponent implements AfterViewInit {
	public activeMediaQuery = "";
	public isFilterSidenavActive: boolean = false;
	public isTDMapPanelSidenavActive: boolean = false;

	constructor(
		public iconRegistry: MatIconRegistry,
		public changeDetectorRef: ChangeDetectorRef,
		public media: ObservableMedia
	) {
		this.iconRegistry.registerFontClassAlias("materialdesignicons", "mdi");
		media.subscribe((change: MediaChange) => (this.activeMediaQuery = change ? change.mqAlias : ""));
	}

	ngAfterViewInit(): void {
		this.changeDetectorRef.detectChanges();
	}

	toggleFilterSideNav(): void {
		this.isFilterSidenavActive = !this.isFilterSidenavActive;
	}

	toggleTDMapPanelSideNav():void{
		this.isTDMapPanelSidenavActive = !this.isTDMapPanelSidenavActive;
	}
}
