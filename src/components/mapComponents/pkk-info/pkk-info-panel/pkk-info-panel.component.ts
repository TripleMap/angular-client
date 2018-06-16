import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { PkkInfoService } from '../../../../services/PkkInfoService';
import { Subscription } from 'rxjs';
import { MessageService } from '../../../../services/MessageService';

@Component({
  selector: 'pkk-info-panel',
  templateUrl: './pkk-info-panel.component.html',
  styleUrls: ['./pkk-info-panel.component.css']
})
export class PkkInfoPanelComponent implements OnInit, OnDestroy {
  public CadastralFeatureInfo: any;
  public CadastralFeatureInfoSubscription: Subscription;
  public cadSchemaProperties: any;
  public cadSchemaColumns: any;
  public cadFeature: any;
  constructor(
    public http: HttpClient,
    public MessageService: MessageService,
    public PkkInfoService: PkkInfoService
  ) { }

  ngOnInit() {
    this.CadastralFeatureInfoSubscription = this.PkkInfoService.CadastralFeatureInfo.subscribe(data => {
      this.CadastralFeatureInfo = data;
    });
    this.getCadColumnNamesForLayer();
  }
  ngOnDestroy() {
    this.CadastralFeatureInfoSubscription.unsubscribe();
  }

  getCadColumnNamesForLayer() {
    this.http.get('api/Layers/GetGeoJSONLayerSchemaWithData?LayerId=parcels_cad').subscribe((data: { properties: object; }) => {
      this.cadSchemaProperties = data.properties;
      this.cadSchemaColumns = [];
      for (let key in data.properties) {
        if (key !== 'id' && key !== 'center' && key !== 'extent') {
          this.cadSchemaColumns.push({
            name: key,
            dictionary: data.properties[key].dictionary,
            foreignTable: data.properties[key].foreignTable,
            label: data.properties[key].description || key,
            columnType: data.properties[key].columnType || 'findSimple'
          });
        }
      }
    }, error => {
      if (error.status <= 400) this.MessageService.errorMessage('Ошибка при получении описания кадастровых данных');
    });
  }

  getFindOneValue(columnName, dirtyValue) {
    let clearValue
    for (const key in this.cadSchemaProperties) {
      const prop = this.cadSchemaProperties[key];
      if (key === columnName && prop.avaliableProperties) {
        prop.avaliableProperties.map(item => {
          if (item.code == dirtyValue) {
            clearValue = item.description;
          }
        });
      }
    }
    if (!clearValue) clearValue = 'Нет значения в справочниках кадастровой информации';
    return clearValue;
  }
}
