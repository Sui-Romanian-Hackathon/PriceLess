 
module priceless::priceless  {
 
    use priceless::admin_cap::{
        create_and_transfer_admin_cap,
    };

    fun init( ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);
        create_and_transfer_admin_cap(admin, ctx);
    }


}