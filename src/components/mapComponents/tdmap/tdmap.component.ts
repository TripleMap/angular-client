import { Component, AfterViewInit, OnInit } from "@angular/core";
import { MapService } from "../../../services/MapService";
import { HttpParams, HttpClient } from "@angular/common/http";

// прикрутить хэш строки в браузере
@Component({
  selector: "td-map",
  templateUrl: "./tdmap.component.html",
  styleUrls: ["./tdmap.component.css"]
})
export class TdmapComponent implements AfterViewInit, OnInit {
  constructor(public _http: HttpClient, public _mapService: MapService) {}

  ngOnInit() {
    // переопределяем getPromise
    TDMap.Utils.Promise.getPromise = (url: string, requestParams: any) => {
      let params = new HttpParams();
      if (requestParams) {
        for (let key in requestParams) {
          params = params.set(key, requestParams[key]);
        }
      }
      return new Promise((resolve, reject) =>
        this._http.get(url, { params }).subscribe(
          data => resolve({ data }),
          err => {
            alert(err);
          }
        )
      );
    };
  }

  ngAfterViewInit() {
    this._mapService.createLeafletMap("map");
  }
}
