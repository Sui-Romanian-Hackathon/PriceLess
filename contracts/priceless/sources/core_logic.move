module priceless::core_logic {

    use std::string::{String};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::table::{Self};

    use ron::ron::RON;
    use priceless::buy_offer::{
        BuyOfferType,
        BuyOffer,
        new_buy_offer,
        is_offer_owner,
        get_buy_offer_deadline,
        get_buy_offer_price_balance,
        get_buy_offer_price,
        get_sell_offers_table,
        get_sell_offers_table_mut,
        get_sell_offers_owner_ids,
        get_sell_offers_owner_ids_mut,
        get_price_balance_mut,
        destroy_buy_offer,
        is_time_based,
        get_price,
        get_store_link,
        get_owner,
        get_sell_offer_id
    };
    use priceless::sell_offer::{
        drop_offers_data,
        update_sell_offer,
        new_sell_offer,
        get_sell_offer_price,
        get_sell_offer_store_link,
    };
    use priceless::platform_registry::{
        PlatformRegistry,
        is_correct_version,
        add_buy_offer_to_platform_registry,
        remove_buy_offer_from_platform_registry,
        get_agent_fee_percentage,
        get_platform_fee_percentage,
        get_offer,
        get_monitor_address,
    };
    use priceless::user::{
        User,
        is_user_subscribed, 
        is_user_owner,
        add_buy_offer_to_user,
        remove_buy_offer_from_user,
    };
    use priceless::agent::{
        Agent,
        is_agent_owner,
    };
    use priceless::mock_shop_buy::{
        Shop,
        mock_shop_buy,
    };
    use priceless::constants::{
        get_EIncorrectAmount,
        get_EUserNotSubscribed,
        get_ENotOwner,
        get_ENotAgentOwner,
        get_EDeadlineExceeded,
        get_PERCENTAGE_DENOMINATOR,
        get_EInvalidCaller,
        get_EInvalidBuyOffer,
    };
    use priceless::events::{
        emit_buy_offer_created,
        emit_buy_offer_modified,
        emit_buy_offer_cancelled,
        emit_sell_offer_made,
        emit_manual_buy,
        emit_service_buy,
        emit_automatic_buy,
        emit_buy_offer_deleted,
    };


    public fun create_buy_offer(
        platform_registry: &mut PlatformRegistry,
        user: &mut User,
        product: String,
        price: Balance<RON>,
        offer_type: BuyOfferType,
        clock: &Clock,
        deadline: u64,
        ctx: &mut TxContext
    ) {
        is_correct_version(platform_registry);
        let caller = tx_context::sender(ctx);
        assert!(is_user_subscribed(user, clock), get_EUserNotSubscribed());
        assert!(is_user_owner(user, caller), get_ENotOwner());
        assert!(balance::value(&price) > 0, get_EIncorrectAmount());
        
        let price_value = balance::value(&price);
        let buy_offer = new_buy_offer(caller, product, price, offer_type, deadline, ctx);
        let buy_offer_id = object::id(&buy_offer);
        
        emit_buy_offer_created(
            buy_offer_id,
            caller,
            product,
            price_value,
            is_time_based(&buy_offer),
            deadline,
            clock::timestamp_ms(clock),
        );
        
        add_buy_offer_to_platform_registry(platform_registry, buy_offer_id, buy_offer);
        add_buy_offer_to_user(user, buy_offer_id);
    }

    public fun modify_buy_offer(
        platform_registry: &mut PlatformRegistry,
        buy_offer_id: ID,
        new_price: u64,
        ctx: &mut TxContext
    ): Balance<RON> {
        is_correct_version(platform_registry);
        let caller = tx_context::sender(ctx);
        let mut buy_offer = remove_buy_offer_from_platform_registry(platform_registry, buy_offer_id);
        assert!(is_offer_owner(&buy_offer, caller), get_ENotOwner());
        
        let current_price_value = get_buy_offer_price(&buy_offer);
        assert!(new_price < current_price_value, get_EIncorrectAmount());

        let price_difference = current_price_value - new_price;
        let difference = balance::split(get_price_balance_mut(&mut buy_offer), price_difference);
        
        emit_buy_offer_modified(
            buy_offer_id,
            caller,
            current_price_value,
            new_price,
            price_difference,
        );
        
        add_buy_offer_to_platform_registry(platform_registry, buy_offer_id, buy_offer);

        difference
    } 

    public fun cancel_buy_offer(
        platform_registry: &mut PlatformRegistry,
        user: &mut User,
        buy_offer_id: ID,
        ctx: &mut TxContext
    ): Balance<RON> {
        is_correct_version(platform_registry);
        let caller = tx_context::sender(ctx);
        let buy_offer = get_offer(platform_registry, buy_offer_id);
        assert!(is_offer_owner(buy_offer, caller), get_ENotOwner());

        let buy_offer = remove_buy_offer_from_platform_registry(platform_registry, buy_offer_id);
        let refunded_amount = get_buy_offer_price(&buy_offer);
        
        emit_buy_offer_cancelled(
            buy_offer_id,
            caller,
            refunded_amount,
        );
        
        delete_buy_offer( user, buy_offer_id, buy_offer)
    } 

    public fun make_sell_offer(
        platform_registry: &mut PlatformRegistry,
        buy_offer_id: ID,
        user: &mut User,
        agent: &mut Agent,
        store_link: String,
        price: u64,
        shop: &mut Shop,
        clock: &Clock,
        ctx: &mut TxContext 
    ) {
        is_correct_version(platform_registry);
        let caller = tx_context::sender(ctx);
        assert!(is_agent_owner(agent, caller), get_ENotAgentOwner());
         
        // New offer rules: 
        // Each agent must make only one offer: old offer gets modified if it exists
        // New offers can have a higher price than existing ones: buyer can choose a manual buy on a 
        // preferred shop
        let agent_id = object::id(agent);
        let mut buy_offer = remove_buy_offer_from_platform_registry(platform_registry, buy_offer_id);
        let exists_offer = get_sell_offers_owner_ids(&buy_offer).contains(&agent_id);
        let sell_offer_id = match (exists_offer) {
            true => {
                let  sell_offer = table::borrow_mut(get_sell_offers_table_mut(&mut buy_offer), agent_id);
                update_sell_offer(sell_offer, store_link, price);
                get_sell_offer_id(&buy_offer, agent_id)
            },
            false => {
                let new_sell_offer = new_sell_offer(agent_id, store_link, price, clock, ctx);
                let sell_offer_id = object::id(&new_sell_offer);
                table::add(get_sell_offers_table_mut(&mut buy_offer), sell_offer_id, new_sell_offer);
                vector::push_back(get_sell_offers_owner_ids_mut(&mut buy_offer), sell_offer_id);
                sell_offer_id
            }
        };

        emit_sell_offer_made(
            buy_offer_id,
            sell_offer_id,
            agent_id,
            caller,
            store_link,
            price,
            exists_offer,
        );

        // Automatic buy if price is below threshold for 
        if (!is_time_based(&buy_offer) && price < get_buy_offer_price(&buy_offer)) {
            buy_internal(
                platform_registry,
                user,
                buy_offer_id,
                buy_offer,
                agent,
                shop,
                price,
                store_link,
            );
        } else {
            add_buy_offer_to_platform_registry(platform_registry, buy_offer_id, buy_offer);
        };  
    }

    public fun manual_buy(
        platform_registry: &mut PlatformRegistry,
        user: &mut User,
        buy_offer_id: ID,
        sell_offer_id: ID,
        agent: &mut Agent,
        price_difference: Balance<RON>,
        shop: &mut Shop,
        clock: &Clock,
        ctx: &mut TxContext 
    ) {
        is_correct_version(platform_registry);
        let caller = tx_context::sender(ctx);
        let buy_offer  = get_offer(platform_registry, buy_offer_id);
        assert!(is_offer_owner(buy_offer, caller), get_ENotOwner());

        // Defensive check in case offer monitor service goes down
        if (is_time_based(buy_offer)) {
            assert!(clock::timestamp_ms(clock) < get_buy_offer_deadline(buy_offer), 
                get_EDeadlineExceeded());
        };

        // Make sure the final price is the sell_offer price  + fee    
        let mut buy_offer_owned = remove_buy_offer_from_platform_registry(platform_registry, buy_offer_id);    
        let mut buy_price_balance = get_buy_offer_price_balance(&mut buy_offer_owned);
        let sell_offer = table::borrow(get_sell_offers_table(&buy_offer_owned), sell_offer_id);
        let store_link = get_sell_offer_store_link(sell_offer);


        let percentage_denominator= get_PERCENTAGE_DENOMINATOR();
        let sell_offer_value = get_sell_offer_price(sell_offer) * 
            (percentage_denominator + platform_registry.get_manual_fee_percentage()) / percentage_denominator;

        assert!(sell_offer_value == 
                balance::value(&buy_price_balance) +  balance::value(&price_difference));

        // Add all balances
        balance::join(&mut buy_price_balance, price_difference);
        // Extract agent fee
        let agent_fee_value = get_sell_offer_price(sell_offer) * 
            (platform_registry.get_manual_fee_percentage() / percentage_denominator);
        let agent_fee_balance = balance::split(&mut buy_price_balance, agent_fee_value);

        let product_price = get_sell_offer_price(sell_offer);
        let total_paid = balance::value(&buy_price_balance) + agent_fee_value;
        let agent_id = object::id(agent);
        
        emit_manual_buy(
            buy_offer_id,
            caller,
            agent_id,
            sell_offer_id,
            store_link,
            product_price,
            agent_fee_value,
            total_paid,
        );

        let empty_balance = delete_buy_offer(user, buy_offer_id, buy_offer_owned);
        balance::destroy_zero(empty_balance);

        // Platform doesn't get any fee in case of manual buy
        let platform_fee = balance::zero<RON>();

        mock_shop_buy(
            platform_registry,
            agent_fee_balance,
            agent,
            platform_fee,
            store_link,
            buy_price_balance,
            shop,
        );
    }

    public fun service_buy(
        platform_registry: &mut PlatformRegistry, 
        user: &mut User, 
        buy_offer_id: ID,
        sell_offers_owner_id: ID,
        agent: &mut Agent,
        clock: &Clock,
        shop: &mut Shop,
        ctx: &mut TxContext
        ) {
        is_correct_version(platform_registry);
        let caller = tx_context::sender(ctx);
        assert!(caller == get_monitor_address(platform_registry), get_EInvalidCaller());

        let buy_offer_owned = remove_buy_offer_from_platform_registry(platform_registry, buy_offer_id);    
        assert!(is_time_based(&buy_offer_owned), get_EInvalidBuyOffer());

        assert!(clock::timestamp_ms(clock) > get_buy_offer_deadline(&buy_offer_owned));

        // TODO: Assert offer is cheapest 
        let price = get_price(&buy_offer_owned, sell_offers_owner_id);
        let store_link = get_store_link(&buy_offer_owned, sell_offers_owner_id);
        
        let buyer = get_owner(&buy_offer_owned);
        let agent_id = object::id(agent);
        let original_price = get_buy_offer_price(&buy_offer_owned);
        let price_difference = original_price - price;
        let percentage_denominator = get_PERCENTAGE_DENOMINATOR();
        let agent_fee = price_difference * get_agent_fee_percentage(platform_registry) / percentage_denominator;
        let platform_fee = price_difference * get_platform_fee_percentage(platform_registry) / percentage_denominator;
        let buyer_savings = price_difference - agent_fee - platform_fee;
        
        emit_service_buy(
            buy_offer_id,
            buyer,
            agent_id,
            sell_offers_owner_id,
            store_link,
            price,
            agent_fee,
            platform_fee,
            buyer_savings,
        );

        buy_internal(
            platform_registry,
            user,
            buy_offer_id,
            buy_offer_owned,
            agent,
            shop,
            price,
            store_link,
        );

    }

    //TODO: Add service_return function

    fun buy_internal(
        platform_registry: &mut PlatformRegistry,
        user: &mut User,
        buy_offer_id: ID,
        mut buy_offer: BuyOffer,
        agent: &mut Agent,
        shop: &mut Shop,
        price: u64,
        store_link: String,
    ) {
        let buyer = get_owner(&buy_offer);
        let agent_id = object::id(agent);
        let price_difference = get_buy_offer_price(&buy_offer) - price;
        let percentage_denominator = get_PERCENTAGE_DENOMINATOR();
        let agent_fee = price_difference * get_agent_fee_percentage(platform_registry) / percentage_denominator;
        let platform_fee = price_difference * get_platform_fee_percentage(platform_registry) / percentage_denominator;
        let buyer_savings = price_difference - agent_fee - platform_fee;

        emit_automatic_buy(
            buy_offer_id,
            buyer,
            agent_id,
            store_link,
            price,
            agent_fee,
            platform_fee,
            buyer_savings,
        );

        let mut buy_price_balance = get_buy_offer_price_balance(&mut buy_offer);
        let mut price_difference_balance = balance::split(&mut buy_price_balance, price_difference);

        let agent_fee_balance = balance::split(&mut price_difference_balance, agent_fee);
        let platform_fee_balance = balance::split(&mut price_difference_balance, platform_fee);
        balance::destroy_zero(price_difference_balance);

        let empty_balance = delete_buy_offer( user, buy_offer_id, buy_offer);
        balance::destroy_zero(empty_balance);

        mock_shop_buy(
            platform_registry,
            agent_fee_balance,
            agent,
            platform_fee_balance,
            store_link,
            buy_price_balance,
            shop,
        )
    }

    fun delete_buy_offer(
        user: &mut User,
        buy_offer_id: ID,
        buy_offer: BuyOffer,
        ): Balance<RON> {

        let owner = get_owner(&buy_offer);
        let (id, balance, sell_offers, sell_offers_owner_ids) = destroy_buy_offer(buy_offer);
        let remaining_balance = balance::value(&balance);

        emit_buy_offer_deleted(
            buy_offer_id,
            owner,
            remaining_balance,
        );

        remove_buy_offer_from_user(user, buy_offer_id);
        drop_offers_data(sell_offers, sell_offers_owner_ids);
        object::delete(id);

        balance
    }
 


}