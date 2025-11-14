module priceless::agent {

    use ron::ron::RON;
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};

    public struct Agent has key, store {
        id: UID,
        address: address,
        stake: Balance<RON>,
        original_stake_amount: u64,
        rating: u64,
        total_rewards_earned: u64,
        current_rewards: Balance<RON>,
        total_slashed: u64,
        registered_at: u64,
        deactivated_at: u64,
        active_offer_count: u64,
    }

    public(package) fun register_agent(
        address: address,
        clock: &Clock, 
        ctx: &mut TxContext): Agent {
        Agent {
            id: object::new(ctx),
            address: address,
            stake: balance::zero(),
            original_stake_amount: 0,
            rating: 0,
            total_rewards_earned: 0,
            current_rewards: balance::zero(),
            total_slashed: 0,
            registered_at: clock::timestamp_ms(clock),
            deactivated_at: 0,
            active_offer_count: 0,
        }
    }
}