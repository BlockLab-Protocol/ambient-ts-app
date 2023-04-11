import {
    ChangeEvent,
    Dispatch,
    SetStateAction,
    useEffect,
    useState,
} from 'react';
import { ethers } from 'ethers';
import styles from './RangeCurrencySelector.module.css';
import RangeCurrencyQuantity from '../RangeCurrencyQuantity/RangeCurrencyQuantity';
import { RiArrowDownSLine } from 'react-icons/ri';
import { TokenIF, TokenPairIF } from '../../../../utils/interfaces/exports';
import { useModal } from '../../../../components/Global/Modal/useModal';
import Modal from '../../../../components/Global/Modal/Modal';
import ambientLogo from '../../../../assets/images/logos/ambient_logo.svg';
import IconWithTooltip from '../../../Global/IconWithTooltip/IconWithTooltip';
import NoTokenIcon from '../../../Global/NoTokenIcon/NoTokenIcon';
import walletIcon from '../../../../assets/images/icons/wallet.svg';
import { SoloTokenSelect } from '../../../../components/Global/TokenSelectContainer/SoloTokenSelect';
import { getRecentTokensParamsIF } from '../../../../App/hooks/useRecentTokens';
import { DefaultTooltip } from '../../../Global/StyledTooltip/StyledTooltip';
import ExchangeBalanceExplanation from '../../../Global/Informational/ExchangeBalanceExplanation';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import { allDexBalanceMethodsIF } from '../../../../App/hooks/useExchangePrefs';
import { IS_LOCAL_ENV } from '../../../../constants';
import { ackTokensMethodsIF } from '../../../../App/hooks/useAckTokens';

interface propsIF {
    provider?: ethers.providers.Provider;
    isUserLoggedIn: boolean | undefined;
    gasPriceInGwei: number | undefined;
    resetTokenQuantities: () => void;
    fieldId: string;
    chainId: string;
    tokenPair: TokenPairIF;
    isTokenAEth: boolean;
    isTokenBEth: boolean;
    updateOtherQuantity: (evt: ChangeEvent<HTMLInputElement>) => void;
    isWithdrawTokenAFromDexChecked: boolean;
    setIsWithdrawTokenAFromDexChecked: Dispatch<SetStateAction<boolean>>;
    isWithdrawTokenBFromDexChecked: boolean;
    setIsWithdrawTokenBFromDexChecked: Dispatch<SetStateAction<boolean>>;
    tokenAQtyCoveredByWalletBalance: number;
    tokenBQtyCoveredByWalletBalance: number;
    tokenAQtyCoveredBySurplusBalance: number;
    tokenBQtyCoveredBySurplusBalance: number;
    tokenAWalletMinusTokenAQtyNum: number;
    tokenBWalletMinusTokenBQtyNum: number;
    tokenASurplusMinusTokenARemainderNum: number;
    tokenBSurplusMinusTokenBRemainderNum: number;
    tokenASurplusMinusTokenAQtyNum: number;
    tokenBSurplusMinusTokenBQtyNum: number;
    sellToken?: boolean;
    reverseTokens: () => void;
    tokenAInputQty: string;
    tokenBInputQty: string;

    tokenABalance: string;
    tokenBBalance: string;
    tokenADexBalance: string;
    tokenBDexBalance: string;
    isTokenADisabled: boolean;
    isTokenBDisabled: boolean;
    isAdvancedMode: boolean;
    disable?: boolean;
    isRangeCopied: boolean;
    handleChangeClick: (input: string) => void;
    verifyToken: (addr: string, chn: string) => boolean;
    getTokensByName: (
        searchName: string,
        chn: string,
        exact: boolean,
    ) => TokenIF[];
    getTokenByAddress: (addr: string, chn: string) => TokenIF | undefined;
    importedTokensPlus: TokenIF[];
    getRecentTokens: (
        options?: getRecentTokensParamsIF | undefined,
    ) => TokenIF[];
    addRecentToken: (tkn: TokenIF) => void;
    tokenAorB: string;
    outputTokens: TokenIF[];
    validatedInput: string;
    setInput: Dispatch<SetStateAction<string>>;
    searchType: string;
    openGlobalPopup: (
        content: React.ReactNode,
        popupTitle?: string,
        popupPlacement?: string,
    ) => void;
    dexBalancePrefs: allDexBalanceMethodsIF;
    ackTokens: ackTokensMethodsIF;
}

