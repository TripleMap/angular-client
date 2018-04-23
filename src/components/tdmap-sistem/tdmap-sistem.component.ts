import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { MediaChange, ObservableMedia } from "@angular/flex-layout";
import { AuthService } from '../../auth/auth-service'

@Component({
  selector: 'tdmap-sistem',
  templateUrl: './tdmap-sistem.component.html',
  styleUrls: ['./tdmap-sistem.component.css']
})
export class TdmapSistem implements AfterViewInit {

  public activeMediaQuery = "";
  public isFilterSidenavActive: boolean = false;
  public isAttributeTableActive: boolean = false;
  public isAttributeItemActive: boolean = false;
  constructor(
    public changeDetectorRef: ChangeDetectorRef,
    public media: ObservableMedia,
    public AuthService: AuthService
  ) {
    media.subscribe((change: MediaChange) => (this.activeMediaQuery = change ? change.mqAlias : ""));
  }

  ngAfterViewInit(): void {
    this.changeDetectorRef.detectChanges();
  }

  toggleFilterSideNav(): void {
    this.isFilterSidenavActive = !this.isFilterSidenavActive;
  }

  toggleTDMapPanel(): void {
    this.isAttributeTableActive = !this.isAttributeTableActive;
  }

  toggleTDMapItemPanel(): void {
    this.isAttributeItemActive = !this.isAttributeItemActive;
  }
  logout() {
    this.AuthService.logout();
  }
}
