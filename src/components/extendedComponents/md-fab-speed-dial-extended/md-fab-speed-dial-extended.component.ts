import { NgcFloatButtonComponent } from '../../../../node_modules/ngc-float-button/components/ngc-float-button.component.js';
import {
  Component,
  Input,
  ContentChildren,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterContentInit,
  OnDestroy,
  Output,
  OnChanges,
  OnInit
} from '@angular/core';

@Component({
  selector: 'md-fab-speed-dial-extended',
  styleUrls: ['./md-fab-speed-dial-extended.component.css'],
  template: `
   <nav class="fab-menu" [class.active]="state.getValue().display">
        <span class="fab-toggle" (click)="toggle()">
          	<mat-icon *ngIf="!icon.includes('mdi')"> {{icon}} </mat-icon>
          	<i *ngIf="icon.includes('mdi')" class='mdi {{icon}}'></i>
        </span>
        <ng-content></ng-content>
    </nav>
    `,
})


export class MdFabSpeedDialExtendedComponent extends NgcFloatButtonComponent{
  constructor(private element: ElementRef, private cd: ChangeDetectorRef){
    super(element, ChangeDetectorRef);
    console.log(this)
  }
	ngOnInit(){
		console.log(this);
	}
}
