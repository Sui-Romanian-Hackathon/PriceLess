import type { SuiTransactionBlockResponse } from "@mysten/sui/client";

/**
 * Extracts the Object ID of the newly created BuyOffer from the transaction response.
 * @param result The full response object after executing the transaction block.
 * @returns The Object ID (string) of the created BuyOffer, or null if not found.
 */
export function extractBuyOfferId(result: SuiTransactionBlockResponse): string | null {
    if (!result.objectChanges) {
        return null;
    }

    // Look for a 'created' object change that matches the BuyOffer type.
    const createdOfferChange = result.objectChanges.find(change => {
        return (
            change.type === 'created' &&
            // Check if the object type includes the package ID and the BuyOffer struct name
            'objectType' in change && 
            change.objectType.includes('BuyOffer')
            // You might need a more specific check, e.g., includes('YourPackageName::buy_offer::BuyOffer')
        );
    });

    if (createdOfferChange && 'objectId' in createdOfferChange) {
        return createdOfferChange.objectId;
    }

    return null;
}