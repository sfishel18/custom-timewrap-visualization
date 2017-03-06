import RealPlotabble from 'plottable';
import debounce from 'lodash/debounce';
import sortBy from 'lodash/sortBy';
import './TimewrapChart.css';

let Plottable = RealPlotabble;

export const setPlottable = (p) => { Plottable = p; };

export const lineSymbolFactory = (size) => {
    const halfSize = size / 2;
    return `M ${-halfSize},1 L ${halfSize},1, ${halfSize},-1 ${-halfSize},-1 Z`;
};

export default class {

    constructor(el, colorPalette) {
        this.el = el;
        this.el.classList.add('custom-timewrap-visualization');
        this.el.innerHTML = '<svg width="100%" height="100%"></svg>';
        this.colorPalette = colorPalette;
        this.tooltip = null;
        this.selectedPoint = null;
        this.update = debounce(this.update, 10);
    }

    update(data, seriesNames) {
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
        const yAxis = new Axes.Numeric(yScale, 'left');
        yAxis.formatter(d => d.toLocaleString());

        const gridlines = new Components.Gridlines(null, yScale);

        const plots = data.map((dataSeries, i) => {
            const plot = new Plots.Line();
            plot.x(d => d.label, xScale);
            plot.y(d => d.fieldValue, yScale);
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

        const tooltipAnchor = plotGroup.foreground().append('circle').attr({
            r: 5,
            opacity: 0,
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
    }

    setSelectedPoint(point, seriesColor, anchor) {
        this.selectedPoint = point;
        anchor.attr({
            fill: seriesColor,
            opacity: 1,
            cx: point.position.x,
            cy: point.position.y,
        });
        this.el.style.cursor = 'pointer';
    }

    clearSelectedPoint(anchor) {
        this.selectedPoint = null;
        anchor.attr({ opacity: 0 });
        this.el.style.cursor = '';
    }

}