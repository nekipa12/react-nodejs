import React, { useState } from "react";
import styles from "./styles.module.sass";
import PropTypes from "prop-types";
import { generateLinkQualityImage } from "../../../../../templates/helpers/linkImageQualityGenerator";
import clsx from "clsx/clsx";

export function TabBarDropdown(props) {

    const { tabs, selectedTab, onTabChange } = props;

    const [isOpen, setOpen] = useState(false);

    const onClick = () => {
        setOpen(!isOpen);
    }

    const onItemClicked = (tab) => {
        onTabChange(tab);
        onClick();
    }

    const renderGridItems = () => tabs.map((tab) =>
        <div className={styles.itemContainer} onClick={() => onItemClicked(tab)}>
            <img className={styles.image} src={generateLinkQualityImage(tab.image)}/>
            <h3 className={clsx(styles.name, selectedTab.id === tab.id && styles.active)}>{tab.name}</h3>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header} onClick={onClick}>
                <h2 className={styles.headerTitle}>{selectedTab.name}</h2>
                <h2 className={styles.chevron}>V</h2>
            </div>
            {
                isOpen &&
                <div className={styles.itemsContainer}>
                    {renderGridItems()}
                </div>
            }
        </div>
    );
}


const propTypesTab = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string,
    collection: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired,
        tag: PropTypes.string,
        image: PropTypes.string,
        alt: PropTypes.string,
        qrCode: PropTypes.string,
        descriptions: PropTypes.array,
    })).isRequired
}

TabBarDropdown.propTypes = {
    selectedTab: PropTypes.shape(propTypesTab).isRequired,
    tabs: PropTypes.arrayOf(PropTypes.shape(propTypesTab).isRequired),
    onTabChange: PropTypes.func.isRequired
}
