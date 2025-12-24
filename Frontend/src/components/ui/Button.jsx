import React from 'react';
import classNames from 'classnames';
import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading = false,
    disabled,
    as: Component = 'button',
    ...props
}) => {
    return (
        <Component
            className={classNames(
                'ui-button',
                `ui-button--${variant}`,
                `ui-button--${size}`,
                { 'ui-button--loading': isLoading },
                className
            )}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <span className="ui-button__spinner" />}
            <span className="ui-button__content">{children}</span>
        </Component>
    );
};

export default Button;
