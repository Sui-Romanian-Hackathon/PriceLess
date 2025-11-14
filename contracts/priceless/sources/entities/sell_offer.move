module priceless::sell_offer {

    use std::string::{String};
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};

    public struct SellOffer has key, store {
        id: UID,
        agent: ID,
        store_link: String,
        price: u64,
        timestamp: u64,
    }

    public(package) fun new_sell_offer(
        agent: ID,
        store_link: String,
        price: u64,
        clock: &Clock,  
        ctx: &mut TxContext 
    ): SellOffer {
        SellOffer {
            id: object::new(ctx),
            agent,
            store_link,
            price,
            timestamp: clock::timestamp_ms(clock),
        }
    }

    public(package) fun drop_offers_data(
        mut sell_offers: Table<ID, SellOffer>, 
        mut sell_offers_orders_ids: vector<ID>
    ) {
        while (!sell_offers_orders_ids.is_empty()) { 
            let id = vector::pop_back(&mut sell_offers_orders_ids);
            let sell_offer = table::remove(&mut sell_offers, id);
            drop_sell_offer(sell_offer);
        };
        vector::destroy_empty(sell_offers_orders_ids);
        table::destroy_empty(sell_offers);
    }

    public(package) fun drop_sell_offer(sell_offer: SellOffer) {
        let SellOffer {
            id,
            store_link: _,
            price: _,
            agent: _,
            timestamp: _,
        } = sell_offer;
        object::delete(id);
    }

    public(package) fun update_sell_offer(
        sell_offer: &mut SellOffer,
        store_link: String,
        price: u64,
    ) {     
        sell_offer.store_link = store_link;
        sell_offer.price = price;
    }

    public(package) fun get_sell_offer_price(sell_offer: &SellOffer): u64 {
        sell_offer.price
    }

    public(package) fun get_sell_offer_store_link(sell_offer: &SellOffer): String {
        sell_offer.store_link
    }

}