import { Transaction } from '@mysten/sui/transactions';
import * as path from 'path';
import { initializeSui, checkBalance, displayTransactionResults } from './utils/utils';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const NETWORK = process.env.NETWORK;
const RON_PACKAGE_ID = process.env.RON_PACKAGE_ID;
const PRICELESS_PACKAGE = process.env.PRICELESS_PACKAGE;
const PLATFORM_REGISTRY = process.env.PLATFORM_REGISTRY;
const USER_ID = process.env.USER_ID;
const BUY_OFFER_ID = process.env.BUY_OFFER_ID;

async function cancelBuyOffer() {
    console.log(`Cancelling Buy Offer`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Cancelling buy offer from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        console.log(`📋 Using configuration:`);
        console.log(`  Priceless Package: ${PRICELESS_PACKAGE}`);
        console.log(`  Platform Registry: ${PLATFORM_REGISTRY}`);
        console.log(`  User ID: ${USER_ID}`);
        console.log(`  Buy Offer ID: ${BUY_OFFER_ID}`);

        // Create transaction
        const tx = new Transaction();

        const ronType = `${RON_PACKAGE_ID}::ron::RON`;

        // Call cancel_buy_offer - it returns Balance<RON>
        console.log(`📞 Calling cancel_buy_offer...`);
        const refundBalance = tx.moveCall({
            target: `${PRICELESS_PACKAGE}::core_logic::cancel_buy_offer`,
            arguments: [
                tx.object(PLATFORM_REGISTRY!),
                tx.object(USER_ID!),
                tx.pure.id(BUY_OFFER_ID!),
            ],
        });

        // Convert Balance back to Coin
        const refundCoin = tx.moveCall({
            target: '0x2::coin::from_balance',
            typeArguments: [ronType],
            arguments: [refundBalance],
        });

        // Transfer the refund coin back to the caller
        tx.transferObjects([refundCoin], address);

        // Set gas budget
        tx.setGasBudget(100000000); // 0.1 SUI

        // Execute transaction
        console.log('📤 Submitting cancel_buy_offer transaction...');
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
        const success = displayTransactionResults(result, 'Cancel Buy Offer transaction');

        if (success) {
            console.log(`🎉 Successfully cancelled buy offer!`);

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
                    
                    // Highlight the refund coin
                    if (change.type === 'created' && change.objectType?.includes('Coin')) {
                        console.log(`\n  💰 Refund Coin Object ID: ${change.objectId}`);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error cancelling buy offer:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    cancelBuyOffer();
}

export { cancelBuyOffer };
