/**
 * Two layers live here:
 *
 *  - `Api*` types mirror exactly what the FastAPI backend returns (camelised by
 *    the api client). They change only when the backend changes.
 *  - The plain types below are what the UI renders. `src/lib/mappers.ts` is the
 *    only place that converts between the two.
 */

/* ------------------------------------------------------------------ */
/* Backend contracts                                                    */
/* ------------------------------------------------------------------ */

/** Genders the backend stores on products and categories. */
export type ApiGender = 'men' | 'women' | 'kids' | 'unisex';

export interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  referralCode?: string | null;
  walletBalance: number;
  isVerified: boolean;
}

export interface ApiVariant {
  id: string;
  size?: string | null;
  color?: string | null;
  stock: number;
  price?: number | null;
}

export interface ApiProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
}

/** Shape of `GET /products` rows. */
export interface ApiProductListItem {
  id: string;
  title: string;
  sku: string;
  brand?: string | null;
  description?: string | null;
  /** What the customer pays (the discounted price when there is one). */
  price: number;
  /** The MRP it is struck through against. */
  originalPrice: number;
  discountPercentage: number;
  rating: number;
  reviewCount: number;
  stock: number;
  imageUrl?: string | null;
  categoryId: string;
  categoryName?: string | null;
  gender?: ApiGender | null;
  sizes: string[];
  colors: string[];
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  isReplaceable: boolean;
  isReturnable: boolean;
}

/** `GET /products/{id}` — the list row plus variants, all images and GST rates. */
export interface ApiProduct extends ApiProductListItem {
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  variants: ApiVariant[];
  images: ApiProductImage[];
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  gender: ApiGender;
  isActive: boolean;
  createdAt: string;
}

export interface ApiBanner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  linkText?: string | null;
  section: string;
  sortOrder: number;
}

export interface ApiHomeContent {
  banners: ApiBanner[];
  featuredProducts: { id: string; title: string; price: number; originalPrice: number; imageUrl: string | null }[];
  newArrivals: { id: string; title: string; price: number; originalPrice: number; imageUrl: string | null }[];
}

export interface ApiCartItem {
  id: string;
  productId: string;
  productTitle?: string | null;
  variantId?: string | null;
  /** Pre-formatted by the backend, e.g. "Size: M, Color: red". */
  variantInfo?: string | null;
  quantity: number;
  price?: number | null;
  imageUrl?: string | null;
}

export interface ApiCart {
  items: ApiCartItem[];
  total: number;
}

export interface ApiWishlistItem {
  id: string;
  productId: string;
  productTitle?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  createdAt: string;
}

export interface ApiAddress {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  type: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ApiOrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string | null;
  quantity: number;
  price: number;
}

export interface ApiOrder {
  id: string;
  userId: string;
  orderNumber: string;
  subtotal: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  discountAmount: number;
  deliveryFee: number;
  finalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  shippingAddress?: string | null;
  returnReason?: string | null;
  returnStatus?: string | null;
  returnEvidence?: string[] | null;
  returnAdminNote?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  estimatedDelivery?: string | null;
  // ShipRocket courier tracking (populated once the order is dispatched).
  awbCode?: string | null;
  courierName?: string | null;
  shipmentStatus?: string | null;
  trackingUrl?: string | null;
  createdAt: string;
  items: ApiOrderItem[];
}

export interface ApiDeliverySettings {
  enabled: boolean;
  fee: number;
  freeAbove: number | null;
}

export interface ApiPaymentMethod {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  iconUrl?: string | null;
  isActive: boolean;
}

/** `POST /payments/create` — everything needed to open the gateway checkout. */
export interface ApiPaymentIntent {
  id: string;
  orderId: string;
  amount: number;
  gateway: string;
  paymentMethod?: string | null;
  paymentStatus: string;
  razorpayOrderId?: string | null;
  razorpayKeyId?: string | null;
  currency?: string | null;
  amountPaise?: number | null;
  /** True for Cash on Delivery — no gateway order is opened, nothing to verify. */
  cod?: boolean | null;
}

export interface ApiReview {
  id: string;
  productId: string;
  userName?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface ApiWalletTransaction {
  id: string;
  transactionType: string;
  amount: number;
  source?: string | null;
  referenceId?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface ApiReferralStats {
  referralCode?: string | null;
  totalEarnings: number;
  pendingEarnings: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalClicks: number;
  walletBalance: number;
  commissionPercentage: number;
  programmeEnabled: boolean;
  shareBaseUrl: string;
}

export interface ApiReferralHistoryItem {
  id: string;
  referredUserName?: string | null;
  referredUserEmail?: string | null;
  orderId: string;
  productId?: string | null;
  productName?: string | null;
  productImage?: string | null;
  purchaseAmount: number;
  rewardAmount: number;
  rewardPercentage: number;
  status: string;
  createdAt: string;
  approvedAt?: string | null;
}

export interface ApiBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  author?: string | null;
  createdAt: string;
}

export interface ApiAuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
}

/* ------------------------------------------------------------------ */
/* UI domain model                                                      */
/* ------------------------------------------------------------------ */

export type GenderCategory = 'ALL' | 'MEN' | 'WOMEN' | 'KIDS';

export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  /** Variant-level override; falls back to the product price when absent. */
  price: number | null;
}

export interface Product {
  id: string;
  title: string;
  sku: string;
  brand: string;
  description: string;
  /** Payable price. */
  price: number;
  /** Struck-through MRP. */
  mrp: number;
  discountPercentage: number;
  categoryId: string;
  category: string;
  gender: GenderCategory;
  images: string[];
  sizes: string[];
  colors: string[];
  variants: ProductVariant[];
  stock: number;
  inStock: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isReturnable: boolean;
  isReplaceable: boolean;
  rating: number;
  reviewCount: number;
  /** Only present on the detail response; the list endpoint omits them. */
  cgstPercentage?: number;
  sgstPercentage?: number;
  igstPercentage?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  gender: GenderCategory;
  parentId: string | null;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

/**
 * A line in the bag. `id` is the server cart-item id when signed in and a
 * locally generated key for a guest cart, which is what makes the two
 * interchangeable to the UI.
 */
export interface CartItem {
  id: string;
  productId: string;
  title: string;
  image: string | null;
  price: number;
  quantity: number;
  variantId: string | null;
  selectedSize: string | null;
  selectedColor: string | null;
}

export interface WishlistItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  image: string | null;
}

export type AddressType = 'Home' | 'Work' | 'Other';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  type: AddressType;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, 'id'>;

/** Backend statuses, kept verbatim so nothing is lost in translation. */
export type OrderStatus = 'placed' | 'processing' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled';

export type ReturnStatus = 'requested' | 'replace_requested' | 'approved' | 'rejected' | 'picked_up' | 'completed';

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  price: number;
  variantId: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  shippingAddress: string;
  returnReason: string | null;
  returnStatus: ReturnStatus | null;
  returnEvidence: string[];
  returnAdminNote: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
  // ShipRocket courier tracking (only present once the order is dispatched).
  awbCode: string | null;
  courierName: string | null;
  shipmentStatus: string | null;
  trackingUrl: string | null;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  referralCode: string;
  walletBalance: number;
  isVerified: boolean;
  role: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string | null;
  author: string;
  createdAt: string;
}

export interface DeliverySettings {
  fee: number;
  /** Subtotal at or above which delivery is free; `null` means never free. */
  freeThreshold: number | null;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
}

/** GST split for a subtotal, mirroring the backend's place-of-supply rules. */
export interface GstBreakup {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  intraState: boolean;
}
