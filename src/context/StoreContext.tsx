import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  addressApi,
  authApi,
  cartApi,
  deliveryApi,
  orderApi,
  walletApi,
  wishlistApi,
} from '../lib/api';
import { errorMessage, hasToken, initApiClient, setSessionExpiredHandler } from '../lib/apiClient';
import {
  formatAddressLine,
  mapAddress,
  mapCartItem,
  mapDeliverySettings,
  mapOrder,
  mapUser,
  mapWalletTransaction,
  mapWishlistItem,
} from '../lib/mappers';
import { orderTotals } from '../lib/pricing';
import type {
  Address,
  AddressInput,
  CartItem,
  DeliverySettings,
  GenderCategory,
  GstBreakup,
  Order,
  Product,
  User,
  WalletTransaction,
  WishlistItem,
} from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

/** What a caller has to pick before an item can go in the bag. */
export interface CartSelection {
  size?: string | null;
  color?: string | null;
  quantity?: number;
}

const GUEST_CART_KEY = 'dristhi_guest_cart';
const GENDER_KEY = 'dristhi_gender';

interface StoreContextType {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  /** True until the stored session has been checked, so pages can hold off redirecting. */
  authLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithOtp: (email: string, otp: string) => Promise<boolean>;
  sendLoginOtp: (email: string) => Promise<boolean>;
  register: (data: { fullName: string; email: string; phone: string; password: string; referralCode?: string }) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateProfile: (data: { fullName?: string; email?: string; phone?: string; avatarUrl?: string }) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;

  // Cart
  cart: CartItem[];
  cartLoading: boolean;
  cartCount: number;
  cartSubtotal: number;
  addToCart: (product: Product, selection?: CartSelection) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // Totals (mirror what the backend will charge)
  deliverySettings: DeliverySettings | null;
  /** Recomputes GST and delivery for a destination state. */
  quoteFor: (state: string | null | undefined) => { subtotal: number; gst: GstBreakup; deliveryFee: number; grandTotal: number };

