import { Interactions, Utils, Plots } from 'plottable';
import $ from 'jquery';
import sortBy from 'lodash/sortBy';
import 'jquery-powertip';
import './Tooltip.css';

const createTooltipAnchor = (group) => {
    const tooltipAnchor = group.foreground().append('circle').attr({
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
        const candidates = this.group.components()
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
            this.setSelectedPoint(point, this.colorScale.scale(colorName), this.tooltipAnchor);
        } else {
            this.clearSelectedPoint(this.tooltipAnchor);
        }
    }

    pointerExitCallback() {
        this.clearSelectedPoint(this.tooltipAnchor);
    }

    setSelectedPoint(point, seriesColor, anchor) {
        anchor.attr({
            fill: seriesColor,
            opacity: 1,
            cx: point.position.x,
            cy: point.position.y,
        });
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
        anchor.attr({ opacity: 0 });
        $.powerTip.hide(anchor.node(), true);
        if (this.hideHandler) {
            this.hideHandler();
        }
    }
}