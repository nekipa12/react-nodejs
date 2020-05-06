import React from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.sass';
import { TabBarMenu } from './TabBarMenu/TabBarMenu';
import { TabContentLayout } from './TabContentLayout/TabContentLayout';
import { ProductItem } from '../../ProductItem/ProductItem';

export class TabBar extends React.Component {
    constructor(props) {
        super(props);
    }

    renderData = () => {
        const { selectedTab, texts, copy } = this.props;
        const collection = [];
        for (let i = 0; i < selectedTab.collection.length; i++) {
            const collectionItem = selectedTab.collection[i];
            collection.push(
                <ProductItem
                    copy={copy}
                    texts={texts}
                    key={collectionItem.id}
                    product={collectionItem}
                />
            );
        }
        return { collection };
    };

    render() {
        const { tabs, selectedTab, onTabChange, includeMenu } = this.props;
        const { collection } = this.renderData();
        return (
            <div className={styles.container}>
                {includeMenu && (
                    <TabBarMenu
                        tabs={tabs}
                        selectedTab={selectedTab}
                        onTabChange={onTabChange}
                    />
                )}
                <TabContentLayout>{collection}</TabContentLayout>
            </div>
        );
    }
}

TabBar.defaultProps = {
    includeMenu: true
};

const propTypesTab = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string,
    collection: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            link: PropTypes.string.isRequired,
            tag: PropTypes.string,
            image: PropTypes.string,
            alt: PropTypes.string,
            qrCode: PropTypes.string,
            descriptions: PropTypes.array
        })
    ).isRequired
};

TabBar.propTypes = {
    selectedTab: PropTypes.shape(propTypesTab).isRequired,
    includeMenu: PropTypes.bool,
    tabs: PropTypes.arrayOf(PropTypes.shape(propTypesTab).isRequired),
    onTabChange: PropTypes.func.isRequired,
    texts: PropTypes.any,
    copy: PropTypes.any
};
