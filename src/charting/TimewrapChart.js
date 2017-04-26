import { Components, Interactions } from 'plottable';
import debounce from 'lodash/debounce';
import flatten from 'lodash/flatten';
import {
    createXScale,
    createYScale,
    createColorScale,
    createXAxis,
    createYAxis,
    createLegend,
    createSeriesPlot,
} from './plottable-utils';
import Tooltip from './Tooltip';
import './TimewrapChart.css';

let synchronousUpdates = false;

export default class {

    // For testing only
    static useSynchronousUpdates() {
        synchronousUpdates = true;
    }

    constructor(el, colorPalette) {
        this.el = el;
        this.el.classList.add('custom-timewrap-visualization');
        this.el.innerHTML = '<div class="render-to" width="100%" height="100%"></svg>';
        this.colorPalette = colorPalette;
        this.tooltip = null;
        this.selectedPoint = null;
        this.clickHandler = null;
        if (!synchronousUpdates) {
            this.update = debounce(this.update, 10);
        }
        this.clickInteractionCallback = this.clickInteractionCallback.bind(this);
    }

    update(data, config, seriesNames) {
        if (this.chart) {
            this.clear();
        }
        const scales = {
            x: createXScale(data),
            y: createYScale(),
            color: createColorScale(seriesNames, this.colorPalette),
        };
        const rotateXLabels = config.xLabelRotation === 'on';
        const xAxis = createXAxis(scales.x, data, rotateXLabels);
        const yAxis = createYAxis(scales.y);
        const gridlines = new Components.Gridlines(null, scales.y);
        const legend = createLegend(scales.color, config.legendPlacement);
        const showMarkers = config.pointMarkers === 'on';
        const plots = flatten(data.map((dataSeries, i) => {
            const seriesName = seriesNames[i];
            return createSeriesPlot(dataSeries, seriesName, scales, showMarkers);
        }));
        this.plotGroup = new Components.Group([gridlines, ...plots]);

        if (!legend) {
            this.chart = new Components.Table([
                [yAxis, this.plotGroup],
                [null, xAxis],
            ]);
        } else if (config.legendPlacement === 'bottom') {
            this.chart = new Components.Table([
                [yAxis, this.plotGroup],
                [null, xAxis],
                [null, legend],
            ]);
        } else {
            this.chart = new Components.Table([
                [yAxis, this.plotGroup, legend],
                [null, xAxis, null],
            ]);
        }
        this.chart.renderTo(this.el.querySelector('div.render-to'));

        const tooltipDateFormat = config.tooltipFormat || 'MMM Do, YYYY h:mm A';
        this.tooltip = new Tooltip(scales.color, tooltipDateFormat);
        this.tooltip.onShow(this.onTooltipShow.bind(this));
        this.tooltip.onHide(this.onTooltipHide.bind(this));
        this.tooltip.attachTo(this.plotGroup);

        this.clickInteraction = new Interactions.Click();
        this.clickInteraction.onClick(this.clickInteractionCallback);
        this.clickInteraction.attachTo(this.plotGroup);
    }

    onTooltipShow(point) {
        this.selectedPoint = point;
        this.el.style.cursor = 'pointer';
    }

    onTooltipHide() {
        this.selectedPoint = null;
        this.el.style.cursor = '';
    }

    remove() {
        this.clear();
        this.clickHandler = null;
    }

    clear() {
        if (this.clickInteraction) {
            this.clickInteraction.offClick(this.clickInteractionCallback);
            this.clickInteraction.detachFrom(this.plotGroup);
        }
        if (this.chart) {
            this.chart.destroy();
        }
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    }

    clickInteractionCallback(point, e) {
        if (!this.selectedPoint || !this.clickHandler) {
            return;
        }
        const { date, fieldName, fieldValue } = this.selectedPoint.datum;
        const clickInfo = {
            date: date.toDate(),
            [fieldName]: fieldValue,
        };
        this.clickHandler(clickInfo, e);
    }

    onClick(handler) {
        this.clickHandler = handler;
    }

}