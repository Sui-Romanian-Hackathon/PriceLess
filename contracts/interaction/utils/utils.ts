import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SuiSetup {
    client: SuiClient;
    keypair: Ed25519Keypair;
    address: string;
}

/**
 * Initialize SUI client and load keypair from keystore
 */
export async function initializeSui(network: string | undefined): Promise<SuiSetup> {
    if (!network) {
        throw new Error('Network is not defined. Check your .env file.');
    }
    const client = new SuiClient({ url: getFullnodeUrl(network as any) });

    const configDir = path.join(os.homedir(), '.sui', 'sui_config');
    const keystorePath = path.join(configDir, 'sui.keystore');
    const clientYamlPath = path.join(configDir, 'client.yaml');

    if (!fs.existsSync(keystorePath)) {
        throw new Error(`Keystore not found at ${keystorePath}. Make sure Sui CLI is set up.`);
    }
    if (!fs.existsSync(clientYamlPath)) {
        throw new Error(`Client config not found at ${clientYamlPath}. Make sure Sui CLI is set up.`);
    }

    const keystore = JSON.parse(fs.readFileSync(keystorePath, 'utf-8'));
    if (keystore.length === 0) {
        throw new Error('No keys found in keystore. Add a key using: sui client new-address');
    }

    // Read active address from client.yaml
    const clientYaml = fs.readFileSync(clientYamlPath, 'utf-8');
    const activeAddressMatch = clientYaml.match(/active_address:\s*["']?(0x[a-fA-F0-9]+)["']?/);
    if (!activeAddressMatch) {
        throw new Error('Could not find active_address in client.yaml');
    }
    const activeAddress = activeAddressMatch[1].toLowerCase();

    // Find the keypair that matches the active address
    let keypair: Ed25519Keypair | undefined;
    let address: string | undefined;
    for (const privateKeyB64 of keystore) {
        const privateKeyBytes = fromBase64(privateKeyB64);
        const secretKey = privateKeyBytes.slice(1, 33);
        const kp = Ed25519Keypair.fromSecretKey(secretKey);
        const kpAddress = kp.getPublicKey().toSuiAddress().toLowerCase();
        if (kpAddress === activeAddress) {
            keypair = kp;
            address = kpAddress;
            break;
        }
    }

    if (!keypair || !address) {
        throw new Error(`Active address ${activeAddress} not found in keystore.`);
    }

    console.log(`🔑 Using address: ${address}`);
    return { client, keypair, address };
}

/**
 * Check and display wallet balance with optional warning for low balance
 */
export async function checkBalance(client: SuiClient, address: string, minBalance?: number): Promise<string> {
    const balance = await client.getBalance({ owner: address });
    console.log(`💰 Balance: ${balance.totalBalance} MIST`);

    if (minBalance && parseInt(balance.totalBalance) < minBalance) {
        console.warn(`⚠️  Low balance. You may need more SUI for the transaction. (Required: ${minBalance} MIST)`);
    }

    return balance.totalBalance;
}

/**
 * Display transaction results in a consistent format
 */
export function displayTransactionResults(result: any, operationName: string) {
    console.log(`✅ ${operationName} submitted!`);
    console.log(`📋 Transaction Digest: ${result.digest}`);

    // Check transaction status - handle both response formats
    const status = result.effects?.status?.status || result.effects?.status;
    const isSuccess = status === 'success' || (typeof status === 'object' && status.status === 'success');

    console.log(`📊 Transaction Status:`, JSON.stringify(status, null, 2));

    if (isSuccess) {
        console.log(`🎉 ${operationName} completed successfully!`);

        // Display events if any
        if (result.events && result.events.length > 0) {
            console.log('\n📋 Events:');
            result.events.forEach((event: any, index: number) => {
                console.log(`  Event ${index + 1}:`, JSON.stringify(event, null, 2));
            });
        }

        // Display object changes if any
        if (result.objectChanges && result.objectChanges.length > 0) {
            console.log('\n📋 Object Changes:');
            result.objectChanges.forEach((change: any) => {
                if (change.type === 'created') {
                    console.log(`  Created: ${change.objectType} - ${change.objectId}`);
                } else if (change.type === 'mutated') {
                    console.log(`  Mutated: ${change.objectType} - ${change.objectId}`);
                }
            });
        }

        return true;
    } else {
        console.error('❌ Transaction failed or aborted');
        console.error('❌ Full Status Object:', JSON.stringify(result.effects?.status, null, 2));
        return false;
    }
}