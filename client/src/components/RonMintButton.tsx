// // src/components/RonMintButton.tsx

// import { useState, type FC } from 'react';
// import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
// import { Transaction } from '@mysten/sui/transactions';
// import { DollarSign } from 'lucide-react';

// export const RON_PACKAGE_ID = import.meta.env.VITE_RON_PACKAGE_ID || '0x0';
// export const RON_TREASURY_CAP_ID = import.meta.env.VITE_RON_TREASURY_CAP_ID || '0x0';
// export const NETWORK = import.meta.env.VITE_NETWORK || '0x0';


// const AMOUNT_TO_MINT_U64 = 1000000n;

// interface RonMintButtonProps {
//     onMintSuccess: () => void;
// }

// const RonMintButton: FC<RonMintButtonProps> = ({ onMintSuccess }) => {
//     const account = useCurrentAccount();
//     const client = useSuiClient();
//     const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
    
//     const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

//     const handleMint = async () => {
//         if (!account?.address) {
//             alert("Please connect your wallet first.");
//             return;
//         }

//         if (!RON_PACKAGE_ID || !RON_TREASURY_CAP_ID) {
//             alert("Configuration Error: RON_PACKAGE_ID or RON_TREASURY_CAP_ID is missing.");
//             return;
//         }

//         setStatus('loading');
        
//         try {
//             const tx = new Transaction();
//             const recipientAddress = account.address;

//             tx.moveCall({
//                 target: `${RON_PACKAGE_ID}::ron::mint`,
//                 arguments: [
//                     // Treasury Cap object ID (needs to be transferable and owned by the signer/wallet)
//                     tx.object(RON_TREASURY_CAP_ID), 
                    
//                     // Amount (u64)
//                     tx.pure.u64(AMOUNT_TO_MINT_U64),  
                    
//                     // Recipient (Address)
//                     tx.object(recipientAddress), 
//                 ],
//             });

//             tx.setGasBudget(100000000); // 0.1 SUI

//             signAndExecute(
//                 {
//                     transaction: tx,
//                     options: {
//                         showEffects: true,
//                         showObjectChanges: true,
//                     }
//                 },
//                 {
//                     onSuccess: (result) => {
//                         console.log("Mint Successful:", result);
//                         setStatus('success');
//                         alert(`Successfully minted 10 RON to ${recipientAddress}`);
//                         onMintSuccess();
//                     },
//                     onError: (error) => {
//                         console.error("Mint Failed:", error);
//                         setStatus('error');
//                         alert(`Mint failed! Check console for details. Error: ${error.message}`);
//                     }
//                 }
//             );

//         } catch (error) {
//             console.error('Error creating transaction:', error);
//             setStatus('error');
//         }
//     };
    
//     return (
//         <button
//             onClick={handleMint}
//             disabled={!account?.address || isPending}
//             className={`w-full py-3 text-white rounded-lg font-bold transition flex items-center justify-center ${
//                 !account?.address || isPending 
//                     ? 'bg-gray-400 cursor-not-allowed' 
//                     : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
//             }`}
//         >
//             {isPending ? (
//                 <span>Minting...</span>
//             ) : (
//                 <>
//                     <DollarSign size={20} className="mr-2" /> 
//                     Mint 10 RON (Test Token)
//                 </>
//             )}
//         </button>
//     );
// };

// export default RonMintButton;