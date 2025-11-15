use clap::ValueEnum;
use std::env;

#[derive(Debug, Clone, ValueEnum)]
pub enum Network {
    Testnet,
}

#[derive(Debug, Clone)]
pub struct PackageConfig {
    pub agent_package_id: String,
}

impl PackageConfig {
    pub fn for_network(network: Network) -> Self {
        match network {
            Network::Testnet => Self::testnet(),
        }
    }

    fn testnet() -> Self {
        Self {
            agent_package_id: env::var("PACKAGE_ID")
                .expect("PACKAGE_ID must be set in environment"),
        }
    }
}

impl Default for Network {
    fn default() -> Self {
        Network::Testnet
    }
}