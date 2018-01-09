import { Component, AfterViewInit, Output, EventEmitter} from "@angular/core";
import { OverLaysService } from "../../services/OverLaysService";
import { TdDataTableService, TdDataTableSortingOrder, ITdDataTableSortChangeEvent, ITdDataTableColumn } from '@covalent/core'
@Component({
	selector: "td-map-panel",
	templateUrl: "./td-map-panel.component.html",
	styleUrls: ["./td-map-panel.component.css"]
})
export class TdMapPanelComponent implements AfterViewInit {
	public selectedRows: any[] = [];
	public selectable: boolean = true;
	public multiple: boolean = true;
	public sortBy: string = 'id';
	public visibleFeatures: any[];
	public pageSize: number = 20;
	public columns: any[] = this.getColumnNames();
	public filteredTotal: number = this.visibleFeatures ? this.visibleFeatures.length ?  this.visibleFeatures.length : 0:0;
	public sortOrder: TdDataTableSortingOrder = TdDataTableSortingOrder.Descending;
	@Output()
  	closeTdmapPanelSidenav: EventEmitter<string> = new EventEmitter<string>();

	constructor(public _overLaysService: OverLaysService) {

	}

	ngAfterViewInit() {
		this._overLaysService.mainLayer.featuresFlow.subscribe(data =>{
			this.visibleFeatures = data.concat([...data,...data,...data,...data,...data,...data,...data,...data,...data,...data,...data,...data]);
			console.log(data)
		});
	}

	toggleSideNav() {
    	this.closeTdmapPanelSidenav.emit('close-tdmap-panel-sidenav');
  	}

  	getColumnNames(){
  		return [{
  			 name: 'type',  label: 'Тип'
  		}, {
  			 name: 'geometry',  label: 'Геометрия'
  		}, {
  			 name: 'properties.id',  label: 'ID'
  		} ]
  	}
}
