import { CrocEnv } from '@crocswap-libs/sdk';
import { TokenIF } from '../../../../utils/interfaces/TokenIF';
import styles from './Transfer.module.css';
import TransferAddressInput from './TransferAddressInput/TransferAddressInput';
import TransferButton from './TransferButton/TransferButton';
import TransferCurrencySelector from './TransferCurrencySelector/TransferCurrencySelector';
import { defaultTokens } from '../../../../utils/data/defaultTokens';
import { useAppDispatch } from '../../../../utils/hooks/reduxToolkit';
import { useState } from 'react';
import { setToken } from '../../../../utils/state/temp';

interface PortfolioTransferProps {
    crocEnv: CrocEnv | undefined;
    connectedAccount: string;
    openGlobalModal: (content: React.ReactNode, title?: string) => void;
    closeGlobalModal: () => void;
    tempTokenSelection: TokenIF;
}

export default function Transfer(props: PortfolioTransferProps) {
    const { crocEnv, connectedAccount, openGlobalModal, closeGlobalModal, tempTokenSelection } =
        props;

    const dispatch = useAppDispatch();

    const [transferQty, setTransferQty] = useState<number | undefined>();

    const chooseToken = (tok: TokenIF) => {
        console.log(tok);
        dispatch(setToken(tok));
        closeGlobalModal();
    };

    const chooseTokenDiv = (
        <div>
            {defaultTokens
                .filter((token: TokenIF) => token.chainId === parseInt('0x5'))
                .map((token: TokenIF) => (
                    <button key={'button_to_set_' + token.name} onClick={() => chooseToken(token)}>
                        {token.name}
                    </button>
                ))}
        </div>
    );

    const transferFn = () => {
        if (crocEnv && transferQty) {
            crocEnv.token(tempTokenSelection.address).transfer(transferQty, connectedAccount);
            // crocEnv.token(tempTokenSelection.address).deposit(1, wallet.address);
        }
    };

    return (
        <div className={styles.deposit_container}>
            <div className={styles.info_text}>
                Transfer tokens to another account within the exchange
            </div>
            <TransferAddressInput fieldId='exchange-balance-transfer-address' />
            <TransferCurrencySelector
                fieldId='exchange-balance-transfer'
                onClick={() => openGlobalModal(chooseTokenDiv)}
                tempTokenSelection={tempTokenSelection}
                setTransferQty={setTransferQty}
            />
            <TransferButton
                onClick={() => {
                    // console.log('clicked');
                    transferFn();
                }}
            />
        </div>
    );
}
