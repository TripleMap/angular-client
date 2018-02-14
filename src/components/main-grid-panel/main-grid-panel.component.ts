import { Component, Input, ChangeDetectionStrategy, AfterViewInit, ChangeDetectorRef, OnChanges, ViewChild } from '@angular/core';
import {
  CompactType,
  DisplayGrid,
  GridsterComponentInterface,
  GridsterConfig,
  GridsterItem,
  GridsterItemComponentInterface,
  GridType
} from 'angular-gridster2';

import { MapService } from "../../services/MapService";

import { TdMapPanelComponent } from '../td-map-panel/td-map-panel.component'
@Component({
  selector: 'main-grid-panel',
  templateUrl: './main-grid-panel.component.html',
  styleUrls: ['./main-grid-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainGridPanelComponent implements AfterViewInit {
  @Input()
  isAttributeTableActive: boolean;
  @ViewChild(TdMapPanelComponent) TdMapPanelComponent: TdMapPanelComponent;

  public options: GridsterConfig;
  public gridItems: Array<GridsterItem> = [];

  constructor(public MapService: MapService, public ChangeDetectorRef: ChangeDetectorRef) {
    this.options = {
      gridType: GridType.Fit,
      compactType: CompactType.None,
      outerMargin: true,
      outerMarginTop: 8,
      outerMarginRight: 8,
      outerMarginBottom: 8,
      outerMarginLeft: 8,
      mobileBreakpoint: 640,
      margin: 10,
      minCols: 8,
      maxCols: 100,
      minRows: 8,
      maxRows: 100,
      maxItemCols: 10,
      minItemCols: 1,
      maxItemRows: 10,
      minItemRows: 1,
      maxItemArea: 2500,
      minItemArea: 1,
      defaultItemCols: 2,
      defaultItemRows: 2,
      keepFixedHeightInMobile: false,
      keepFixedWidthInMobile: false,
      scrollSensitivity: 5,
      scrollSpeed: 10,
      enableEmptyCellClick: false,
      enableEmptyCellContextMenu: false,
      enableEmptyCellDrop: false,
      enableEmptyCellDrag: false,
      ignoreMarginInRow: true,
      draggable: {
        delayStart: 0,
        enabled: true,
        ignoreContentClass: 'gridster-item-content',
        ignoreContent: false,
        dragHandleClass: 'drag-handler'
      },
      resizable: {
        delayStart: 0,
        enabled: true,
        handles: {
          s: true,
          e: true,
          n: true,
          w: true,
          se: true,
          ne: true,
          sw: true,
          nw: true
        }
      },
      swap: false,
      pushItems: true,
      pushDirections: { north: true, east: true, south: true, west: true },
      pushResizeItems: true,
      displayGrid: DisplayGrid.Always,
      itemResizeCallback: this.itemResize,
    };

    this.gridItems.push({ id: 'tdmmap', cols: 8, rows: 8, y: 0, x: 0 });
  }

  itemResize = (item, itemComponent) => {
    if (item.id === 'tdmmap') {
      const map = this.MapService.getMap();
      setTimeout(map.invalidateSize.bind(map), 100);
    }
    if (item.id === 'attributeTable') {
      if (this.TdMapPanelComponent.activeLayer) {
        this.TdMapPanelComponent.onFilterListSubscriberNext(this.TdMapPanelComponent.activeLayer, true);
      }
    }
  }
  ngAfterViewInit() {
    this.ChangeDetectorRef.detectChanges();
  }

  ngOnChanges(changes) {
    if (changes && changes.isAttributeTableActive) {
      this.toggleAttributeTable(changes.isAttributeTableActive.currentValue)
    }
  }

  toggleAttributeTable(attrinuteTableValueChanges: boolean) {
    if (attrinuteTableValueChanges) {
      this.gridItems.push({ id: 'attributeTable', cols: 5, rows: 8, y: 0, x: 8 });
    } else {
      for (let i = this.gridItems.length - 1; i >= 0; i--) {
        if (this.gridItems[i].id === 'attributeTable') this.gridItems.splice(i, 1);
      }
      if (this.MapService.TDMapManager) {
        const map = this.MapService.getMap();
        setTimeout(map.invalidateSize.bind(map), 100);
      }
    }
  }
}
