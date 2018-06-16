import { Component } from '@angular/core';
import { GeometryEditorService } from '../../../services/GeometryEditorService';
import { MapService } from '../../../services/MapService';
import { OverLaysService, LayersLinks } from '../../../services/OverLaysService';
import { BehaviorSubject } from "rxjs";
import { MatDialog } from '@angular/material';
import { ConfirmDialogDialog } from '../../confirm-dialog/confirm-dialog.component';
import { UnionFeaturesDialogComponent } from '../../union-features-dialog/union-features-dialog.component';
import { HttpClient } from "@angular/common/http";
import { MessageService } from '../../../services/MessageService';

@Component({
  selector: 'geometry-editor',
  templateUrl: './geometry-editor.component.html',
  styleUrls: ['./geometry-editor.component.css']
})
export class GeometryEditorComponent {
  public editToolsIsActive: boolean = false;
  public editMode: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public editorHistory: BehaviorSubject<any[]> = new BehaviorSubject([]);
  constructor(
    public GeometryEditorService: GeometryEditorService,
    public MapService: MapService,
    public OverLaysService: OverLaysService,
    public MatDialog: MatDialog,
    public http: HttpClient,
    public MessageService: MessageService,
  ) {
    this.GeometryEditorService.editorHistory.subscribe();
  }

  showEditTools = () => (this.editToolsIsActive = !this.editToolsIsActive);

  createMarker() {
    const map = this.MapService.getMap();
    map.editTools.startMarker();
  }

  createPolyline() {
    const map = this.MapService.getMap();
    map.editTools.startPolyline();
  }

  createPolygon() {
    const map = this.MapService.getMap();
    map.editTools.startPolygon();
  }

  toggleEdit = () => this.editToolsIsActive ? this.stopEditing() : this.startEditing();
  toggleFeatureEdit = (e) => e.layer.toggleEdit();
  rememberEditChanges = (editChangeEvent) => {
    let id = editChangeEvent.layer.toGeoJSON().properties.id
    if (this.editorHistory.getValue().indexOf(id) === -1) {
      this.editorHistory.next([...this.editorHistory.getValue(), id]);
    }
  }

  startEditing() {
    this.editToolsIsActive = !this.editToolsIsActive; this.editMode.next(true);

    this.MapService.getMap().on('editable:vertex:dragend editable:vertex:deleted editable:vertex:new', this.rememberEditChanges, this);

    this.OverLaysService.leafletLayers.map(leafletLayer => {
      leafletLayer.on('dblclick', this.toggleFeatureEdit, this);
    });
  }

  stopEditing() {
    this.editToolsIsActive = !this.editToolsIsActive;
    this.editMode.next(false);
    const map = this.MapService.getMap();
    map.editTools.stopDrawing();
    this.MapService.getMap().on('editable:vertex:dragend editable:vertex:deleted editable:vertex:new', this.rememberEditChanges, this);

    this.OverLaysService.leafletLayers.map(leafletLayer => {
      leafletLayer.getLayers().forEach(layer => { if (layer.editor) layer.toggleEdit() });
      leafletLayer.off('dblclick', this.toggleFeatureEdit, this);
    });


    if (this.editorHistory.getValue().length > 0) {
      this.MatDialog.open(ConfirmDialogDialog, {
        width: '250px',
        data: {
          message: 'Сохранить изменения?'
        }
      }).afterClosed()
        .subscribe(confirm => {
          if (confirm) {
            this.OverLaysService.leafletLayers.map(leafletLayer => {
              leafletLayer.getLayers().forEach(layer => {
                if (layer && layer.feature && layer.feature.properties) {
                  let id = layer.feature.properties.id;
                  if (this.editorHistory.getValue().indexOf(id) !== -1) {
                    let url = LayersLinks.featuresEdit.updateFeatureGeometryById(leafletLayer.options.id, id);
                    this.http.patch(url, layer.toGeoJSON().geometry).subscribe(data => this.MessageService.succesMessage('Геометрия обновлена'), error => {
                      this.http.patch(url, layer.toGeoJSON().geometry).subscribe(data => this.MessageService.succesMessage('Геометрия обновлена'), error => {
                        this.restoreAllEditedFeatures();
                        this.MessageService.errorMessage('Ошибка при сохранении геометрии');
                      });
                    });
                  }
                }
              });
            });
            this.editorHistory.next([]);
          } else {
            this.restoreAllEditedFeatures();
            this.editorHistory.next([]);
          }
        });
    } else {
      this.editorHistory.next([]);
    }
  }

