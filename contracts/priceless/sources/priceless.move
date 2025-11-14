 
module priceless::priceless  {
 
    use priceless::platform_registry::{
        PlatformRegistry,
        create_and_share_platform_registry,
        get_platform_registry_admin,
        get_platform_registry_version_mut,
    };
    use priceless::admin_cap::{
        AdminCap,
        create_and_transfer_admin_cap,
        get_admin_cap_id,
    };

    use priceless::constants::{
        get_ENotAdmin,
        get_VERSION,
        get_ENotUpgrade
    };

    fun init(ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);
        let admin_cap_id = create_and_transfer_admin_cap(admin, ctx);
        create_and_share_platform_registry(admin_cap_id, ctx);
    }

    entry fun migrate_platform_registry(staking_contract: &mut PlatformRegistry, admin_cap: &AdminCap) {
        assert!(get_platform_registry_admin(staking_contract) == get_admin_cap_id(admin_cap), get_ENotAdmin());
        let version = get_platform_registry_version_mut(staking_contract);
        assert!(*version < get_VERSION(), get_ENotUpgrade());
        *version = get_VERSION();
    }


}