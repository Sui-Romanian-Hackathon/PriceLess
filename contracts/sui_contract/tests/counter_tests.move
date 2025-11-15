#[test_only]
module counter::counter_tests {
    use sui::test_scenario;
    use sui::transfer;
    use counter::counter;

    const EWrongInitialValue: u64 = 0;
    const EWrongAddValue: u64 = 1;

    #[test]
    fun test_create_counter() {
        let user = @0x12e4;
        let mut scenario = test_scenario::begin(user);

        {
            let ctx = scenario.ctx();
            let c = counter::new(ctx);
            assert!(counter::val(&c) == 0, EWrongInitialValue);
            transfer::public_transfer(c, scenario.sender());
        };

        scenario.end();
    }

    #[test]
    fun test_add_value_once() {
        let user = @0x12e4;
        let mut scenario = test_scenario::begin(user);

        {
            let ctx = scenario.ctx();
            let c = counter::new(ctx);
            transfer::public_transfer(c, scenario.sender());
        };

        scenario.next_tx(user);
        {
            let mut c = test_scenario::take_from_sender<counter::Counter>(&scenario);
            counter::add_value(&mut c, 42);
            assert!(counter::val(&c) == 42, EWrongAddValue);
            transfer::public_transfer(c, scenario.sender());
        };

        scenario.end();
    }

    #[test]
    fun test_add_value_multiple() {
        let user = @0x12e4;
        let mut scenario = test_scenario::begin(user);

        {
            let ctx = scenario.ctx();
            let c = counter::new(ctx);
            transfer::public_transfer(c, scenario.sender());
        };

        scenario.next_tx(user);
        {
            let mut c = test_scenario::take_from_sender<counter::Counter>(&scenario);
            counter::add_value(&mut c, 10);
            counter::add_value(&mut c, 15);
            assert!(counter::val(&c) == 25, EWrongAddValue);
            transfer::public_transfer(c, scenario.sender());
        };

        scenario.end();
    }
}
