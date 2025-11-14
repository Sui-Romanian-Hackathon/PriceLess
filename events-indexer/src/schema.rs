// @generated automatically by Diesel CLI.

diesel::table! {
    Agent (id) {
        id -> Int4,
        agent_id -> Text,
        agent_address -> Text,
        stake_amount -> Int8,
        rating -> Int8,
        buys -> Int8,
        active -> Bool,
        registered_at -> Int8,
    }
}