  saveEdits() {
    const map = this.MapService.getMap();
    map.editTools.stopDrawing();
    map.eachLayer(layer => { if (layer.editor) layer.toggleEdit() });
    this.OverLaysService.leafletLayers.map(leafletLayer => {
      leafletLayer.getLayers().forEach(layer => {
        if (layer && layer.feature && layer.feature.properties) {
          let id = layer.feature.properties.id;
          if (this.editorHistory.getValue().indexOf(id) !== -1) {
            let url = LayersLinks.featuresEdit.updateFeatureGeometryById(leafletLayer.options.id, id);
            this.http.patch(url, layer.toGeoJSON().geometry).subscribe(data => this.MessageService.succesMessage('Геометрия обновлена'), error => {
              this.http.patch(url, layer.toGeoJSON().geometry).subscribe(data => this.MessageService.succesMessage('Геометрия обновлена'), error => {
                this.restoreAllEditedFeatures();
                this.MessageService.errorMessage('Ошибка при сохранении геометрии');
              });
            });
          }
        }
      });
    });
    this.editorHistory.next([]);
  }

  restoreAllEditedFeatures() {
    this.OverLaysService.leafletLayers.map(leafletLayer => {
      leafletLayer.getLayers().forEach(layer => {
        if (layer && layer.feature && layer.feature.properties) {
          let id = layer.feature.properties.id;
          if (this.editorHistory.getValue().indexOf(id) !== -1) {
            let url = LayersLinks.featuresEdit.getFeatureGeoJSONById(leafletLayer.options.id, id);
            this.http.get(url).subscribe((features: any[]) => {
              if (features && features.length > 0) {
                features.map(feature => {
                  layer.remove();
                  leafletLayer.addData(feature.geometry);
                })
              }
            })
          }
        }
      });
    });
  }

  removeGeometry() {
    const map = this.MapService.getMap();
    const confirmAndRemove = (leafletLayer, removeAbleLayersId) => {
      this.MatDialog.open(ConfirmDialogDialog, {
        width: '340px',
        height: '140x',
        data: {
          message: `Удалить объекты (${removeAbleLayersId.length})?`
        }
      }).afterClosed()
        .subscribe(confirm => {
          if (confirm) {
            this.http.delete(LayersLinks.featuresEdit.removeByIds(leafletLayer.options.id, removeAbleLayersId.toString()))
              .subscribe(
                (data: { count: number }) => {
                  let removeDict = {};
                  removeAbleLayersId.map(item => { removeDict[item] = true; });

                  leafletLayer.getLayers().forEach(layer => {
                    if (layer && layer.feature && layer.feature.properties && removeDict[layer.feature.properties.id]) {
                      layer.disableEdit();
                      leafletLayer.selections.selectedFeatures.deselect(layer.feature.properties.id);
                      layer.remove();
                    }
                  });
                  this.MessageService.succesMessage(`Объекты удалены (${data.count})`);
                },
                error => {
                  this.MessageService.errorMessage('Не удалось удалить объекты');
                }
              )
          }
        });
    }

    this.OverLaysService.leafletLayers.map(leafletLayer => {
      let removeAbleLayersId = [];
      leafletLayer.getLayers().forEach(layer => {
        if (layer && layer.feature && layer.feature && layer.editor) {
          let selectedFeaturesId = leafletLayer.selections.selectedFeatures.selected;
          let editFeaturesId = [];
          leafletLayer.getLayers().forEach(layer => {
            if (layer && layer.feature && layer.feature && layer.editor) editFeaturesId.push(layer.feature.properties.id);
          });
          selectedFeaturesId.map(id => {
            if (editFeaturesId.indexOf(id) !== -1) removeAbleLayersId.push(id);
          });
        }
      });
      if (removeAbleLayersId.length === 0) {
        this.MessageService.warnMessage('Не выбрано ни одного объекта');
        return;
      } else {
        confirmAndRemove(leafletLayer, removeAbleLayersId);
      }
    });

  }


