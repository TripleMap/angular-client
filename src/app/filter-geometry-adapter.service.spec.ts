import { TestBed, inject } from '@angular/core/testing';

import { FilterGeometryAdapterService } from './filter-geometry-adapter.service';

describe('FilterGeometryAdapterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilterGeometryAdapterService]
    });
  });

  it('should be created', inject([FilterGeometryAdapterService], (service: FilterGeometryAdapterService) => {
    expect(service).toBeTruthy();
  }));
});
