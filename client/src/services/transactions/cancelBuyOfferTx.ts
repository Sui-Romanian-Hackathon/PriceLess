// src/services/transactions/cancelBuyOfferTx.ts

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';

interface CancelBuyOfferTxParams {
    client: SuiClient;
    currentAddress: string;
    buyOfferId: string;
    userAddress: string; // USER_ADDR (User object)

    // Configuration IDs
    PRICELESS_PACKAGE: string;
    PLATFORM_REGISTRY: string;
    RON_PACKAGE_ID: string;
}

/**
 * Builds the transaction block for cancelling a buy offer on the Sui network.
 * @param params - Parameters required to construct the transaction.
 * @returns The Transaction object ready for signing.
 */
export function createCancelBuyOfferTransaction(params: CancelBuyOfferTxParams): Transaction {
    const {
        currentAddress,
        buyOfferId,
        userAddress,
        PRICELESS_PACKAGE,
        PLATFORM_REGISTRY,
        RON_PACKAGE_ID,
    } = params;

    const tx = new Transaction();

    console.log(`📝 Building cancel_buy_offer transaction:`);
    console.log(`  Buy Offer ID: ${buyOfferId}`);
    console.log(`  User Address: ${userAddress}`);

    const ronType = `${RON_PACKAGE_ID}::ron::RON`;

    // Call cancel_buy_offer - it returns Balance<RON>
    const refundBalance = tx.moveCall({
        target: `${PRICELESS_PACKAGE}::core_logic::cancel_buy_offer`,
        arguments: [
            tx.object(PLATFORM_REGISTRY),
            tx.object(userAddress),
            tx.pure.id(buyOfferId),
        ],
    });

    // Convert Balance back to Coin
    const refundCoin = tx.moveCall({
        target: '0x2::coin::from_balance',
        typeArguments: [ronType],
        arguments: [refundBalance],
    });

    // Transfer the refund coin back to the caller
    tx.transferObjects([refundCoin], currentAddress);

    // Set gas budget
    tx.setGasBudget(100000000); // 0.1 SUI

    return tx;
}
