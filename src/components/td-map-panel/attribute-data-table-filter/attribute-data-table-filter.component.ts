import { Component, Directive, OnInit, Input, ViewEncapsulation, ViewContainerRef } from '@angular/core';


@Component({
  selector: "attribute-data-table-filter",
  templateUrl: './attribute-data-table-filter.component.html',
  styleUrls: ['./attribute-data-table-filter.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AttributeDataTableFilterComponent implements OnInit {

  @Input() columnData;
  constructor(public container: ViewContainerRef) {
  }

  ngOnInit() {
  }
}