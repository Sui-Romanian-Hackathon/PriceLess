use anyhow::{Context, Error};
use async_trait::async_trait;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use log::{error, info};
use serde::Deserialize;
use std::sync::Arc;
use sui_indexer_alt_framework::pipeline::sequential::Handler;
use sui_indexer_alt_framework::pipeline::Processor;
use sui_indexer_alt_framework::postgres::{store::Store, Db};
use sui_indexer_alt_framework::types::full_checkpoint_content::CheckpointData;
use sui_indexer_alt_framework::FieldCount;
use sui_indexer_alt_framework::Result;
use sui_types::base_types::{ObjectID, SuiAddress};
use sui_types::event::Event;

use crate::schema::{Agent, User, BuyOffer, SellOffer, ManualBuy, ShopPurchase};

// ============== EVENT DEFINITIONS ==============

#[derive(Deserialize, Debug)]
pub struct AgentRegisteredEvent {
    pub agent_id: ObjectID,
    pub agent_object_address: SuiAddress,
    pub agent_owner_address: SuiAddress,
    pub stake_amount: u64,
    pub timestamp: u64,
}

#[derive(Deserialize, Debug)]
pub struct UserRegisteredEvent {
    pub user_id: ObjectID,
    pub user_object_address: SuiAddress,
    pub user_owner_address: SuiAddress,
    pub subscription_fee: u64,
    pub subscription_deadline: u64,
    pub timestamp: u64,
}

#[derive(Deserialize, Debug)]
pub struct BuyOfferCreatedEvent {
    pub buy_offer_id: ObjectID,
    pub owner: SuiAddress,
    pub product: String,
    pub price: u64,
    pub offer_type_is_time_based: bool,
    pub deadline: u64,
    pub timestamp: u64,
}

#[derive(Deserialize, Debug)]
pub struct SellOfferMadeEvent {
    pub buy_offer_id: ObjectID,
    pub sell_offer_id: ObjectID,
    pub agent_id: ObjectID,
    pub agent_address: SuiAddress,
    pub store_link: String,
    pub price: u64,
    pub is_update: bool,
}

#[derive(Deserialize, Debug)]
pub struct ManualBuyEvent {
    pub buy_offer_id: ObjectID,
    pub buyer: SuiAddress,
    pub agent_id: ObjectID,
    pub sell_offer_id: ObjectID,
    pub store_link: String,
    pub product_price: u64,
    pub agent_fee: u64,
    pub total_paid: u64,
}

#[derive(Deserialize, Debug)]
pub struct BuyOfferDeletedEvent {
    pub buy_offer_id: ObjectID,
    pub owner: SuiAddress,
    pub remaining_balance: u64,
}

#[derive(Deserialize, Debug)]
pub struct BuyOfferModifiedEvent {
    pub buy_offer_id: ObjectID,
    pub owner: SuiAddress,
    pub old_price: u64,
    pub new_price: u64,
    pub price_reduction: u64,
}

#[derive(Deserialize, Debug)]
pub struct ShopPurchaseEvent {
    pub agent_id: ObjectID,
    pub store_link: String,
    pub product_price: u64,
    pub agent_fee: u64,
    pub platform_fee: u64,
}

// ============== DATABASE VALUE TYPES ==============

#[derive(Insertable, Debug, FieldCount)]
#[diesel(table_name = Agent)]
pub struct AgentValue {
    pub agent_id: String,
    pub agent_address: String,
    pub agent_owner_address: String,
    pub stake_amount: i64,
    pub rating: i64,
    pub buys: i64,
    pub active: bool,
    pub registered_at: i64,
}

#[derive(Insertable, Debug, FieldCount)]
#[diesel(table_name = User)]
pub struct UserValue {
    pub user_id: String,
    pub user_address: String,
    pub user_owner_address: String,
    pub subscription_fee: i64,
    pub subscription_deadline: i64,
    pub active: bool,
    pub registered_at: i64,
}

