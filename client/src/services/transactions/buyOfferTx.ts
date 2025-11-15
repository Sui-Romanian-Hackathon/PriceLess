// src/services/transactions/buyOfferTx.ts

import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { SuiClient } from '@mysten/sui/client';

// Simplified types for the transaction inputs
interface BuyOfferTxParams {
    client: SuiClient;
    currentAddress: string;
    productName: string; 
    price: number; 
    offerType: 'TargetPrice' | 'Deadline';
    deadlineTimestampMs: number | null;
    
    // Configuration IDs
    PRICELESS_PACKAGE: string;
    PLATFORM_REGISTRY: string;
    RON_PACKAGE_ID: string;
    USER_ADDR: string;
}

interface CoinObject {
    coinObjectId: string;
    balance: string; 
}

/**
 * Builds the transaction block for creating a Buy Offer on the Sui network.
 * Uses REAL RON coins found in the wallet.
 * * @param params - Parameters required to construct the transaction.
 * @returns The Transaction object ready for signing.
 */
export async function createBuyOfferTransaction(params: BuyOfferTxParams): Promise<Transaction> {
    const { 
        client, 
        currentAddress, 
        productName, 
        price, 
        offerType, 
        deadlineTimestampMs,
        PRICELESS_PACKAGE, 
        PLATFORM_REGISTRY, 
        RON_PACKAGE_ID,
        USER_ADDR 
    } = params;

    const tx = new Transaction();
    const ronType = `${RON_PACKAGE_ID}::ron::RON`;
    const priceBigInt = BigInt(price);
    
    let coinsData: CoinObject[] = [];

    // --- 1. Find REAL RON coins (Logică standard) ---
    const coins = await client.getCoins({
        owner: currentAddress,
        coinType: ronType,
    });
    console.log('my coins', coins);

    if (!coins.data || coins.data.length === 0) {
        throw new Error('No RON coins found in wallet. Please obtain actual RON test tokens.');
    }
    coinsData = coins.data.map(c => ({
        coinObjectId: c.coinObjectId,
        balance: c.balance
    }));
    
    // Asigură-te că există suficient sold
    const totalBalance = coinsData.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
    if (totalBalance < priceBigInt) {
        throw new Error(`Insufficient RON balance. Required: ${price}, Available: ${totalBalance}`);
    }


    // --- 2. Coin Management (Merge/Split) ---
    
    const [firstCoin, ...otherCoins] = coinsData;
    let ronCoin = tx.object(firstCoin.coinObjectId);

    if (otherCoins.length > 0) {
        tx.mergeCoins(
            ronCoin,
            otherCoins.map(coin => tx.object(coin.coinObjectId))
        );
    }
    
    const [priceCoin] = tx.splitCoins(ronCoin, [tx.pure.u64(priceBigInt)]);

    // --- 3. Convert Coin to Balance ---
    const priceBalance = tx.moveCall({
        target: '0x2::coin::into_balance',
        typeArguments: [ronType],
        arguments: [priceCoin],
    });

    console.log('price balance', priceBalance);

    // --- 4. Get Offer Type ---
    const offerTypeTarget = offerType === 'TargetPrice' 
        ? 'get_price_based_offer' 
        : 'get_deadline_based_offer';

    const offerTypeObject = tx.moveCall({
        target: `${PRICELESS_PACKAGE}::buy_offer::${offerTypeTarget}`,
        arguments: [],
    });

    console.log('offer type object', offerTypeObject);

    // --- 5. Call create_buy_offer ---
    
    const deadlineArg = offerType === 'Deadline' && deadlineTimestampMs !== null
        ? tx.pure.u64(deadlineTimestampMs)
        : tx.pure.u64(0); 

    tx.moveCall({
        target: `${PRICELESS_PACKAGE}::core_logic::create_buy_offer`,
        arguments: [
            tx.object(PLATFORM_REGISTRY),
            tx.object(USER_ADDR), 
            tx.pure.string(productName),
            priceBalance,
            offerTypeObject,
            tx.object(SUI_CLOCK_OBJECT_ID),
            deadlineArg,
        ],
    });

    tx.setGasBudget(100000000); 

    return tx;
}