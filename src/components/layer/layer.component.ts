import { Component, OnInit, ElementRef } from '@angular/core';

@Component({
  selector: 'layer-selection',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.css']
})

export class LayerComponent {
	isActive: boolean = false;

  	constructor(private element: ElementRef) {
  	
  	}

  	transformMaterial(event){
  		this.isActive = !this.isActive;
  	}
}