#[derive(Insertable, Debug, FieldCount)]
#[diesel(table_name = BuyOffer)]
pub struct BuyOfferValue {
    pub buy_offer_id: String,
    pub owner: String,
    pub product: String,
    pub price: i64,
    pub offer_type_is_time_based: bool,
    pub deadline: i64,
    pub created_at: i64,
}

#[derive(Insertable, Debug, FieldCount)]
#[diesel(table_name = SellOffer)]
pub struct SellOfferValue {
    pub buy_offer_id: String,
    pub sell_offer_id: String,
    pub agent_id: String,
    pub agent_address: String,
    pub store_link: String,
    pub price: i64,
    pub is_update: bool,
}

#[derive(Insertable, Debug, FieldCount)]
#[diesel(table_name = ManualBuy)]
pub struct ManualBuyValue {
    pub buy_offer_id: String,
    pub buyer: String,
    pub agent_id: String,
    pub sell_offer_id: String,
    pub store_link: String,
    pub product_price: i64,
    pub agent_fee: i64,
    pub total_paid: i64,
}

#[derive(Debug)]
pub struct BuyOfferModifiedData {
    pub buy_offer_id: String,
    pub new_price: i64,
}

#[derive(Insertable, Debug, FieldCount)]
#[diesel(table_name = ShopPurchase)]
pub struct ShopPurchaseValue {
    pub agent_id: String,
    pub store_link: String,
    pub product_price: i64,
    pub agent_fee: i64,
    pub platform_fee: i64,
}

// ============== UNIFIED EVENT ENUM ==============

pub enum IndexedEvent {
    Agent(AgentValue),
    User(UserValue),
    BuyOffer(BuyOfferValue),
    SellOffer(SellOfferValue),
    ManualBuy(ManualBuyValue),
    BuyOfferDeleted(String), // just the buy_offer_id
    BuyOfferModified(BuyOfferModifiedData),
    ShopPurchase(ShopPurchaseValue),
}

// ============== UNIFIED EVENT PIPELINE ==============

pub struct EventPipeline {
    package_id: String,
}

impl Processor for EventPipeline {
    const NAME: &'static str = "events";

    type Value = IndexedEvent;

    fn process(&self, checkpoint: &Arc<CheckpointData>) -> Result<Vec<Self::Value>> {
        let checkpoint_seq = checkpoint.checkpoint_summary.sequence_number;
        let timestamp_ms: u64 = checkpoint.checkpoint_summary.timestamp_ms.into();
        let registered_at = i64::try_from(timestamp_ms)
            .context("Timestamp too large to convert to i64")?;

        let mut values = Vec::new();

        for tx in &checkpoint.transactions {
            let tx_digest = tx.transaction.digest().to_string();

            if let Some(events) = &tx.events {
                for event in &events.data {
                    if let Some(indexed_event) = self.process_event(event, &tx_digest, registered_at)? {
                        values.push(indexed_event);
                    }
                }
            }
        }

        if !values.is_empty() {
            info!(
                "Checkpoint {}: Found {} events to index",
                checkpoint_seq,
                values.len()
            );
        }

        Ok(values)
    }
}

#[async_trait]
impl Handler for EventPipeline {
    type Store = Db;
    type Batch = Vec<Self::Value>;

    fn batch(batch: &mut Self::Batch, values: Vec<Self::Value>) {
        batch.extend(values);
    }

