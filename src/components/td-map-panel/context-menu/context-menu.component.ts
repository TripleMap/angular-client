import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { OverLaysService } from '../../../services/OverLaysService'
@Component({
  selector: 'context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css']
})
export class ContextMenuComponent {
  @Input('featureId') featureId;
  @Input('columnName') columnName;
  @ViewChild(MatMenuTrigger) contextMenuSpan: MatMenuTrigger;
  public activeLayer: any;
  public mapFeature: any;

  constructor(public OverLaysService: OverLaysService) { }

  openContextMenu(event, activeLayer) {
    event.preventDefault();
    this.contextMenuSpan.openMenu();
    this.activeLayer = activeLayer;

    let mapLayer = this.OverLaysService.getLeafletLayerById(activeLayer.id);
    if (!mapLayer) return;
    let mapLayers = mapLayer.getLayers();
    let length = mapLayers.length;
    for (let i = 0; i < length; i++) {
      const element = mapLayers[i];
      if (element.feature && element.feature.properties && element.feature.properties.id === this.featureId) {
        this.mapFeature = element;
        break;
      }
    }
  }

  zoomToFeature() {
    if (this.mapFeature) {
      let center = this.mapFeature.getCenter();
      this.mapFeature._map.flyTo(center);
    }
  }

}
