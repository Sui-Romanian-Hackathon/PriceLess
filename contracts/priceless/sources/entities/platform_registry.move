module priceless::platform_registry {

    use sui::table::{Self, Table};

    use priceless::constants::{
        get_VERSION,
        get_AGENT_STAKE_AMOUNT,
        get_PERCENTAGE_DENOMINATOR,
        get_TOTAL_FEE_PERCENTAGE,
        get_PLATFORM_FEE_PERCENTAGE,
        get_REWARD_1ST,
        get_REWARD_2ND,
        get_REWARD_3RD,
    };

    use priceless::admin_cap::{
        AdminCap,
    };
    
    public struct PlatformRegistry has key {
        id: UID,
        version: u64,
        admin: ID,   
        agent_stake_amount: u64,
        percentage_denominator: u64,
        total_fee_percentage: u64,
        platform_fee_percentage: u64,
        reward_1st: u64,
        reward_2nd: u64,
        reward_3rd: u64,
        total_volume: u64,
        total_fees_collected: u64,
        completed_offers: u64,
        cancelled_offers: u64,
        agents: Table<address, ID>,
    }

    public(package) fun new_platform_registry(admin_cap: &AdminCap, ctx: &mut TxContext): PlatformRegistry {
        PlatformRegistry {
            id: object::new(ctx),
            version: get_VERSION(),
            admin: object::id(admin_cap),
            agent_stake_amount: get_AGENT_STAKE_AMOUNT(),
            percentage_denominator: get_PERCENTAGE_DENOMINATOR(),
            total_fee_percentage: get_TOTAL_FEE_PERCENTAGE(),
            platform_fee_percentage: get_PLATFORM_FEE_PERCENTAGE(),
            reward_1st: get_REWARD_1ST(),
            reward_2nd: get_REWARD_2ND(),
            reward_3rd: get_REWARD_3RD(),
            total_volume: 0,
            total_fees_collected: 0,
            completed_offers: 0,
            cancelled_offers: 0,
            agents: table::new(ctx),
        }
    }
}