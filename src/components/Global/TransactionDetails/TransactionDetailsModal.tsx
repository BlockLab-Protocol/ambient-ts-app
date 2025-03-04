import styles from './TransactionDetailsModal.module.css';
import { useState, useRef, useContext, useEffect, memo } from 'react';
import TransactionDetailsHeader from './TransactionDetailsHeader/TransactionDetailsHeader';
import TransactionDetailsPriceInfo from './TransactionDetailsPriceInfo/TransactionDetailsPriceInfo';
import TransactionDetailsGraph from './TransactionDetailsGraph/TransactionDetailsGraph';
import { TransactionIF, PositionServerIF } from '../../../ambient-utils/types';
import TransactionDetailsSimplify from './TransactionDetailsSimplify/TransactionDetailsSimplify';
import useCopyToClipboard from '../../../utils/hooks/useCopyToClipboard';
import { AppStateContext } from '../../../contexts/AppStateContext';
import modalBackground from '../../../assets/images/backgrounds/background.png';
import { GCGO_OVERRIDE_URL } from '../../../ambient-utils/constants';
import { ChainDataContext } from '../../../contexts/ChainDataContext';
import { CrocEnvContext } from '../../../contexts/CrocEnvContext';
import {
    getPositionData,
    printDomToImage,
} from '../../../ambient-utils/dataLayer';
import { TokenContext } from '../../../contexts/TokenContext';
import { CachedDataContext } from '../../../contexts/CachedDataContext';
import Modal from '../Modal/Modal';

interface propsIF {
    tx: TransactionIF;
    isBaseTokenMoneynessGreaterOrEqual: boolean;
    isAccountView: boolean;
    onClose: () => void;
}

function TransactionDetailsModal(props: propsIF) {
    const { tx, isBaseTokenMoneynessGreaterOrEqual, isAccountView, onClose } =
        props;
    const {
        snackbar: { open: openSnackbar },
    } = useContext(AppStateContext);

    const {
        cachedQuerySpotPrice,
        cachedFetchTokenPrice,
        cachedTokenDetails,
        cachedEnsResolve,
    } = useContext(CachedDataContext);

    const { lastBlockNumber } = useContext(ChainDataContext);
    const {
        crocEnv,
        activeNetwork,
        provider,
        chainData: { chainId },
    } = useContext(CrocEnvContext);

    const { tokens } = useContext(TokenContext);

    const [updatedPositionApy, setUpdatedPositionApy] = useState<
        number | undefined
    >(1.01);

    useEffect(() => {
        const positionStatsCacheEndpoint = GCGO_OVERRIDE_URL
            ? GCGO_OVERRIDE_URL + '/position_stats?'
            : activeNetwork.graphCacheUrl + '/position_stats?';

        fetch(
            positionStatsCacheEndpoint +
                new URLSearchParams({
                    user: tx.user,
                    bidTick: tx.bidTick.toString(),
                    askTick: tx.askTick.toString(),
                    base: tx.base,
                    quote: tx.quote,
                    poolIdx: tx.poolIdx.toString(),
                    chainId: chainId,
                    positionType: tx.positionType,
                }),
        )
            .then((response) => response?.json())
            .then(async (json) => {
                if (!crocEnv || !provider || !json?.data) {
                    return;
                }
                // temporarily skip ENS fetch
                const skipENSFetch = true;

                const positionPayload = json?.data as PositionServerIF;
                const positionStats = await getPositionData(
                    positionPayload,
                    tokens.tokenUniv,
                    crocEnv,
                    provider,
                    chainId,
                    lastBlockNumber,
                    cachedFetchTokenPrice,
                    cachedQuerySpotPrice,
                    cachedTokenDetails,
                    cachedEnsResolve,
                    skipENSFetch,
                );

                setUpdatedPositionApy(
                    positionStats.aprEst
                        ? positionStats.aprEst * 100
                        : undefined,
                );
            })
            .catch(console.error);
    }, [lastBlockNumber, !!crocEnv, !!provider, chainId]);

    const [showSettings, setShowSettings] = useState(false);
    const [showShareComponent, setShowShareComponent] = useState(true);

    const detailsRef = useRef(null);

    const copyTransactionDetailsToClipboard = async () => {
        if (detailsRef.current) {
            const blob = await printDomToImage(detailsRef.current, '#0d1117', {
                background: `url(${modalBackground}) no-repeat`,
                backgroundSize: 'cover',
            });
            if (blob) {
                copy(blob);
                openSnackbar('Shareable image copied to clipboard', 'info');
            }
        }
    };

    const [controlItems] = useState([
        { slug: 'ticks', name: 'Show ticks', checked: true },
        { slug: 'liquidity', name: 'Show Liquidity', checked: true },
        { slug: 'value', name: 'Show value', checked: true },
    ]);

    const [_, copy] = useCopyToClipboard();

    function handleCopyAddress() {
        const txHash = tx.txHash;
        copy(txHash);
        openSnackbar(`${txHash} copied`, 'info');
    }

    const shareComponent = (
        <div ref={detailsRef} className={styles.main_outer_container}>
            <div className={styles.main_content}>
                <div className={styles.left_container}>
                    <TransactionDetailsPriceInfo
                        tx={tx}
                        controlItems={controlItems}
                        positionApy={updatedPositionApy}
                    />
                </div>
                <div className={styles.right_container}>
                    <TransactionDetailsGraph
                        tx={tx}
                        transactionType={tx.entityType}
                        isBaseTokenMoneynessGreaterOrEqual={
                            isBaseTokenMoneynessGreaterOrEqual
                        }
                        isAccountView={isAccountView}
                    />
                </div>
            </div>
            <p className={styles.ambi_copyright}>ambient.finance</p>
        </div>
    );

    const transactionDetailsHeaderProps = {
        showSettings,
        setShowSettings,
        copyTransactionDetailsToClipboard,
        setShowShareComponent,
        showShareComponent,
        handleCopyAddress,
        onClose,
    };

    return (
        <Modal usingCustomHeader onClose={onClose}>
            <div className={styles.outer_container}>
                <TransactionDetailsHeader {...transactionDetailsHeaderProps} />
                {showShareComponent ? (
                    shareComponent
                ) : (
                    <TransactionDetailsSimplify
                        tx={tx}
                        isAccountView={isAccountView}
                    />
                )}
            </div>
        </Modal>
    );
}

export default memo(TransactionDetailsModal);
