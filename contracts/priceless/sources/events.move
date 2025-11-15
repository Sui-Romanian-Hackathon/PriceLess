module priceless::events {

    use sui::event;

    public struct AgentRegistered has copy, drop {
        agent_id: ID,
        agent_address: address,
        stake_amount: u64,
        timestamp: u64,
    }

    public struct AgentUnstaked has copy, drop {
        agent_id: ID,
        agent_address: address,
        unstaked_amount: u64,
        timestamp: u64,
    }

    public struct UserRegistered has copy, drop {
        user_id: ID,
        user_address: address,
        subscription_fee: u64,
        subscription_deadline: u64,
        timestamp: u64,
    }

    public struct BuyOfferCreated has copy, drop {
        buy_offer_id: ID,
        owner: address,
        product: std::string::String,
        price: u64,
        offer_type_is_time_based: bool,
        deadline: u64,
        timestamp: u64,
    }

    public struct BuyOfferModified has copy, drop {
        buy_offer_id: ID,
        owner: address,
        old_price: u64,
        new_price: u64,
        price_reduction: u64,
    }

    public struct BuyOfferCancelled has copy, drop {
        buy_offer_id: ID,
        owner: address,
        refunded_amount: u64,
    }

    public struct SellOfferMade has copy, drop {
        buy_offer_id: ID,
        sell_offer_id: ID,
        agent_id: ID,
        agent_address: address,
        store_link: std::string::String,
        price: u64,
        is_update: bool,
    }

    public struct ManualBuy has copy, drop {
        buy_offer_id: ID,
        buyer: address,
        agent_id: ID,
        sell_offer_id: ID,
        store_link: std::string::String,
        product_price: u64,
        agent_fee: u64,
        total_paid: u64,
    }

    public struct ServiceBuy has copy, drop {
        buy_offer_id: ID,
        buyer: address,
        agent_id: ID,
        sell_offer_id: ID,
        store_link: std::string::String,
        product_price: u64,
        agent_fee: u64,
        platform_fee: u64,
        buyer_savings: u64,
    }

    public struct AutomaticBuy has copy, drop {
        buy_offer_id: ID,
        buyer: address,
        agent_id: ID,
        store_link: std::string::String,
        product_price: u64,
        agent_fee: u64,
        platform_fee: u64,
        buyer_savings: u64,
    }

    public struct BuyOfferDeleted has copy, drop {
        buy_offer_id: ID,
        owner: address,
        remaining_balance: u64,
    }

    public struct ShopPurchase has copy, drop {
        agent_id: ID,
        store_link: std::string::String,
        product_price: u64,
        agent_fee: u64,
        platform_fee: u64,
    }
    
    public(package) fun emit_agent_registered(
        agent_id: ID,
        agent_address: address,
        stake_amount: u64,
        timestamp: u64,
    ) {
        event::emit(AgentRegistered {
            agent_id,
            agent_address,
            stake_amount,
            timestamp,
        });
    }

    public(package) fun emit_agent_unstaked(
        agent_id: ID,
        agent_address: address,
        unstaked_amount: u64,
        timestamp: u64,
    ) {
        event::emit(AgentUnstaked {
            agent_id,
            agent_address,
            unstaked_amount,
            timestamp,
        });
    }

    public(package) fun emit_user_registered(
        user_id: ID,
        user_address: address,
        subscription_fee: u64,
        subscription_deadline: u64,
        timestamp: u64,
    ) {
        event::emit(UserRegistered {
            user_id,
            user_address,
            subscription_fee,
            subscription_deadline,
            timestamp,
        });
    }

    public(package) fun emit_buy_offer_created(
        buy_offer_id: ID,
        owner: address,
        product: std::string::String,
        price: u64,
        offer_type_is_time_based: bool,
        deadline: u64,
        timestamp: u64,
    ) {
        event::emit(BuyOfferCreated {
            buy_offer_id,
            owner,
            product,
            price,
            offer_type_is_time_based,
            deadline,
            timestamp,
        });
    }

    public(package) fun emit_buy_offer_modified(
        buy_offer_id: ID,
        owner: address,
        old_price: u64,
        new_price: u64,
        price_reduction: u64,
    ) {
        event::emit(BuyOfferModified {
            buy_offer_id,
            owner,
            old_price,
            new_price,
            price_reduction,
        });
    }

    public(package) fun emit_buy_offer_cancelled(
        buy_offer_id: ID,
        owner: address,
        refunded_amount: u64,
    ) {
        event::emit(BuyOfferCancelled {
            buy_offer_id,
            owner,
            refunded_amount,
        });
    }

    public(package) fun emit_sell_offer_made(
        buy_offer_id: ID,
        sell_offer_id: ID,
        agent_id: ID,
        agent_address: address,
        store_link: std::string::String,
        price: u64,
        is_update: bool,
    ) {
        event::emit(SellOfferMade {
            buy_offer_id,
            sell_offer_id,
            agent_id,
            agent_address,
            store_link,
            price,
            is_update,
        });
    }

    public(package) fun emit_manual_buy(
        buy_offer_id: ID,
        buyer: address,
        agent_id: ID,
        sell_offer_id: ID,
        store_link: std::string::String,
        product_price: u64,
        agent_fee: u64,
        total_paid: u64,
    ) {
        event::emit(ManualBuy {
            buy_offer_id,
            buyer,
            agent_id,
            sell_offer_id,
            store_link,
            product_price,
            agent_fee,
            total_paid,
        });
    }

    public(package) fun emit_service_buy(
        buy_offer_id: ID,
        buyer: address,
        agent_id: ID,
        sell_offer_id: ID,
        store_link: std::string::String,
        product_price: u64,
        agent_fee: u64,
        platform_fee: u64,
        buyer_savings: u64,
    ) {
        event::emit(ServiceBuy {
            buy_offer_id,
            buyer,
            agent_id,
            sell_offer_id,
            store_link,
            product_price,
            agent_fee,
            platform_fee,
            buyer_savings,
        });
    }

    public(package) fun emit_automatic_buy(
        buy_offer_id: ID,
        buyer: address,
        agent_id: ID,
        store_link: std::string::String,
        product_price: u64,
        agent_fee: u64,
        platform_fee: u64,
        buyer_savings: u64,
    ) {
        event::emit(AutomaticBuy {
            buy_offer_id,
            buyer,
            agent_id,
            store_link,
            product_price,
            agent_fee,
            platform_fee,
            buyer_savings,
        });
    }

    public(package) fun emit_buy_offer_deleted(
        buy_offer_id: ID,
        owner: address,
        remaining_balance: u64,
    ) {
        event::emit(BuyOfferDeleted {
            buy_offer_id,
            owner,
            remaining_balance,
        });
    }

    public(package) fun emit_shop_purchase(
        agent_id: ID,
        store_link: std::string::String,
        product_price: u64,
        agent_fee: u64,
        platform_fee: u64,
    ) {
        event::emit(ShopPurchase {
            agent_id,
            store_link,
            product_price,
            agent_fee,
            platform_fee,
        });
    }
}

