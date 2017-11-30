import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  	title = 'app';
    constructor(private iconRegistry: MatIconRegistry) {
    	this.iconRegistry.registerFontClassAlias('materialdesignicons', 'mdi');
  	}
}
