import {
    MSQR
} from './msqr.js'
import {
    GeoUtil
} from '../utils/TDMap.Utils.GeoUtil.js'

export class ImageVectorize {
    constructor() {

    }

    pkkImageToGeoJSON(image, map, deltaSW, deltaNE, zoom, d) {
        // получаем список точек первого обхода
        let pathPoints = MSQR(image, {
            tolerance: 1.5,
            path2D: true,
            maxShapes: 25
        });
        let polygons = pathPoints.filter(item => item.length > 2 ? item : false);

        // инвертируем растр для получения "дырок"
        // создаем новый канвас и на нем отрисовываем послойно инверсию
        let canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        ctx.fillStyle = "rgb(255, 255, 0)";
        ctx.beginPath();
        // сначала отрисовываем, то что было за границей первого обхода в желтый цвет
        for (var z = 0; z < pathPoints.length; z++) {
            if (pathPoints[z].length > 3) {
                for (var i = 0; i < pathPoints[z].length; i++) {
                    if (i === 0) {
                        ctx.moveTo(pathPoints[z][i].x, pathPoints[z][i].y);
                    } else if (i === pathPoints[z].length) {
                        ctx.lineTo(pathPoints[z][i].x, pathPoints[z][i].y);
                    } else {
                        ctx.lineTo(pathPoints[z][i].x, pathPoints[z][i].y);
                    }
                }
            }
        }
        ctx.rect(0, 0, image.width, image.height);
        ctx.fill();
        // инвертируем границы и бублики в целом
        let imgData = ctx.getImageData(0, 0, image.width, image.height);
        for (let d = 0; d < imgData.data.length; d += 4) {
            if (imgData.data[d + 3] === 0) {
                imgData.data[d] = 255;
                imgData.data[d + 1] = 0;
                imgData.data[d + 2] = 0;
                imgData.data[d + 3] = 255;
            } else {
                imgData.data[d] = 0;
                imgData.data[d + 1] = 0;
                imgData.data[d + 2] = 0;
                imgData.data[d + 3] = 0;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // получаем список точек второго обхода
        let holes = MSQR(ctx, {
            tolerance: 1.5,
            path2D: true,
            maxShapes: 100
        }).filter(item => item.length > 2 ? item : false);

        let geometry = {
            type: "MultiPolygon",
            coordinates: []
        };
        geometry.coordinates = polygons.map(polygonItem => {
            let exterior = polygonItem.map(item => {
                let polygonPoint = L.point(item.x * d[1] + deltaSW.x, item.y * d[1] + deltaNE.y);
                return [map.unproject(polygonPoint, zoom).lng, map.unproject(polygonPoint, zoom).lat];
            })
            if (polygonItem.length) exterior.push(exterior[0]);
            return [exterior];
        });

        let arrayOfHoles = holes.map(holeItem => {
            let hole = holeItem.map(item => {
                let holePoint = L.point(item.x * d[1] + deltaSW.x, item.y * d[1] + deltaNE.y);
                return [map.unproject(holePoint, zoom).lng, map.unproject(holePoint, zoom).lat];
            })
            if (holeItem.length) hole.push(hole[0]);

            return hole;
        });

        //проверка на пересечение
        //проверяем каждый полигон и каждый бублик на предмет пересечения.
        if (arrayOfHoles.length > 0) {
            for (var p = 0; p < geometry.coordinates.length; p++) {
                for (var ah = 0; ah < arrayOfHoles.length; ah++) {
                    var intersectResult = GeoUtil.isHoleIntersectsPolygon(arrayOfHoles[ah], geometry.coordinates[p][0]);
                    if (intersectResult) {
                        geometry.coordinates[p].push(arrayOfHoles[ah]);
                    }
                }
            }
        }
        return geometry;
    }
}