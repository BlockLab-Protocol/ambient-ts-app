import { FiCopy, FiExternalLink } from 'react-icons/fi';
import { CgProfile } from 'react-icons/cg';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import {
    getChainExplorer,
    getFormattedNumber,
} from '../../../../../ambient-utils/dataLayer';
import { useContext, useEffect, useMemo, useState } from 'react';
import { CrocEnvContext } from '../../../../../contexts/CrocEnvContext';
import { TokenIF } from '../../../../../ambient-utils/types';
import { CachedDataContext } from '../../../../../contexts/CachedDataContext';
import { LogoutButton } from '../../../../../components/Global/LogoutButton/LogoutButton';
import {
    NameDisplay,
    WalletDisplay,
    CopyButton,
    TokenContainer,
    LogoName,
    TokenAmount,
    ActionsContainer,
    NameDisplayContainer,
    WalletContent,
    WalletWrapper,
    AccountLink,
} from '../../../../../styled/Components/Header';
import { FlexContainer } from '../../../../../styled/Common';
import { BigNumber } from 'ethers';
import { toDisplayQty } from '@crocswap-libs/sdk';
import {
    ZERO_ADDRESS,
    supportedNetworks,
} from '../../../../../ambient-utils/constants';
import IconWithTooltip from '../../../../../components/Global/IconWithTooltip/IconWithTooltip';
import { TokenBalanceContext } from '../../../../../contexts/TokenBalanceContext';

interface WalletDropdownPropsIF {
    ensName: string;
    accountAddress: string;
    handleCopyAddress: () => void;
    clickOutsideHandler: () => void;
    clickLogout: () => void;
    accountAddressFull: string;
}

interface TokenAmountDisplayPropsIF {
    logo: string;
    symbol: string;
    amount: string;
    value?: string;
}

