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

export default class {

    constructor(el, colorPalette) {
        this.el = el;
        this.el.classList.add('custom-timewrap-visualization');
        this.el.innerHTML = '<svg width="100%" height="100%"></svg>';
        this.colorPalette = colorPalette;
        this.tooltip = null;
        this.selectedPoint = null;
        this.clickHandler = null;
        this.update = debounce(this.update, 10);
        this.clickInteractionCallback = this.clickInteractionCallback.bind(this);
    }

    update(data, config, seriesNames) {
        if (this.chart) {
            this.chart.destroy();
        }
        const scales = {
            x: createXScale(),
            y: createYScale(),
            color: createColorScale(seriesNames, this.colorPalette),
        };
        const xAxis = createXAxis(scales.x, data);
        const yAxis = createYAxis(scales.y);
        const gridlines = new Components.Gridlines(null, scales.y);
        const legend = createLegend(scales.color, config.legendPlacement);
        const showMarkers = config.pointMarkers === 'on';
        const plots = flatten(data.map((dataSeries, i) => {
            const seriesName = seriesNames[i];
            return createSeriesPlot(dataSeries, seriesName, scales, showMarkers);
        }));
        const plotGroup = new Components.Group([gridlines, ...plots]);

        if (!legend) {
            this.chart = new Components.Table([
                [yAxis, plotGroup],
                [null, xAxis],
            ]);
        } else if (config.legendPlacement === 'bottom') {
            this.chart = new Components.Table([
                [yAxis, plotGroup],
                [null, xAxis],
                [null, legend],
            ]);
        } else {
            this.chart = new Components.Table([
                [yAxis, plotGroup, legend],
                [null, xAxis, null],
            ]);
        }
        this.chart.renderTo(this.el.querySelector('svg'));

        const tooltipDateFormat = config.tooltipFormat || 'MMM Do, YYYY h:mm A';
        this.tooltip = new Tooltip(scales.color, tooltipDateFormat);
        this.tooltip.onShow(this.onTooltipShow.bind(this));
        this.tooltip.onHide(this.onTooltipHide.bind(this));
        this.tooltip.attachTo(plotGroup);

        this.clickInteraction = new Interactions.Click();
        this.clickInteraction.onClick(this.clickInteractionCallback);
        this.clickInteraction.attachTo(plotGroup);
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
        if (this.chart) {
            this.chart.destroy();
        }
        if (this.tooltip) {
            this.tooltip.destroy();
        }
        if (this.clickInteraction) {
            this.clickInteraction.offClick(this.clickInteractionCallback);
        }
        this.clickHandler = null;
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