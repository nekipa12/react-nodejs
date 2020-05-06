import React, { useMemo, useState } from 'react'
import styles from "./styles.module.sass";
import { TabBar } from "./TabBar/TabBar";
import { normalizeProductGridData } from '../../common/helpers'
import { getTextValue } from "../../common/helpers";
import clsx from 'clsx';

interface ProductGridProps {
  microSite: any
  copy (key: string) : string
  includeMenu: boolean
  initialTabName: string
  isModal: true
}

const ProductGrid = ({
                       microSite,
                       copy,
                       includeMenu= true,
                       initialTabName,
                       isModal
} : ProductGridProps) => {
  if(!microSite) {
      return null
  }

  const {
    header_text,
    sub_header_text,
    product_grid,
    microcopies,
  } = microSite;

  const productGrid = useMemo(() => normalizeProductGridData(product_grid), [product_grid]);
  const arButtonText = useMemo(
    () => copy('productgrid.arcat.text'),
    [microcopies]
  );
  const arCardProductText = useMemo(
    () => copy('video.qrprompt.text'),
    [microcopies]
  );

  const texts = {
    arCardProductText,
    arButtonText
  }

  const initialTabIndex = productGrid.findIndex(({name}) => name === initialTabName);

  const [selectedTab, setSelectedTab] = useState(productGrid[initialTabIndex === -1 ? 0 : initialTabIndex]);
  const onTabChange = (tab:any) => setSelectedTab(tab);

  return (
    <div className={styles.container}>
      <div className={clsx(styles.shopHeaderContainer, isModal && styles.shopHeaderContainerModal)}>
        <h2 className={styles.subtitle}>{getTextValue(sub_header_text)}</h2>
        <h1 className={styles.title}>{initialTabName ? initialTabName : getTextValue(header_text)}</h1>
      </div>
      <TabBar
        includeMenu={includeMenu}
        texts={texts}
        tabs={productGrid}
        onTabChange={onTabChange}
        selectedTab={selectedTab}
        copy={copy}
      />
    </div>
  )
}

export default ProductGrid