  // Wishlist
  wishlist: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Pick<Product, 'id' | 'title'>) => Promise<void>;

  // Addresses
  addresses: Address[];
  addressesLoading: boolean;
  addAddress: (address: AddressInput) => Promise<boolean>;
  updateAddress: (id: string, address: Partial<AddressInput>) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;

  // Orders
  orders: Order[];
  ordersLoading: boolean;
  refreshOrders: () => Promise<void>;
  getOrder: (orderId: string) => Promise<Order | null>;
  /** Places the order server-side and empties the bag. Payment happens after. */
  placeOrder: (address: Address) => Promise<Order | null>;
  requestReturn: (orderId: string, reason: string, evidence?: string[]) => Promise<boolean>;

  requestReplace: (orderId: string, reason: string, evidence?: string[]) => Promise<boolean>;
  // Wallet
  walletBalance: number;
  walletTransactions: WalletTransaction[];
  refreshWallet: () => Promise<void>;

  // Browsing
  selectedGender: GenderCategory;
  setSelectedGender: (gender: GenderCategory) => void;

  // Toast
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function readGuestCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(GUEST_CART_KEY);
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]): void {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

/**
 * Picks the variant matching the chosen size/colour. Returns null for products
 * with no variants at all, which the cart endpoint accepts.
 */
function resolveVariantId(product: Product, size?: string | null, color?: string | null): string | null {
  if (!product.variants.length) return null;
  const exact = product.variants.find(
    v => (!size || v.size === size) && (!color || v.color === color),
  );
  if (exact) return exact.id;
  // A product can carry sizes without colours (or the reverse); fall back to
  // matching on whichever attribute the buyer actually chose.
  const bySize = size ? product.variants.find(v => v.size === size) : undefined;
  if (bySize) return bySize.id;
  const byColor = color ? product.variants.find(v => v.color === color) : undefined;
  return byColor?.id ?? null;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => readGuestCart());
  const [cartLoading, setCartLoading] = useState(false);

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);

  const [selectedGender, setSelectedGenderState] = useState<GenderCategory>(() => {
    try {
      return (localStorage.getItem(GENDER_KEY) as GenderCategory) || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isAuthenticated = user !== null;
  // Read inside callbacks that must not be re-created when auth flips.
  const isAuthenticatedRef = useRef(false);
  isAuthenticatedRef.current = isAuthenticated;

  /* -------------------------------------------------------------- */
  /* Toasts                                                          */
  /* -------------------------------------------------------------- */

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts(prev => [...prev, { id, title, message, type }]);
      setTimeout(() => removeToast(id), 4500);
    },
    [removeToast],
  );

  /* -------------------------------------------------------------- */
  /* Guest cart persistence                                          */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    if (!isAuthenticated) writeGuestCart(cart);
  }, [cart, isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem(GENDER_KEY, selectedGender);
    } catch {
      /* noop */
    }
  }, [selectedGender]);

  const setSelectedGender = useCallback((gender: GenderCategory) => setSelectedGenderState(gender), []);

  /* -------------------------------------------------------------- */
  /* Signed-in data                                                  */
  /* -------------------------------------------------------------- */

  const refreshCart = useCallback(async () => {
    if (!isAuthenticatedRef.current) return;
    setCartLoading(true);
    try {
      const data = await cartApi.get();
      setCart((data.items ?? []).map(mapCartItem));
    } catch {
      /* a stale bag is better than an empty one — leave what is on screen */
    } finally {
      setCartLoading(false);
    }
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticatedRef.current) return;
    try {
      setWishlist((await wishlistApi.list()).map(mapWishlistItem));
    } catch {
      /* noop */
    }
  }, []);

  const refreshAddresses = useCallback(async () => {
    if (!isAuthenticatedRef.current) return;
    setAddressesLoading(true);
    try {
      setAddresses((await addressApi.list()).map(mapAddress));
    } catch {
      /* noop */
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!isAuthenticatedRef.current) return;
    setOrdersLoading(true);
    try {
      setOrders((await orderApi.list()).map(mapOrder));
    } catch {
      /* noop */
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const refreshWallet = useCallback(async () => {
    if (!isAuthenticatedRef.current) return;
    try {
      const [balance, transactions] = await Promise.all([walletApi.balance(), walletApi.transactions()]);
      setWalletBalance(balance.balance ?? 0);
      setWalletTransactions(transactions.map(mapWalletTransaction));
    } catch {
      /* noop */
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!hasToken()) return;
    try {
      const profile = mapUser(await authApi.me());
      setUser(profile);
      setWalletBalance(profile.walletBalance);
    } catch {
      /* the api client already clears a dead session */
    }
  }, []);

  /**
   * Moves a guest bag onto the server after sign-in, so nothing chosen while
   * browsing anonymously is lost. Runs before the first server cart fetch.
   */
  const mergeGuestCart = useCallback(async () => {
    const guestItems = readGuestCart();
    if (!guestItems.length) return;
    for (const item of guestItems) {
      try {
        await cartApi.add(item.productId, item.variantId, item.quantity);
      } catch {
        // A product that has since gone out of stock or been delisted should
        // not block the rest of the bag from transferring.
      }
    }
    writeGuestCart([]);
  }, []);

  /** Everything a signed-in session needs, fetched together after auth. */
  const loadSession = useCallback(
    async ({ merge }: { merge: boolean }) => {
      if (merge) await mergeGuestCart();
      await Promise.all([refreshCart(), refreshWishlist(), refreshAddresses(), refreshOrders(), refreshWallet()]);
    },
    [mergeGuestCart, refreshAddresses, refreshCart, refreshOrders, refreshWallet, refreshWishlist],
  );

  const clearSessionState = useCallback(() => {
    setUser(null);
    setWishlist([]);
    setAddresses([]);
    setOrders([]);
    setWalletTransactions([]);
    setWalletBalance(0);
    setCart(readGuestCart());
  }, []);

  /* -------------------------------------------------------------- */
  /* Bootstrap                                                       */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    initApiClient();

    setSessionExpiredHandler(() => {
      clearSessionState();
      showToast('Session Expired', 'Please sign in again to continue.', 'info');
    });

    // Store-wide settings are public, so they load regardless of sign-in state.
    deliveryApi
      .settings()
      .then(s => setDeliverySettings(mapDeliverySettings(s)))
      .catch(() => setDeliverySettings({ fee: 0, freeThreshold: null }));

    (async () => {
      if (!hasToken()) {
        setAuthLoading(false);
        return;
      }
      try {
        const profile = mapUser(await authApi.me());
        setUser(profile);
        setWalletBalance(profile.walletBalance);
        isAuthenticatedRef.current = true;
        await loadSession({ merge: true });
      } catch {
        clearSessionState();
      } finally {
        setAuthLoading(false);
      }
    })();

    return () => setSessionExpiredHandler(null);
    // Bootstrap runs exactly once; the callbacks it uses are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------- */
  /* Auth actions                                                    */
  /* -------------------------------------------------------------- */

  /** Shared tail of every sign-in route: load the profile, then the session data. */
  const completeSignIn = useCallback(async () => {
    const profile = mapUser(await authApi.me());
    setUser(profile);
    setWalletBalance(profile.walletBalance);
    isAuthenticatedRef.current = true;
    await loadSession({ merge: true });
    return profile;
  }, [loadSession]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        await authApi.login(email, password);
        const profile = await completeSignIn();
        showToast('Welcome Back', `Signed in as ${profile.fullName}.`, 'success');
        return true;
      } catch (err) {
        showToast('Sign In Failed', errorMessage(err, 'Check your email and password and try again.'), 'error');
        return false;
      }
    },
    [completeSignIn, showToast],
  );

  const sendLoginOtp = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        await authApi.sendLoginOtp(email);
        showToast('Code Sent', `A one-time code is on its way to ${email}.`, 'success');
        return true;
      } catch (err) {
        showToast('Could Not Send Code', errorMessage(err), 'error');
        return false;
      }
    },
    [showToast],
  );

  const loginWithOtp = useCallback(
    async (email: string, otp: string): Promise<boolean> => {
      try {
        await authApi.loginWithOtp(email, otp);
        const profile = await completeSignIn();
        showToast('Welcome Back', `Signed in as ${profile.fullName}.`, 'success');
        return true;
      } catch (err) {
        showToast('Verification Failed', errorMessage(err, 'That code is not valid or has expired.'), 'error');
        return false;
      }
    },
    [completeSignIn, showToast],
  );

  const register = useCallback(
    async (data: { fullName: string; email: string; phone: string; password: string; referralCode?: string }) => {
      try {
        await authApi.register(data);
        showToast('Account Created', `We have sent a verification code to ${data.email}.`, 'success');
        return true;
      } catch (err) {
        showToast('Registration Failed', errorMessage(err), 'error');
        return false;
      }
    },
    [showToast],
  );

  const verifyOtp = useCallback(
    async (email: string, otp: string): Promise<boolean> => {
      try {
        const result = await authApi.verifyOtp(email, otp);
        // Some deployments hand back tokens on verification; when they do the
        // customer is already signed in and should not be asked to log in again.
        if (result.accessToken) {
          const profile = await completeSignIn();
          showToast('Account Verified', `Welcome to Dristi Fashions, ${profile.fullName}.`, 'success');
        } else {
          showToast('Account Verified', 'Your email has been verified. Please sign in.', 'success');
        }
        return true;
      } catch (err) {
        showToast('Verification Failed', errorMessage(err, 'That code is not valid or has expired.'), 'error');
        return false;
      }
    },
    [completeSignIn, showToast],
  );

  const resendOtp = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        await authApi.resendOtp(email);
        showToast('Code Resent', `A fresh code is on its way to ${email}.`, 'success');
        return true;
      } catch (err) {
        showToast('Could Not Resend', errorMessage(err), 'error');
        return false;
      }
    },
    [showToast],
  );

  const forgotPassword = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        await authApi.forgotPassword(email);
        showToast('Reset Code Sent', `Check ${email} for your password reset code.`, 'success');
        return true;
      } catch (err) {
        showToast('Request Failed', errorMessage(err), 'error');
        return false;
      }
    },
    [showToast],
  );

  const resetPassword = useCallback(
    async (email: string, otp: string, newPassword: string): Promise<boolean> => {
      try {
        await authApi.resetPassword(email, otp, newPassword);
        showToast('Password Updated', 'You can now sign in with your new password.', 'success');
        return true;
      } catch (err) {
        showToast('Reset Failed', errorMessage(err), 'error');
        return false;
      }
    },
    [showToast],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      try {
        await authApi.changePassword(currentPassword, newPassword);
        showToast('Password Changed', 'Your credentials have been updated.', 'success');
        return true;
      } catch (err) {
        showToast('Could Not Change Password', errorMessage(err), 'error');
        return false;
      }
    },
    [showToast],
  );

  const updateProfile = useCallback(
    async (data: { fullName?: string; email?: string; phone?: string; avatarUrl?: string }): Promise<boolean> => {
      try {
        setUser(mapUser(await authApi.updateProfile(data)));
        showToast('Profile Updated', 'Your account details have been saved.', 'success');
        return true;
      } catch (err) {
        showToast('Update Failed', errorMessage(err), 'error');
        return false;
      }
    },
    [showToast],
  );

  const logout = useCallback(() => {
    authApi.logout();
    isAuthenticatedRef.current = false;
    clearSessionState();
    showToast('Signed Out', 'You have been signed out of Dristi Fashions.', 'info');
  }, [clearSessionState, showToast]);

  /* -------------------------------------------------------------- */
  /* Cart actions                                                    */
  /* -------------------------------------------------------------- */

  const addToCart = useCallback(
    async (product: Product, selection: CartSelection = {}): Promise<boolean> => {
      const quantity = Math.max(1, selection.quantity ?? 1);
      if (!product.inStock) {
        showToast('Out of Stock', `${product.title} is currently unavailable.`, 'error');
        return false;
      }

      const variantId = resolveVariantId(product, selection.size, selection.color);

      if (!isAuthenticatedRef.current) {
        // Guest bag: keyed by product + variant, exactly like the server table.
        setCart(prev => {
          const index = prev.findIndex(i => i.productId === product.id && i.variantId === variantId);
          if (index > -1) {
            const next = [...prev];
            next[index] = { ...next[index], quantity: next[index].quantity + quantity };
            return next;
          }
          return [
            ...prev,
            {
              id: `guest_${product.id}_${variantId ?? 'default'}`,
              productId: product.id,
              title: product.title,
              image: product.images[0] ?? null,
              price: product.price,
              quantity,
              variantId,
              selectedSize: selection.size ?? null,
              selectedColor: selection.color ?? null,
            },
          ];
        });
        showToast('Added to Bag', `${product.title} added to your bag.`, 'success');
        return true;
      }

      try {
        const data = await cartApi.add(product.id, variantId, quantity);
        setCart((data.items ?? []).map(mapCartItem));
        showToast('Added to Bag', `${product.title} added to your bag.`, 'success');
        return true;
      } catch (err) {
        showToast('Could Not Add to Bag', errorMessage(err), 'error');
        return false;
      }
    },
    [showToast],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!isAuthenticatedRef.current) {
        setCart(prev =>
          quantity <= 0
            ? prev.filter(i => i.id !== itemId)
            : prev.map(i => (i.id === itemId ? { ...i, quantity } : i)),
        );
        return;
      }
      try {
        const data = await cartApi.update(itemId, quantity);
        setCart((data.items ?? []).map(mapCartItem));
      } catch (err) {
        showToast('Could Not Update Bag', errorMessage(err), 'error');
      }
    },
    [showToast],
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      if (!isAuthenticatedRef.current) {
        setCart(prev => prev.filter(i => i.id !== itemId));
        showToast('Item Removed', 'Item removed from your bag.', 'info');
        return;
      }
      try {
        const data = await cartApi.remove(itemId);
        setCart((data.items ?? []).map(mapCartItem));
        showToast('Item Removed', 'Item removed from your bag.', 'info');
      } catch (err) {
        showToast('Could Not Remove Item', errorMessage(err), 'error');
      }
    },
    [showToast],
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticatedRef.current) {
      setCart([]);
      return;
    }
    // There is no bulk-clear endpoint, so drop the lines one by one and take
    // the last response as the new state.
    const ids = cart.map(i => i.id);
    for (const id of ids) {
      try {
        await cartApi.remove(id);
      } catch {
        /* keep going — a partially cleared bag still beats a stuck one */
      }
    }
    await refreshCart();
  }, [cart, refreshCart]);

  /* -------------------------------------------------------------- */
  /* Wishlist actions                                                */
  /* -------------------------------------------------------------- */

  const isInWishlist = useCallback((productId: string) => wishlist.some(w => w.productId === productId), [wishlist]);

  const toggleWishlist = useCallback(
    async (product: Pick<Product, 'id' | 'title'>) => {
      if (!isAuthenticatedRef.current) {
        showToast('Sign In Required', 'Please sign in to save pieces to your wishlist.', 'info');
        return;
      }
      const exists = wishlist.some(w => w.productId === product.id);
      try {
        if (exists) {
          await wishlistApi.remove(product.id);
          setWishlist(prev => prev.filter(w => w.productId !== product.id));
          showToast('Removed from Wishlist', `${product.title} removed from your wishlist.`, 'info');
        } else {
          await wishlistApi.add(product.id);
          await refreshWishlist();
          showToast('Saved to Wishlist', `${product.title} saved to your wishlist.`, 'success');
        }
      } catch (err) {
        showToast('Wishlist Update Failed', errorMessage(err), 'error');
      }
    },
    [refreshWishlist, showToast, wishlist],
  );

  /* -------------------------------------------------------------- */
  /* Address actions                                                 */
  /* -------------------------------------------------------------- */

  const addAddress = useCallback(
    async (address: AddressInput): Promise<boolean> => {
      try {
        // The first address saved is the default whether or not the box was
        // ticked — otherwise checkout would open with nothing selected.
        await addressApi.create({ ...address, isDefault: address.isDefault || addresses.length === 0 });
        await refreshAddresses();
        showToast('Address Saved', 'Your delivery address has been added.', 'success');
        return true;
      } catch (err) {
        showToast('Could Not Save Address', errorMessage(err), 'error');
        return false;
      }
    },
    [addresses.length, refreshAddresses, showToast],
  );

  const updateAddress = useCallback(
    async (id: string, address: Partial<AddressInput>): Promise<boolean> => {
      try {
        await addressApi.update(id, address);
        await refreshAddresses();
        showToast('Address Updated', 'Your delivery address has been saved.', 'success');
        return true;
      } catch (err) {
        showToast('Could Not Update Address', errorMessage(err), 'error');
        return false;
      }
    },
    [refreshAddresses, showToast],
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      try {
        await addressApi.remove(id);
        await refreshAddresses();
        showToast('Address Deleted', 'Address removed from your address book.', 'info');
      } catch (err) {
        showToast('Could Not Delete Address', errorMessage(err), 'error');
      }
    },
    [refreshAddresses, showToast],
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      try {
        await addressApi.update(id, { isDefault: true });
        await refreshAddresses();
        showToast('Default Address Set', 'Updated your primary shipping address.', 'success');
      } catch (err) {
        showToast('Could Not Set Default', errorMessage(err), 'error');
      }
    },
    [refreshAddresses, showToast],
  );

  /* -------------------------------------------------------------- */
  /* Order actions                                                   */
  /* -------------------------------------------------------------- */

  const getOrder = useCallback(async (orderId: string): Promise<Order | null> => {
    try {
      return mapOrder(await orderApi.get(orderId));
    } catch {
      return null;
    }
  }, []);

  const placeOrder = useCallback(
    async (address: Address): Promise<Order | null> => {
      if (!cart.length) {
        showToast('Your Bag Is Empty', 'Add a piece to your bag before checking out.', 'info');
        return null;
      }
      try {
        const created = mapOrder(
          await orderApi.create({
            shippingAddress: formatAddressLine(address),
            // Drives the CGST+SGST vs IGST split server-side.
            shippingState: address.state,
            items: cart.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
          }),
        );
        // The backend does not empty the bag when an order is created, so the
        // storefront has to — otherwise the next visit re-offers paid-for items.
        await clearCart();
        setOrders(prev => [created, ...prev]);
        return created;
      } catch (err) {
        showToast('Could Not Place Order', errorMessage(err), 'error');
        return null;
      }
    },
    [cart, clearCart, showToast],
  );

  const requestReturn = useCallback(
    async (orderId: string, reason: string, evidence: string[] = []): Promise<boolean> => {
      try {
        await orderApi.requestReturn(orderId, reason, evidence);
        await refreshOrders();
        showToast('Return Requested', 'Our concierge team will be in touch shortly.', 'success');
        return true;
      } catch (err) {
        showToast('Request Failed', errorMessage(err), 'error');
        return false;
      }
    },
    [refreshOrders, showToast],
  );

  const requestReplace = useCallback(
    async (orderId: string, reason: string, evidence: string[] = []): Promise<boolean> => {
      try {
        await orderApi.requestReplace(orderId, reason, evidence);
        await refreshOrders();
        showToast('Replacement Requested', 'Our concierge team will be in touch shortly.', 'success');
        return true;
      } catch (err) {
        showToast('Request Failed', errorMessage(err), 'error');
        return false;
      }
    },
    [refreshOrders, showToast],
  );

  /* -------------------------------------------------------------- */
  /* Derived values                                                  */
  /* -------------------------------------------------------------- */

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.quantity, 0), [cart]);

  const quoteFor = useCallback(
    (state: string | null | undefined) => orderTotals(cartSubtotal, state, deliverySettings),
    [cartSubtotal, deliverySettings],
  );

  const value: StoreContextType = {
    user,
    isAuthenticated,
    authLoading,
    login,
    loginWithOtp,
    sendLoginOtp,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    logout,
    refreshUser,

    cart,
    cartLoading,
    cartCount,
    cartSubtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,

    deliverySettings,
    quoteFor,

    wishlist,
    isInWishlist,
    toggleWishlist,

    addresses,
    addressesLoading,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,

    orders,
    ordersLoading,
    refreshOrders,
    getOrder,
    placeOrder,
    requestReturn,
    requestReplace,

    walletBalance,
    walletTransactions,
    refreshWallet,

    selectedGender,
    setSelectedGender,

    toasts,
    showToast,
    removeToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
