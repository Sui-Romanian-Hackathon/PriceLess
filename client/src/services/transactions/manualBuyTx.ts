// src/services/transactions/manualBuyTx.ts

import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { SuiClient } from '@mysten/sui/client';

interface ManualBuyTxParams {
    client: SuiClient;
    currentAddress: string;
    buyOfferId: string;
    sellOfferId: string;
    agentId: string; // AGENT1 from SellOffer
    userAddress: string; // USER_ADDR
    priceDifference: number; // In base units (divide actual price by 100)

    // Configuration IDs
    PRICELESS_PACKAGE: string;
    PLATFORM_REGISTRY: string;
    RON_PACKAGE_ID: string;
    SHOP: string;
}

/**
 * Builds the transaction block for manual buy on the Sui network.
 * @param params - Parameters required to construct the transaction.
 * @returns The Transaction object ready for signing.
 */
export async function createManualBuyTransaction(params: ManualBuyTxParams): Promise<Transaction> {
    const {
        client,
        currentAddress,
        buyOfferId,
        sellOfferId,
        agentId,
        userAddress,
        priceDifference,
        PRICELESS_PACKAGE,
        PLATFORM_REGISTRY,
        RON_PACKAGE_ID,
        SHOP,
    } = params;

    const tx = new Transaction();
    const ronType = `${RON_PACKAGE_ID}::ron::RON`;

    let priceDifferenceBalance;

    if (priceDifference > 0) {
        // Fetch RON coins from wallet
        const coins = await client.getCoins({
            owner: currentAddress,
            coinType: ronType,
        });

        if (!coins.data || coins.data.length === 0) {
            throw new Error('No RON coins found in wallet. Please mint some RON tokens first.');
        }

        console.log(`✅ Found ${coins.data.length} RON coin(s)`);

        // Get the first coin (or merge multiple coins if needed)
        let ronCoin;
        if (coins.data.length === 1) {
            ronCoin = tx.object(coins.data[0].coinObjectId);
        } else {
            console.log(`🔄 Merging ${coins.data.length} RON coins...`);
            const [firstCoin, ...otherCoins] = coins.data;
            ronCoin = tx.object(firstCoin.coinObjectId);

            if (otherCoins.length > 0) {
                tx.mergeCoins(
                    ronCoin,
                    otherCoins.map(coin => tx.object(coin.coinObjectId))
                );
            }
        }

        // Split the price difference amount
        console.log(`✂️  Splitting ${priceDifference} from RON coin...`);
        const [priceDiffCoin] = tx.splitCoins(ronCoin, [tx.pure.u64(BigInt(priceDifference))]);

        // Convert to balance
        priceDifferenceBalance = tx.moveCall({
            target: '0x2::coin::into_balance',
            typeArguments: [ronType],
            arguments: [priceDiffCoin],
        });
    } else {
        // Create zero balance
        priceDifferenceBalance = tx.moveCall({
            target: '0x2::balance::zero',
            typeArguments: [ronType],
            arguments: [],
        });
    }

    // Call manual_buy
    console.log(`📞 Calling manual_buy...`);
    console.log(`\n=== MANUAL BUY TRANSACTION ARGUMENTS ===`);
    console.log(`0. PLATFORM_REGISTRY (object): ${PLATFORM_REGISTRY}`);
    console.log(`1. USER_ADDRESS (object): ${userAddress}`);
    console.log(`2. BUY_OFFER_ID (pure ID): ${buyOfferId}`);
    console.log(`3. SELL_OFFER_ID (pure ID): ${sellOfferId}`);
    console.log(`4. AGENT_ID (object): ${agentId}`);
    console.log(`5. PRICE_DIFFERENCE_BALANCE: ${priceDifference} base units`);
    console.log(`6. SHOP (object): ${SHOP}`);
    console.log(`7. CLOCK (object): ${SUI_CLOCK_OBJECT_ID}`);
    console.log(`========================================\n`);

    tx.moveCall({
        target: `${PRICELESS_PACKAGE}::core_logic::manual_buy`,
        arguments: [
            tx.object(PLATFORM_REGISTRY),
            tx.object(userAddress),
            tx.pure.id(buyOfferId),
            tx.pure.id(sellOfferId),
            tx.object(agentId),
            priceDifferenceBalance,
            tx.object(SHOP),
            tx.object(SUI_CLOCK_OBJECT_ID),
        ],
    });

    tx.setGasBudget(100000000);

    return tx;
}
