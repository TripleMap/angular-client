import {
	CadastralSearchProvider
} from './TDMap.CadastralTools.DataProvider.js'
import {
	Observable
} from "rxjs/Observable";
import 'rxjs/add/observable/fromPromise';

export class CadastralSearchDataService {
	public map: any;
	public cadastralSearchProvider: any;
	constructor(map) {
		this.map = map;
		this.cadastralSearchProvider = new CadastralSearchProvider(map);
	}

	getGeoJsonByCadNum(cadNum, cadObjType) {
		return Observable.fromPromise(new Promise((resolve, reject) => {
			this.cadastralSearchProvider.getDataByCadastralNumber(cadNum, cadObjType).then((data, type) => {
				if (type === "withoutCoords") {
					resolve({ data, type: "withoutCoords" });
					return;
				}
				if (type === "noObjects") {
					resolve({ data, type: "noObjects" });
					return;
				}
				if (type === "withCoords") {
					let bbox = [
						data.properties.extent.xmin,
						data.properties.extent.ymin,
						data.properties.extent.xmax,
						data.properties.extent.ymax
					];
					let strBbox = bbox.join();
					let bounds = new L.latLngBounds(
						L.Projection.SphericalMercator.unproject(new L.point(data.properties.extent.xmin, data.properties.extent.ymax)),
						L.Projection.SphericalMercator.unproject(new L.point(data.properties.extent.xmax, data.properties.extent.ymin))
					);

					let newBoundsNorthEast = this.map.getPixelBounds(bounds._northEast, 18);
					let newBoundsSouthWest = this.map.getPixelBounds(bounds._southWest, 18);
					let futureNE = {
						x: newBoundsNorthEast.min.x + this.map.getSize().x / 2,
						y: newBoundsNorthEast.min.y + this.map.getSize().y / 2
					};
					let futureSW = {
						x: newBoundsSouthWest.min.x + this.map.getSize().x / 2,
						y: newBoundsSouthWest.min.y + this.map.getSize().y / 2
					};

					let futureHight = futureSW.y - futureNE.y;
					let futureWidth = futureNE.x - futureSW.x;

					let kW, kH;
					(futureHight / 4096 > 1) ? kH = futureHight / 4096 : kH = 1;
					(futureWidth / 4096 > 1) ? kW = futureWidth / 4096 : kW = 1;

					let d = [kW, kH].sort();
					let size = [futureWidth / d[1], futureHight / d[1]];
					let strSize = size.join();
					//////
					///// TO DO !!!
					//// ИСПОЛЬЗОВАТЬ WEB WORKER
					this.cadastralSearchProvider.getImageByCadastralNumber(data.properties.id, strBbox, strSize, futureSW, futureNE).then((geometry) => {
						resolve({
							data: {
								type: "Feature",
								geometry: geometry,
								properties: data.properties
							}, type: "withCoords"
						});
					}, error => reject(error));
				}
			}, error => reject(error));
		}))
	};

	getFeatureByCadastralNumber(cadNum, cadObjType) {
		return Observable.fromPromise(this.cadastralSearchProvider.getFeatureByCadastralNumber(cadNum, (cadObjType || 'PARCEL')));
	};

	getFeaturesByLocation(latLng, cadObjType) {
		let lngLatString = latLng instanceof L.LatLng ? `${latLng.lng},${latLng.lat}` : latLng;
		return Observable.fromPromise(this.cadastralSearchProvider.getFeatureByLocation(lngLatString, (cadObjType || 'PARCEL')));
	};

	getTypeAheadFeatures(text, limit, cadObjType) {
		return Observable.fromPromise(this.cadastralSearchProvider.getTypeAheadFeatures(text, limit, (cadObjType || 'PARCEL')));
	};
};