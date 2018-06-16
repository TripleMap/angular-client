import { Component } from '@angular/core';
import { MapService } from '../../../services/MapService';
import { PkkInfoService } from '../../../services/PkkInfoService';

@Component({
  selector: 'pkk-info',
  templateUrl: './pkk-info.component.html',
  styleUrls: ['./pkk-info.component.css']
})
export class PkkInfoComponent {
  public pkkInfoActive: boolean = false;
  constructor(
    public MapService: MapService,
    public PkkInfoService: PkkInfoService
  ) { }

  startSpatialSearch() {
    this.pkkInfoActive = !this.pkkInfoActive;
    this.pkkInfoActive ? this.PkkInfoService.startSpatialSearch() : this.PkkInfoService.stopSpatialSearch()
  }
}
