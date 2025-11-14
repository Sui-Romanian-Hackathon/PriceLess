module priceless::platform_registry {

    use sui::table::{Self, Table};
    use sui::balance::{Self, Balance};
    
    use ron::ron::RON;
    use priceless::admin_cap::{
        AdminCap,
    };
    use priceless::constants::{
        get_USER_MONTHLY_SUBSCRIPTION_COST,
        get_USER_YEARLY_SUBSCRIPTION_COST,
        get_VERSION,
        get_AGENT_STAKE_AMOUNT,
        get_AGENT_FEE_PERCENTAGE,
        get_PLATFORM_FEE_PERCENTAGE,
        get_MANUAL_BUY_FEE_PERCENTAGE,
        get_EIncorrectVersion,
    };
    use priceless::buy_offer::{
        BuyOffer,
    };
    
    public struct PlatformRegistry has key {
        id: UID,
        version: u64,
        admin: ID,   
        required_stake_amount: u64,
        monthly_subscription_cost: u64,
        yearly_subscription_cost: u64,
        manual_fee_percentage: u64,
        agent_fee_percentage: u64,
        platform_fee_percentage: u64,
        total_volume: u64,
        monitor_address: address,
        agents: Table<address, ID>,
        users: Table<address, ID>,
        buy_offers: Table<ID, BuyOffer>,
        treasury: Balance<RON>,
    }

    public(package) fun create_and_share_platform_registry(admin_cap_id: ID, ctx: &mut TxContext) {
        let platform_registry=  PlatformRegistry {
            id: object::new(ctx),
            version: get_VERSION(),
            admin: admin_cap_id,
            required_stake_amount: get_AGENT_STAKE_AMOUNT(),
            monthly_subscription_cost: get_USER_MONTHLY_SUBSCRIPTION_COST(),
            yearly_subscription_cost: get_USER_YEARLY_SUBSCRIPTION_COST(),
            manual_fee_percentage : get_MANUAL_BUY_FEE_PERCENTAGE(),
            agent_fee_percentage: get_AGENT_FEE_PERCENTAGE(),
            platform_fee_percentage: get_PLATFORM_FEE_PERCENTAGE(),
            total_volume: 0,
            monitor_address: @0x0,
            agents: table::new(ctx),
            users: table::new(ctx),
            buy_offers: table::new(ctx),
            treasury: balance::zero(),
        };
        transfer::share_object(platform_registry);
    }

    public(package) fun add_agent(platform_registry: &mut PlatformRegistry, address: address, agent_id: ID) {
        table::add(&mut platform_registry.agents, address, agent_id);
    }

    public(package) fun add_user(platform_registry: &mut PlatformRegistry, address: address, user_id: ID) {
        table::add(&mut platform_registry.users, address, user_id);
    }

    public(package) fun add_buy_offer_to_platform_registry(platform_registry: &mut PlatformRegistry, buy_offer_id: ID, buy_offer: BuyOffer) {
        table::add(&mut platform_registry.buy_offers, buy_offer_id, buy_offer);
    }

    public(package) fun remove_buy_offer_from_platform_registry(platform_registry: &mut PlatformRegistry, buy_offer_id: ID): BuyOffer {
        table::remove(&mut platform_registry.buy_offers, buy_offer_id)
    }

    public(package) fun get_offer(platform_registry: &PlatformRegistry, buy_offer_id: ID): &BuyOffer {
        table::borrow(&platform_registry.buy_offers, buy_offer_id)
    }

    public(package) fun increase_platform_registry_treasury(platform_registry: &mut PlatformRegistry, balance: Balance<RON>) {
        balance::join(&mut platform_registry.treasury, balance);
    }

    public fun set_monitor_address(_ : &AdminCap, platform_registry: &mut PlatformRegistry, address: address) {
        platform_registry.monitor_address = address;
    }

    public fun get_monitor_address(platform_registry: &mut PlatformRegistry): address {
        platform_registry.monitor_address  
    }

    public fun modify_required_stake_amount(_ : &AdminCap, platform_registry: &mut PlatformRegistry, new_stake_amount: u64) {
        platform_registry.required_stake_amount = new_stake_amount;
    }

    public fun increase_platform_treasury(platform_registry: &mut PlatformRegistry, fee: Balance<RON>) {
        balance::join(&mut platform_registry.treasury, fee);
    }

    public(package) fun get_required_stake_amount(platform_registry: &PlatformRegistry): u64 {
        platform_registry.required_stake_amount
    }

    public(package) fun get_platform_registry_admin(platform_registry: &PlatformRegistry): ID{
        platform_registry.admin
    }

    public(package) fun get_platform_registry_version_mut(platform_registry: &mut PlatformRegistry): &mut u64 {
        &mut platform_registry.version
    }

    public(package) fun get_manual_fee_percentage(platform_registry: &PlatformRegistry): u64 {
        platform_registry.manual_fee_percentage
    }

    public(package) fun has_agent_registered(platform_registry: &PlatformRegistry, agent_owner_address: address): bool {
        table::contains<address,ID>(&platform_registry.agents, agent_owner_address)
    }

    public(package) fun has_user_registered(platform_registry: &PlatformRegistry, user_owner_address: address): bool {
        table::contains<address,ID>(&platform_registry.users, user_owner_address)
    }

    public(package) fun get_monthly_subscription_cost(platform_registry: &PlatformRegistry): u64 {
        platform_registry.monthly_subscription_cost
    }

    public(package) fun get_yearly_subscription_cost(platform_registry: &PlatformRegistry): u64 {
        platform_registry.yearly_subscription_cost
    }

    public(package) fun is_correct_version(platform_registry: &PlatformRegistry) {
        assert!(platform_registry.version == get_VERSION(), get_EIncorrectVersion());
    }

    public(package) fun get_agent_fee_percentage(platform_registry: &PlatformRegistry): u64 {
        platform_registry.agent_fee_percentage
    }

    public(package) fun get_platform_fee_percentage(platform_registry: &PlatformRegistry): u64 {
        platform_registry.platform_fee_percentage
    }

}