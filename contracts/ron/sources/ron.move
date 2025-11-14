module ron::ron {

    use sui::coin::{Self, TreasuryCap};
    use sui::coin_registry; 

    public struct RON has drop {}

    fun init(witness: RON, ctx: &mut TxContext) {
        let (initializer, treasury) = coin_registry::new_currency_with_otw(
            witness,
            2, // decimals
            b"RON".to_string(),         // symbol
            b"RON".to_string(),         // name
            b"".to_string(),             // description
            b"".to_string(),             // icon_url
            ctx,
        );
        let metadata_cap = initializer.finalize(ctx);
        transfer::public_transfer(treasury, ctx.sender());
        transfer::public_transfer(metadata_cap, ctx.sender());
    }


    public fun mint(
        treasury_cap: &mut TreasuryCap<RON>, 
        amount: u64, 
        recipient: address, 
        ctx: &mut TxContext,
    ) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient)
    }

}
 