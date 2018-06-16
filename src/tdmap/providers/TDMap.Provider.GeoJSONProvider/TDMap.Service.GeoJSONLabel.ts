import * as polylabel from 'polylabel';
import * as moment from 'moment';
export class GeoJSONLabelLayer {
    public labelField: string | boolean = false;
    private labelsLayerSVGHack: any;
    public url: string | boolean = false;
    private leafletLayer: any = null;
    public set labelData(data) {
        this._labelData = data;
        this.renderData();
    }
    public get labelData() {
        return this._labelData
    }

    public _labelData: {} = {};
    public canvas: any;

    constructor(leafletLayer, urlToGetData) {
        this.leafletLayer = leafletLayer;
        this.url = urlToGetData;
    }

    addLabels(labelField) {
        this.labelField = labelField;

        this.labelsLayerSVGHack = L.geoJSON({
            "type": "Feature", "properties": {},
            "geometry": { "type": "LineString", "coordinates": [[0, 0], [0, 0]] }
        }, { renderer: L.svg(), className: `label_path_${this.leafletLayer.options.id}` })
            .addTo(this.leafletLayer._map);
        let svgPath = document.getElementsByClassName(`label_path_${this.leafletLayer.options.id}`);
        let svgGroup = svgPath[0].parentElement;
        svgGroup.setAttribute('id', `label_group_${this.leafletLayer.options.id}`);

        this.updateLabels();
        this.leafletLayer._map.on('moveend', this.refreshOnMoveEnd, this)

    }

    updateLabels() {
        this.clearLabels();
        const getDataProcess = this.getDataToLabel();
        if (!getDataProcess) return;
        getDataProcess
            .subscribe(
                response => this.labelData = response,
                error => this.removeLabels()
            );
    }

    getDataToLabel() {
        if (this.url && this.labelField) return TDMap.Utils.Promises.getPromise(this.url, { FieldToLabel: this.labelField });
        return false;
    }

    removeLabels() {
        this.clearLabels();
        this.labelsLayerSVGHack.remove();
        this.labelData = null;
        this.leafletLayer._map.off('moveend', this.refreshOnMoveEnd, this)
    }

    renderData() {
        this.labelFeatures();
    }

    refreshOnMoveEnd() {
        this.clearLabels();
        this.labelFeatures();
    }
    labelFeatures() {
        let column;
        for (const key in this.leafletLayer.schemaProperties) {
            if (this.labelField === key) column = this.leafletLayer.schemaProperties[key];
        }
        if (!column) return;
        const group = d3.select(`#label_group_${this.leafletLayer.options.id}`).append('g').attr("id", `labels_group_${this.leafletLayer.options.id}`);
        this.leafletLayer.eachLayer(layer => {

            let layerId = layer.feature.properties.id;
            let labelData = this._labelData[layerId];
            if (labelData === null || labelData === undefined) return;
            let label;
            if (column.columnType === 'findMany') label = labelData.map(item => item.description).join(',')
            if (column.columnType === 'findOne') label = labelData.description;
            if (column.columnType === 'findUser') label = labelData.username;
            if (column.columnType === 'findBoolean') label = labelData ? 'Да' : 'Нет';
            if (column.columnType === 'findNumber' || column.columnType === 'findSimple') label = labelData;
            if (column.columnType === 'findDate') label = moment(Number(labelData)).format('DD.MM.YYYY HH:mm');

            const region = (layer._parts && layer._parts[0] && layer._parts[0].length > 0) ? layer._parts[0] : false;
            if (!region) return;
            let polygon = [[...layer._parts[0].map(item => [item.x, item.y])]]
            let pos = polylabel(polygon, 1.0);

            if (isNaN(pos[0]) || isNaN(pos[1])) return;

            group.append('text')
                .attr("class", `halo_${this.leafletLayer.options.id}`)
                .style("stroke", 'white')
                .style("opacity", 0.5)
                .style("stroke-width", 2)
                .style("font-size", '12')
                .style("text-anchor", 'middle')
                .style("font-family", 'Roboto,Helvetica Neue,sans-serif')
                .attr("x", pos[0])
                .attr("y", pos[1])
                .text(label);
            group.append('text')
                .attr("class", `text_${this.leafletLayer.options.id}`)
                .style("fill", 'maroon')
                .style("fill-opacity", 0.8)
                .style("text-anchor", 'middle')
                .style("font-size", '12')
                .style("font-family", 'Roboto,Helvetica Neue,sans-serif')
                .attr("x", pos[0])
                .attr("y", pos[1])
                .text(label);
        });
    }

    clearLabels() {
        const element = document.getElementById(`labels_group_${this.leafletLayer.options.id}`);
        element && element.parentNode && element.parentNode.removeChild(element);
    }

}