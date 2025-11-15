// @generated automatically by Diesel CLI.

diesel::table! {
    Agent (id) {
        id -> Int4,
        agent_id -> Text,
        agent_address -> Text,
        agent_owner_address -> Text,
        stake_amount -> Int8,
        rating -> Int8,
        buys -> Int8,
        active -> Bool,
        registered_at -> Int8,
    }
}

diesel::table! {
    BuyOffer (id) {
        id -> Int4,
        buy_offer_id -> Text,
        owner -> Text,
        product -> Text,
        price -> Int8,
        offer_type_is_time_based -> Bool,
        deadline -> Int8,
        created_at -> Int8,
    }
}

diesel::table! {
    ManualBuy (id) {
        id -> Int4,
        buy_offer_id -> Text,
        buyer -> Text,
        agent_id -> Text,
        sell_offer_id -> Text,
        store_link -> Text,
        product_price -> Int8,
        agent_fee -> Int8,
        total_paid -> Int8,
    }
}

diesel::table! {
    SellOffer (id) {
        id -> Int4,
        buy_offer_id -> Text,
        sell_offer_id -> Text,
        agent_id -> Text,
        agent_address -> Text,
        store_link -> Text,
        price -> Int8,
        is_update -> Bool,
    }
}

diesel::table! {
    ShopPurchase (id) {
        id -> Int4,
        agent_id -> Text,
        store_link -> Text,
        product_price -> Int8,
        agent_fee -> Int8,
        platform_fee -> Int8,
    }
}

diesel::table! {
    User (id) {
        id -> Int4,
        user_id -> Text,
        user_address -> Text,
        user_owner_address -> Text,
        subscription_fee -> Int8,
        subscription_deadline -> Int8,
        active -> Bool,
        registered_at -> Int8,
    }
}

diesel::table! {
    watermarks (pipeline) {
        pipeline -> Text,
        epoch_hi_inclusive -> Int8,
        checkpoint_hi_inclusive -> Int8,
        tx_hi -> Int8,
        timestamp_ms_hi_inclusive -> Int8,
        reader_lo -> Int8,
        pruner_timestamp -> Timestamp,
        pruner_hi -> Int8,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    Agent,
    BuyOffer,
    ManualBuy,
    SellOffer,
    ShopPurchase,
    User,
    watermarks,
);
