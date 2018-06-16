import { Component, OnInit } from '@angular/core';
import { MapStyleLabelsComponent } from './map-style-labels/map-style-labels.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
@Component({
  selector: 'map-style',
  templateUrl: './map-style.component.html',
  styleUrls: ['./map-style.component.css']
})
export class MapStyleComponent implements OnInit {

  constructor(public matDialog: MatDialog) { }

  ngOnInit() {
  }

  labelFeatures() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.height = '80vh';
    dialogConfig.width = '80vw';
    this.matDialog.open(MapStyleLabelsComponent, dialogConfig);
  }
}
