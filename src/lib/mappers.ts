/** The only place backend DTOs become UI models. */
import type {
  Address,
  AddressType,
  ApiAddress,
  ApiBanner,
  ApiBlogPost,
  ApiCartItem,
  ApiCategory,
  ApiDeliverySettings,
  ApiGender,
  ApiOrder,
  ApiPaymentMethod,
  ApiProduct,
  ApiProductListItem,
  ApiReview,
  ApiUser,
  ApiWalletTransaction,
  ApiWishlistItem,
  BlogPost,
  CartItem,
  Category,
  DeliverySettings,
  GenderCategory,
  HeroSlide,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductVariant,
  ReturnStatus,
  Review,
  User,
  WalletTransaction,
  WishlistItem,
} from '../types';

/** Shown wherever a product or category has no image of its own. */
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
      <rect width="600" height="800" fill="#f4f2ff"/>
      <circle cx="300" cy="340" r="86" fill="none" stroke="#c6c5d0" stroke-width="3"/>
      <path d="M255 372l30-34 26 30 22-24 42 48H255z" fill="#c6c5d0"/>
      <text x="300" y="500" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="#9a99ab">
        Dristhi Fashions
      </text>
    </svg>`,
  );

export function toUiGender(gender: ApiGender | string | null | undefined): GenderCategory {
  switch ((gender ?? '').toLowerCase()) {
    case 'men':
      return 'MEN';
    case 'women':
      return 'WOMEN';
    case 'kids':
      return 'KIDS';
    default:
      return 'ALL';
  }
}

/** `undefined` for ALL, so the caller can drop the query param entirely. */
export function toApiGender(gender: GenderCategory): string | undefined {
  return gender === 'ALL' ? undefined : gender.toLowerCase();
}

export function mapUser(api: ApiUser): User {
  return {
    id: api.id,
    fullName: api.fullName,
    email: api.email,
    phone: api.phone ?? '',
    avatarUrl: api.avatarUrl ?? null,
    referralCode: api.referralCode ?? '',
    walletBalance: api.walletBalance ?? 0,
    isVerified: api.isVerified,
    role: api.role,
  };
}

function mapVariants(api: ApiProduct): ProductVariant[] {
  return (api.variants ?? []).map(v => ({
    id: v.id,
    size: v.size ?? null,
    color: v.color ?? null,
    stock: v.stock ?? 0,
    price: v.price ?? null,
  }));
}

/**
 * List rows carry a single primary image; detail responses carry the full set.
 * Either way the UI gets a non-empty `images` array so galleries never break.
 */
function mapImages(api: ApiProductListItem | ApiProduct): string[] {
  const detail = (api as ApiProduct).images;
  if (detail?.length) {
    const primaryFirst = [...detail].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
    return primaryFirst.map(i => i.imageUrl).filter(Boolean);
  }
  return api.imageUrl ? [api.imageUrl] : [PLACEHOLDER_IMAGE];
}

export function mapProduct(api: ApiProductListItem | ApiProduct): Product {
  const detail = api as ApiProduct;
  const images = mapImages(api);
  return {
    id: api.id,
    title: api.title,
    sku: api.sku ?? '',
    brand: api.brand || 'Dristhi Fashions',
    description: api.description ?? '',
    price: api.price,
    mrp: api.originalPrice ?? api.price,
    discountPercentage: api.discountPercentage ?? 0,
    categoryId: api.categoryId,
    category: api.categoryName ?? 'Collection',
    gender: toUiGender(api.gender),
    images: images.length ? images : [PLACEHOLDER_IMAGE],
    sizes: api.sizes ?? [],
    colors: api.colors ?? [],
    variants: detail.variants ? mapVariants(detail) : [],
    stock: api.stock ?? 0,
    inStock: (api.stock ?? 0) > 0,
    isNew: api.isNew ?? false,
    isFeatured: api.isFeatured ?? false,
    isReturnable: api.isReturnable ?? false,
    isReplaceable: api.isReplaceable ?? false,
    rating: api.rating ?? 0,
    reviewCount: api.reviewCount ?? 0,
    cgstPercentage: detail.cgstPercentage,
    sgstPercentage: detail.sgstPercentage,
    igstPercentage: detail.igstPercentage,
  };
}

export function mapCategory(api: ApiCategory): Category {
  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    description: api.description ?? '',
    imageUrl: api.imageUrl || null,
    gender: toUiGender(api.gender),
    parentId: api.parentId ?? null,
  };
}

/**
 * Banners are authored in the admin app with only an image and optional copy,
 * so every text slot needs a sensible default before it reaches the carousel.
 */
export function mapBannerToSlide(api: ApiBanner): HeroSlide {
  return {
    id: api.id,
    title: api.title || 'The Dristi Edit',
    subtitle: api.subtitle || 'New Season',
    description: api.subtitle && api.title ? '' : 'Handpicked pieces from our latest collection.',
    image: api.imageUrl,
    ctaText: api.linkText || 'Explore Collection',
    ctaLink: api.linkUrl || '/search',
  };
}

/** `variantInfo` arrives pre-formatted ("Size: M, Color: red"); pull the parts back out. */
function parseVariantInfo(info: string | null | undefined): { size: string | null; color: string | null } {
  if (!info) return { size: null, color: null };
  let size: string | null = null;
  let color: string | null = null;
  for (const part of info.split(',')) {
    const [rawKey, ...rest] = part.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (!value) continue;
    if (key === 'size') size = value;
    if (key === 'color') color = value;
  }
  return { size, color };
}

export function mapCartItem(api: ApiCartItem): CartItem {
  const { size, color } = parseVariantInfo(api.variantInfo);
  return {
    id: api.id,
    productId: api.productId,
    title: api.productTitle ?? 'Item',
    image: api.imageUrl || null,
    price: api.price ?? 0,
    quantity: api.quantity,
    variantId: api.variantId ?? null,
    selectedSize: size,
    selectedColor: color,
  };
}

export function mapWishlistItem(api: ApiWishlistItem): WishlistItem {
  return {
    id: api.id,
    productId: api.productId,
    title: api.productTitle ?? 'Item',
    price: api.price ?? 0,
    image: api.imageUrl || null,
  };
}

const ADDRESS_TYPES: AddressType[] = ['Home', 'Work', 'Other'];

export function mapAddress(api: ApiAddress): Address {
  const type = ADDRESS_TYPES.find(t => t.toLowerCase() === (api.type ?? '').toLowerCase()) ?? 'Home';
  return {
    id: api.id,
    fullName: api.fullName,
    phone: api.phone,
    street: api.street,
    city: api.city,
    state: api.state,
    country: api.country || 'IN',
    pincode: api.pincode,
    type,
    isDefault: api.isDefault,
  };
}

/** The one-line string the orders endpoint stores and later renders back. */
export function formatAddressLine(address: Address): string {
  return [address.fullName, address.phone, address.street, address.city, address.state, address.pincode, address.country]
    .filter(Boolean)
    .join(', ');
}

const ORDER_STATUSES: OrderStatus[] = ['placed', 'processing', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled'];
const RETURN_STATUSES: ReturnStatus[] = ['requested', 'replace_requested', 'approved', 'rejected', 'completed'];

export function mapOrder(api: ApiOrder): Order {
  const status = ORDER_STATUSES.find(s => s === api.orderStatus) ?? 'placed';
  const returnStatus = RETURN_STATUSES.find(s => s === api.returnStatus) ?? null;
  return {
    id: api.id,
    orderNumber: api.orderNumber,
    status,
    paymentStatus: api.paymentStatus ?? 'pending',
    items: (api.items ?? []).map(i => ({
      id: i.id,
      productId: i.productId,
      title: i.productName,
      quantity: i.quantity,
      price: i.price,
      variantId: i.variantId ?? null,
    })),
    subtotal: api.subtotal ?? 0,
    gstAmount: api.gstAmount ?? 0,
    cgstAmount: api.cgstAmount ?? 0,
    sgstAmount: api.sgstAmount ?? 0,
    igstAmount: api.igstAmount ?? 0,
    discount: api.discountAmount ?? 0,
    deliveryFee: api.deliveryFee ?? 0,
    totalAmount: api.finalAmount ?? 0,
    shippingAddress: api.shippingAddress ?? '',
    returnReason: api.returnReason || null,
    returnStatus,
    estimatedDelivery: api.estimatedDelivery ?? null,
    createdAt: api.createdAt,
  };
}

export function mapWalletTransaction(api: ApiWalletTransaction): WalletTransaction {
  return {
    id: api.id,
    type: (api.transactionType ?? '').toLowerCase() === 'debit' ? 'debit' : 'credit',
    amount: api.amount ?? 0,
    description: api.description || api.source || 'Wallet transaction',
    createdAt: api.createdAt,
  };
}

export function mapReview(api: ApiReview): Review {
  return {
    id: api.id,
    userName: api.userName || 'Verified Buyer',
    rating: api.rating,
    comment: api.comment ?? '',
    createdAt: api.createdAt,
  };
}

export function mapBlogPost(api: ApiBlogPost): BlogPost {
  return {
    id: api.id,
    title: api.title,
    slug: api.slug,
    excerpt: api.excerpt || (api.content ? `${api.content.slice(0, 160)}…` : ''),
    content: api.content ?? '',
    image: api.imageUrl || null,
    author: api.author || 'Dristhi Atelier',
    createdAt: api.createdAt,
  };
}

export function mapPaymentMethod(api: ApiPaymentMethod): PaymentMethod {
  return {
    id: api.id,
    code: api.code,
    name: api.name,
    description: api.description ?? '',
    iconUrl: api.iconUrl || null,
  };
}

/**
 * `{ enabled, fee, freeAbove }` becomes what the UI actually needs. When
 * charging is switched off the fee is always zero, matching the backend's own
 * `compute_fee`.
 */
export function mapDeliverySettings(api: ApiDeliverySettings): DeliverySettings {
  return {
    fee: api.enabled ? api.fee ?? 0 : 0,
    freeThreshold: api.freeAbove ?? null,
  };
}
