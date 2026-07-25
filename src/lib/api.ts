/**
 * Thin, typed bindings for every backend endpoint the storefront uses.
 *
 * Everything here returns raw `Api*` DTOs — converting them into the UI domain
 * model is `mappers.ts`'s job, so a backend field rename only ever has to be
 * chased through these two files.
 */
import { apiDelete, apiGet, apiGetBlob, apiPost, apiPut, clearTokens, setTokens } from './apiClient';
import type {
  ApiAddress,
  ApiAuthTokens,
  ApiBlogPost,
  ApiCart,
  ApiCategory,
  ApiDeliverySettings,
  ApiHomeContent,
  ApiOrder,
  ApiPaymentIntent,
  ApiPaymentMethod,
  ApiProduct,
  ApiProductListItem,
  ApiReferralHistoryItem,
  ApiReferralStats,
  ApiReview,
  ApiUser,
  ApiWalletTransaction,
  ApiWishlistItem,
} from '../types';

/* ------------------------------------------------------------------ */
/* Auth                                                                 */
/* ------------------------------------------------------------------ */

export interface LoginResult extends ApiAuthTokens {
  user?: ApiUser;
}

export const authApi = {
  /** Creates the account and emails an OTP; the user is not signed in yet. */
  register(data: { fullName: string; email: string; phone: string; password: string; referralCode?: string }) {
    return apiPost<{ message?: string }>('/api/v1/auth/register', {
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      ...(data.referralCode ? { referral_code: data.referralCode } : {}),
    });
  },

  async login(email: string, password: string): Promise<LoginResult> {
    const result = await apiPost<LoginResult>('/api/v1/auth/login', { email, password });
    setTokens(result.accessToken, result.refreshToken);
    return result;
  },

  /** Confirms the signup OTP. Returns tokens when the backend signs the user straight in. */
  async verifyOtp(email: string, otp: string): Promise<Partial<ApiAuthTokens> & { message?: string }> {
    const result = await apiPost<Partial<ApiAuthTokens> & { message?: string }>('/api/v1/auth/verify-otp', { email, otp });
    if (result.accessToken && result.refreshToken) setTokens(result.accessToken, result.refreshToken);
    return result;
  },

  resendOtp(email: string) {
    return apiPost<{ message?: string }>('/api/v1/auth/resend-otp', { email });
  },

  sendLoginOtp(email: string) {
    return apiPost<{ message?: string }>('/api/v1/auth/send-login-otp', { email });
  },

  async loginWithOtp(email: string, otp: string): Promise<LoginResult> {
    const result = await apiPost<LoginResult>('/api/v1/auth/login-with-otp', { email, otp });
    setTokens(result.accessToken, result.refreshToken);
    return result;
  },

  forgotPassword(email: string) {
    return apiPost<{ message?: string }>('/api/v1/auth/forgot-password', { email });
  },

  resetPassword(email: string, otp: string, newPassword: string) {
    return apiPost<{ message?: string }>('/api/v1/auth/reset-password', { email, otp, new_password: newPassword });
  },

  changePassword(currentPassword: string, newPassword: string) {
    return apiPost<{ message?: string }>('/api/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  me() {
    return apiGet<ApiUser>('/api/v1/auth/me');
  },

  updateProfile(data: { fullName?: string; email?: string; phone?: string; avatarUrl?: string }) {
    return apiPut<ApiUser>('/api/v1/auth/me', {
      ...(data.fullName !== undefined ? { full_name: data.fullName } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.avatarUrl !== undefined ? { avatar_url: data.avatarUrl } : {}),
    });
  },

  logout() {
    clearTokens();
  },
};

/* ------------------------------------------------------------------ */
/* Catalogue                                                            */
/* ------------------------------------------------------------------ */

export interface ProductQuery {
  /** Category **id** (a UUID) — the backend filters on `category_id`, not the name. */
  category?: string;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  featured?: boolean;
  /** Lowercase backend gender; omit for "all". */
  gender?: string;
}

export const catalogApi = {
  listProducts(params: ProductQuery = {}) {
    const query: Record<string, string> = {};
    if (params.category) query.category = params.category;
    if (params.search) query.search = params.search;
    if (params.sort) query.sort = params.sort;
    if (params.featured !== undefined) query.featured = String(params.featured);
    if (params.gender) query.gender = params.gender;
    return apiGet<ApiProductListItem[]>('/api/v1/products', query);
  },

  getProduct(productId: string) {
    return apiGet<ApiProduct>(`/api/v1/products/${productId}`);
  },

  listCategories() {
    return apiGet<ApiCategory[]>('/api/v1/categories');
  },

  home() {
    return apiGet<ApiHomeContent>('/api/v1/home');
  },
};

/* ------------------------------------------------------------------ */
/* Reviews                                                              */
/* ------------------------------------------------------------------ */

export const reviewApi = {
  list(productId: string) {
    return apiGet<ApiReview[]>(`/api/v1/products/${productId}/reviews`);
  },

  create(productId: string, rating: number, comment?: string) {
    return apiPost<ApiReview>(`/api/v1/products/${productId}/reviews`, {
      rating,
      ...(comment ? { comment } : {}),
    });
  },
};

/* ------------------------------------------------------------------ */
/* Cart                                                                 */
/* ------------------------------------------------------------------ */

export const cartApi = {
  get() {
    return apiGet<ApiCart>('/api/v1/cart');
  },

  add(productId: string, variantId: string | null, quantity = 1) {
    return apiPost<ApiCart>('/api/v1/cart/add', {
      product_id: productId,
      ...(variantId ? { variant_id: variantId } : {}),
      quantity,
    });
  },

  update(cartItemId: string, quantity: number) {
    return apiPut<ApiCart>('/api/v1/cart/update', { cart_item_id: cartItemId, quantity });
  },

  remove(cartItemId: string) {
    return apiDelete<ApiCart>(`/api/v1/cart/remove/${cartItemId}`);
  },
};

/* ------------------------------------------------------------------ */
/* Wishlist                                                             */
/* ------------------------------------------------------------------ */

export const wishlistApi = {
  list() {
    return apiGet<ApiWishlistItem[]>('/api/v1/wishlist');
  },

  add(productId: string) {
    return apiPost<{ message: string; id: string }>('/api/v1/wishlist/add', { product_id: productId });
  },

  remove(productId: string) {
    return apiDelete<{ message: string }>(`/api/v1/wishlist/remove/${productId}`);
  },
};

/* ------------------------------------------------------------------ */
/* Addresses                                                            */
/* ------------------------------------------------------------------ */

interface AddressPayload {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  type: string;
  isDefault: boolean;
}

/** Only the keys actually supplied are sent, so a PUT never blanks a field. */
function addressBody(data: Partial<AddressPayload>): Record<string, unknown> {
  return {
    ...(data.fullName !== undefined ? { full_name: data.fullName } : {}),
    ...(data.phone !== undefined ? { phone: data.phone } : {}),
    ...(data.street !== undefined ? { street: data.street } : {}),
    ...(data.city !== undefined ? { city: data.city } : {}),
    ...(data.state !== undefined ? { state: data.state } : {}),
    ...(data.country !== undefined ? { country: data.country } : {}),
    ...(data.pincode !== undefined ? { pincode: data.pincode } : {}),
    ...(data.type !== undefined ? { type: data.type } : {}),
    ...(data.isDefault !== undefined ? { is_default: data.isDefault } : {}),
  };
}

export const addressApi = {
  list() {
    return apiGet<ApiAddress[]>('/api/v1/addresses');
  },

  create(data: AddressPayload) {
    return apiPost<ApiAddress>('/api/v1/addresses', addressBody(data));
  },

  update(id: string, data: Partial<AddressPayload>) {
    return apiPut<ApiAddress>(`/api/v1/addresses/${id}`, addressBody(data));
  },

  remove(id: string) {
    return apiDelete<{ message: string }>(`/api/v1/addresses/${id}`);
  },
};

/* ------------------------------------------------------------------ */
/* Orders                                                               */
/* ------------------------------------------------------------------ */

export interface CreateOrderInput {
  /** One-line shipping address string — the backend stores it verbatim. */
  shippingAddress: string;
  /** Drives intra- vs inter-state GST. Always send it so the tax split is right. */
  shippingState: string;
  items: { productId: string; variantId?: string | null; quantity: number }[];
}

export const orderApi = {
  create(data: CreateOrderInput) {
    return apiPost<ApiOrder>('/api/v1/orders', {
      shipping_address: data.shippingAddress,
      shipping_state: data.shippingState,
      items: data.items.map(i => ({
        product_id: i.productId,
        ...(i.variantId ? { variant_id: i.variantId } : {}),
        quantity: i.quantity,
      })),
    });
  },

  list() {
    return apiGet<ApiOrder[]>('/api/v1/orders');
  },

  get(orderId: string) {
    return apiGet<ApiOrder>(`/api/v1/orders/${orderId}`);
  },

  /** Delivered orders only; the reason is stored on the order. */
  requestReturn(orderId: string, reason: string) {
    return apiPost<{ message: string; returnStatus: string }>(`/api/v1/orders/${orderId}/return`, { reason });
  },

  requestReplace(orderId: string, reason: string) {
    return apiPost<{ message: string; returnStatus: string }>(`/api/v1/orders/${orderId}/replace`, { reason });
  },

  invoicePdf(orderId: string) {
    return apiGetBlob(`/api/v1/orders/${orderId}/invoice`);
  },
};

/* ------------------------------------------------------------------ */
/* Payments                                                             */
/* ------------------------------------------------------------------ */

export const paymentApi = {
  listMethods(region = 'IN') {
    return apiGet<ApiPaymentMethod[]>('/api/v1/payment-methods', { region });
  },

  create(orderId: string, paymentMethod?: string) {
    return apiPost<ApiPaymentIntent>('/api/v1/payments/create', {
      order_id: orderId,
      ...(paymentMethod ? { payment_method: paymentMethod } : {}),
    });
  },

  verify(data: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    return apiPost<{ message: string; invoiceNumber: string; paymentMethod?: string }>('/api/v1/payments/verify', {
      order_id: data.orderId,
      razorpay_order_id: data.razorpayOrderId,
      razorpay_payment_id: data.razorpayPaymentId,
      razorpay_signature: data.razorpaySignature,
    });
  },
};

/* ------------------------------------------------------------------ */
/* Wallet & referrals                                                   */
/* ------------------------------------------------------------------ */

export const walletApi = {
  balance() {
    return apiGet<{ balance: number }>('/api/v1/wallet/balance');
  },

  transactions() {
    return apiGet<ApiWalletTransaction[]>('/api/v1/wallet/transactions');
  },
};

export const referralApi = {
  stats() {
    return apiGet<ApiReferralStats>('/api/v1/referral/me');
  },

  history() {
    return apiGet<ApiReferralHistoryItem[]>('/api/v1/referral/history');
  },

  /** Server-built share URL, so the storefront domain lives in one place. */
  shareLink(productId: string, referralCode: string) {
    return apiPost<{ shareUrl: string }>('/api/v1/referral/share-link', {
      product_id: productId,
      referral_code: referralCode,
    });
  },

  trackClick(productId: string, referralCode: string) {
    return apiPost<{ message: string }>('/api/v1/referral/track-click', {
      product_id: productId,
      referral_code: referralCode,
    });
  },
};

/* ------------------------------------------------------------------ */
/* Content & store settings                                             */
/* ------------------------------------------------------------------ */

export const blogApi = {
  list() {
    return apiGet<ApiBlogPost[]>('/api/v1/blog');
  },

  get(slug: string) {
    return apiGet<ApiBlogPost>(`/api/v1/blog/${slug}`);
  },
};

export const contactApi = {
  send(data: { fullName: string; email: string; subject?: string; message: string }) {
    return apiPost<{ message: string }>('/api/v1/contact', {
      full_name: data.fullName,
      email: data.email,
      ...(data.subject ? { subject: data.subject } : {}),
      message: data.message,
    });
  },

  subscribe(email: string) {
    return apiPost<{ message: string }>('/api/v1/newsletter', { email });
  },
};

export const deliveryApi = {
  settings() {
    return apiGet<ApiDeliverySettings>('/api/v1/delivery');
  },
};
