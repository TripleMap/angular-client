import { NgcFloatButtonModule } from 'ngc-float-button';
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
  template: `
   <nav class="fab-menu" [class.active]="state.getValue().display">
        <a class="fab-toggle" (click)="toggle()" [ngSwitch]="true">
          	<mat-icon *ngSwitchCase="!icon.includes(mdi)"> {{icon}} </mat-icon>
          	<i *ngSwitchCase="icon.includes(mdi)" class='mdi {{icon}}'> {{icon}} </i>
        </a>
        <ng-content></ng-content>
    </nav>
    `,
})


export class MdFabSpeedDialExtendedComponent extends NgcFloatButtonModule implements OnInit{
	ngOnInit(){
		console.log(this);
	}
}
