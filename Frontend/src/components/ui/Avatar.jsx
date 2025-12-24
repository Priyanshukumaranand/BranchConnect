import React, { useMemo } from 'react';
import classNames from 'classnames';
import './Avatar.css';

const Avatar = ({
    src,
    name,
    alt,
    size = 'md',
    className,
    status = null, // 'online', 'busy', etc.
    ...props
}) => {
    const initials = useMemo(() => {
        if (!name) return '?';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    }, [name]);

    return (
        <div className={classNames('ui-avatar', `ui-avatar--${size}`, className)} {...props}>
            {src ? (
                <img src={src} alt={alt || name} className="ui-avatar__image" />
            ) : (
                <span className="ui-avatar__initials">{initials}</span>
            )}
            {status && <span className={classNames('ui-avatar__status', `ui-avatar__status--${status}`)} />}
        </div>
    );
};

export default Avatar;
