import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.sass';
import clsx from 'clsx';

export function Button({
    simple,
    name,
    icon,
    onClick,
    text,
    tabIndex,
    ...props
}) {
    return (
        <button
            className={clsx(
                styles.container,
                'rcms_arviewer', //needed for tracking
                simple && styles.simple,
                text && styles.text
            )}
            onClick={onClick}
            tabIndex={tabIndex}
            {...props}
        >
            {icon && (
                <img
                    className={clsx(
                        styles.image,
                        'rcms_arviewer' //needed for tracking
                    )}
                    src={icon}
                    alt={'arIcon'}
                />
            )}
            <span
                className={clsx(
                    styles.name,
                    'rcms_arviewer' //needed for  tracking
                )}
            >
                {name}
            </span>
        </button>
    );
}

Button.propTypes = {
    simple: PropTypes.bool,
    text: PropTypes.bool,
    name: PropTypes.string.isRequired,
    icon: PropTypes.any,
    tabIndex: PropTypes.number,
    onClick: PropTypes.func.isRequired
};
