import { Component, OnInit, Input, ViewEncapsulation, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

import * as moment from 'moment';
@Component({
  selector: "attribute-data-table-filter",
  templateUrl: './attribute-data-table-filter.component.html',
  styleUrls: ['./attribute-data-table-filter.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttributeDataTableFilterComponent implements OnInit {

  @Input() columnData;
  @Input() filterDataLayer;
  @Output() filterChange: EventEmitter<object> = new EventEmitter<object>();
  public filterForm: FormGroup;
  public maxDateValue: Date = new Date();
  public isActive: boolean = false;
  constructor(
    public container: ViewContainerRef,
    public fb: FormBuilder,
    public changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (this.columnData.columnType === 'findSimple') {
      this.filterForm = this.fb.group({
        findSimple: '',
        findSimpleNull: false
      });
    } else if (this.columnData.columnType === 'findBoolean') {
      this.filterForm = this.fb.group({
        findBooleanTrue: false,
        findBooleanFalse: false,
        findBooleanNull: false
      });
    } else if (this.columnData.columnType === 'findNumber') {
      this.filterForm = this.fb.group({
        findNumberFrom: [null, [Validators.min(0), Validators.pattern("^[0-9]{1,7}([,.][0-9]{0,7})?$")]],
        findNumberTo: [null, [Validators.min(0), Validators.pattern("^[0-9]{1,7}([,.][0-9]{0,7})?$")]],
        findNumberNull: false
      });
    } else if (this.columnData.columnType === 'findDate') {
      this.filterForm = this.fb.group({
        findDateFrom: null,
        findDateTo: null,
        findDateNull: false
      });
    } else if (this.columnData.columnType === 'findDate') {
      this.filterForm = this.fb.group({
        findSimple: '',
        findSimpleNull: false
      });
    } else if (this.columnData.columnType === 'findMany') {
      this.filterForm = this.fb.group({
        findMany: null,
        findManyNull: false
      });
    } else if (this.columnData.columnType === 'findOne') {
      this.filterForm = this.fb.group({
        findOne: null,
        findOneNull: false
      });
    } else if (this.columnData.columnType === 'findUser') {
      this.filterForm = this.fb.group({
        findUser: null,
        findUserNull: false
      });
    }


    this.filterForm.valueChanges
      .debounceTime(500)
      .distinctUntilChanged()
      .filter(this.isValidForm)
      .map(this.pipeFiltersToNumberOrNull)
      .subscribe(this.filterData.bind(this));

  }

  pipeFiltersToNumberOrNull = filters => {
    if (this.columnData.columnType === 'findNumber') {
      filters.findNumberFrom = filters.findNumberFrom && filters.findNumberFrom !== 0 ? Number(filters.findNumberFrom.replace(",", ".")) : null;
      filters.findNumberTo = filters.findNumberTo && filters.findNumberTo !== 0 ? Number(filters.findNumberTo.replace(",", ".")) : null;
    }

    if (this.columnData.columnType === 'findSimple') {
      filters.findSimple = filters.findSimple ? filters.findSimple.length ? filters.findSimple : null : null;
    }

    if (this.columnData.columnType === 'findMany') {
      filters.findMany = filters.findMany ? filters.findMany.length ? filters.findMany : null : null;
    }

    if (this.columnData.columnType === 'findOne') {
      filters.findOne = filters.findOne ? filters.findOne : null;
    }
    if (this.columnData.columnType === 'findUser') {
      filters.findUser = filters.findUser ? filters.findUser : null;
    }

    return filters;
  }

  isValidForm = () => this.filterForm.status === "VALID";

  clearForm(): void {
    if (this.columnData.columnType === 'findSimple') {
      this.filterForm.get('findSimple').setValue('');
      this.filterForm.get('findSimpleNull').setValue(false);
    } else if (this.columnData.columnType === 'findBoolean') {
      this.filterForm.get('findBooleanTrue').setValue(false);
      this.filterForm.get('findBooleanFalse').setValue(false);
      this.filterForm.get('findBooleanNull').setValue(false);
    } else if (this.columnData.columnType === 'findNumber') {
      this.filterForm.get('findNumberFrom').setValue(null);
      this.filterForm.get('findNumberTo').setValue(null);
      this.filterForm.get('findNumberNull').setValue(null);
    } else if (this.columnData.columnType === 'findMany') {
      this.filterForm.get('findMany').setValue(null);
      this.filterForm.get('findManyNull').setValue(false);
    } else if (this.columnData.columnType === 'findOne') {
      this.filterForm.get('findOne').setValue(null);
      this.filterForm.get('findOneNull').setValue(false);
    } else if (this.columnData.columnType === 'findUser') {
      this.filterForm.get('findUser').setValue(null);
      this.filterForm.get('findUserNull').setValue(false);
    } else if (this.columnData.columnType === 'findDate') {
      this.filterForm.get('findDateFrom').setValue(null);
      this.filterForm.get('findDateTo').setValue(null);
      this.filterForm.get('findDateNull').setValue(false);
    }
    this.isActive = false;
  }

  filterData(filterValue) {
    let filterValues = null;
    switch (this.columnData.columnType) {
      case 'findDate':
        if (filterValue.findDateFrom || filterValue.findDateTo || filterValue.findDateNull) {
          filterValues = {
            values: {
              from: filterValue.findDateFrom ? filterValue.findDateFrom.unix() * 1000 : null,
              to: filterValue.findDateTo ? moment(filterValue.findDateTo).add(1, "day").unix() * 1000 : null,
            },
            noop: filterValue.findDateNull
          };
        }
        break;
      case 'findSimple':
        if (filterValue.findSimple || filterValue.findSimpleNull) {
          filterValues = {
            values: filterValue.findSimple,
            noop: filterValue.findSimpleNull
          };
        }
        break;
      case 'findBoolean':
        if (filterValue.findBooleanTrue || filterValue.findBooleanFalse || filterValue.findBooleanNull) {
          filterValues = {
            values: {
              yes: filterValue.findBooleanTrue,
              no: filterValue.findBooleanFalse
            },
            noop: filterValue.findBooleanNull
          };
        }
        break;
      case 'findNumber':
        if ((filterValue.findNumberFrom >= 0 && filterValue.findNumberFrom !== null) || (filterValue.findNumberTo >= 0 && filterValue.findNumberTo !== null) || filterValue.findNumberNull) {
          filterValues = {
            values: {
              from: filterValue.findNumberFrom,
              to: filterValue.findNumberTo
            },
            noop: filterValue.findNumberNull
          };
        }
        break;
      case 'findMany':
        if (filterValue.findMany || filterValue.findManyNull) {
          filterValues = {
            values: filterValue.findMany,
            noop: filterValue.findManyNull
          };
        }
        break;
      case 'findOne':
        if (filterValue.findOne || filterValue.findOneNull) {
          filterValues = {
            values: filterValue.findOne,
            noop: filterValue.findOneNull
          };
        }
        break;
      case 'findUser':
        if (filterValue.findUser || filterValue.findUserNull) {
          filterValues = {
            values: filterValue.findUser,
            noop: filterValue.findUserNull
          };
        }
        break;
    };

    filterValues ? this.isActive = true : this.isActive = false;
    this.filterChange.emit({ columnData: this.columnData, filterValues });
  }
}