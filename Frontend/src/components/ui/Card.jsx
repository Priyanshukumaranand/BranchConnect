import React from 'react';
import classNames from 'classnames';
import './Card.css';

const Card = ({
    children,
    className,
    variant = 'default',
    hoverEffect = false,
    as: Component = 'div',
    ...props
}) => {
    return (
        <Component
            className={classNames(
                'ui-card',
                {
                    'ui-card--hover': hoverEffect,
                    [`ui-card--${variant}`]: variant !== 'default'
                },
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
};

export default Card;
