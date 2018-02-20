import { Component, Input, ChangeDetectionStrategy, AfterViewInit, ChangeDetectorRef, OnChanges, ViewChild, ViewChildren, QueryList } from '@angular/core';
import {
  CompactType,
  DisplayGrid,
  GridsterComponentInterface,
  GridsterConfig,
  GridsterItem,
  GridsterItemComponentInterface,
  GridType,
  GridsterItemComponent
} from 'angular-gridster2';

import { MapService } from "../../services/MapService";

import { TdMapPanelComponent } from '../td-map-panel/td-map-panel.component'
@Component({
  selector: 'main-grid-panel',
  templateUrl: './main-grid-panel.component.html',
  styleUrls: ['./main-grid-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainGridPanelComponent {
  @Input()
  isAttributeTableActive: boolean;
  @ViewChild(TdMapPanelComponent) TdMapPanelComponent: TdMapPanelComponent;
  @ViewChildren(GridsterItemComponent) gridsterItems: QueryList<GridsterItemComponent>
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
      minCols: 15,
      maxCols: 100,
      minRows: 8,
      maxRows: 100,
      maxItemCols: 25,
      minItemCols: 1,
      maxItemRows: 25,
      minItemRows: 1,
      maxItemArea: 2500,
      minItemArea: 1,
      defaultItemCols: 2,
      defaultItemRows: 2,
      keepFixedHeightInMobile: false,
      keepFixedWidthInMobile: false,
      scrollSensitivity: 5,
      scrollSpeed: 10,
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
      pushItems: false,
      pushDirections: { north: true, east: true, south: true, west: true },
      pushResizeItems: true,
      displayGrid: DisplayGrid.None,
      itemResizeCallback: this.itemResize,
    };

    this.gridItems.push({ id: 'tdmap', cols: 10, rows: 8, y: 0, x: 0 });
    this.gridItems.push({ id: 'tdmapItem', cols: 5, rows: 8, y: 0, x: 10 });
  }

  itemResize = (item, itemComponent) => {
    if (item.id === 'tdmap') {
      const map = this.MapService.getMap();
      setTimeout(map.invalidateSize.bind(map), 300);
    }
    if (item.id === 'attributeTable') {
      if (this.TdMapPanelComponent.activeLayer) {
        this.TdMapPanelComponent.onFilterListSubscriberNext(this.TdMapPanelComponent.activeLayer, true);
      }
    }
  }

  ngOnChanges(changes) {
    if (changes && changes.isAttributeTableActive) {
      this.toggleAttributeTable(changes.isAttributeTableActive.currentValue)
    }
  }

  toggleAttributeTable(attrinuteTableValueChanges: boolean) {
    if (attrinuteTableValueChanges) {
      this.gridItems.push({ id: 'attributeTable', cols: 15, rows: 8, y: 0, x: 0 });
    } else {
      for (let i = this.gridItems.length - 1; i >= 0; i--) {
        if (this.gridItems[i].id === 'attributeTable') {
          this.gridItems.splice(i, 1);
          this.ChangeDetectorRef.detectChanges();
          break;
        }
      }

      if (this.gridsterItems) {
        let tdmap = this.gridsterItems.forEach(gridsterItem => {
          if (gridsterItem.item.id === 'tdmap') {
            gridsterItem.$item.cols = 10;
            gridsterItem.$item.rows = 8;
            gridsterItem.$item.x = 0;
            gridsterItem.$item.y = 0;
            gridsterItem.setSize(true);
            gridsterItem.checkItemChanges(gridsterItem.$item, gridsterItem.item);
          }
          if (gridsterItem.item.id === 'tdmapItem') {
            gridsterItem.$item.cols = 5;
            gridsterItem.$item.rows = 8;
            gridsterItem.$item.x = 10;
            gridsterItem.$item.y = 0;
            gridsterItem.setSize(true);
            gridsterItem.checkItemChanges(gridsterItem.$item, gridsterItem.item);
          }
        });
      }

      if (this.MapService.TDMapManager) {
        const map = this.MapService.getMap();
        setTimeout(map.invalidateSize.bind(map), 300);
      }
    }
  }
}
