import { useMoralis } from 'react-moralis';
// import { contractAddresses, getTokenBalance } from '@crocswap-libs/sdk';
import { Signer } from 'ethers';

export const useWallet = async (provider: Signer) => {
    // console.log(useMoralis());
    // console.log(useChain());
    const { Moralis, chainId, isWeb3Enabled, account } = useMoralis();
    if (isWeb3Enabled && account !== null) {
        // this conditional is important because it prevents a TS error
        // ... in assigning the value of the key 'chain' below
        if (!!chainId && chainId === '0x2a') {
            const tokens = await Moralis.Web3API.account.getTokenBalances({
                chain: chainId,
                address: account,
            });
            console.log(tokens);
            // const nativeEthBalance = await getTokenBalance(
            //     contractAddresses.ZERO_ADDR,
            //     account,
            //     provider,
            // );
            // const nativeTokenBalance = await provider.getBalance(account);
            // console.log(nativeTokenBalance);
        }
    }
};
