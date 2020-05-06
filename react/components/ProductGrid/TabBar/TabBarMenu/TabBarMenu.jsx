import React from "react";
import styles from "./styles.module.sass";
import clsx from "clsx";
import PropTypes from "prop-types";
import {Image} from '../../../Image';

export function TabBarMenu(props) {

    const { tabs, selectedTab, onTabChange } = props;

    return (
        <div className={styles.barContainerWrapper}>
            <div className={styles.barContainer}>
                {
                    tabs.map(tab => {
                        const isActive = selectedTab.id === tab.id;
                        return (
                            <button
                                key={tab.id}
                                className={clsx(styles.container, isActive && styles.active)}
                                onClick={() => onTabChange(tab)}
                            >
                                {tab.name}
                                {isActive && <div className={styles.activeDot}/>}
                                <div className={styles.previewCategoryContainer}>
                                    <div className={styles.arrowUp}/>
                                    <div className={styles.imagePreview}>
                                        <Image publicId={`images/${tab.image}`} width={'245'} alt={tab.name} />
                                    </div>
                                </div>
                            </button>
                        );
                    })
                }
            </div>
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

TabBarMenu.propTypes = {
    selectedTab: PropTypes.shape(propTypesTab).isRequired,
    tabs: PropTypes.arrayOf(PropTypes.shape(propTypesTab).isRequired),
    onTabChange: PropTypes.func.isRequired
}
