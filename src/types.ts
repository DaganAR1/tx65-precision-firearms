export type Category = 'Rifles' | 'Pistols' | 'Optics' | 'Accessories' | 'Ammunition';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image_url: string;
  images?: string[];
  stock_quantity: number;
  shipping_price?: number;
  is_best_seller?: boolean;
  specs: Record<string, string | string[]>;
  spec_prices?: Record<string, Record<string, number>>;
  spec_rules?: Array<{
    if_spec: string;
    if_value: string;
    then_not_spec: string;
    then_not_value: string;
  }>;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  total_amount: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  customer_email: string;
  customer_name: string;
  ffl_info?: any;
  transaction_id?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  product?: Product;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'customer';
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  author_id: string;
  category: string;
  published: boolean;
  created_at: string;
  author?: UserProfile;
}
