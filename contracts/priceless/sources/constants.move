module priceless::constants {
    
    const VERSION: u64 = 6;
    const AGENT_STAKE_AMOUNT: u64 = 500_000_000;
    const USER_MONTHLY_SUBSCRIPTION_COST: u64 = 10_00;
    const USER_YEARLY_SUBSCRIPTION_COST: u64 = 100_00;
    const PERCENTAGE_DENOMINATOR: u64 = 10_000;
    const MANUAL_BUY_FEE_PERCENTAGE: u64 = 500;
    const AGENT_FEE_PERCENTAGE: u64 = 5_000;  // Agent fee percentage
    const PLATFORM_FEE_PERCENTAGE: u64 = 5_000; // Platform fee percentage
    const RATING_DENOMINATOR: u64 = 500;
    const ONE_MONTH_IN_MS: u64 = 30 * 24 * 60 * 60 * 1000;
    const ONE_YEAR_IN_MS: u64 = 365 * 24 * 60 * 60 * 1000;

    const ENotAdmin: u64 = 1;
    const EIncorrectStakeAmount: u64 = 2;
    const ENotAgentOwner: u64 = 3;
    const ENotUpgrade: u64 = 4;
    const EAgentAlreadyRegistered: u64 = 5;
    const EAgentNotRegistered: u64 = 6;
    const EUserAlreadyRegistered: u64 = 7;
    const EIncorrectAmount: u64 = 8;
    const EUserNotSubscribed: u64 = 9;
    const ENotOwner: u64 = 10;
    const EIncorrectVersion: u64 = 11;
    const EDeadlineExceeded: u64 = 12;
    const EInvalidCaller: u64 = 13;
    const EInvalidBuyOffer: u64 = 14;

    public(package) fun get_VERSION(): u64 { VERSION }
    public(package) fun get_AGENT_STAKE_AMOUNT(): u64 { AGENT_STAKE_AMOUNT }
    public(package) fun get_USER_MONTHLY_SUBSCRIPTION_COST(): u64 { USER_MONTHLY_SUBSCRIPTION_COST }
    public(package) fun get_USER_YEARLY_SUBSCRIPTION_COST(): u64 { USER_YEARLY_SUBSCRIPTION_COST }
    public(package) fun get_PERCENTAGE_DENOMINATOR(): u64 { PERCENTAGE_DENOMINATOR }
    public(package) fun get_MANUAL_BUY_FEE_PERCENTAGE(): u64 { MANUAL_BUY_FEE_PERCENTAGE }
    public(package) fun get_AGENT_FEE_PERCENTAGE(): u64 { AGENT_FEE_PERCENTAGE }
    public(package) fun get_PLATFORM_FEE_PERCENTAGE(): u64 { PLATFORM_FEE_PERCENTAGE }
    public(package) fun get_RATING_DENOMINATOR(): u64 { RATING_DENOMINATOR }
    public(package) fun get_ONE_MONTH_IN_MS(): u64 { ONE_MONTH_IN_MS }
    public(package) fun get_ONE_YEAR_IN_MS(): u64 { ONE_YEAR_IN_MS }
    
    public(package) fun get_ENotAdmin(): u64 { ENotAdmin }
    public(package) fun get_EIncorrectStakeAmount(): u64 { EIncorrectStakeAmount }
    public(package) fun get_ENotAgentOwner(): u64 { ENotAgentOwner }
    public(package) fun get_ENotUpgrade(): u64 { ENotUpgrade }
    public(package) fun get_EAgentAlreadyRegistered(): u64 { EAgentAlreadyRegistered }
    public(package) fun get_EAgentNotRegistered(): u64 { EAgentNotRegistered }
    public(package) fun get_EUserAlreadyRegistered(): u64 { EUserAlreadyRegistered }
    public(package) fun get_EIncorrectAmount(): u64 { EIncorrectAmount }
    public(package) fun get_EUserNotSubscribed(): u64 { EUserNotSubscribed }
    public(package) fun get_ENotOwner(): u64 { ENotOwner }
    public(package) fun get_EIncorrectVersion(): u64 { EIncorrectVersion }
    public(package) fun get_EDeadlineExceeded(): u64 { EDeadlineExceeded }
    public(package) fun get_EInvalidCaller(): u64 { EInvalidCaller }
    public(package) fun get_EInvalidBuyOffer(): u64 { EInvalidBuyOffer }
}