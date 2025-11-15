import { Transaction } from '@mysten/sui/transactions';
import * as path from 'path';
import { initializeSui, checkBalance, displayTransactionResults } from './utils/utils';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const NETWORK = process.env.NETWORK;
const PRICELESS_PACKAGE = process.env.PRICELESS_PACKAGE;
const PLATFORM_REGISTRY = process.env.PLATFORM_REGISTRY;
const ADMIN_CAP_ID = process.env.ADMIN_CAP_ID;

async function migratePlatformRegistry() {
    console.log(`Migrating Platform Registry`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Migrating platform registry from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        console.log(`📋 Using configuration:`);
        console.log(`  Priceless Package: ${PRICELESS_PACKAGE}`);
        console.log(`  Platform Registry: ${PLATFORM_REGISTRY}`);
        console.log(`  Admin Cap ID: ${ADMIN_CAP_ID}`);

        // Create transaction
        const tx = new Transaction();

        // Call migrate_platform_registry
        console.log(`📞 Calling migrate_platform_registry...`);
        tx.moveCall({
            target: `${PRICELESS_PACKAGE}::priceless::migrate_platform_registry`,
            arguments: [
                tx.object(PLATFORM_REGISTRY!),
                tx.object(ADMIN_CAP_ID!),
            ],
        });

        // Set gas budget
        tx.setGasBudget(100000000); // 0.1 SUI

        // Execute transaction
        console.log('📤 Submitting migrate_platform_registry transaction...');
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
        const success = displayTransactionResults(result, 'Migrate Platform Registry transaction');

        if (success) {
            console.log(`🎉 Successfully migrated platform registry!`);

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
        console.error('Error migrating platform registry:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    migratePlatformRegistry();
}

export { migratePlatformRegistry };
