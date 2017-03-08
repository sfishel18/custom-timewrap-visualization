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
        const legend = createLegend(scales.color);
        const plots = flatten(data.map((dataSeries, i) => {
            const seriesName = seriesNames[i];
            return createSeriesPlot(dataSeries, seriesName, scales);
        }));
        const plotGroup = new Components.Group([gridlines, ...plots]);

        this.chart = new Components.Table([
            [yAxis, plotGroup, legend],
            [null, xAxis, null],
        ]);
        this.chart.renderTo(this.el.querySelector('svg'));

        const tooltipDateFormat = config.tooltipFormat || 'MMM Do, YYYY h:mm A';
        this.tooltip = new Tooltip(scales.color, tooltipDateFormat);
        this.tooltip.onShow(this.onTooltipShow.bind(this));
        this.tooltip.onHide(this.onTooltipHide.bind(this));
        this.tooltip.attachTo(plotGroup);

        const clickInteraction = this.createClickInteraction();
        clickInteraction.attachTo(plotGroup);
    }

    onTooltipShow(point) {
        this.selectedPoint = point;
        this.el.style.cursor = 'pointer';
    }

    onTooltipHide() {
        this.selectedPoint = null;
        this.el.style.cursor = '';
    }

    createClickInteraction() {
        const clickInteraction = new Interactions.Click();
        clickInteraction.onClick((point, e) => {
            if (!this.selectedPoint || !this.clickHandler) {
                return;
            }
            const { date, fieldName, fieldValue } = this.selectedPoint.datum;
            const clickInfo = {
                date: date.toDate(),
                [fieldName]: fieldValue,
            };
            this.clickHandler(clickInfo, e);
        });
        return clickInteraction;
    }

    onClick(handler) {
        this.clickHandler = handler;
    }

}