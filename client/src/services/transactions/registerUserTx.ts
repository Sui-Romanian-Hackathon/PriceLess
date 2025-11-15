// src/services/transactions/registerUserTx.ts

import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { SuiClient } from '@mysten/sui/client';

export type SubscriptionType = "Monthly" | "Yearly";

interface RegisterUserTxParams {
    client: SuiClient;
    currentAddress: string;
    subscriptionType: SubscriptionType;
    
    // Configuration IDs
    PRICELESS_PACKAGE: string;
    PLATFORM_REGISTRY: string;
    RON_PACKAGE_ID: string;
}

// Definim taxele în unități brute (u64)
const SUBSCRIPTION_FEES = {
    Monthly: 10_00, // 10 RON
    Yearly: 100_00, // 100 RON (Adjust to your actual Move contract logic)
};

interface CoinObject {
    coinObjectId: string;
    balance: string; 
}

/**
 * Builds the transaction block for registering a User with a subscription fee.
 * * @param params - Parameters required to construct the transaction.
 * @returns The Transaction object ready for signing.
 */
export async function createRegisterUserTransaction(params: RegisterUserTxParams): Promise<Transaction> {
    const { 
        client, 
        currentAddress, 
        subscriptionType,
        PRICELESS_PACKAGE, 
        PLATFORM_REGISTRY, 
        RON_PACKAGE_ID,
    } = params;

    const SUBSCRIPTION_FEE = SUBSCRIPTION_FEES[subscriptionType];
    const feeBigInt = BigInt(SUBSCRIPTION_FEE);
    const ronType = `${RON_PACKAGE_ID}::ron::RON`;

    // 1.
    const coins = await client.getCoins({
        owner: currentAddress,
        coinType: ronType,
    });

    if (!coins.data || coins.data.length === 0) {
        throw new Error('No RON coins found in wallet. Subscription fee required.');
    }

    const totalBalance = coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
    if (totalBalance < feeBigInt) {
        throw new Error(`Insufficient RON balance. Required: ${SUBSCRIPTION_FEE} raw units, Available: ${totalBalance}`);
    }

    // 2.
    const tx = new Transaction();
    const [firstCoin, ...otherCoins] = coins.data;
    let ronCoin = tx.object(firstCoin.coinObjectId);

    // Merge coins if necessary
    if (otherCoins.length > 0) {
        tx.mergeCoins(
            ronCoin,
            otherCoins.map(coin => tx.object(coin.coinObjectId))
        );
    }

    // Split the coin for the exact subscription fee
    const [subscriptionCoin] = tx.splitCoins(ronCoin, [tx.pure.u64(feeBigInt)]);

    // Convert the coin into a Balance object
    const subscriptionBalance = tx.moveCall({
        target: '0x2::coin::into_balance',
        typeArguments: [ronType],
        arguments: [subscriptionCoin],
    });

    // Determine the Move function for the subscription type
    //  'get_monthly_subscription' sau 'get_yearly_subscription'
    const subscriptionTypeFunction = subscriptionType === "Monthly" 
        ? 'get_monthly_subscription' 
        : 'get_yearly_subscription'; 

    const subscriptionTypeObject = tx.moveCall({
        target: `${PRICELESS_PACKAGE}::user::${subscriptionTypeFunction}`,
        arguments: [],
    });

    // Call the main registration function
    tx.moveCall({
        target: `${PRICELESS_PACKAGE}::user::register_user`,
        arguments: [
            tx.object(PLATFORM_REGISTRY),
            subscriptionTypeObject,
            subscriptionBalance,
            tx.object(SUI_CLOCK_OBJECT_ID),
        ],
    });

    tx.setGasBudget(100000000); 

    return tx;
}