module counter::counter {


    public struct Counter has key, store {
        id: UID,
        val: u64
    }

    public fun new(ctx: &mut TxContext) {
    let counter = Counter {
        id: object::new(ctx),
        val: 0,
    };
    transfer::public_transfer(counter, tx_context::sender(ctx));
    }


    public fun add_value(counter: &mut Counter, value: u64) {
        counter.val = counter.val + value;
    }

    public fun val(counter: &Counter): u64 {
        counter.val
    }
}
