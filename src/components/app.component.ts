import { Component, ChangeDetectorRef, AfterViewInit } from "@angular/core";
import { MatIconRegistry } from "@angular/material";
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { FormControl, Validators } from '@angular/forms';
@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.css"]
})
export class AppComponent implements AfterViewInit {
	options: number[];
	public activeMediaQuery = "";
	public isActive:boolean = false;
	public myControl = new FormControl('', [Validators.required, Validators.email]);
	constructor(
		public iconRegistry: MatIconRegistry,
		public changeDetectorRef: ChangeDetectorRef,
		public media: ObservableMedia
	) {
		this.iconRegistry.registerFontClassAlias("materialdesignicons", "mdi");
		media.subscribe((change: MediaChange) => this.activeMediaQuery = change ? change.mqAlias : "");
	}

	ngAfterViewInit(): void {
		this.options = [1,2,3]
		this.changeDetectorRef.detectChanges();
	}

	toggleSideNav(): void {
		this.isActive = !this.isActive;
	}
}