export default function WalletDropdown(props: WalletDropdownPropsIF) {
    const {
        ensName,
        accountAddress,
        handleCopyAddress,
        clickOutsideHandler,
        clickLogout,
        accountAddressFull,
    } = props;
    const {
        chainData: { chainId },
    } = useContext(CrocEnvContext);

    const { tokenBalances } = useContext(TokenBalanceContext);
    const defaultPair = supportedNetworks[chainId].defaultPair;

    const nativeData: TokenIF | undefined =
        tokenBalances &&
        tokenBalances.find((tkn: TokenIF) => tkn.address === ZERO_ADDRESS);
    const usdcData: TokenIF | undefined = useMemo(() => {
        return tokenBalances?.find(
            (tkn: TokenIF) =>
                tkn.address.toLowerCase() ===
                defaultPair[1].address.toLowerCase(),
        );
    }, [tokenBalances]);
    const { cachedFetchTokenPrice } = useContext(CachedDataContext);

    const blockExplorer = getChainExplorer(chainId);

    function TokenAmountDisplay(props: TokenAmountDisplayPropsIF): JSX.Element {
        const { logo, symbol, amount, value } = props;
        const ariaLabel = `Current amount of ${symbol} in your wallet is ${amount} or ${value} dollars`;
        return (
            <TokenContainer tabIndex={0} aria-label={ariaLabel}>
                <LogoName alignItems='center' gap={4}>
                    <img src={logo} alt='' />
                    <h3>{symbol}</h3>
                </LogoName>
                <TokenAmount gap={4} flexDirection={'column'}>
                    <h3>{amount}</h3>
                    <h6>{value !== undefined ? value : '...'}</h6>
                </TokenAmount>
            </TokenContainer>
        );
    }

    const [usdcBalanceForDom, setUsdcBalanceForDom] = useState<
        string | undefined
    >();
    const [usdcUsdValueForDom, setUsdcUsdValueForDom] = useState<
        string | undefined
    >();

    const [ethMainnetUsdPrice, setEthMainnetUsdPrice] = useState<
        number | undefined
    >();

    const { crocEnv } = useContext(CrocEnvContext);

    useEffect(() => {
        if (!crocEnv) return;
        Promise.resolve(
            cachedFetchTokenPrice(ZERO_ADDRESS, chainId, crocEnv),
        ).then((price) => {
            if (price?.usdPrice !== undefined) {
                setEthMainnetUsdPrice(price.usdPrice);
            } else {
                setEthMainnetUsdPrice(undefined);
            }
        });
        if (usdcData === undefined) {
            setUsdcUsdValueForDom(undefined);
            setUsdcBalanceForDom(undefined);
            return;
        }
        const usdcCombinedBalance =
            usdcData.walletBalance !== undefined
                ? BigNumber.from(usdcData.walletBalance)
                      .add(BigNumber.from(usdcData.dexBalance ?? '0'))
                      .toString()
                : undefined;
        const usdcCombinedBalanceDisplay =
            usdcData && usdcCombinedBalance
                ? toDisplayQty(usdcCombinedBalance, usdcData.decimals)
                : undefined;
        const usdcCombinedBalanceDisplayNum = usdcCombinedBalanceDisplay
            ? parseFloat(usdcCombinedBalanceDisplay ?? '0')
            : undefined;

        const usdcCombinedBalanceDisplayTruncated =
            usdcCombinedBalanceDisplayNum !== 0
                ? getFormattedNumber({
                      value: usdcCombinedBalanceDisplayNum,
                  })
                : '0.00';

        setUsdcBalanceForDom(usdcCombinedBalanceDisplayTruncated);
        Promise.resolve(
            cachedFetchTokenPrice(usdcData.address, chainId, crocEnv),
        ).then((price) => {
            if (price?.usdPrice !== undefined) {
                const usdValueNum: number =
                    (price &&
                        price?.usdPrice *
                            (usdcCombinedBalanceDisplayNum ?? 0)) ??
                    0;
                const usdValueTruncated = getFormattedNumber({
                    value: usdValueNum,
                    isUSD: true,
                });
                setUsdcUsdValueForDom(usdValueTruncated);
            } else {
                setUsdcUsdValueForDom(undefined);
            }
        });
    }, [crocEnv, chainId, JSON.stringify(usdcData)]);

    const nativeCombinedBalance =
        nativeData?.walletBalance !== undefined
            ? BigNumber.from(nativeData.walletBalance)
                  .add(BigNumber.from(nativeData.dexBalance ?? '0'))
                  .toString()
            : undefined;
    const nativeCombinedBalanceDisplay =
        nativeData && nativeCombinedBalance
            ? toDisplayQty(nativeCombinedBalance, nativeData.decimals)
            : undefined;
    const nativeCombinedBalanceDisplayNum = nativeCombinedBalanceDisplay
        ? parseFloat(nativeCombinedBalanceDisplay ?? '0')
        : undefined;
    const nativeCombinedBalanceTruncated =
        nativeCombinedBalanceDisplayNum !== undefined
            ? getFormattedNumber({
                  value: nativeCombinedBalanceDisplayNum,
              })
            : undefined;

    const ethMainnetUsdValue =
        ethMainnetUsdPrice !== undefined &&
        nativeCombinedBalanceDisplayNum !== undefined
            ? ethMainnetUsdPrice * nativeCombinedBalanceDisplayNum
            : undefined;

    const nativeTokenMainnetUsdValueTruncated =
        ethMainnetUsdValue !== undefined
            ? ethMainnetUsdValue
                ? getFormattedNumber({
                      value: ethMainnetUsdValue,
                      isUSD: true,
                  })
                : '$0.00'
            : undefined;

    const tokensData = [
        {
            symbol: nativeData?.symbol || 'ETH',
            amount: nativeCombinedBalanceTruncated
                ? nativeData?.symbol === 'ETH'
                    ? 'Ξ ' + nativeCombinedBalanceTruncated
                    : nativeCombinedBalanceTruncated
                : '...',
            value: nativeTokenMainnetUsdValueTruncated,
            logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        },
        {
            symbol: 'USDC',
            amount: nativeCombinedBalanceTruncated
                ? parseFloat(usdcBalanceForDom ?? '0') === 0
                    ? '0.00'
                    : usdcBalanceForDom
                : '...',
            value: nativeCombinedBalanceTruncated
                ? parseFloat(usdcUsdValueForDom ?? '0') === 0
                    ? '$0.00'
                    : usdcUsdValueForDom
                : '...',
            logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        },
    ];

    return (
        <WalletWrapper
            flexDirection='column'
            justifyContent='space-between'
            gap={16}
            rounded
            tabIndex={0}
            aria-label={`Wallet menu for ${ensName ? ensName : accountAddress}`}
        >
            <NameDisplayContainer gap={4} alignItems='center'>
                <Jazzicon
                    diameter={50}
                    seed={jsNumberForAddress(accountAddressFull.toLowerCase())}
                />

                <FlexContainer alignItems='center' flexDirection='column'>
                    <NameDisplay gap={16} alignItems='center'>
                        <h2>{ensName !== '' ? ensName : accountAddress}</h2>
                        <IconWithTooltip
                            title={`${'View wallet address on block explorer'}`}
                            placement='right'
                        >
                            <a
                                target='_blank'
                                rel='noreferrer'
                                href={`${blockExplorer}address/${accountAddressFull}`}
                                aria-label='View address on Etherscan'
                            >
                                <FiExternalLink />
                            </a>
                        </IconWithTooltip>

                        <IconWithTooltip
                            title={`${'Copy wallet address to clipboard'}`}
                            placement='right'
                        >
                            <CopyButton
                                onClick={handleCopyAddress}
                                aria-label='Copy address to clipboard'
                            >
                                <FiCopy />
                            </CopyButton>
                        </IconWithTooltip>
                    </NameDisplay>
                    <WalletDisplay gap={16} alignItems='center'>
                        <p>Connected Wallet Address:</p>
                        <p>{props.accountAddress}</p>
                    </WalletDisplay>
                </FlexContainer>
            </NameDisplayContainer>
            <WalletContent>
                {tokensData.map((tokenData) => (
                    <TokenAmountDisplay
                        amount={
                            tokenData.amount !== undefined
                                ? tokenData.amount
                                : '…'
                        }
                        value={tokenData.value}
                        symbol={tokenData.symbol}
                        logo={tokenData.logo}
                        key={JSON.stringify(tokenData)}
                    />
                ))}
            </WalletContent>
            <ActionsContainer numCols={2} gap={16} fullWidth={true}>
                <AccountLink
                    to={'/account'}
                    aria-label='Go to the account page '
                    tabIndex={0}
                    onClick={clickOutsideHandler}
                >
                    <CgProfile />
                    My Account
                </AccountLink>
                <LogoutButton onClick={clickLogout} />
            </ActionsContainer>
        </WalletWrapper>
    );
}
