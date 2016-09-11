import React, { PropTypes } from 'react';
import './Tooltip.css';

const Tooltip = props => {
    const { date, fieldName, y } = props.value;
    return (<div className="timewrap-tooltip">
        <div>{date.format('MMM Do, YYYY h:mm A') }</div>
        <div>
            <span>{fieldName}: </span>
            <span style={{ float: 'right' }}>{y}</span>
        </div>
    </div>);
};

Tooltip.propTypes = {
    value: PropTypes.object,
};

export default Tooltip;