  cutGeometry() {
    const map = this.MapService.getMap();
    map.editTools.startPolyline();
    const afterSplit = (data, layersToRemove) => {
      this.MatDialog.open(ConfirmDialogDialog, {
        width: '250px',
        data: {
          message: 'Разделить объект и сохранить изменения?'
        }
      }).afterClosed()
        .subscribe(confirm => {
          if (confirm) {
            data.map(featureCollection => {
              this.OverLaysService.leafletLayers.map(leafletLayer => {
                let featureId = featureCollection.features[0].properties.id
                this.http.post(`api/Layers/CreateFeaturesOnFeatureSplit?LayerId=${leafletLayer.options.id}&featureId=${featureId}`, featureCollection)
                  .subscribe(
                    (data: any[]) => {
                      data.map(feature => leafletLayer.addData(feature));
                      this.editorHistory.next(this.editorHistory.getValue().filter(id => (layersToRemove.indexOf(id) !== -1) ? false : id));
                      layersToRemove.map(layer => layer.remove());
                      this.MessageService.succesMessage('Объект разделен.');
                    },
                    error => {
                      this.MessageService.errorMessage('Объект не удалось разделить.')
                    });
              })
            });
          }
        });
    }

    const cutPolygons = (e) => {
      let geoJSONsToCut = [];
      let layersToRemove = [];
      this.OverLaysService.leafletLayers.map(leafletLayer => {
        leafletLayer.getLayers().forEach(layer => {
          if (layer && layer.feature && layer.feature && layer.editor) { geoJSONsToCut.push(layer.toGeoJSON()); layersToRemove.push(layer) }
        });
      });
      const removeCutLileLayer = e => e.target.remove();
      e.layer.on('dblclick', removeCutLileLayer);
      if (!geoJSONsToCut.length) { this.MessageService.warnMessage('Не выбрано ни одного объекта для деления'); return; }
      let splitLine = e.layer.toGeoJSON().geometry;

      this.http.post('api/Layers/SplitFeaturesByLine', { geometries: geoJSONsToCut, splitLine })
        .subscribe(
          data => afterSplit(data, layersToRemove),
          error => this.MessageService.errorMessage('Не удалось определить возможность деления объекта')
        );
    }

    map.once('editable:drawing:commit', cutPolygons, this);

  }




  unionGeometries() {
    this.OverLaysService.leafletLayers.map(leafletLayer => {
      let unionableLayersId = [];

      let selectedFeaturesId = leafletLayer.selections.selectedFeatures.selected;
      let editFeaturesId = [];

      leafletLayer.getLayers().forEach(layer => {
        if (layer && layer.feature && layer.feature && layer.editor) editFeaturesId.push(layer.feature.properties.id);
      });
      selectedFeaturesId.map(id => {
        if (editFeaturesId.indexOf(id) !== -1) unionableLayersId.push(id);
      });
      if (unionableLayersId.length <= 1) { this.MessageService.warnMessage('Для объединения необходимо два и более объектов.'); return; };
      let mainFeatureIdToUnion;
      this.MatDialog.open(UnionFeaturesDialogComponent, {
        width: '70%',
        height: '90%',
        data: {
          layerId: leafletLayer.options.id,
          featureIds: unionableLayersId
        }
      }).afterClosed()
        .subscribe(mainFeatureIdToUnion => {
          if (mainFeatureIdToUnion) {
            this.http.post(`api/Layers/UnionGeoJSONObjectsById?LayerId=${leafletLayer.options.id}&MainFeatureIdToUnion=${mainFeatureIdToUnion}`, { featureIds: unionableLayersId })
              .subscribe(
                data => {
                  unionableLayersId.map(
                    layerId => leafletLayer
                      .getLayers()
                      .forEach(layer => {
                        if (layer && layer.feature && layer.feature.properties.id && layer.feature.properties.id === layerId) {
                          this.editorHistory.next(this.editorHistory.getValue().filter(id => (layerId === id) ? false : id));
                          layer.remove();
                        }
                      })
                  )
                  leafletLayer.addData(data);
                  this.MessageService.succesMessage('Объекты объединены.');
                },
                error => {
                  if (error.status <= 400) this.MessageService.errorMessage('Не удалось объединить объекты.');
                }
              );
          }
        });
    });
  }
}
