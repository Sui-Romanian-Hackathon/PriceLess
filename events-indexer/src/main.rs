use clap::Parser;
use events_indexer::handlers::EventPipeline;
use events_indexer::config::{Network, PackageConfig};
use events_indexer::MIGRATIONS;
use std::fs;
use std::path::PathBuf;
use sui_indexer_alt_framework::{
    cluster::{Args as ClusterArgs, IndexerCluster},
    pipeline::sequential::SequentialConfig,
    postgres::DbArgs,
    Result,
};
use url::Url;

#[derive(Parser, Debug)]
struct AppArgs {
    #[clap(
        long,
        env = "DATABASE_URL",
        default_value = "postgres://postgres:postgres@localhost:5432/events-indexer"
    )]
    database_url: Url,

    #[clap(long, env = "DATABASE_TLS_CA_CERT")]
    database_tls_ca_cert: Option<String>,

    #[clap(flatten)]
    cluster_args: ClusterArgs,

    #[clap(
        long,
        value_enum,
        default_value = "testnet",
        help = "Network to use for package configurations"
    )]
    network: Network,
}

#[tokio::main]
async fn main() -> Result<()> {
    let _ = dotenvy::dotenv();

    env_logger::init();

    let args = AppArgs::parse();

    // Get package configuration for selected network
    let package_config = PackageConfig::for_network(args.network.clone());

    let mut indexer = IndexerCluster::builder()
        .with_database_url(args.database_url.clone())
        .with_db_args({
            let mut db_args = DbArgs::default();
            if let Some(cert_content) = args.database_tls_ca_cert {
                if !cert_content.is_empty() {
                    let cert_dir = PathBuf::from("./certificates");
                    fs::create_dir_all(&cert_dir)?;

                    let cert_path = cert_dir.join("ca-cert.crt");
                    fs::write(&cert_path, cert_content)?;

                    db_args = DbArgs {
                        tls_verify_cert: true,
                        tls_ca_cert_path: Some(cert_path),
                        ..DbArgs::default()
                    };
                }
            }
            db_args
        })
        .with_args(args.cluster_args)
        .with_migrations(&MIGRATIONS)
        .build()
        .await?;

    indexer
        .sequential_pipeline(
            EventPipeline::new(package_config.agent_package_id),
            SequentialConfig::default(),
        )
        .await?;

    let _ = indexer.run().await?.await;
    Ok(())
}
