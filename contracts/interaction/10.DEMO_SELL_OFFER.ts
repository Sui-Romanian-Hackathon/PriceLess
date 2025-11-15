import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import * as path from 'path';
import { initializeSui, checkBalance, displayTransactionResults } from './utils/utils';
import { config } from 'dotenv';
import axios from 'axios';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const NETWORK = process.env.NETWORK;
const PRICELESS_PACKAGE = process.env.PRICELESS_PACKAGE;
const PLATFORM_REGISTRY = process.env.PLATFORM_REGISTRY;
const AGENT1 = process.env.AGENT1;
const SHOP = process.env.SHOP;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Demo user wallet
const USER_WALLET = "0xe84167595a4c2b113329dededb103be1029a7fe258cc725ad1ee637d59801b0a";

const PRICE = 1300_00; // Price in RON tokens
const STORE_LINK = 'https://example.com/product';

async function makeSellOffer() {
    console.log(`Making Sell Offer (DEMO)`);

    try {
        const { client, keypair, address } = await initializeSui(NETWORK);

        console.log(`📝 Making sell offer from address: ${address}`);

        // Check balance
        await checkBalance(client, address, 100000000);

        // Fetch USER_ADDR from API
        console.log(`🔍 Fetching user data for wallet: ${USER_WALLET}`);
        const userResponse = await axios.get(`${BACKEND_URL}/api/get_user?address=${USER_WALLET}`);
        const user = userResponse.data.data;

        if (!user) {
            throw new Error(`User not found for wallet: ${USER_WALLET}`);
        }

        const USER_ADDR = user.user_address;
        console.log(`✅ Found USER_ADDR: ${USER_ADDR}`);

        // Fetch BUY_OFFER_ID from API
        console.log(`🔍 Fetching buy offer for wallet: ${USER_WALLET}`);
        const buyOfferResponse = await axios.get(`${BACKEND_URL}/api/buy-offers/owner/${USER_WALLET}`);
        const buyOffers = buyOfferResponse.data.data;

        if (!buyOffers || buyOffers.length === 0) {
            throw new Error(`Buy offer not found for wallet: ${USER_WALLET}`);
        }

        // Get the most recent buy offer
        const buyOffer = buyOffers[0];
        const BUY_OFFER_ID = buyOffer.buy_offer_id;
        console.log(`✅ Found BUY_OFFER_ID: ${BUY_OFFER_ID}`);

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
