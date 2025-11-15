module priceless::agent {

    use ron::ron::RON;
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};

    use priceless::platform_registry::{
        PlatformRegistry,
        get_required_stake_amount,
        add_agent,
        has_agent_registered,
        is_correct_version,
    };
    use priceless::constants::{
        get_RATING_DENOMINATOR,
        get_EIncorrectStakeAmount,
        get_ENotAgentOwner,
        get_EAgentAlreadyRegistered,
        get_EAgentNotRegistered,
    };
    use priceless::events::{
        emit_agent_registered,
        emit_agent_unstaked,
    };

    public struct Agent has key, store {
        id: UID,
        owner: address,
        stake: Balance<RON>,
        collected_fees: Balance<RON>,
        rating: u64,
        buys: u64,
        active: bool,
    }

    public fun register_agent(
        platform_registry: &mut PlatformRegistry,
        stake_balance: Balance<RON>,
        clock: &Clock,
        ctx: &mut TxContext
        ) {
        is_correct_version(platform_registry);

        let caller = tx_context::sender(ctx);
        assert!(!has_agent_registered(platform_registry, caller), get_EAgentAlreadyRegistered()); 

        let stake_amount = balance::value(&stake_balance);
        assert!(stake_amount == get_required_stake_amount(platform_registry), get_EIncorrectStakeAmount());

        let agent = Agent {
            id: object::new(ctx),
            owner: caller,
            stake: stake_balance,
            collected_fees: balance::zero<RON>(),
            rating: get_RATING_DENOMINATOR(),
            buys: 0,
            active: true,
        };

        let agent_id = object::id(&agent);
        let agent_object_address = object::id_to_address(&agent_id);
        add_agent(platform_registry, caller, agent_id);
        transfer::share_object(agent);

        emit_agent_registered(agent_id, agent_object_address, caller, stake_amount, clock::timestamp_ms(clock));
    }

    public fun unstake(agent: &mut Agent, 
        platform_registry: &mut PlatformRegistry,
        clock: &Clock,
        ctx: &mut TxContext
        ): Balance<RON> {
        is_correct_version(platform_registry);

        let caller = tx_context::sender(ctx);
        assert!(has_agent_registered(platform_registry, caller), get_EAgentNotRegistered());

        assert!(is_agent_owner(agent, caller), get_ENotAgentOwner());
        agent.active = false;
        let balance = balance::withdraw_all(&mut agent.stake);
        
        emit_agent_unstaked(
            object::id(agent), 
            caller, 
            balance::value(&balance), 
            clock::timestamp_ms(clock)
        );
        
        balance
    }

    public(package) fun is_agent_owner(agent: &Agent, address: address): bool {
        agent.owner == address
    }

    public(package) fun increase_collected_fees(agent: &mut Agent, fee: Balance<RON>) {
        balance::join(&mut agent.collected_fees, fee);
    }
 
}