import { Transaction } from '@mysten/sui/transactions';
import * as path from 'path';
import { initializeSui, checkBalance, displayTransactionResults } from './utils/utils';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const NETWORK = process.env.NETWORK;
const PRICELESS_PACKAGE = process.env.PRICELESS_PACKAGE;
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID;

async function createShop() {
    console.log(`Creating Shop`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Creating shop from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        console.log(`📋 Using configuration:`);
        console.log(`  Priceless Package: ${PRICELESS_PACKAGE}`);
        console.log(`  Admin Cap ID: ${ADMIN_CAP_ID}`);

        // Create transaction
        const tx = new Transaction();

        // Call create_and_share_shop
        console.log(`📞 Calling create_and_share_shop...`);
        tx.moveCall({
            target: `${PRICELESS_PACKAGE}::mock_shop_buy::create_and_share_shop`,
            arguments: [
                tx.pure.id(ADMIN_CAP_ID!),
            ],
        });

        // Set gas budget
        tx.setGasBudget(100000000); // 0.1 SUI

        // Execute transaction
        console.log('📤 Submitting create shop transaction...');
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
        const success = displayTransactionResults(result, 'Create Shop transaction');

        if (success) {
            console.log(`🎉 Successfully created shop!`);

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
                    
                    // Highlight the created Shop object
                    if (change.type === 'created' && change.objectType?.includes('Shop')) {
                        console.log(`\n  🏪 Shop Object ID: ${change.objectId}`);
                        console.log(`     Add this to your .env file as SHOP_ID`);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error creating shop:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    createShop();
}

export { createShop };
