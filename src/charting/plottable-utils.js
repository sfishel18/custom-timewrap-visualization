import { Scales, Axes, Components, Plots, Dataset } from 'plottable';
import find from 'lodash/find';
import has from 'lodash/has';
import every from 'lodash/every';

export const createXScale = (data) => {
    const scale = new Scales.Category();
    const longestSeries = find(data, test => every(data, s => s.length <= test.length));
    scale.domain(longestSeries.map((d, i) => String(i)));
    scale.outerPadding(0);
    return scale;
};

export const createYScale = () => {
    const scale = new Scales.Linear();
    scale.tickGenerator((scl) => {
        let ticks = scl.defaultTicks();
        if (ticks.length >= 6) {
            ticks = ticks.filter((tick, i) => i % 2 === 0);
        }
        return ticks;
    });
    scale.addIncludedValuesProvider(() => [0]);
    scale.addPaddingExceptionsProvider(() => [0]);
    scale.snappingDomainEnabled(true);
    return scale;
};

export const createColorScale = (seriesNames, colors) => {
    const scale = new Scales.Color();
    scale.domain(seriesNames);
    scale.range(colors);
    return scale;
};

export const createXAxis = (scale, data, rotateLabels) => {
    const axis = new Axes.Category(scale, 'bottom');
    axis.tickLabelPadding(3);
    axis.margin(5);
    if (rotateLabels) {
        axis.tickLabelAngle(90);
    }
    axis.formatter((str) => {
        const index = parseInt(str, 10);
        const series = find(data, s => s.length > index);
        return series[index].label;
    });
    return axis;
};

class YAxis extends Axes.Numeric {
    _hideOverflowingTickLabels() {
        // eslint-disable-next-line no-underscore-dangle
        super._hideOverflowingTickLabels();
        // eslint-disable-next-line no-underscore-dangle
        const tickLabels = this._tickLabelContainer.selectAll(`.${Axes.Numeric.TICK_LABEL_CLASS}`);
        tickLabels[0][tickLabels[0].length - 1].style.visibility = 'visible';
    }

    renderImmediately(...args) {
        super.renderImmediately(...args);
        // eslint-disable-next-line no-underscore-dangle
        const tickLabels = this._tickLabelContainer.selectAll(`.${Axes.Numeric.TICK_LABEL_CLASS}`);
        tickLabels[0].forEach(label => label.setAttribute('y', parseFloat(label.getAttribute('y')) + 6));
    }
}

export const createYAxis = (scale) => {
    const axis = new YAxis(scale, 'left');
    axis.formatter(d => d.toLocaleString());
    axis.showEndTickLabels(true);
    axis.tickLabelPadding(5);
    axis.margin(10);
    return axis;
};

const lineSymbolFactory = (size) => {
    const halfSize = size / 2;
    return `M ${-halfSize},1 L ${halfSize},1, ${halfSize},-1 ${-halfSize},-1 Z`;
};

export const createLegend = (scale, placement = 'right') => {
    if (placement === 'none') {
        return null;
    }
    const legend = new Components.Legend(scale);
    legend.symbol(() => lineSymbolFactory);
    if (placement === 'bottom') {
        legend.xAlignment('center');
        legend.yAlignment('bottom');
        legend.maxEntriesPerRow(Infinity);
    } else {
        legend.yAlignment('center');
        legend.maxEntriesPerRow(1);
    }
    return legend;
};

const createMarkerPlot = (name, scales, dataset) => {
    const markerPlot = new Plots.Scatter();
    markerPlot.x(d => String(d.index), scales.x);
    markerPlot.y(d => parseFloat(d.fieldValue), scales.y);
    markerPlot.attr('fill', name, scales.color);
    markerPlot.size(7);
    markerPlot.attr('opacity', 1);
    markerPlot.addDataset(dataset);
    return markerPlot;
};

const createLinePlot = (name, scales, dataset) => {
    const linePlot = new Plots.Line();
    linePlot.x(d => String(d.index), scales.x);
    linePlot.y(d => parseFloat(d.fieldValue), scales.y);
    linePlot.attr('stroke', name, scales.color);
    linePlot.attr('stroke-width', '1px');
    linePlot.addDataset(dataset);
    return linePlot;
};

export const createSeriesPlot = (series, name, scales, showMarkers = false) => {
    const seriesWithIndices = series.map((s, i) => Object.assign({ index: i }, s));
    const seriesWithoutNulls = seriesWithIndices.filter(s => has(s, 'fieldValue'));
    const dataset = new Dataset(seriesWithoutNulls);
    if (seriesWithoutNulls.length === 1 && !showMarkers) {
        return createMarkerPlot(name, scales, dataset);
    }
    const linePlot = createLinePlot(name, scales, dataset);
    if (!showMarkers) {
        return linePlot;
    }
    const markerPlot = createMarkerPlot(name, scales, dataset);
    return [linePlot, markerPlot];
};