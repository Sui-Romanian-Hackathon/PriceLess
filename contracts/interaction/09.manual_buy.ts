import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import * as path from 'path';
import { initializeSui, checkBalance, displayTransactionResults } from './utils/utils';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const NETWORK = process.env.NETWORK;
const RON_PACKAGE_ID = process.env.RON_PACKAGE_ID;
const PRICELESS_PACKAGE = process.env.PRICELESS_PACKAGE;
const PLATFORM_REGISTRY = process.env.PLATFORM_REGISTRY;
const USER_ADDR = process.env.USER_ADDR;
const AGENT1 = process.env.AGENT1;
const SHOP = process.env.SHOP;
const BUY_OFFER_ID = process.env.BUY_OFFER_ID;
const SELL_OFFER_ID = process.env.SELL_OFFER_ID;

// Price difference to pay (if the sell offer price + fee is higher than buy offer price)
// Formula: sell_offer_price * (10000 + manual_fee_percentage) / 10000 - buy_offer_price
// Given: buy_offer = 5000, sell_offer = 6000, manual_fee = 500 (5%)
// Calculation: 6000 * 10500 / 10000 - 5000 = 6300 - 5000 = 1300
const PRICE_DIFFERENCE = 1300;

async function manualBuy() {
    console.log(`Manual Buy`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Executing manual buy from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        console.log(`📋 Using configuration:`);
        console.log(`  Priceless Package: ${PRICELESS_PACKAGE}`);
        console.log(`  Platform Registry: ${PLATFORM_REGISTRY}`);
        console.log(`  Buy Offer ID: ${BUY_OFFER_ID}`);
        console.log(`  Sell Offer ID: ${SELL_OFFER_ID}`);
        console.log(`  User addr: ${USER_ADDR}`);
        console.log(`  Agent ID: ${AGENT1}`);
        console.log(`  Shop: ${SHOP}`);
        console.log(`  Price Difference: ${PRICE_DIFFERENCE} RON`);

        // Create transaction
        const tx = new Transaction();

        const ronType = `${RON_PACKAGE_ID}::ron::RON`;

        // If price difference is needed, get RON coins and split
        let priceDifferenceBalance;
        if (PRICE_DIFFERENCE > 0) {
            const coins = await client.getCoins({
                owner: address,
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
            console.log(`✂️  Splitting ${PRICE_DIFFERENCE} from RON coin...`);
            const [priceDiffCoin] = tx.splitCoins(ronCoin, [tx.pure.u64(PRICE_DIFFERENCE)]);

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
        tx.moveCall({
            target: `${PRICELESS_PACKAGE}::core_logic::manual_buy`,
            arguments: [
                tx.object(PLATFORM_REGISTRY!),
                tx.object(USER_ADDR!),
                tx.pure.id(BUY_OFFER_ID!),
                tx.pure.id(SELL_OFFER_ID!),
                tx.object(AGENT1!),
                priceDifferenceBalance,
                tx.object(SHOP!),
                tx.object(SUI_CLOCK_OBJECT_ID),
            ],
        });

        // Set gas budget
        tx.setGasBudget(100000000); // 0.1 SUI

        // Execute transaction
        console.log('📤 Submitting manual_buy transaction...');
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
                showEvents: true,
            },
        });

        // Display transaction results
        const success = displayTransactionResults(result, 'Manual Buy transaction');

        if (success) {
            console.log(`🎉 Successfully completed manual buy!`);

            // Display events if any
            if (result.events && result.events.length > 0) {
                console.log('\n📋 Events:');
                result.events.forEach((event: any, index: number) => {
                    console.log(`  Event ${index + 1}:`, JSON.stringify(event, null, 2));
                });
            }

            // Display object changes
            if (result.objectChanges && result.objectChanges.length > 0) {
                console.log('\n📋 Object Changes:');
                result.objectChanges.forEach((change: any) => {
                    console.log(`  ${change.type}: ${change.objectType || 'N/A'} - ${change.objectId}`);
                });
            }
        }
    } catch (error) {
        console.error('Error executing manual buy:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    manualBuy();
}

export { manualBuy };
