
import { AppSettings, Hotel, MenuItem, Coupon, Banner } from './types';

export const INITIAL_SETTINGS: AppSettings = {
  appName: "Foodie We",
  logoUrl: "https://picsum.photos/200/200?random=1",
  deliveryFee: 40,
  platformFee: 5,
  surcharge: 0,
  aboutUs: "Foodie We is your premium neighborhood food delivery companion. We connect you with the best local hotels to bring delicious flavors right to your doorstep.",
  deliveryTimes: ["30-45 mins", "45-60 mins", "ASAP"],
  rewardInfo: "Earn 10 points for every ₹100 spent! Redeem points for exclusive discounts on your future orders."
};

export const INITIAL_HOTELS: Hotel[] = [
  {
    id: 'h1',
    name: "Spicy Treats",
    description: "Best North Indian and Mughlai dishes in town.",
    image: "https://picsum.photos/400/300?random=11",
    isOpen: true
  },
  {
    id: 'h2',
    name: "Burger Hub",
    description: "Juicy burgers and crispy fries.",
    image: "https://picsum.photos/400/300?random=12",
    isOpen: true
  }
];

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    hotelId: 'h1',
    name: "Paneer Butter Masala",
    price: 220,
    image: "https://picsum.photos/200/200?random=21",
    description: "Creamy cottage cheese cubes in rich tomato gravy.",
    isAvailable: true
  },
  {
    id: 'm2',
    hotelId: 'h1',
    name: "Garlic Naan",
    price: 45,
    image: "https://picsum.photos/200/200?random=22",
    description: "Soft leavened bread topped with garlic.",
    isAvailable: true
  },
  {
    id: 'm3',
    hotelId: 'h2',
    name: "Classic Cheese Burger",
    price: 150,
    image: "https://picsum.photos/200/200?random=23",
    description: "Grilled patty with melted cheese and fresh veggies.",
    isAvailable: true
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  { id: 'c1', code: 'WELCOME50', discount: 50, description: 'Flat ₹50 off on your first order!' },
  { id: 'c2', code: 'FOODIE20', discount: 20, description: 'Extra ₹20 off for all users.' }
];

export const INITIAL_BANNERS: Banner[] = [
  { id: 'b1', imageUrl: "https://picsum.photos/800/400?random=31", title: "Weekend Specials" },
  { id: 'b2', imageUrl: "https://picsum.photos/800/400?random=32", title: "Free Delivery over ₹500" }
];
