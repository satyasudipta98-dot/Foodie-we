
export interface User {
  id: string;
  name: string;
  mobile: string;
  password?: string;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  image: string;
  isOpen: boolean;
}

export interface MenuItem {
  id: string;
  hotelId: string;
  name: string;
  price: number;
  image: string;
  description: string;
  isAvailable: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  hotelId: string;
  hotelName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  surcharge: number;
  discount: number;
  total: number;
  address: string;
  deliveryTime: string;
  paymentMethod: 'Online' | 'COD';
  transactionId?: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Delivered';
  timestamp: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  description: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
}

export interface AppSettings {
  appName: string;
  logoUrl: string;
  deliveryFee: number;
  platformFee: number;
  surcharge: number;
  aboutUs: string;
  deliveryTimes: string[];
  rewardInfo: string;
}

export type View = 'LOGIN' | 'SIGNUP' | 'HOME' | 'HOTEL_DETAILS' | 'CART' | 'CHECKOUT' | 'ORDER_CONFIRMATION' | 'ORDER_HISTORY' | 'COUPONS' | 'REWARDS' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';
