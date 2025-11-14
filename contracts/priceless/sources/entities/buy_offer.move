module priceless::buy_offer {

    use sui::table::{Self, Table};
    use sui::balance::{Self, Balance};
    use std::string::{String};

    use ron::ron::RON;
    use priceless::sell_offer::{
        SellOffer,
        get_sell_offer_price,
        get_sell_offer_store_link,
    };

    public enum BuyOfferType has store, copy, drop {
        TimeBased,
        PriceBased,
    }

    public struct BuyOffer has key, store {
        id: UID,
        owner: address,
        product: String,
        price: Balance<RON>,
        sell_offers: Table<ID, SellOffer>,
        sell_offers_owner_ids: vector<ID>,
        offer_type: BuyOfferType,
        deadline: u64,
    }

    public(package) fun new_buy_offer(
        owner: address,
        product: String,
        price: Balance<RON>,
        offer_type: BuyOfferType,
        deadline: u64,
        ctx: &mut TxContext
    ): BuyOffer {
        BuyOffer {
            id: object::new(ctx),
            owner,
            product,
            price,
            sell_offers: table::new(ctx),
            sell_offers_owner_ids: vector::empty(),
            offer_type,
            deadline,
        }
    }

    public(package) fun is_offer_owner(buy_offer: &BuyOffer, address: address): bool {
        buy_offer.owner == address
    }

    public(package) fun get_buy_offer_deadline(buy_offer: &BuyOffer): u64 {
        buy_offer.deadline
    }

    public(package) fun get_buy_offer_price_balance(buy_offer: &mut BuyOffer): Balance<RON> {
        balance::withdraw_all(&mut buy_offer.price)
    }

    public(package) fun get_buy_offer_price(buy_offer: &BuyOffer): u64 {
        balance::value(&buy_offer.price)
    }

    public(package) fun get_buy_offer_type(buy_offer: &BuyOffer): BuyOfferType {
        buy_offer.offer_type
    }

    public(package) fun get_sell_offers_table(buy_offer: &BuyOffer): &Table<ID, SellOffer> {
        &buy_offer.sell_offers
    }

    public(package) fun get_price(buy_offer: &BuyOffer, sell_offer_id: ID): u64 {
        let sell_offer = table::borrow(&buy_offer.sell_offers, sell_offer_id);
        get_sell_offer_price(sell_offer)
    }

    public(package) fun get_store_link(buy_offer: &BuyOffer, sell_offer_id: ID): String {
        let sell_offer = table::borrow(&buy_offer.sell_offers, sell_offer_id);
        get_sell_offer_store_link(sell_offer)
    }

    public(package) fun get_sell_offers_table_mut(buy_offer: &mut BuyOffer): &mut Table<ID, SellOffer> {
        &mut buy_offer.sell_offers
    }

    public(package) fun get_sell_offers_owner_ids(buy_offer: &BuyOffer): &vector<ID> {
        &buy_offer.sell_offers_owner_ids
    }

    public(package) fun get_sell_offers_owner_ids_mut(buy_offer: &mut BuyOffer): &mut vector<ID> {
        &mut buy_offer.sell_offers_owner_ids
    }

    public(package) fun get_offer_type(buy_offer: &BuyOffer): BuyOfferType {
        buy_offer.offer_type
    }

    public(package) fun get_price_balance_mut(buy_offer: &mut BuyOffer): &mut Balance<RON> {
        &mut buy_offer.price
    }

    public(package) fun destroy_buy_offer(buy_offer: BuyOffer): (UID, Balance<RON>, Table<ID, SellOffer>, vector<ID>) {
        let BuyOffer { 
            id, 
            owner: _, 
            product: _, 
            price, 
            sell_offers, 
            sell_offers_owner_ids,
            offer_type: _,
            deadline: _,
        } = buy_offer;
        (id, price, sell_offers, sell_offers_owner_ids)
    }

    public(package) fun is_time_based(buy_offer: &BuyOffer): bool {
        match (buy_offer.offer_type) {
            BuyOfferType::TimeBased => true,
            BuyOfferType::PriceBased => false,
        }
    }

    public(package) fun get_owner(buy_offer: &BuyOffer): address {
        buy_offer.owner
    }

}