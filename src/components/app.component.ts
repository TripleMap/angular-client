import { Component, ChangeDetectorRef,AfterViewInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { TdMediaService, TdDigitsPipe, TdLayoutManageListComponent, TdRotateAnimation } from '@covalent/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit{
  	name = 'Фильтрация';
  	single: any[];
  	multi: any[];
  	miniNav: boolean = false;

  	constructor(public iconRegistry: MatIconRegistry, public media: TdMediaService, public _changeDetectorRef: ChangeDetectorRef) {
  	  	this.iconRegistry.registerFontClassAlias('materialdesignicons', 'mdi');
  	}
	
  	ngAfterViewInit(): void {
  	  	this.media.broadcast();
  	  	this._changeDetectorRef.detectChanges();
  	}
}
