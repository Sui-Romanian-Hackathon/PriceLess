// mockProducts.ts

import type { Product } from "../types/index";

export const mockProducts: Product[] = [
  {
    id: '1',
    name: "Gaming Laptop Pro X",
    bestPrice: 95.50, 
    bestShop: "Altex",
    description:
      "The best performing gaming laptop with a 20% discount off the average price.",
    details: [
      "Latest generation i7 Processor",
      "RTX 4070 Graphics Card",
      "16GB RAM",
      "Offer valid until 15.12.2025",
    ],
  },
  {
    id: '2',
    name: "Premium Wireless Headphones",
    bestPrice: 199.99,
    bestShop: "eMAG",
    description: "Active noise cancellation and 30-hour battery life.",
    details: [
      "Hi-Fi Sound",
      "Pro Noise Cancellation",
      "Available in Black only",
    ],
  },
  {
    id: '3',
    name: "55 Inch OLED TV",
    bestPrice: 3899.00,
    bestShop: "Media Galaxy",
    description:
      "Immersive visual experience with OLED technology and 120Hz refresh rate.",
    details: [
      "4K UHD Resolution",
      "WebOS Smart TV",
      "5-year Extended Warranty",
    ],
  },
  {
    id: '4',
    name: "Automatic Deluxe Espresso Machine",
    bestPrice: 1250.00,
    bestShop: "Kaufland",
    description: "Prepares 10 types of beverages with a single touch.",
    details: [
      "Integrated ceramic grinder",
      "Auto-cleaning function",
      "15 Bar Pressure",
    ],
  },
];