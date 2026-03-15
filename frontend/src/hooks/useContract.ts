import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { network, CONTRACT_ADDRESS, CONTRACT_NAME, userSession } from './useWallet';

export function useContractActions() {
  const mintNFT = async (recipient: string, onFinish?: () => void) => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName:    CONTRACT_NAME,
      functionName:    'mint',
      functionArgs:    [principalCV(recipient)],
      network,
      anchorMode:         AnchorMode.Any,
      postConditionMode:  PostConditionMode.Allow,
      onFinish:  (data) => { onFinish?.(); },
      onCancel:  () => { onFinish?.(); },
      userSession,
    });
  };

  const listNFT = async (tokenId: number, price: number, onFinish?: () => void) => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName:    CONTRACT_NAME,
      functionName:    'list-nft',
      functionArgs:    [uintCV(tokenId), uintCV(price)],
      network,
      anchorMode:         AnchorMode.Any,
      postConditionMode:  PostConditionMode.Allow,
      onFinish:  () => { onFinish?.(); },
      onCancel:  () => { onFinish?.(); },
      userSession,
    });
  };

  const unlistNFT = async (tokenId: number, onFinish?: () => void) => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName:    CONTRACT_NAME,
      functionName:    'unlist-nft',
      functionArgs:    [uintCV(tokenId)],
      network,
      anchorMode:        AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish:  () => { onFinish?.(); },
      onCancel:  () => { onFinish?.(); },
      userSession,
    });
  };

  const buyNFT = async (tokenId: number, price: number, seller: string, onFinish?: () => void) => {
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName:    CONTRACT_NAME,
      functionName:    'buy-nft',
      functionArgs:    [uintCV(tokenId)],
      network,
      anchorMode:        AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish:  () => { onFinish?.(); },
      onCancel:  () => { onFinish?.(); },
      userSession,
    });
  };

  return { mintNFT, listNFT, unlistNFT, buyNFT };
}
