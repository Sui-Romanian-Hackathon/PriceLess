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

const STAKE_AMOUNT = 500_000_000; // 5,000,000 RON tokens (with 2 decimals)

async function registerAgent() {
    console.log(`Registering Agent`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Registering agent from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        console.log(`📋 Using configuration:`);
        console.log(`  priceless Package: ${PRICELESS_PACKAGE}`);
        console.log(`  Platform Registry: ${PLATFORM_REGISTRY}`);
        console.log(`  Stake Amount: ${STAKE_AMOUNT} raw units (${STAKE_AMOUNT / 100} RON with 2 decimals)`);

        // Get all RON coins owned by the address
        const ronType = `${RON_PACKAGE_ID}::ron::RON`;
        const coinType = `0x2::coin::Coin<${ronType}>`;

        console.log(`🔍 Looking for RON coins of type: ${coinType}`);

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
        console.log(`💰 Total RON balance: ${totalBalance} raw units (${Number(totalBalance) / 100} RON with 2 decimals)`);

        if (totalBalance < BigInt(STAKE_AMOUNT)) {
            throw new Error(`Insufficient RON balance. Required: ${STAKE_AMOUNT}, Available: ${totalBalance}`);
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

        // Split the exact amount needed for staking
        console.log(`✂️  Splitting ${STAKE_AMOUNT} from RON coin...`);
        const [stakeCoin] = tx.splitCoins(ronCoin, [tx.pure.u64(STAKE_AMOUNT)]);

        // Convert the coin to balance and call register_agent
        const stakeBalance = tx.moveCall({
            target: '0x2::coin::into_balance',
            typeArguments: [ronType],
            arguments: [stakeCoin],
        });

        // Call register_agent
        console.log(`📞 Calling register_agent...`);
        tx.moveCall({
            target: `${PRICELESS_PACKAGE}::agent::register_agent`,
            arguments: [
                tx.object(PLATFORM_REGISTRY!),
                stakeBalance,
                tx.object(SUI_CLOCK_OBJECT_ID),
            ],
        });

        // Set gas budget
        tx.setGasBudget(100000000); // 0.1 SUI

        // Execute transaction
        console.log('📤 Submitting register_agent transaction...');
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
        const success = displayTransactionResults(result, 'Register Agent transaction');

        if (success) {
            console.log(`🎉 Successfully registered as agent!`);

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
        console.error('Error registering agent:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    registerAgent();
}

export { registerAgent };
