export const GeoUtil = {

    isHoleIntersectsPolygon: function(hole, polygon) {
        var result = this.parseResult(this.isMultiPointInsideBBox(hole, polygon));
        if (result === 'within' || result === 'overlaps') {
            return true;
        } else {
            return false;
        }
    },

    isMultiPointInsideBBox: function(coordinates, bboxCoords) {
        var arrayOfResults = [];
        for (var i = 0; i < coordinates.length; i++) {
            arrayOfResults.push(this.pointIntersectionMath(coordinates[i], bboxCoords));
        }
        return arrayOfResults;
    },

    pointIntersectionMath: function(pointCoordinates, bboxCoords) {
        var x = pointCoordinates[0],
            y = pointCoordinates[1];
        var inside = false;
        for (var i = 0, j = bboxCoords.length - 1; i < bboxCoords.length; j = i++) {
            var xi = bboxCoords[i][0],
                yi = bboxCoords[i][1];
            var xj = bboxCoords[j][0],
                yj = bboxCoords[j][1];
            var intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    },

    parseResult: function(result) {
        if (result === true && typeof(result) === "boolean") {
            return "within";
        } else if (result === false && typeof(result) === "boolean") {
            return "no intersects";
        } else if (result.constructor === Array) {
            result.sort();
            if (result[0] === result[result.length - 1] && result[0] === true) {
                return "within";
            } else if (result[0] === result[result.length - 1] && result[0] === false) {
                return "no intersects";
            } else {
                return "overlaps";
            }
        }
    }
};