    async fn commit<'a>(
        values: &Vec<Self::Value>,
        conn: &mut <Self::Store as Store>::Connection<'a>,
    ) -> Result<usize> {
        if values.is_empty() {
            return Ok(0);
        }

        let mut total_count = 0;

        for event in values {
            match event {
                IndexedEvent::Agent(agent_value) => {
                    let count = diesel::insert_into(Agent::table)
                        .values(agent_value)
                        .on_conflict_do_nothing()
                        .execute(conn)
                        .await
                        .map_err(Into::<Error>::into)?;
                    total_count += count;
                }
                IndexedEvent::User(user_value) => {
                    let count = diesel::insert_into(User::table)
                        .values(user_value)
                        .on_conflict_do_nothing()
                        .execute(conn)
                        .await
                        .map_err(Into::<Error>::into)?;
                    total_count += count;
                }
                IndexedEvent::BuyOffer(buy_offer_value) => {
                    let count = diesel::insert_into(BuyOffer::table)
                        .values(buy_offer_value)
                        .on_conflict_do_nothing()
                        .execute(conn)
                        .await
                        .map_err(Into::<Error>::into)?;
                    total_count += count;
                }
                IndexedEvent::SellOffer(sell_offer_value) => {
                    let count = diesel::insert_into(SellOffer::table)
                        .values(sell_offer_value)
                        .on_conflict_do_nothing()
                        .execute(conn)
                        .await
                        .map_err(Into::<Error>::into)?;
                    total_count += count;
                }
                IndexedEvent::ManualBuy(manual_buy_value) => {
                    let count = diesel::insert_into(ManualBuy::table)
                        .values(manual_buy_value)
                        .on_conflict_do_nothing()
                        .execute(conn)
                        .await
                        .map_err(Into::<Error>::into)?;
                    total_count += count;
                }
                IndexedEvent::BuyOfferDeleted(buy_offer_id) => {
                    // Delete from SellOffer table first (foreign key constraint)
                    diesel::delete(SellOffer::table.filter(SellOffer::buy_offer_id.eq(buy_offer_id.clone())))
                        .execute(conn)
                        .await
                        .map_err(Into::<Error>::into)?;

                    // Delete from BuyOffer table
                    let count = diesel::delete(BuyOffer::table.filter(BuyOffer::buy_offer_id.eq(buy_offer_id)))
                        .execute(conn)
                        .await
                        .map_err(Into::<Error>::into)?;
                    total_count += count;
                }
                IndexedEvent::BuyOfferModified(modified_data) => {
                    // Update price in BuyOffer table
                    let count = diesel::update(BuyOffer::table.filter(BuyOffer::buy_offer_id.eq(modified_data.buy_offer_id.clone())))
                        .set(BuyOffer::price.eq(modified_data.new_price))
                        .execute(conn)
                        .await
                        .map_err(Into::<Error>::into)?;
                    total_count += count;
                }
                IndexedEvent::ShopPurchase(shop_purchase_value) => {
                    let count = diesel::insert_into(ShopPurchase::table)
                        .values(shop_purchase_value)
                        .on_conflict_do_nothing()
                        .execute(conn)
                        .await
                        .map_err(Into::<Error>::into)?;
                    total_count += count;
                }
            }
        }

        Ok(total_count)
    }
}

impl EventPipeline {
    pub fn new(package_id: String) -> Self {
        Self { package_id }
    }

