import { Transaction } from '@mysten/sui/transactions';
import * as fs from 'fs';
import * as path from 'path';
import { initializeSui, checkBalance, displayTransactionResults } from './utils/utils';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const NETWORK = process.env.NETWORK;
const RON_PACKAGE_ID = process.env.RON_PACKAGE_ID;
const RON_TREASURY_CAP_ID = process.env.RON_TREASURY_CAP_ID;


async function mintRON() {
    const targetPackage = RON_PACKAGE_ID;
    const targetTreasuryCap = RON_TREASURY_CAP_ID;
    
    console.log(`Minting RON`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Claiming from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        console.log(`📋 Using configuration:`);
        console.log(`  RON Package: ${targetPackage}`);
        console.log(`  RON Treasury Cap: ${targetTreasuryCap}`);

        // Create transaction
        const tx = new Transaction();

        // Call claim function
        tx.moveCall({
            target: `${RON_PACKAGE_ID}::ron::mint`,
            arguments: [
                tx.object(targetTreasuryCap!),
                tx.pure.u64(10000_00),  // 10_000 RON
                tx.object(address), 
            ],
        });

        // Set gas budget
        tx.setGasBudget(100000000); // 0.1 SUI

        // Execute transaction
        console.log('📤 Submitting claim transaction...');
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
        const success = displayTransactionResults(result, 'Claim transaction');
        
        if (success) {
            console.log(`🎉 Successfully claimed rewards!`);
            
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
                    console.log(`  ${change.type}: ${change.objectType} - ${change.objectId}`);
                });
            }
        }
    } catch (error) {
        console.error('Error minting RON:', error);
        process.exit(1);
    };
}

if (require.main === module) {
    mintRON();
}

export { mintRON };