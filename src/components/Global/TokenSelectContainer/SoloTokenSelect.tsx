import { useEffect, useMemo, useState, Dispatch, SetStateAction } from 'react';
import { TokenListIF, TokenIF } from '../../../utils/interfaces/exports';
import TokenSelect from '../TokenSelect/TokenSelect';
import { useAppDispatch } from '../../../utils/hooks/reduxToolkit';
import { setToken } from '../../../utils/state/temp';
import { useSoloSearch } from './useSoloSearch';
import styles from './SoloTokenSelect.module.css';
import { memoizeFetchContractDetails } from '../../../App/functions/fetchContractDetails';
import { ethers } from 'ethers';
import SoloTokenImport from './SoloTokenImport';
// import { AiOutlineQuestionCircle } from 'react-icons/ai';

interface propsIF {
    provider: ethers.providers.Provider | undefined;
    importedTokens: TokenIF[];
    chainId: string;
    setImportedTokens: Dispatch<SetStateAction<TokenIF[]>>;
    // TODO: rewrite logic to build this Map from all lists not just active ones
    tokensOnActiveLists: Map<string, TokenIF>;
    closeModal: () => void;
    verifyToken: (addr: string, chn: string) => boolean;
    getTokensOnChain: (chn: string) => TokenIF[];
    getTokensByName: (searchName: string, chn: string, exact: boolean) => TokenIF[];
    getTokenByAddress: (addr: string, chn: string) => TokenIF | undefined;
}

export const SoloTokenSelect = (props: propsIF) => {
    const {
        provider,
        importedTokens,
        chainId,
        setImportedTokens,
        closeModal,
        getTokensByName,
        getTokenByAddress,
        verifyToken
    } = props;

    // hook to process search input and return an array of relevant tokens
    // also returns state setter function and values for control flow
    const [outputTokens, validatedInput, setInput, searchType] = useSoloSearch(
        chainId,
        importedTokens,
        verifyToken,
        getTokenByAddress,
        getTokensByName
    );

    // instance of hook used to retrieve data from RTK
    const dispatch = useAppDispatch();

    // fn to respond to a user clicking to select a token
    const chooseToken = (tkn: TokenIF) => {
        // dispatch token data object to RTK
        dispatch(setToken(tkn));
        // determine if the token is a previously imported token
        const isTokenImported = importedTokens.some(
            (tk: TokenIF) => tk.address.toLowerCase() === tkn.address.toLowerCase(),
        );
        // if token is NOT imported, update local storage accordingly
        if (!isTokenImported) {
            // retrieve and parse user data object from local storage
            const userData = JSON.parse(localStorage.getItem('user') as string);
            // update value of `tokens` on user data object
            userData.tokens = [...importedTokens, tkn];
            // write updated value to local storage
            localStorage.setItem('user', JSON.stringify(userData));
            // update local state record of imported tokens
            // necessary as there is no event listener on local storage 😱
            setImportedTokens([...importedTokens, tkn]);
        }
        // close the token modal
        closeModal();
    };

    // hook to hold data for a token pulled from on-chain
    // null value is allowed to clear the hook when needed or on error
    const [customToken, setCustomToken] = useState<TokenIF | null>(null);
    useEffect(() => {
        // gatekeeping to pull token data from on-chain query
        // make sure a provider exists
        // validated input must appear to be a valid contract address
        // app must fail to find token in local data
        if (provider && searchType === 'address' && !verifyToken(validatedInput, chainId)) {
            // local instance of function to pull back token data from chain
            const cachedFetchContractDetails = memoizeFetchContractDetails();
            // promise holding query to get token metadata from on-chain
            const promise = cachedFetchContractDetails(provider, validatedInput, chainId);
            // resolve the promise
            Promise.resolve(promise)
                // if response has a `decimals` value treat it as valid
                .then((res) => res?.decimals && setCustomToken(res))
                // error handling
                .catch((err) => {
                    // log error to console
                    console.warn(err);
                    // set custom token as `null`
                    setCustomToken(null);
                });
        } else {
            // clear token data if conditions do not indicate necessity
            setCustomToken(null);
        }
    // run hook when validated input or type of search changes
    // searchType is redundant but may be relevant in the future
    // until then it does not hurt anything to put it there
    }, [searchType, validatedInput]);
    // EDS Test Token 2 address (please do not delete!)
    // '0x0B0322d75bad9cA72eC7708708B54e6b38C26adA'

    const contentRouter = useMemo(() => {
        let output: string;
        if (validatedInput) {
            if (searchType === 'address') {
                if (
                    verifyToken(validatedInput, chainId) ||
                    JSON.parse(localStorage.getItem('user') as string).tokens
                        .some((tkn: TokenIF) => (
                            tkn.address.toLowerCase() === validatedInput.toLowerCase()
                        ))
                ) {
                    output = 'token buttons';
                } else {
                    output = 'from chain';
                }
            } else if (searchType === 'nameOrSymbol') {
                output = 'token buttons';
            } else {
                output = 'token buttons';
            }
        } else {
            output = 'token buttons';
        }
        return output;
    }, [validatedInput, searchType]);

    // TODO: find the control flow to put this in the DOM
    // const tokenNotFound = (
    //     <div className={styles.token_not_found}>
    //         <p>Cound not find matching token</p>
    //         <AiOutlineQuestionCircle />
    //     </div>
    // );

    return (
        <section className={styles.container}>
            <input
                spellCheck={'false'}
                type='text'
                placeholder='&#61442; Search name or enter an Address'
                onChange={(e) => setInput(e.target.value)}
            />
            {contentRouter === 'token buttons' &&
                outputTokens.map((token: TokenIF) => (
                    <TokenSelect
                        key={JSON.stringify(token)}
                        token={token}
                        tokensBank={importedTokens}
                        // TODO: refactor TokenSelect.tsx to remove this value and
                        // TODO: ... functionality, it is still here for now because we
                        // TODO: ... call this component from multiple places in the App
                        undeletableTokens={[]}
                        chainId={chainId}
                        setImportedTokens={setImportedTokens}
                        chooseToken={chooseToken}
                        isOnPortfolio={true}
                        fromListsText=''
                    />
                )
            )}
            {contentRouter === 'from chain' &&
            <SoloTokenImport customToken={customToken} chooseToken={chooseToken} />
            }
        </section>
    );
};
