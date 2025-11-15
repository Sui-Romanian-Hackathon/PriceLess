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

use crate::schema::{Agent, User};

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

// ============== UNIFIED EVENT ENUM ==============

pub enum IndexedEvent {
    Agent(AgentValue),
    User(UserValue),
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

        Ok(None)
    }
}
