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

const PRICE = 50_00; // 50 RON tokens
const PRODUCT_NAME = 'A';
const DEADLINE = 1826224527; // Deadline timestamp in milliseconds

async function createBuyOffer() {
    console.log(`Creating Buy Offer`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Creating buy offer from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        console.log(`📋 Using configuration:`);
        console.log(`  Priceless Package: ${PRICELESS_PACKAGE}`);
        console.log(`  Platform Registry: ${PLATFORM_REGISTRY}`);
        console.log(`  User ID: ${USER_ADDR}`);
        console.log(`  Product: ${PRODUCT_NAME}`);
        console.log(`  Price: ${PRICE} RON`);
        console.log(`  Offer Type: PriceBased`);
        console.log(`  Deadline: ${DEADLINE}`);

        // Get all RON coins owned by the address
        const ronType = `${RON_PACKAGE_ID}::ron::RON`;

        console.log(`🔍 Looking for RON coins of type: ${ronType}`);

        const coins = await client.getCoins({
            owner: address,
            coinType: ronType,
        });

        if (!coins.data || coins.data.length === 0) {
            throw new Error('No RON coins found in wallet. Please mint some RON tokens first.');
        }

        console.log(`✅ Found ${coins.data.length} RON coin(s)`);

        // Calculate total balance
        const totalBalance = coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
        console.log(`💰 Total RON balance: ${totalBalance} raw units`);

        if (totalBalance < BigInt(PRICE)) {
            throw new Error(`Insufficient RON balance. Required: ${PRICE}, Available: ${totalBalance}`);
        }

        // Create transaction
        const tx = new Transaction();

        // Get the first coin (or merge multiple coins if needed)
        let ronCoin;
        if (coins.data.length === 1) {
            ronCoin = tx.object(coins.data[0].coinObjectId);
        } else {
            // If multiple coins, merge them first
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

        // Split the exact amount needed for the buy offer
        console.log(`✂️  Splitting ${PRICE} from RON coin...`);
        const [priceCoin] = tx.splitCoins(ronCoin, [tx.pure.u64(PRICE)]);

        // Convert coin to balance
        const priceBalance = tx.moveCall({
            target: '0x2::coin::into_balance',
            typeArguments: [ronType],
            arguments: [priceCoin],
        });

        // Get PriceBased offer type
        const offerType = tx.moveCall({
            target: `${PRICELESS_PACKAGE}::buy_offer::get_price_based_offer`,
            arguments: [],
        });

        // Call create_buy_offer
        console.log(`📞 Calling create_buy_offer...`);
        tx.moveCall({
            target: `${PRICELESS_PACKAGE}::core_logic::create_buy_offer`,
            arguments: [
                tx.object(PLATFORM_REGISTRY!),
                tx.object(USER_ADDR!),
                tx.pure.string(PRODUCT_NAME),
                priceBalance,
                offerType,
                tx.object(SUI_CLOCK_OBJECT_ID),
                tx.pure.u64(DEADLINE),
            ],
        });

        // Set gas budget
        tx.setGasBudget(100000000); // 0.1 SUI

        // Execute transaction
        console.log('📤 Submitting create_buy_offer transaction...');
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
        const success = displayTransactionResults(result, 'Create Buy Offer transaction');

        if (success) {
            console.log(`🎉 Successfully created buy offer!`);

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
                    
                    // Highlight the created BuyOffer object
                    if (change.type === 'created' && change.objectType?.includes('BuyOffer')) {
                        console.log(`\n  🛒 Buy Offer Object ID: ${change.objectId}`);
                        console.log(`     Add this to your .env file as BUY_OFFER_ID`);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error creating buy offer:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    createBuyOffer();
}

export { createBuyOffer };
