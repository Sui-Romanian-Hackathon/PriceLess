// src/services/transactions/modifyBuyOfferTx.ts

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';

interface ModifyBuyOfferTxParams {
    client: SuiClient;
    currentAddress: string;
    buyOfferId: string;
    newPrice: number;

    // Configuration IDs
    PRICELESS_PACKAGE: string;
    PLATFORM_REGISTRY: string;
    RON_PACKAGE_ID: string;
}

/**
 * Builds the transaction block for modifying a buy offer on the Sui network.
 * @param params - Parameters required to construct the transaction.
 * @returns The Transaction object ready for signing.
 */
export function createModifyBuyOfferTransaction(params: ModifyBuyOfferTxParams): Transaction {
    const {
        currentAddress,
        buyOfferId,
        newPrice,
        PRICELESS_PACKAGE,
        PLATFORM_REGISTRY,
        RON_PACKAGE_ID,
    } = params;

    const tx = new Transaction();

    console.log(`📝 Building modify_buy_offer transaction:`);
    console.log(`  Buy Offer ID: ${buyOfferId}`);
    console.log(`  New Price: RON ${newPrice}`);

    const ronType = `${RON_PACKAGE_ID}::ron::RON`;

    // Call modify_buy_offer - it returns Balance<RON>
    const refundBalance = tx.moveCall({
        target: `${PRICELESS_PACKAGE}::core_logic::modify_buy_offer`,
        arguments: [
            tx.object(PLATFORM_REGISTRY),
            tx.pure.id(buyOfferId),
            tx.pure.u64(newPrice),
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
