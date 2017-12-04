import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { MediaMatcher } from '@angular/cdk/layout';
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
	name = 'Фильтрация';
	single: any[];
	multi: any[];
	miniNav: boolean = false;

	private _mobileQueryListener: () => void;
	constructor(public iconRegistry: MatIconRegistry, public changeDetectorRef: ChangeDetectorRef) {
		this.iconRegistry.registerFontClassAlias('materialdesignicons', 'mdi');
	}

	ngAfterViewInit(): void {
		this.changeDetectorRef.detectChanges();
	}
}
