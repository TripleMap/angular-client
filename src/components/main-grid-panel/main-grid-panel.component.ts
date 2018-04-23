import { Component, Input, ChangeDetectionStrategy, AfterViewInit, OnChanges, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CompactType, DisplayGrid, GridsterComponentInterface, GridsterConfig, GridsterItem, GridsterItemComponentInterface, GridType, GridsterItemComponent } from 'angular-gridster2';
import { MapService } from "../../services/MapService";
import { TdMapPanelComponent } from '../td-map-panel/td-map-panel.component';

@Component({
  selector: 'main-grid-panel',
  templateUrl: './main-grid-panel.component.html',
  styleUrls: ['./main-grid-panel.component.css']
})
export class MainGridPanelComponent {
  @Input()
  isAttributeTableActive: boolean;
  @Input()
  isAttributeItemActive: boolean;
  @ViewChild(TdMapPanelComponent) TdMapPanelComponent: TdMapPanelComponent;
  @ViewChildren(GridsterItemComponent) gridsterItems: QueryList<GridsterItemComponent>;
  public options: GridsterConfig;
  public gridItems: Array<GridsterItem> = [];

  constructor(public MapService: MapService) {
    this.options = {
      gridType: GridType.Fit,
      compactType: CompactType.CompactUp,
      outerMargin: true,
      outerMarginTop: 8,
      outerMarginRight: 8,
      outerMarginBottom: 8,
      outerMarginLeft: 8,
      mobileBreakpoint: 640,
      margin: 6,
      minCols: 16,
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
        enabled: true
      },
      swap: false,
      pushItems: false,
      pushDirections: { north: true, east: true, south: true, west: true },
      pushResizeItems: true,
      displayGrid: DisplayGrid.None,
      itemResizeCallback: this.itemResize,
    };

    this.gridItems.push({ id: 'tdmap', cols: 16, rows: 8, y: 0, x: 0 });
  }

  itemResize = (item, itemComponent) => {
    if (item.id === 'tdmap') {
      const map = this.MapService.getMap();
      if (map) setTimeout(map.invalidateSize.bind(map), 300);
    }
    if (item.id === 'attributeTable') {
      if (this.TdMapPanelComponent.activeLayer) {
        this.TdMapPanelComponent.updateTableData(this.TdMapPanelComponent.activeLayer, false);
      }
    }
  }

  ngOnChanges(changes) {
    if (changes) {
      if (changes.isAttributeTableActive) this.toggleAttributeTable(changes.isAttributeTableActive.currentValue);
      if (changes.isAttributeItemActive) this.toggleAttributeItem(changes.isAttributeItemActive.currentValue);
    }
  }

  toggleAttributeTable(attrinuteTableValueChanges: boolean) {
    if (attrinuteTableValueChanges) {
      this.gridItems.push({ id: 'attributeTable', cols: 16, rows: 8, y: 0, x: 0 });
    } else {
      for (let i = this.gridItems.length - 1; i >= 0; i--) {
        if (this.gridItems[i].id === 'attributeTable') {
          this.gridItems.splice(i, 1);
          break;
        }
      }

      setTimeout(() => {
        if (this.gridsterItems && this.gridsterItems.length === 1) {
          let tdmap = this.gridsterItems.forEach(gridsterItem => {
            if (gridsterItem.item.id === 'tdmap') {
              gridsterItem.$item.cols = 16;
              gridsterItem.$item.rows = 8;
              gridsterItem.$item.x = 0;
              gridsterItem.$item.y = 0;
              gridsterItem.setSize(true);
              gridsterItem.checkItemChanges(gridsterItem.$item, gridsterItem.item);
              this.MapService.getMap().invalidateSize();
            }
          })
        } else {
          if (this.MapService.TDMapManager) {
            const map = this.MapService.getMap();
            if (map) map.invalidateSize.bind(map);
          }
        }
      }, 300);
    }
  }

  toggleAttributeItem(attributeItemActiveValueChanges) {
    if (attributeItemActiveValueChanges) {
      let tdmap = this.gridsterItems.forEach(gridsterItem => {
        if (gridsterItem.item.id === 'tdmap') {
          gridsterItem.$item.cols = 10;
          gridsterItem.$item.rows = 8;
          gridsterItem.$item.x = 0;
          gridsterItem.$item.y = 0;
          gridsterItem.setSize(true);
          gridsterItem.checkItemChanges(gridsterItem.$item, gridsterItem.item);
          this.MapService.getMap().invalidateSize();
        }
      })
      this.gridItems.push({ id: 'tdmapItem', cols: 6, rows: 8, y: 0, x: 10 });
    } else {
      for (let i = this.gridItems.length - 1; i >= 0; i--) {
        if (this.gridItems[i].id === 'tdmapItem') {
          this.gridItems.splice(i, 1);
          break;
        }
      }
      setTimeout(() => {
        if (this.gridsterItems && this.gridsterItems.length === 1) {
          let tdmap = this.gridsterItems.forEach(gridsterItem => {
            if (gridsterItem.item.id === 'tdmap') {
              gridsterItem.$item.cols = 16;
              gridsterItem.$item.rows = 8;
              gridsterItem.$item.x = 0;
              gridsterItem.$item.y = 0;
              gridsterItem.setSize(true);
              gridsterItem.checkItemChanges(gridsterItem.$item, gridsterItem.item);
              this.MapService.getMap().invalidateSize();
            }
          })
        } else {
          if (this.MapService.TDMapManager) {
            const map = this.MapService.getMap();
            if (map) map.invalidateSize.bind(map);
          }
        }
      }, 300);

    }
  }
}
