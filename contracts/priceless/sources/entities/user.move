module priceless::user {

    use sui::table::{Self, Table};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};

    use ron::ron::RON;
    use priceless::platform_registry::{
        PlatformRegistry,
        is_correct_version,
        has_user_registered,
        get_monthly_subscription_cost,
        get_yearly_subscription_cost,
        increase_platform_registry_treasury,
        add_user
    };
    use priceless::constants::{
        get_EUserAlreadyRegistered,
        get_EIncorrectAmount,
        get_ONE_MONTH_IN_MS,
        get_ONE_YEAR_IN_MS,
    };
    use priceless::events::{
        emit_user_registered,
    };

    public enum SubscriptionType has store, copy, drop {
        Monthly,
        Yearly,
    }

    public struct User has key, store {
        id: UID,
        address: address,
        subsciption_type: SubscriptionType,
        subscription_deadline: u64,
        buys: u64,
        buy_offers: Table<ID, bool>,
    }

    public fun register_user(
        platform_registry: &mut PlatformRegistry,
        subscription_type: SubscriptionType,
        subsciption_fee: Balance<RON>,
        clock: &Clock,
        ctx: &mut TxContext
        ) {
        is_correct_version(platform_registry);
        let caller = tx_context::sender(ctx);
        assert!(!has_user_registered(platform_registry, caller), get_EUserAlreadyRegistered());

        let subscription_fee = match (subscription_type) {
            SubscriptionType::Monthly => get_monthly_subscription_cost(platform_registry),
            SubscriptionType::Yearly => get_yearly_subscription_cost(platform_registry),
        };

        assert!(&subscription_fee == &balance::value(&subsciption_fee), get_EIncorrectAmount());
        increase_platform_registry_treasury(platform_registry, subsciption_fee);

        let subscription_deadline = clock::timestamp_ms(clock) + match (subscription_type) {
            SubscriptionType::Monthly => get_ONE_MONTH_IN_MS(),
            SubscriptionType::Yearly => get_ONE_YEAR_IN_MS(),
        };

        let user = User {
            id: object::new(ctx),
            address: caller,
            subsciption_type: subscription_type,
            subscription_deadline: subscription_deadline,
            buys: 0,
            buy_offers: table::new(ctx),
        };

        let user_id = object::id(&user);
        add_user(platform_registry, caller, user_id);
        
        emit_user_registered(
            user_id,
            caller,
            subscription_fee,
            subscription_deadline,
            clock::timestamp_ms(clock),
        );
        
        transfer::share_object(user);
    }

    public(package) fun add_buy_offer_to_user(user: &mut User, buy_offer_id: ID) {
        table::add(&mut user.buy_offers, buy_offer_id, true);
    }

    public(package) fun remove_buy_offer_from_user(user: &mut User, buy_offer_id: ID) {
        table::remove(&mut user.buy_offers, buy_offer_id);
    }

    public(package) fun is_user_owner(user: &User, address: address): bool {
        user.address == address
    }

    public(package) fun is_user_subscribed(user: &User, clock: &Clock): bool {
        clock::timestamp_ms(clock) < user.subscription_deadline
    }

    public fun get_monthly_subscription(): SubscriptionType {
        SubscriptionType::Monthly
    }

    public fun get_yearly_subscription(): SubscriptionType {
        SubscriptionType::Yearly
    }

}