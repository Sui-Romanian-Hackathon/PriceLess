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

diesel::allow_tables_to_appear_in_same_query!(
    Agent,
    User,
);
