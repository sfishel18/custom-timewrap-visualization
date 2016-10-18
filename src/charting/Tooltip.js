import React, { PropTypes } from 'react';
import moment from 'moment';
import './Tooltip.css';

const Tooltip = (props) => {
    const { format } = props;
    const { date, fieldName, y } = props.value;
    return (<div className="timewrap-tooltip">
        <div>{date.format(format || 'MMM Do, YYYY h:mm A') }</div>
        <div>
            <span className="tooltip-cell">{fieldName}: </span>
            <span className="tooltip-cell" style={{ float: 'right' }}>{y}</span>
        </div>
    </div>);
};

Tooltip.propTypes = {
    value: PropTypes.shape({
        // Eslint is confused by the direct destructuring of `props.value`
        /* eslint-disable react/no-unused-prop-types */
        // Custom prop type validators have inconsistent return values by design
        // eslint-disable-next-line consistent-return
        date(props, propName, componentName) {
            const date = props[propName];
            if (!moment.isMoment(date)) {
                return new Error(
                    `Expected ${propName} supplied to ${componentName} to be a moment instance. ` +
                    'Validation failed.'
                );
            }
        },
        fieldName: PropTypes.string,
        y: PropTypes.number,
        /* eslint-enable react/no-unused-prop-types */
    }),
    format: PropTypes.string,
};

export default Tooltip;