export default function RangeCurrencySelector(props: propsIF) {
    const {
        provider,
        isUserLoggedIn,
        gasPriceInGwei,
        tokenPair,
        chainId,
        isTokenAEth,
        isTokenBEth,
        isWithdrawTokenAFromDexChecked,
        setIsWithdrawTokenAFromDexChecked,
        isWithdrawTokenBFromDexChecked,
        setIsWithdrawTokenBFromDexChecked,
        fieldId,
        sellToken,
        updateOtherQuantity,
        reverseTokens,
        tokenABalance,
        tokenBBalance,
        tokenADexBalance,
        tokenAInputQty,
        tokenBInputQty,
        tokenBDexBalance,
        tokenASurplusMinusTokenARemainderNum,
        tokenBSurplusMinusTokenBRemainderNum,
        isTokenADisabled,
        isTokenBDisabled,
        isAdvancedMode,
        handleChangeClick,
        isRangeCopied,
        verifyToken,
        getTokensByName,
        getTokenByAddress,
        importedTokensPlus,
        getRecentTokens,
        addRecentToken,
        tokenAorB,
        outputTokens,
        validatedInput,
        setInput,
        searchType,
        openGlobalPopup,
        dexBalancePrefs,
        ackTokens,
    } = props;

    const isTokenASelector = fieldId === 'A';

    const thisToken = isTokenASelector
        ? tokenPair.dataTokenA
        : tokenPair.dataTokenB;

    useEffect(() => {
        if (parseFloat(tokenADexBalance) <= 0) {
            setIsWithdrawTokenAFromDexChecked(false);
        }
    }, [tokenADexBalance]);

    useEffect(() => {
        if (parseFloat(tokenBDexBalance) <= 0) {
            setIsWithdrawTokenBFromDexChecked(false);
        }
    }, [tokenBDexBalance]);

    const walletAndSurplusBalanceNonLocaleString = isTokenASelector
        ? tokenADexBalance && gasPriceInGwei
            ? isTokenAEth
                ? (
                      parseFloat(tokenADexBalance) +
                      parseFloat(tokenABalance) -
                      gasPriceInGwei * 500000 * 1e-9
                  ).toFixed(18)
                : tokenADexBalance
            : ''
        : tokenBDexBalance && gasPriceInGwei
        ? isTokenBEth
            ? (
                  parseFloat(tokenBDexBalance) +
                  parseFloat(tokenBBalance) -
                  gasPriceInGwei * 500000 * 1e-9
              ).toFixed(18)
            : tokenBDexBalance
        : '';

    const walletAndSurplusBalanceLocaleString = isTokenASelector
        ? tokenADexBalance
            ? (
                  parseFloat(tokenADexBalance) + parseFloat(tokenABalance)
              ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              })
            : '...'
        : tokenBDexBalance
        ? (
              parseFloat(tokenBDexBalance) + parseFloat(tokenBBalance)
          ).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })
        : '...';

    const isFieldDisabled =
        (isTokenASelector && isTokenADisabled) ||
        (!isTokenASelector && isTokenBDisabled);

    const modalCloseCustom = (): void => setInput('');

    const [isTokenModalOpen, openTokenModal, closeTokenModal] =
        useModal(modalCloseCustom);
    const [showSoloSelectTokenButtons, setShowSoloSelectTokenButtons] =
        useState(true);

    const handleInputClear = (): void => {
        setInput('');
        const soloTokenSelectInput = document.getElementById(
            'solo-token-select-input',
        ) as HTMLInputElement;
        soloTokenSelectInput.value = '';
    };

    const sellTokenWalletClassname =
        (isTokenASelector && !isWithdrawTokenAFromDexChecked) ||
        (!isTokenASelector && !isWithdrawTokenBFromDexChecked) ||
        (isTokenASelector &&
            isWithdrawTokenAFromDexChecked &&
            tokenASurplusMinusTokenARemainderNum &&
            tokenASurplusMinusTokenARemainderNum < 0) ||
        (!isTokenASelector &&
            isWithdrawTokenBFromDexChecked &&
            tokenBSurplusMinusTokenBRemainderNum &&
            tokenBSurplusMinusTokenBRemainderNum < 0)
            ? styles.enabled_logo
            : styles.grey_logo_wallet;

    const shouldDisplayMaxButton = isTokenASelector
        ? !isTokenAEth
        : !isTokenBEth;

    const maxButton = shouldDisplayMaxButton ? (
        <button
            className={`${styles.max_button} ${styles.max_button_enable}`}
            onClick={() => {
                handleChangeClick(walletAndSurplusBalanceNonLocaleString);
                IS_LOCAL_ENV && console.debug('max button clicked');
            }}
        >
            Max
        </button>
    ) : (
        <p className={styles.max_button} />
    );

    const exchangeBalanceTitle = (
        <p
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
            }}
            onClick={() =>
                openGlobalPopup(
                    <ExchangeBalanceExplanation />,
                    'Exchange Balance',
                    'right',
                )
            }
        >
            Wallet & Exchange Balance <AiOutlineQuestionCircle size={14} />
        </p>
    );

    const walletContent = (
        <div className={styles.main_wallet_container}>
            <IconWithTooltip
                title='Use Wallet Balance'
                placement='bottom'
                style={{ display: 'flex', alignItems: 'center' }}
            >
                <div
                    className={styles.balance_with_pointer}
                    onClick={() => {
                        dexBalancePrefs.range.drawFromDexBal.disable();
                        if (isTokenASelector) {
                            setIsWithdrawTokenAFromDexChecked(false);
                        } else {
                            setIsWithdrawTokenBFromDexChecked(false);
                        }
                    }}
                >
                    <div
                        className={`${styles.wallet_logo} ${sellTokenWalletClassname}`}
                    >
                        <img src={walletIcon} width='20' />
                    </div>
                </div>
            </IconWithTooltip>
            <IconWithTooltip
                title='Use Exchange Balance'
                placement='bottom'
                style={{ display: 'flex', alignItems: 'center' }}
            >
                <div
                    className={`${styles.wallet_logo} ${
                        styles.balance_with_pointer
                    }  ${
                        isTokenASelector
                            ? isWithdrawTokenAFromDexChecked
                                ? styles.enabled_logo
                                : null
                            : isWithdrawTokenBFromDexChecked
                            ? styles.enabled_logo
                            : null
                    }`}
                    onClick={() => {
                        dexBalancePrefs.range.drawFromDexBal.enable();
                        if (isTokenASelector) {
                            setIsWithdrawTokenAFromDexChecked(true);
                        } else {
                            setIsWithdrawTokenBFromDexChecked(true);
                        }
                    }}
                >
                    <img src={ambientLogo} width='20' alt='surplus' />
                </div>
            </IconWithTooltip>{' '}
            <DefaultTooltip
                interactive
                title={exchangeBalanceTitle}
                placement={'bottom'}
                arrow
                enterDelay={100}
                leaveDelay={200}
            >
                <div className={styles.balance_column}>
                    <div>
                        {isUserLoggedIn
                            ? walletAndSurplusBalanceLocaleString
                            : ''}
                    </div>
                </div>
            </DefaultTooltip>
            {maxButton}
        </div>
    );

    const swapboxBottomOrNull = !isUserLoggedIn ? (
        <div className={styles.swapbox_bottom} />
    ) : (
        <div className={styles.swapbox_bottom}>{walletContent}</div>
    );

    return (
        <div className={styles.swapbox}>
            <span className={styles.direction}>
                {sellToken ? 'Amounts' : ''}
            </span>
            <div className={styles.swapbox_top}>
                <div className={styles.swap_input} id='range_sell_qty'>
                    <RangeCurrencyQuantity
                        value={
                            tokenAorB === 'A' ? tokenAInputQty : tokenBInputQty
                        }
                        thisToken={thisToken}
                        fieldId={fieldId}
                        updateOtherQuantity={updateOtherQuantity}
                        disable={isFieldDisabled}
                        isAdvancedMode={isAdvancedMode}
                    />
                </div>
                <button
                    className={`${styles.token_select} ${
                        isRangeCopied && styles.pulse_animation
                    }`}
                    onClick={() => openTokenModal()}
                    id='range_token_selector'
                    tabIndex={0}
                    aria-label={`Open range ${fieldId} token modal.`}
                >
                    {thisToken.logoURI ? (
                        <img
                            className={styles.token_list_img}
                            src={thisToken.logoURI}
                            alt={thisToken.name + 'token logo'}
                            width='30px'
                        />
                    ) : (
                        <NoTokenIcon
                            tokenInitial={thisToken.symbol.charAt(0)}
                            width='30px'
                        />
                    )}
                    <span className={styles.token_list_text}>
                        {thisToken.symbol}
                    </span>
                    <RiArrowDownSLine size={27} />
                </button>
            </div>
            {swapboxBottomOrNull}
            {isTokenModalOpen && (
                <Modal
                    onClose={closeTokenModal}
                    title='Select Token'
                    centeredTitle
                    handleBack={handleInputClear}
                    showBackButton={false}
                    footer={null}
                >
                    <SoloTokenSelect
                        modalCloseCustom={modalCloseCustom}
                        provider={provider}
                        closeModal={closeTokenModal}
                        chainId={chainId}
                        importedTokensPlus={importedTokensPlus}
                        getTokensByName={getTokensByName}
                        getTokenByAddress={getTokenByAddress}
                        verifyToken={verifyToken}
                        showSoloSelectTokenButtons={showSoloSelectTokenButtons}
                        setShowSoloSelectTokenButtons={
                            setShowSoloSelectTokenButtons
                        }
                        outputTokens={outputTokens}
                        validatedInput={validatedInput}
                        setInput={setInput}
                        searchType={searchType}
                        addRecentToken={addRecentToken}
                        getRecentTokens={getRecentTokens}
                        isSingleToken={false}
                        tokenAorB={tokenAorB}
                        reverseTokens={reverseTokens}
                        tokenPair={tokenPair}
                        ackTokens={ackTokens}
                    />
                </Modal>
            )}
        </div>
    );
}
