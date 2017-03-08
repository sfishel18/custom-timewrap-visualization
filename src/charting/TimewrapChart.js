import RealPlotabble from 'plottable';
import debounce from 'lodash/debounce';
import sortBy from 'lodash/sortBy';
import find from 'lodash/find';
import $ from 'jquery';
import 'jquery-powertip';
import './TimewrapChart.css';

let Plottable = RealPlotabble;

export const setPlottable = (p) => { Plottable = p; };

export const lineSymbolFactory = (size) => {
    const halfSize = size / 2;
    return `M ${-halfSize},1 L ${halfSize},1, ${halfSize},-1 ${-halfSize},-1 Z`;
};

const generateTooltipHtml = (point, seriesColor, timeFormat) =>
    `<table>
        <tr>
            <th colspan="2" style="text-align: left; color: ${seriesColor};">
                ${point.datum.date.format(timeFormat)}
            </th>
        </tr>
        <tr>
            <td style="text-align: left;">
                ${point.datum.fieldName}:
            </td>
            <td style="text-align: right;">
                ${parseFloat(point.datum.fieldValue).toLocaleString()}
            </td>
        </tr>
    </table>`;

$.fn.powerTip.smartPlacementLists.e = ['e', 'w'];

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
        const { Scales, Axes, Plots, Dataset, Components, Interactions, Utils } = Plottable;
        const xScale = new Scales.Category();
        xScale.outerPadding(0);
        const yScale = new Scales.Linear();
        yScale.addIncludedValuesProvider(() => [0]);
        yScale.addPaddingExceptionsProvider(() => [0]);
        yScale.snappingDomainEnabled(true);
        const colorScale = new Scales.Color();
        colorScale.range(this.colorPalette);
        colorScale.domain(seriesNames);

        const xAxis = new Axes.Category(xScale, 'bottom');
        xAxis.tickLabelPadding(5);
        xAxis.formatter((str) => {
            const index = parseInt(str, 10);
            const series = find(data, s => s.length > index);
            return series[index].label;
        });
        const yAxis = new Axes.Numeric(yScale, 'left');
        yAxis.formatter(d => d.toLocaleString());

        const gridlines = new Components.Gridlines(null, yScale);

        const plots = data.map((dataSeries, i) => {
            const plot = new Plots.Line();
            plot.x((d, index) => String(index), xScale);
            plot.y(d => parseFloat(d.fieldValue), yScale);
            plot.attr('stroke', seriesNames[i], colorScale);
            plot.attr('stroke-width', '1px');

            const dataset = new Dataset(dataSeries);
            plot.addDataset(dataset);
            return plot;
        });

        const legend = new Components.Legend(colorScale);
        legend.yAlignment('center');
        legend.maxEntriesPerRow(1);
        legend.symbol(() => lineSymbolFactory);

        const plotGroup = new Components.Group([gridlines, ...plots]);

        this.chart = new Components.Table([
            [yAxis, plotGroup, legend],
            [null, xAxis, null],
        ]);
        this.chart.renderTo(this.el.querySelector('svg'));

        this.tooltipDateFormat = config.tooltipFormat || 'MMM Do, YYYY h:mm A';
        const tooltipAnchor = plotGroup.foreground().append('circle').attr({
            r: 5,
            opacity: 0,
        });
        $(tooltipAnchor.node()).powerTip({
            placement: 'e',
            smartPlacement: true,
            fadeInTime: 0,
            fadeOutTime: 0,
            manual: true,
            offset: 5,
            popupId: 'custom-timewrap-visualization-tooltip',
        });

        const pointer = new Interactions.Pointer();
        pointer.onPointerMove((queryPoint) => {
            const candidates = plotGroup.components()
                .filter(component => component instanceof Plots.Line)
                .map(component => component.entityNearestByXThenY(queryPoint))
                .filter(point => !!point)
                .map(point => ({
                    point,
                    distance: Utils.Math.distanceSquared(point.position, queryPoint),
                }));

            const sortedCandidates = sortBy(candidates, candidate => candidate.distance);
            if (sortedCandidates.length > 0 && sortedCandidates[0].distance <= 900) {
                const point = sortedCandidates[0].point;
                const colorName = point.component.attr('stroke').accessor();
                this.setSelectedPoint(point, colorScale.scale(colorName), tooltipAnchor);
            } else {
                this.clearSelectedPoint(tooltipAnchor);
            }
        });

        pointer.onPointerExit(() => {
            this.clearSelectedPoint(tooltipAnchor);
        });
        pointer.attachTo(plotGroup);

        const clickHandler = new Interactions.Click();
        clickHandler.onClick((point, e) => {
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
        clickHandler.attachTo(plotGroup);
    }

    onClick(handler) {
        this.clickHandler = handler;
    }

    setSelectedPoint(point, seriesColor, anchor) {
        this.selectedPoint = point;
        anchor.attr({
            fill: seriesColor,
            opacity: 1,
            cx: point.position.x,
            cy: point.position.y,
        });
        const $anchor = $(anchor.node());
        $.powerTip.hide($anchor, true);
        $anchor.data('powertip', generateTooltipHtml(point, seriesColor, this.tooltipDateFormat));
        $.powerTip.reposition($anchor);
        $.powerTip.show($anchor);
        this.el.style.cursor = 'pointer';
    }

    clearSelectedPoint(anchor) {
        this.selectedPoint = null;
        anchor.attr({ opacity: 0 });
        $.powerTip.hide(anchor.node(), true);
        this.el.style.cursor = '';
    }

}