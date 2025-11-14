module priceless::constants {
    
    const VERSION: u64 = 1;
    const AGENT_STAKE_AMOUNT: u64 = 500_000_000;
    const PERCENTAGE_DENOMINATOR: u64 = 10_000;
    const TOTAL_FEE_PERCENTAGE: u64 = 5_000;  // Percentage the platform and agents get out of the saved amount
    const PLATFORM_FEE_PERCENTAGE: u64 = 5_000; // Platform fee 
    const REWARD_1ST: u64 = 8_000;
    const REWARD_2ND: u64 = 1_500;
    const REWARD_3RD: u64 = 500;

                                                 

    const ENotAdmin: u64 = 1;

    public(package) fun get_VERSION(): u64 { VERSION }
    public(package) fun get_AGENT_STAKE_AMOUNT(): u64 { AGENT_STAKE_AMOUNT }
    public(package) fun get_PERCENTAGE_DENOMINATOR(): u64 { PERCENTAGE_DENOMINATOR }
    public(package) fun get_TOTAL_FEE_PERCENTAGE(): u64 { TOTAL_FEE_PERCENTAGE }
    public(package) fun get_PLATFORM_FEE_PERCENTAGE(): u64 { PLATFORM_FEE_PERCENTAGE }
    public(package) fun get_REWARD_1ST(): u64 { REWARD_1ST }
    public(package) fun get_REWARD_2ND(): u64 { REWARD_2ND }
    public(package) fun get_REWARD_3RD(): u64 { REWARD_3RD }

    public(package) fun get_ENotAdmin(): u64 { ENotAdmin }

}