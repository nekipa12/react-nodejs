import React, { useState } from 'react';
import ReactModal from 'react-modal';
import styles from './styles.module.sass';
import PropTypes from 'prop-types';
import inWhichBrowser from 'in-which-browser';
import { Image } from '../Image';
import arIcon from '../../assets/images/arProductGrid.svg';
import { Button } from './Button/Button';
import { isMobile } from 'react-device-detect';
import clsx from 'clsx';
import ARLink from '../ARLinks';
import { WeChatOverlay } from '../WeChatOverlay';

const IMAGE_WIDTH = '398';

export function ProductItem(props) {
    const {
        product: {
            id,
            name,
            tag,
            link,
            alt,
            image,
            descriptions,
            ar_model_ios_path: arIosPath,
            ar_model_android_path: arAndroidPath,
            qrCode,
            collectionName
        },
        texts,
        copy,
        tabbable = true
    } = props;
    const [isOpenCard, setOpenCard] = useState(false);

    // Modal code here for now, might create an extra component later
    const isWechatBrowser =
        inWhichBrowser && inWhichBrowser.browser
            ? inWhichBrowser.browser.wechat
            : false;
    const [openModal, setOpenModal] = useState(false);
    function handleOpenModal() {
        setOpenModal(true);
    }
    function handleCloseModal() {
        setOpenModal(false);
    }

    function onCardClick(event) {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        if (isOpenCard) {
            event.preventDefault();
        }
    }

    function onARClicked(e) {
        e.stopPropagation();
        if (!isMobile) {
            setOpenCard(true);
        }
    }

    function onCloseCardClicked() {
        setOpenCard(false);
    }

    function renderTag() {
        if (tag) {
            return (
                <div className={styles.tagContainer}>
                    <span className={styles.tag}>{tag}</span>
                </div>
            );
        }
    }

    function renderArComponents() {
        if (arAndroidPath || arIosPath) {
            return (
                <>
                    <div className={styles.actionBarContainer}>
                        {!isOpenCard ? (
                            <Button
                                data-tracking-product={name}
                                data-tracking-subcollection={collectionName}
                                name={texts.arButtonText}
                                icon={arIcon}
                                onClick={onARClicked}
                                tabIndex={tabbable ? 0 : -1}
                            />
                        ) : null}
                    </div>
                    {isWechatBrowser && arIosPath ? (
                        <>
                            <a
                                onClick={handleOpenModal}
                                tabIndex={tabbable ? 0 : -1}
                            >
                                <img
                                    src={arIcon}
                                    alt={alt}
                                    className={styles.arIcon}
                                />
                            </a>
                            <ReactModal
                                isOpen={openModal}
                                contentLabel='onRequestClose'
                                onRequestClose={handleCloseModal}
                                shouldCloseOnOverlayClick={false}
                                className={'ReactModal__Content'}
                            >
                                <WeChatOverlay
                                    copy={copy}
                                    open={openModal}
                                    handleCloseModal={handleCloseModal}
                                />
                            </ReactModal>
                        </>
                    ) : (
                        <ARLink
                            gltf={arAndroidPath}
                            usdz={arIosPath}
                            iosPrefix='../../'
                        >
                            <img
                                src={arIcon}
                                alt={alt}
                                className={styles.arIcon}
                            />
                        </ARLink>
                    )}
                </>
            );
        }
    }

    function renderBarCard() {
        return (
            <div className={clsx(styles.barCardWrapper, 'barcode-container')}>
                <div
                    className={clsx(
                        styles.container,
                        isOpenCard && styles.barCardContainer
                    )}
                >
                    <Image
                        className={styles.image}
                        publicId={qrCode}
                        width={IMAGE_WIDTH}
                        alt={alt}
                    />
                    <h2 className={styles.barCardMessage}>
                        {texts.arCardProductText}
                    </h2>
                    <div className={styles.actionBarContainer}>
                        <Button
                            simple
                            name={'close'}
                            onClick={onCloseCardClicked}
                            tabIndex={tabbable ? 0 : -1}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const [mainName, ...restName] = (name || '').split(' ');

    function renderProductItem() {
        return (
            <a
                href={link}
                target='_blank'
                className={clsx(
                    styles.container,
                    'product-container',
                    'rcms_purchasefromgrid'
                )}
                onClick={(event) => onCardClick(event)}
                tabIndex={tabbable ? 0 : -1}
                data-tracking-subcollection={collectionName}
                data-tracking-product={name}
            >
                {renderTag()}
                <Image
                    className={styles.image}
                    publicId={`images/${image}`}
                    width={IMAGE_WIDTH}
                    alt={alt}
                />
                <div className={styles.catalogNumber}>{id}</div>
                <h2 className={styles.name}>
                    {mainName}
                    <br />
                    {[...restName].join(' ')}
                </h2>

                <div className={styles.descriptionContainer}>
                    <p className={styles.description}>
                        {descriptions && descriptions.join(' • ')}
                    </p>
                </div>
            </a>
        );
    }

    return (
        <div className={styles.productWrapper}>
            {renderProductItem()}
            {isOpenCard && qrCode && renderBarCard()}
            {renderArComponents()}
        </div>
    );
}

ProductItem.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired,
        tag: PropTypes.string,
        image: PropTypes.string,
        alt: PropTypes.string,
        qrCode: PropTypes.string,
        ar_model_android_path: PropTypes.string,
        ar_model_ios_path: PropTypes.string,
        descriptions: PropTypes.array,
        collectionName: PropTypes.string
    }).isRequired,
    texts: PropTypes.any,
    copy: PropTypes.any,
    tabbable: PropTypes.bool
};
