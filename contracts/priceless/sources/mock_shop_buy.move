module priceless::mock_shop_buy {

    use sui::table::{Self, Table};
    use std::string::{String};
    use sui::balance::{Self, Balance};

    use ron::ron::RON;    
    use priceless::agent::{
        Agent,
        increase_collected_fees,
    };
    use priceless::platform_registry::{
        PlatformRegistry,
        increase_platform_treasury
    };
    use priceless::events::{
        emit_shop_purchase,
    };
    
    public struct Shop has key{
        id: UID,
        admin: ID,
        buy_action: Table<String, Balance<RON>>
    }

    public fun create_and_share_shop(admin_cap_id: ID, ctx: &mut TxContext) {
        let shop = Shop {
            id: object::new(ctx),
            admin: admin_cap_id, 
            buy_action: table::new(ctx),
        };
        transfer::share_object(shop);
    }

    public(package) fun mock_shop_buy(
        platform_registry: &mut PlatformRegistry,
        agent_fee: Balance<RON>,
        agent: &mut Agent,
        platform_fee: Balance<RON>,
        store_link: String,
        price: Balance<RON>,
        shop: &mut Shop,
    ) {
        let agent_id = object::id(agent);
        let agent_fee_value = balance::value(&agent_fee);
        let platform_fee_value = balance::value(&platform_fee);
        let product_price = balance::value(&price);

        emit_shop_purchase(
            agent_id,
            store_link,
            product_price,
            agent_fee_value,
            platform_fee_value,
        );

        increase_collected_fees(agent, agent_fee);
        increase_platform_treasury(platform_registry, platform_fee);
        shop.buy_action.add(store_link, price);
    }
}