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

const SUBSCRIPTION_FEE = 10_00; // 10 RON  

async function registerUser() {
    console.log(`Registering User`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Registering user from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        console.log(`📋 Using configuration:`);
        console.log(`  Priceless Package: ${PRICELESS_PACKAGE}`);
        console.log(`  Platform Registry: ${PLATFORM_REGISTRY}`);
        console.log(`  Subscription Type: Monthly`);
        console.log(`  Subscription Fee: ${SUBSCRIPTION_FEE} RON`);

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

        if (totalBalance < BigInt(SUBSCRIPTION_FEE)) {
            throw new Error(`Insufficient RON balance. Required: ${SUBSCRIPTION_FEE}, Available: ${totalBalance}`);
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

        // Split the exact amount needed for subscription
        console.log(`✂️  Splitting ${SUBSCRIPTION_FEE} from RON coin...`);
        const [subscriptionCoin] = tx.splitCoins(ronCoin, [tx.pure.u64(SUBSCRIPTION_FEE)]);

        // Convert the coin to balance
        const subscriptionBalance = tx.moveCall({
            target: '0x2::coin::into_balance',
            typeArguments: [ronType],
            arguments: [subscriptionCoin],
        });

        // Get Monthly subscription type
        const subscriptionType = tx.moveCall({
            target: `${PRICELESS_PACKAGE}::user::get_monthly_subscription`,
            arguments: [],
        });

        // Call register_user
        console.log(`📞 Calling register_user...`);
        tx.moveCall({
            target: `${PRICELESS_PACKAGE}::user::register_user`,
            arguments: [
                tx.object(PLATFORM_REGISTRY!),
                subscriptionType,
                subscriptionBalance,
                tx.object(SUI_CLOCK_OBJECT_ID),
            ],
        });

        // Set gas budget
        tx.setGasBudget(100000000); // 0.1 SUI

        // Execute transaction
        console.log('📤 Submitting register_user transaction...');
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
        const success = displayTransactionResults(result, 'Register User transaction');

        if (success) {
            console.log(`🎉 Successfully registered as user!`);

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
                    
                    // Highlight the created User object
                    if (change.type === 'created' && change.objectType?.includes('User')) {
                        console.log(`\n  👤 User Object ID: ${change.objectId}`);
                        console.log(`     Add this to your .env file as USER_ADDR`);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error registering user:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    registerUser();
}

export { registerUser };