    fn process_event(
        &self,
        event: &Event,
        tx_digest: &str,
        _registered_at: i64,
    ) -> Result<Option<IndexedEvent>> {
        let event_type = event.type_.to_string();

        // Extract package ID from event type
        let event_package_id = if let Some(module_start) = event_type.find("::") {
            &event_type[..module_start]
        } else {
            return Ok(None);
        };

        // Normalize package IDs by removing leading zeros after 0x
        let normalize_package_id = |id: &str| -> String {
            if let Some(hex_part) = id.strip_prefix("0x") {
                format!("0x{}", hex_part.trim_start_matches('0'))
            } else {
                id.to_string()
            }
        };

        let normalized_event_package = normalize_package_id(event_package_id);
        let normalized_expected_package = normalize_package_id(&self.package_id);

        if normalized_event_package != normalized_expected_package {
            return Ok(None);
        }

        // Check if this is an AgentRegistered event
        if event_type.contains("::AgentRegistered") || event_type.ends_with("::agent_registered") {
            info!(
                "Agent registration event detected: {} in tx: {}",
                event_type, tx_digest
            );

            match bcs::from_bytes::<AgentRegisteredEvent>(&event.contents) {
                Ok(agent_event) => {
                    info!(
                        "Successfully parsed AgentRegistered - agent_id: {}, object_address: {}, owner_address: {}, stake_amount: {}, timestamp: {}, tx: {}",
                        agent_event.agent_id, agent_event.agent_object_address, agent_event.agent_owner_address, agent_event.stake_amount, agent_event.timestamp, tx_digest
                    );

                    let stake_amount = i64::try_from(agent_event.stake_amount)
                        .context("Stake amount too large to convert to i64")?;
                    let registered_at = i64::try_from(agent_event.timestamp)
                        .context("Timestamp too large to convert to i64")?;

                    return Ok(Some(IndexedEvent::Agent(AgentValue {
                        agent_id: agent_event.agent_id.to_string(),
                        agent_address: agent_event.agent_object_address.to_string(),
                        agent_owner_address: agent_event.agent_owner_address.to_string(),
                        stake_amount,
                        rating: 500,
                        buys: 0,
                        active: true,
                        registered_at,
                    })));
                }
                Err(e) => {
                    error!(
                        "Failed to parse AgentRegistered event in tx {}: {}",
                        tx_digest, e
                    );
                    return Err(e.into());
                }
            }
        }

        // Check if this is a UserRegistered event
        if event_type.contains("::UserRegistered") || event_type.ends_with("::user_registered") {
            info!(
                "User registration event detected: {} in tx: {}",
                event_type, tx_digest
            );

            match bcs::from_bytes::<UserRegisteredEvent>(&event.contents) {
                Ok(user_event) => {
                    info!(
                        "Successfully parsed UserRegistered - user_id: {}, object_address: {}, owner_address: {}, subscription_fee: {}, subscription_deadline: {}, timestamp: {}, tx: {}",
                        user_event.user_id, user_event.user_object_address, user_event.user_owner_address, user_event.subscription_fee, user_event.subscription_deadline, user_event.timestamp, tx_digest
                    );

                    let subscription_fee = i64::try_from(user_event.subscription_fee)
                        .context("Subscription fee too large to convert to i64")?;
                    let subscription_deadline = i64::try_from(user_event.subscription_deadline)
                        .context("Subscription deadline too large to convert to i64")?;
                    let registered_at = i64::try_from(user_event.timestamp)
                        .context("Timestamp too large to convert to i64")?;

                    return Ok(Some(IndexedEvent::User(UserValue {
                        user_id: user_event.user_id.to_string(),
                        user_address: user_event.user_object_address.to_string(),
                        user_owner_address: user_event.user_owner_address.to_string(),
                        subscription_fee,
                        subscription_deadline,
                        active: true,
                        registered_at,
                    })));
                }
                Err(e) => {
                    error!(
                        "Failed to parse UserRegistered event in tx {}: {}",
                        tx_digest, e
                    );
                    return Err(e.into());
                }
            }
        }

        // Check if this is a BuyOfferCreated event
        if event_type.contains("::BuyOfferCreated") || event_type.ends_with("::buy_offer_created") {
            info!(
                "Buy offer created event detected: {} in tx: {}",
                event_type, tx_digest
            );

            match bcs::from_bytes::<BuyOfferCreatedEvent>(&event.contents) {
                Ok(buy_offer_event) => {
                    info!(
                        "Successfully parsed BuyOfferCreated - buy_offer_id: {}, owner: {}, product: {}, price: {}, is_time_based: {}, deadline: {}, timestamp: {}, tx: {}",
                        buy_offer_event.buy_offer_id, buy_offer_event.owner, buy_offer_event.product, buy_offer_event.price, buy_offer_event.offer_type_is_time_based, buy_offer_event.deadline, buy_offer_event.timestamp, tx_digest
                    );

                    let price = i64::try_from(buy_offer_event.price)
                        .context("Price too large to convert to i64")?;
                    let deadline = i64::try_from(buy_offer_event.deadline)
                        .context("Deadline too large to convert to i64")?;
                    let created_at = i64::try_from(buy_offer_event.timestamp)
                        .context("Timestamp too large to convert to i64")?;

                    return Ok(Some(IndexedEvent::BuyOffer(BuyOfferValue {
                        buy_offer_id: buy_offer_event.buy_offer_id.to_string(),
                        owner: buy_offer_event.owner.to_string(),
                        product: buy_offer_event.product,
                        price,
                        offer_type_is_time_based: buy_offer_event.offer_type_is_time_based,
                        deadline,
                        created_at,
                    })));
                }
                Err(e) => {
                    error!(
                        "Failed to parse BuyOfferCreated event in tx {}: {}",
                        tx_digest, e
                    );
                    return Err(e.into());
                }
            }
        }

        // Check if this is a SellOfferMade event
        if event_type.contains("::SellOfferMade") || event_type.ends_with("::sell_offer_made") {
            info!(
                "Sell offer made event detected: {} in tx: {}",
                event_type, tx_digest
            );

            match bcs::from_bytes::<SellOfferMadeEvent>(&event.contents) {
                Ok(sell_offer_event) => {
                    info!(
                        "Successfully parsed SellOfferMade - buy_offer_id: {}, sell_offer_id: {}, agent_id: {}, agent_address: {}, store_link: {}, price: {}, is_update: {}, tx: {}",
                        sell_offer_event.buy_offer_id, sell_offer_event.sell_offer_id, sell_offer_event.agent_id, sell_offer_event.agent_address, sell_offer_event.store_link, sell_offer_event.price, sell_offer_event.is_update, tx_digest
                    );

                    let price = i64::try_from(sell_offer_event.price)
                        .context("Price too large to convert to i64")?;

                    return Ok(Some(IndexedEvent::SellOffer(SellOfferValue {
                        buy_offer_id: sell_offer_event.buy_offer_id.to_string(),
                        sell_offer_id: sell_offer_event.sell_offer_id.to_string(),
                        agent_id: sell_offer_event.agent_id.to_string(),
                        agent_address: sell_offer_event.agent_address.to_string(),
                        store_link: sell_offer_event.store_link,
                        price,
                        is_update: sell_offer_event.is_update,
                    })));
                }
                Err(e) => {
                    error!(
                        "Failed to parse SellOfferMade event in tx {}: {}",
                        tx_digest, e
                    );
                    return Err(e.into());
                }
            }
        }

        // Check if this is a ManualBuy event
        if event_type.contains("::ManualBuy") || event_type.ends_with("::manual_buy") {
            info!(
                "Manual buy event detected: {} in tx: {}",
                event_type, tx_digest
            );

            match bcs::from_bytes::<ManualBuyEvent>(&event.contents) {
                Ok(manual_buy_event) => {
                    info!(
                        "Successfully parsed ManualBuy - buy_offer_id: {}, buyer: {}, agent_id: {}, sell_offer_id: {}, store_link: {}, product_price: {}, agent_fee: {}, total_paid: {}, tx: {}",
                        manual_buy_event.buy_offer_id, manual_buy_event.buyer, manual_buy_event.agent_id, manual_buy_event.sell_offer_id, manual_buy_event.store_link, manual_buy_event.product_price, manual_buy_event.agent_fee, manual_buy_event.total_paid, tx_digest
                    );

                    let product_price = i64::try_from(manual_buy_event.product_price)
                        .context("Product price too large to convert to i64")?;
                    let agent_fee = i64::try_from(manual_buy_event.agent_fee)
                        .context("Agent fee too large to convert to i64")?;
                    let total_paid = i64::try_from(manual_buy_event.total_paid)
                        .context("Total paid too large to convert to i64")?;

                    return Ok(Some(IndexedEvent::ManualBuy(ManualBuyValue {
                        buy_offer_id: manual_buy_event.buy_offer_id.to_string(),
                        buyer: manual_buy_event.buyer.to_string(),
                        agent_id: manual_buy_event.agent_id.to_string(),
                        sell_offer_id: manual_buy_event.sell_offer_id.to_string(),
                        store_link: manual_buy_event.store_link,
                        product_price,
                        agent_fee,
                        total_paid,
                    })));
                }
                Err(e) => {
                    error!(
                        "Failed to parse ManualBuy event in tx {}: {}",
                        tx_digest, e
                    );
                    return Err(e.into());
                }
            }
        }

        // Check if this is a BuyOfferDeleted event
        if event_type.contains("::BuyOfferDeleted") || event_type.ends_with("::buy_offer_deleted") {
            info!(
                "Buy offer deleted event detected: {} in tx: {}",
                event_type, tx_digest
            );

            match bcs::from_bytes::<BuyOfferDeletedEvent>(&event.contents) {
                Ok(buy_offer_deleted_event) => {
                    info!(
                        "Successfully parsed BuyOfferDeleted - buy_offer_id: {}, owner: {}, remaining_balance: {}, tx: {}",
                        buy_offer_deleted_event.buy_offer_id, buy_offer_deleted_event.owner, buy_offer_deleted_event.remaining_balance, tx_digest
                    );

                    return Ok(Some(IndexedEvent::BuyOfferDeleted(buy_offer_deleted_event.buy_offer_id.to_string())));
                }
                Err(e) => {
                    error!(
                        "Failed to parse BuyOfferDeleted event in tx {}: {}",
                        tx_digest, e
                    );
                    return Err(e.into());
                }
            }
        }

        // Check if this is a BuyOfferModified event
        if event_type.contains("::BuyOfferModified") || event_type.ends_with("::buy_offer_modified") {
            info!(
                "Buy offer modified event detected: {} in tx: {}",
                event_type, tx_digest
            );

            match bcs::from_bytes::<BuyOfferModifiedEvent>(&event.contents) {
                Ok(buy_offer_modified_event) => {
                    info!(
                        "Successfully parsed BuyOfferModified - buy_offer_id: {}, owner: {}, old_price: {}, new_price: {}, price_reduction: {}, tx: {}",
                        buy_offer_modified_event.buy_offer_id, buy_offer_modified_event.owner, buy_offer_modified_event.old_price, buy_offer_modified_event.new_price, buy_offer_modified_event.price_reduction, tx_digest
                    );

                    let new_price = i64::try_from(buy_offer_modified_event.new_price)
                        .context("New price too large to convert to i64")?;

                    return Ok(Some(IndexedEvent::BuyOfferModified(BuyOfferModifiedData {
                        buy_offer_id: buy_offer_modified_event.buy_offer_id.to_string(),
                        new_price,
                    })));
                }
                Err(e) => {
                    error!(
                        "Failed to parse BuyOfferModified event in tx {}: {}",
                        tx_digest, e
                    );
                    return Err(e.into());
                }
            }
        }

        // Check if this is a ShopPurchase event
        if event_type.contains("::ShopPurchase") || event_type.ends_with("::shop_purchase") {
            info!(
                "Shop purchase event detected: {} in tx: {}",
                event_type, tx_digest
            );

            match bcs::from_bytes::<ShopPurchaseEvent>(&event.contents) {
                Ok(shop_purchase_event) => {
                    info!(
                        "Successfully parsed ShopPurchase - agent_id: {}, store_link: {}, product_price: {}, agent_fee: {}, platform_fee: {}, tx: {}",
                        shop_purchase_event.agent_id, shop_purchase_event.store_link, shop_purchase_event.product_price, shop_purchase_event.agent_fee, shop_purchase_event.platform_fee, tx_digest
                    );

                    let product_price = i64::try_from(shop_purchase_event.product_price)
                        .context("Product price too large to convert to i64")?;
                    let agent_fee = i64::try_from(shop_purchase_event.agent_fee)
                        .context("Agent fee too large to convert to i64")?;
                    let platform_fee = i64::try_from(shop_purchase_event.platform_fee)
                        .context("Platform fee too large to convert to i64")?;

                    return Ok(Some(IndexedEvent::ShopPurchase(ShopPurchaseValue {
                        agent_id: shop_purchase_event.agent_id.to_string(),
                        store_link: shop_purchase_event.store_link,
                        product_price,
                        agent_fee,
                        platform_fee,
                    })));
                }
                Err(e) => {
                    error!(
                        "Failed to parse ShopPurchase event in tx {}: {}",
                        tx_digest, e
                    );
                    return Err(e.into());
                }
            }
        }

        Ok(None)
    }
}
