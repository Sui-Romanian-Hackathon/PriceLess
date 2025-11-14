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

use crate::schema::Agent;

#[derive(Deserialize, Debug)]
pub struct AgentRegisteredEvent {
    pub agent_id: ObjectID,
    pub agent_address: SuiAddress,
    pub stake_amount: u64,
    pub timestamp: u64,
}

#[derive(Insertable, Debug, FieldCount)]
#[diesel(table_name = Agent)]
pub struct AgentValue {
    pub agent_id: String,
    pub agent_address: String,
    pub stake_amount: i64,
    pub rating: i64,
    pub buys: i64,
    pub active: bool,
    pub registered_at: i64,
}

pub struct AgentPipeline {
    package_id: String,
}

impl Processor for AgentPipeline {
    const NAME: &'static str = "agent";

    type Value = AgentValue;

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
                    if let Some(agent_value) = self.process_event(event, &tx_digest, registered_at)? {
                        values.push(agent_value);
                    }
                }
            }
        }

        if !values.is_empty() {
            info!(
                "Checkpoint {}: Found {} agent registration events",
                checkpoint_seq,
                values.len()
            );
        }

        Ok(values)
    }
}

#[async_trait]
impl Handler for AgentPipeline {
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

        let count = diesel::insert_into(Agent::table)
            .values(values)
            .on_conflict_do_nothing()
            .execute(conn)
            .await
            .map_err(Into::<Error>::into)?;

        Ok(count)
    }
}

impl AgentPipeline {
    pub fn new(package_id: String) -> Self {
        Self { package_id }
    }

    fn process_event(
        &self,
        event: &Event,
        tx_digest: &str,
        _registered_at: i64,
    ) -> Result<Option<AgentValue>> {
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
        // Adjust the event name to match your actual Move event
        if event_type.contains("::AgentRegistered") || event_type.ends_with("::agent_registered") {
            info!(
                "Agent registration event detected: {} in tx: {}",
                event_type, tx_digest
            );

            match bcs::from_bytes::<AgentRegisteredEvent>(&event.contents) {
                Ok(agent_event) => {
                    info!(
                        "Successfully parsed AgentRegistered - agent_id: {}, address: {}, stake_amount: {}, timestamp: {}, tx: {}",
                        agent_event.agent_id, agent_event.agent_address, agent_event.stake_amount, agent_event.timestamp, tx_digest
                    );

                    let stake_amount = i64::try_from(agent_event.stake_amount)
                        .context("Stake amount too large to convert to i64")?;
                    let registered_at = i64::try_from(agent_event.timestamp)
                        .context("Timestamp too large to convert to i64")?;

                    return Ok(Some(AgentValue {
                        agent_id: agent_event.agent_id.to_string(),
                        agent_address: agent_event.agent_address.to_string(),
                        stake_amount,
                        rating: 500,
                        buys: 0,
                        active: true,
                        registered_at,
                    }));
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

        Ok(None)
    }
}
