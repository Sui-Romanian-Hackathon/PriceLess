import type { Agent, SellOffer, BuyOffer } from "../types/marketTypes";

export const MOCK_AGENTS: Agent[] = [
  { id: "a1", name: "Agent Alpha", rating: 4.8 },
  { id: "a2", name: "Agent Beta", rating: 4.2 },
  { id: "a3", name: "Agent Gamma", rating: 4.9 },
];

export const MOCK_SELL_OFFERS: SellOffer[] = [
  {
    id: "s1",
    agent: MOCK_AGENTS[0],
    price: 95.5,
    shop: "Emag",
    quantity: 5,
    productId: "1",
  },
  {
    id: "s2",
    agent: MOCK_AGENTS[1],
    price: 96.0,
    shop: "Altex",
    quantity: 10,
    productId: "1",
  },
  {
    id: "s3",
    agent: MOCK_AGENTS[2],
    price: 97.25,
    shop: "GadgetOnline",
    quantity: 3,
    productId: "1",
  },
  {
    id: "s4",
    agent: MOCK_AGENTS[0],
    price: 199.99,
    shop: "Emag",
    quantity: 1,
    productId: "2",
  },
];

// export const MOCK_BUY_OFFERS: BuyOffer[] = [
//     { id: 'b1', type: 'TargetPrice', targetPrice: 94.00, deadline: null, productId: '1' },
//     { id: 'b2', type: 'Deadline', targetPrice: null, deadline: '2026-01-01', productId: '1' },
//     { id: 'b3', type: 'TargetPrice', targetPrice: 190.00, deadline: null, productId: '2' },
// ];

// export const getOffersByProductId = (productId: string) => ({
//     sellOffers: MOCK_SELL_OFFERS.filter(offer => offer.productId === productId),
//     buyOffers: MOCK_BUY_OFFERS.filter(offer => offer.productId === productId),
// });

// src/mocks/marketMockData.ts (Exemplu)

// import type { BuyOffer, SellOffer } from "../types/marketTypes";

export const MOCK_BUY_OFFERS: BuyOffer[] = [
  // 🚨 ASIGURĂ-TE CĂ ID-URILE SUNT EXACT STRINGURILE NECESARE
  {
    id: "b1",
    type: "TargetPrice",
    targetPrice: 94.0,
    deadline: null,
    productId: "1",
  },
  {
    id: "b2",
    type: "Deadline",
    targetPrice: null,
    deadline: "2026-01-01",
    productId: "1",
  },
  {
    id: "b3",
    type: "TargetPrice",
    targetPrice: 190.0,
    deadline: null,
    productId: "2",
  },
  // Adaugă mock-uri Sell Offer aici dacă MOCK_SELL_OFFERS nu e separat
];

export const getOffersByProductId = (productId: string) => ({
  sellOffers: MOCK_SELL_OFFERS.filter(offer => offer.productId === productId),
  buyOffers: MOCK_BUY_OFFERS.filter(offer => offer.productId === productId),
  // Această funcție este folosită doar pentru Sell Offers statice în ProductsPage, dar e bine să fie completă
});

