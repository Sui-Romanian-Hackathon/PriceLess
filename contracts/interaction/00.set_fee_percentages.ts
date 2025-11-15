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

const AGENT_FEE_PERCENTAGE = 5000; // 50% (out of 10000)
const PLATFORM_FEE_PERCENTAGE = 5000; // 50% (out of 10000)

async function setFeePercentages() {
    console.log(`Setting Fee Percentages`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Setting fee percentages from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        console.log(`📋 Using configuration:`);
        console.log(`  Priceless Package: ${PRICELESS_PACKAGE}`);
        console.log(`  Platform Registry: ${PLATFORM_REGISTRY}`);
        console.log(`  Admin Cap ID: ${ADMIN_CAP_ID}`);
        console.log(`  Agent Fee Percentage: ${AGENT_FEE_PERCENTAGE} (${AGENT_FEE_PERCENTAGE / 100}%)`);
        console.log(`  Platform Fee Percentage: ${PLATFORM_FEE_PERCENTAGE} (${PLATFORM_FEE_PERCENTAGE / 100}%)`);

        // Create transaction
        const tx = new Transaction();

        // Call set_fee_percentages
        console.log(`📞 Calling set_fee_percentages...`);
        tx.moveCall({
            target: `${PRICELESS_PACKAGE}::platform_registry::set_fee_percentages`,
            arguments: [
                tx.object(ADMIN_CAP_ID!),
                tx.object(PLATFORM_REGISTRY!),
                tx.pure.u64(AGENT_FEE_PERCENTAGE),
                tx.pure.u64(PLATFORM_FEE_PERCENTAGE),
            ],
        });

        // Set gas budget
        tx.setGasBudget(100000000); // 0.1 SUI

        // Execute transaction
        console.log('📤 Submitting set_fee_percentages transaction...');
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
        const success = displayTransactionResults(result, 'Set Fee Percentages transaction');

        if (success) {
            console.log(`🎉 Successfully set fee percentages!`);

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
        console.error('Error setting fee percentages:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    setFeePercentages();
}

export { setFeePercentages };
