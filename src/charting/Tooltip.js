import { Interactions, Utils, Plots } from 'plottable';
import $ from 'jquery';
import sortBy from 'lodash/sortBy';
import uniqBy from 'lodash/uniqBy';
import isFunction from 'lodash/isFunction';
import 'jquery-powertip';
import './Tooltip.css';

const isPlotComponent = component =>
    (component instanceof Plots.Line) || (component instanceof Plots.Scatter);

const nearestPlotEntity = (queryPoint, component) => {
    if (isFunction(component.entityNearestByXThenY)) {
        return component.entityNearestByXThenY(queryPoint);
    }
    return component.entityNearest(queryPoint);
};

const getPointColorName = (point) => {
    const component = point.component;
    if (component instanceof Plots.Line) {
        return component.attr('stroke').accessor();
    }
    return component.attr('fill').accessor();
};

const createTooltipAnchor = (group) => {
    const tooltipAnchor = group.foreground().append('circle');
    tooltipAnchor.attr('r', 5);
    tooltipAnchor.attr('opacity', 0);
    $(tooltipAnchor.node()).powerTip({
        placement: 'e',
        smartPlacement: true,
        fadeInTime: 0,
        fadeOutTime: 0,
        manual: true,
        offset: 5,
        popupId: 'custom-timewrap-visualization-tooltip',
    });
    return tooltipAnchor;
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

export default class Tooltip {
    constructor(colorScale, dateFormat) {
        this.colorScale = colorScale;
        this.dateFormat = dateFormat;
        this.showHandler = null;
        this.hideHandler = null;
        this.pointer = null;
        this.group = null;
        this.tooltipAnchor = null;
        this.pointerMoveCallback = this.pointerMoveCallback.bind(this);
        this.pointerExitCallback = this.pointerExitCallback.bind(this);
    }

    attachTo(group) {
        this.group = group;
        this.tooltipAnchor = createTooltipAnchor(group);
        this.pointer = new Interactions.Pointer();
        this.pointer.onPointerMove(this.pointerMoveCallback);
        this.pointer.onPointerExit(this.pointerExitCallback);
        this.pointer.attachTo(group);
    }

    onShow(handler) {
        this.showHandler = handler;
    }

    onHide(handler) {
        this.hideHandler = handler;
    }

    destroy() {
        if (this.pointer) {
            if (this.group) {
                this.pointer.detachFrom(this.group);
            }
            this.pointer.offPointerMove(this.pointerMoveCallback);
            this.pointer.offPointerExit(this.pointerExitCallback);
        }
        if (this.tooltipAnchor) {
            $.powerTip.hide(this.tooltipAnchor.node(), true);
        }
        this.showHandler = null;
        this.hideHandler = null;
    }

    pointerMoveCallback(queryPoint) {
        if (!this.group || !this.tooltipAnchor) {
            return;
        }
        const plotComponents = this.group.components()
            .filter(isPlotComponent);
        const dedupedComponents = uniqBy(plotComponents, component =>
            component.datasets()[0],
        );
        const candidates = dedupedComponents
            .map(nearestPlotEntity.bind(null, queryPoint))
            .filter(point => !!point)
            .map(point => ({
                point,
                distance: Utils.Math.distanceSquared(point.position, queryPoint),
            }));

        const sortedCandidates = sortBy(candidates, candidate => candidate.distance);
        if (sortedCandidates.length > 0 && sortedCandidates[0].distance <= 900) {
            const point = sortedCandidates[0].point;
            const colorName = getPointColorName(point);
            this.setSelectedPoint(point, this.colorScale.scale(colorName), this.tooltipAnchor);
        } else {
            this.clearSelectedPoint(this.tooltipAnchor);
        }
    }

    pointerExitCallback() {
        this.clearSelectedPoint(this.tooltipAnchor);
    }

    setSelectedPoint(point, seriesColor, anchor) {
        anchor.attr('fill', seriesColor);
        anchor.attr('opacity', 1);
        anchor.attr('cx', point.position.x);
        anchor.attr('cy', point.position.y);
        const $anchor = $(anchor.node());
        $.powerTip.hide($anchor, true);
        $anchor.data('powertip', generateTooltipHtml(point, seriesColor, this.dateFormat));
        $.powerTip.reposition($anchor);
        $.powerTip.show($anchor);
        if (this.showHandler) {
            this.showHandler(point);
        }
    }

    clearSelectedPoint(anchor) {
        anchor.attr('opacity', 0);
        $.powerTip.hide(anchor.node(), true);
        if (this.hideHandler) {
            this.hideHandler();
        }
    }
}