import React from 'react';
import classNames from 'classnames';
import './Badge.css';

const Badge = ({
    children,
    variant = 'neutral', // neutral, info, success, warning, error
    className,
    ...props
}) => {
    return (
        <span
            className={classNames('ui-badge', `ui-badge--${variant}`, className)}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
