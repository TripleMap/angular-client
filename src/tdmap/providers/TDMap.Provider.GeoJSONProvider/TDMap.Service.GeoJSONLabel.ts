import * as polylabel from 'polylabel';
import * as moment from 'moment';
export class GeoJSONLabelLayer {
    public labelProperties: any | boolean = false;
    private labelsLayerSVGHack: any;
    public url: string | boolean = false;
    public canLabel: boolean = false;
    private leafletLayer: any = null;
    public labelOptions: {
        field_to_label: string;
        label_color: string;
        label_font_size: string;
        halo_color: string;
        halo_size: string;
        active: boolean,
    } = {
            field_to_label: '',
            label_color: '#000',
            label_font_size: '12',
            halo_color: '#fff',
            halo_size: '12',
            active: false,
        };

    public labelData: {} = {};

    constructor(urlToGetData) {
        this.url = urlToGetData;
    }

    setLabelProperties(labelProperties) {
        this.labelProperties = labelProperties;
        this.getDataToLabel();
    }

    addLabelLayer(leafletLayer) {
        this.leafletLayer = leafletLayer;
        this.labelsLayerSVGHack = L.geoJSON({
            "type": "Feature", "properties": {},
            "geometry": { "type": "LineString", "coordinates": [[0, 0], [0, 0]] }
        }, { renderer: L.svg(), className: `label_path_${this.leafletLayer.options.id}` })
            .addTo(this.leafletLayer._map);
        let svgPath = document.getElementsByClassName(`label_path_${this.leafletLayer.options.id}`);
        let svgGroup = svgPath[0].parentElement;
        svgGroup.setAttribute('id', `label_group_${this.leafletLayer.options.id}`);
        this.leafletLayer._map.on('zoomend dragend', this.refreshLabels, this);

    }

    removeLabelLayer() {
        if (this.labelsLayerSVGHack) {
            this.labelsLayerSVGHack.remove();
            this.labelsLayerSVGHack = null;
            const element = document.getElementById(`label_group_${this.leafletLayer.options.id}`);
            const g = element ? element.parentNode : false;
            g && g.parentNode && g.parentNode.removeChild(g);
        }

        if (this.leafletLayer && this.leafletLayer._map) this.leafletLayer._map.off('zoomend dragend', this.refreshLabels, this);

    }
    getDataToLabel() {
        if (!(this.url && this.labelProperties && this.labelProperties.field_to_label)) return;
        TDMap.Utils.Promises.getPromise(this.url, { FieldToLabel: this.labelProperties.field_to_label })
            .subscribe(
                response => {
                    this.labelData = response;
                    this.labelFeatures();
                },
                error => this.clearLabels()
            );
    }


    removeLabels() {
        this.clearLabels();
        this.labelData = null;
    }

    refreshLabels(e) {
        this.clearLabels();
        if (!this.canLabel) return;
        if (e && e.type === 'zoomend') {
            setTimeout(() => { this.labelFeatures(); }, 0);
        } else {
            this.labelFeatures();
        }

    }

    clearLabels() {
        if (!(this.leafletLayer && this.leafletLayer.options)) return;
        const element = document.getElementById(`labels_group_${this.leafletLayer.options.id}`);
        element && element.parentNode && element.parentNode.removeChild(element);
    }


    labelFeatures() {
        if (!this.leafletLayer || !this.leafletLayer._map) return;
        let zoom = this.leafletLayer._map.getZoom();

        if (zoom < 12 || !this.labelData) return;
        let column;
        for (const key in this.leafletLayer.schemaProperties) {
            if (this.labelProperties.field_to_label === key) column = this.leafletLayer.schemaProperties[key];
        }
        if (!column) return;
        d3.select(`#labels_group_${this.leafletLayer.options.id}`).remove();
        const group = d3.select(`#label_group_${this.leafletLayer.options.id}`).append('g').attr("id", `labels_group_${this.leafletLayer.options.id}`);
        this.leafletLayer.eachLayer(layer => {

            let layerId = layer.feature.properties.id;
            let labelData = this.labelData[layerId];
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
                .style("stroke", this.labelProperties.halo_color)
                .style("stroke-width", this.labelProperties.halo_size)
                .style("font-size", this.labelProperties.label_font_size)
                .style("text-anchor", 'middle')
                .style("font-family", 'Roboto,Helvetica Neue,sans-serif')
                .attr("x", pos[0])
                .attr("y", pos[1])
                .text(label);
            group.append('text')
                .attr("class", `text_${this.leafletLayer.options.id}`)
                .style("fill", this.labelProperties.label_color)
                .style("text-anchor", 'middle')
                .style("font-size", this.labelProperties.label_font_size)
                .style("font-family", 'Roboto,Helvetica Neue,sans-serif')
                .attr("x", pos[0])
                .attr("y", pos[1])
                .text(label);
        });
    }
}