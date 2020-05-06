import React from "react";
import styles from "./styles.module.sass";
import PropTypes from "prop-types";

export function TabContentLayout(props) {
    const {children} = props;

    return (
        <div className={styles.container}>
            {children}
        </div>
    );
}

TabContentLayout.propTypes = {
    children: PropTypes.node.isRequired,
}
