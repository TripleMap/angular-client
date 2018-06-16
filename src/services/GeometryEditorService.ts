import { Injectable } from '@angular/core';
import { OverLaysService } from './OverLaysService';
import { MapService } from './MapService';
import { BehaviorSubject } from "rxjs";
@Injectable({
  providedIn: 'root'
})
export class GeometryEditorService {
  public editMode: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public editorHistory: BehaviorSubject<{ feature: any }[]> = new BehaviorSubject([]);
  constructor(
    public OverLaysService: OverLaysService,
    public MapService: MapService
  ) { }


  toggleFeatureEdit = (e) => e.layer.toggleEdit();

  rememberEditChanges(editChangeEvent) {
    this.editorHistory.next([...this.editorHistory.getValue(), { feature: editChangeEvent.layer.toGeoJSON() }]);
  }
}
