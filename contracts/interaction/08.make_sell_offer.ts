import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import * as path from 'path';
import { initializeSui, checkBalance, displayTransactionResults } from './utils/utils';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const NETWORK = process.env.NETWORK;
const PRICELESS_PACKAGE = process.env.PRICELESS_PACKAGE;
const PLATFORM_REGISTRY = process.env.PLATFORM_REGISTRY;
const USER_ADDR = process.env.USER_ADDR;
const AGENT1 = process.env.AGENT1;
const SHOP = process.env.SHOP;
const BUY_OFFER_ID = process.env.BUY_OFFER_ID;

const PRICE = 60_00; // Price in RON tokens
const STORE_LINK = 'https://example.com/product';

async function makeSellOffer() {
    console.log(`Making Sell Offer`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Making sell offer from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        console.log(`📋 Using configuration:`);
        console.log(`  Priceless Package: ${PRICELESS_PACKAGE}`);
        console.log(`  Platform Registry: ${PLATFORM_REGISTRY}`);
        console.log(`  Buy Offer ID: ${BUY_OFFER_ID}`);
        console.log(`  User ID: ${USER_ADDR}`);
        console.log(`  Agent ID: ${AGENT1}`);
        console.log(`  Shop ID: ${SHOP}`);
        console.log(`  Price: ${PRICE} RON`);
        console.log(`  Store Link: ${STORE_LINK}`);

        // Create transaction
        const tx = new Transaction();

        // Call make_sell_offer
        console.log(`📞 Calling make_sell_offer...`);
        tx.moveCall({
            target: `${PRICELESS_PACKAGE}::core_logic::make_sell_offer`,
            arguments: [
                tx.object(PLATFORM_REGISTRY!),
                tx.pure.id(BUY_OFFER_ID!),
                tx.object(USER_ADDR!),
                tx.object(AGENT1!),
                tx.pure.string(STORE_LINK),
                tx.pure.u64(PRICE),
                tx.object(SHOP!),
                tx.object(SUI_CLOCK_OBJECT_ID),
            ],
        });

        // Set gas budget
        tx.setGasBudget(100000000); // 0.1 SUI

        // Execute transaction
        console.log('📤 Submitting make_sell_offer transaction...');
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
        const success = displayTransactionResults(result, 'Make Sell Offer transaction');

        if (success) {
            console.log(`🎉 Successfully made sell offer!`);

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
        console.error('Error making sell offer:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    makeSellOffer();
}

export { makeSellOffer };
