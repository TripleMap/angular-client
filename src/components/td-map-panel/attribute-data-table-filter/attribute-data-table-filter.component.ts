import { Component, Directive, OnInit, Input, ViewEncapsulation, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { FilterGeometryAdapter } from '../../../services/FilterGeometryAdapter'
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
  public isActive: boolean = false;
  constructor(
    public container: ViewContainerRef,
    public fb: FormBuilder,
    public changeDetectorRef: ChangeDetectorRef
  ) {

    // this.filterForm = this.fb.group({
    //   findSimple: '',
    //   findBooleanTrue: false,
    //   findBooleanFalse: false,
    //   findBooleanNull: false,
    //   findNumberFrom: [null, [Validators.min(0), Validators.pattern("^[0-9]{1,7}([,.][0-9]{0,7})?$")]],
    //   findNumberTo: [null, [Validators.min(0), Validators.pattern("^[0-9]{1,7}([,.][0-9]{0,7})?$")]]
    // });
  }

  ngOnInit() {
    if (this.columnData.columnType === 'findSimple') {
      this.filterForm = this.fb.group({
        findSimple: '',
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
        findNumberTo: [null, [Validators.min(0), Validators.pattern("^[0-9]{1,7}([,.][0-9]{0,7})?$")]]
      });
    } else if (this.columnData.columnType === 'findDate') {
      this.filterForm = this.fb.group({
        findSimple: '',
      });
    } else if (this.columnData.columnType === 'findMany') {
      this.filterForm = this.fb.group({
        findSimple: '',
      });
    }



    this.filterForm.valueChanges
      .debounceTime(500)
      .distinctUntilChanged()
      .filter(this.isValidForm)
      .map(this.pipeFiltersToNumber)
      .subscribe(this.filterData.bind(this));

  }

  pipeFiltersToNumber = filters => {
    if (this.columnData.columnType === 'findNumber') {
      filters.findNumberFrom = filters.findNumberFrom ? Number(filters.findNumberFrom.replace(",", ".")) : null;
      filters.findNumberTo = filters.findNumberTo ? Number(filters.findNumberTo.replace(",", ".")) : null;
    }
    if (this.columnData.columnType === 'findSimple') {
      filters.findSimple = filters.findSimple ? filters.findSimple.length ? filters.findSimple : null : null;
    }
    return filters;
  }

  isValidForm = () => this.filterForm.status === "VALID";

  clearForm(): void {
    if (this.columnData.columnType === 'findSimple') {
      this.filterForm.get('findSimple').setValue('');
    } else if (this.columnData.columnType === 'findBoolean') {
      this.filterForm.get('findBooleanTrue').setValue(false);
      this.filterForm.get('findBooleanFalse').setValue(false);
      this.filterForm.get('findBooleanNull').setValue(null);
    } else if (this.columnData.columnType === 'findNumber') {
      this.filterForm.get('findNumberFrom').setValue(null);
      this.filterForm.get('findNumberTo').setValue(null);
    }
    this.isActive = false;
  }

  filterData(filterValue) {
    let values;
    if (this.columnData.columnType === 'findSimple' || this.columnData.columnType === 'findDate' || this.columnData.columnType === 'findMany') {
      values = filterValue.findSimple;
      values ? this.isActive = true : this.isActive = false;
    } else if (this.columnData.columnType === 'findBoolean') {
      if (!filterValue.findBooleanTrue && !filterValue.findBooleanFalse && !filterValue.findBooleanNull) {
        values = null;
        this.isActive = false;
      } else {
        values = {
          yes: filterValue.findBooleanTrue,
          no: filterValue.findBooleanFalse,
          noop: filterValue.findBooleanNull
        };
        this.isActive = true;
      }
    } else if (this.columnData.columnType === 'findNumber') {
      if (!filterValue.findBooleanTrue && !filterValue.findBooleanFalse && !filterValue.findBooleanNull) {
        values = null;
        this.isActive = false;
      } else {
        values = {
          from: filterValue.findNumberFrom,
          to: filterValue.findNumberTo
        };
        this.isActive = true;
      }
    }

    this.filterChange.emit({ columnData: this.columnData, values });
  }
}