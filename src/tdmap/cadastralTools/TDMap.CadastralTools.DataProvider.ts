import { ImageVectorize } from './TDMap.CadastralTools.ImageVectorize.js';

let random = () => Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);


export class CadastralSearchProvider {
    public map: any;;
    public typeAheadUrl = "http://pkk5.rosreestr.ru/api/typeahead";
    public featuresUrl = "http://pkk5.rosreestr.ru/api/features";
    public featuresTypes = {
        PARCEL: 1,
        OKS: 5
    }
    public imageVectorize: any;
    constructor(map) {
        this.map = map;
        this.typeAheadUrl = "http://pkk5.rosreestr.ru/api/typeahead";
        this.featuresUrl = "http://pkk5.rosreestr.ru/api/features";
        this.featuresTypes = {
            PARCEL: 1,
            OKS: 5
        }
        this.imageVectorize = new ImageVectorize();
    }
    getFeatureByCadastralNumber(cadNum, cadObjType) {
        var urlOptions = {
            text: cadNum,
            tolerance: "16391",
            limit: 16,
            callback: `JQuery${random()}${random()}`
        };
        this[urlOptions.callback] = function (data) { };

        return new Promise((resolve, reject) => {
            let dataUrl = `${this.featuresUrl}/${this.featuresTypes[cadObjType]}/${cadNum.split(':').map(elem => Number(elem)).join(':')}`;
            return $.ajax({
                url: dataUrl,
                type: "GET",
                dataType: "jsonp",
                success: function (response) {
                    if (!response.feature) {
                        resolve(false);
                        return
                    }
                    if (!response.feature.center && !response.feature.extent) {
                        resolve({
                            data: {
                                type: "Feature",
                                properties: {
                                    cn: response.feature.attrs.cn,
                                    id: response.feature.attrs.id
                                }
                            },
                            type: "withoutCoords"
                        });
                        return;
                    }

                    let cords = L.Projection.SphericalMercator.unproject(
                        L.point(response.feature.center.x, response.feature.center.y)
                    );
                    let obj = {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [
                                cords[Object.keys(cords)[1]],
                                cords[Object.keys(cords)[0]]
                            ]
                        },
                        properties: response.feature.attrs
                    };
                    obj.properties.extent = response.feature.extent;
                    obj.properties.center = response.feature.center;
                    resolve({ data: obj, type: "withCoords" });
                },
                error: error => reject(error)
            });
        });
    }

    getImageByCadastralNumber(cadnum, strBbox, strSize, futureSW, futureNE) {
        var urlOptions = {
            dpi: "96",
            transparent: "true",
            format: "png32",
            layers: "show:6,7",
            bbox: strBbox,
            bboxSR: "3857",
            imageSR: "3857",
            size: strSize,
            layerDefs: JSON.stringify({
                "6": `ID = '${cadnum}'`,
                "7": `ID = '${cadnum}'`
            }),
            f: "image"
        };
        let self = this;
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "http://pkk5.rosreestr.ru/arcgis/rest/services/Cadastre/CadastreSelected/MapServer/export?",
                type: "GET",
                data: urlOptions,
                success: function (data) {
                    var image = new Image();
                    image.setAttribute("crossOrigin", "anonymous");
                    image.onload = function () {
                        let geometry = self.imageVectorize.pkkImageToGeoJSON(image, self.map, futureSW, futureNE, 18);
                        //resolve(geometry, image.width, image.height, urlOptions.bbox);
                    };
                    image.onerror = error => reject(error);
                    image.src = this.url;
                },
                error: error => reject(error)
            });
        });
    }

    getFeaturesByLocation(lngLatString, cadObjType) {
        return new Promise((resolve, reject) => {
            var urlOptions = {
                text: lngLatString,
                tolerance: "16",
                limit: 11,
                callback: "JQuery" + random() + random()
            };

            this[urlOptions.callback] = function (data) { };
            let dataUrl = `${this.featuresUrl}/${this.featuresTypes[cadObjType]}?`;
            $.ajax({
                url: dataUrl,
                type: "GET",
                data: urlOptions,
                dataType: "jsonp",
                jsonpCallback: urlOptions.callback,
                success: function (response) {
                    if (!response.features.length) {
                        resolve([]);
                        return;
                    }
                    let result = response.features.map((item) => {
                        let cords = L.Projection.SphericalMercator.unproject(
                            L.point(item.center.x, item.center.y)
                        );
                        return {
                            display_name: item.attrs.address,
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [cords[Object.keys(cords)[1]], cords[Object.keys(cords)[0]]]
                            },
                            properties: {
                                address: item.attrs.address,
                                cn: item.attrs.cn,
                                id: item.attrs.id,
                                extent: item.extent,
                                type: item.type
                            }
                        };
                    });

                    resolve(result);
                },
                error: error => reject(error)
            });
        });
    }

    getTypeAheadFeatures(text, limit, type) {
        return new Promise((resolve, reject) => {
            if (!text) {
                resolve(null);
                return;
            }

            $.ajax({
                url: this.typeAheadUrl,
                type: "GET",
                data: {
                    text,
                    limit: limit || 10,
                    type: this.featuresTypes[type] || 1
                },
                dataType: "json",
                success: response => resolve(response),
                error: error => reject(error)
            })
        });
    }
}