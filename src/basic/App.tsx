import { useState, useCallback, useEffect } from "react";
import {
  CartItem,
  Coupon,
  Product,
  ProductWithUI,
  Notification,
} from "./models";
import {
  calculateProductDiscount,
  applyBulkDiscount,
  calculateItemPrice,
  formatUserPrice,
  formatAdminPrice,
  SOLD_OUT_TEXT,
  hasBulkPurchase,
  calculateRemainingStock,
} from "./utils";
import {
  useNotifications,
  useLocalStorage,
  useSearch,
  useProducts,
} from "./hooks";
import {
  NotificationToast,
  SearchInput,
  ProductCard,
  Header,
  ProductList,
  CartSidebar,
  AdminPanel,
} from "./components";

const initialCoupons: Coupon[] = [
  {
    name: "5000원 할인",
    code: "AMOUNT5000",
    discountType: "amount",
    discountValue: 5000,
  },
  {
    name: "10% 할인",
    code: "PERCENT10",
    discountType: "percentage",
    discountValue: 10,
  },
];

const App = () => {
  const {
    products,
    editingProduct,
    showProductForm,
    productForm,
    addProduct,
    updateProduct,
    deleteProduct,
    startEditProduct,
    resetProductForm,
    setEditingProduct,
    setShowProductForm,
    setProductForm,
  } = useProducts();

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem("coupons");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialCoupons;
      }
    }
    return initialCoupons;
  });

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { notifications, addNotification, removeNotification } =
    useNotifications();

  const { searchTerm, setSearchTerm, debouncedSearchTerm, filteredProducts } =
    useSearch(products);

  const formatPrice = (price: number, productId?: string): string => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product && getRemainingStock(product) <= 0) {
        return SOLD_OUT_TEXT;
      }
    }

    if (isAdmin) {
      return formatAdminPrice(price);
    }

    return formatUserPrice(price);
  };

  const getMaxApplicableDiscount = (item: CartItem): number => {
    const { discounts } = item.product;
    const { quantity } = item;

    const baseDiscount = calculateProductDiscount(discounts, quantity);
    const hasBulkPurchaseFlag = hasBulkPurchase(cart);

    return applyBulkDiscount(baseDiscount, hasBulkPurchaseFlag);
  };

  const calculateItemTotal = (item: CartItem): number => {
    const { price } = item.product;
    const { quantity } = item;
    const discountRate = getMaxApplicableDiscount(item);

    return calculateItemPrice(price, quantity, discountRate);
  };

  const calculateCartTotal = (): {
    totalBeforeDiscount: number;
    totalAfterDiscount: number;
  } => {
    let totalBeforeDiscount = 0;
    let totalAfterDiscount = 0;

    cart.forEach((item) => {
      const itemPrice = item.product.price * item.quantity;
      totalBeforeDiscount += itemPrice;
      totalAfterDiscount += calculateItemTotal(item);
    });

    if (selectedCoupon) {
      if (selectedCoupon.discountType === "amount") {
        totalAfterDiscount = Math.max(
          0,
          totalAfterDiscount - selectedCoupon.discountValue
        );
      } else {
        totalAfterDiscount = Math.round(
          totalAfterDiscount * (1 - selectedCoupon.discountValue / 100)
        );
      }
    }

    return {
      totalBeforeDiscount: Math.round(totalBeforeDiscount),
      totalAfterDiscount: Math.round(totalAfterDiscount),
    };
  };

  const getRemainingStock = (product: Product): number => {
    const cartItem = cart.find((item) => item.product.id === product.id);
    return calculateRemainingStock(product.stock, cartItem?.quantity || 0);
  };

  const [totalItemCount, setTotalItemCount] = useState(0);

  useEffect(() => {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setTotalItemCount(count);
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("coupons", JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("cart");
    }
  }, [cart]);

  const addToCart = useCallback(
    (product: ProductWithUI) => {
      const remainingStock = getRemainingStock(product);
      if (remainingStock <= 0) {
        addNotification("재고가 부족합니다!", "error");
        return;
      }

      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (item) => item.product.id === product.id
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;

          if (newQuantity > product.stock) {
            addNotification(
              `재고는 ${product.stock}개까지만 있습니다.`,
              "error"
            );
            return prevCart;
          }

          return prevCart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          );
        }

        return [...prevCart, { product, quantity: 1 }];
      });

      addNotification("장바구니에 담았습니다", "success");
    },
    [cart, addNotification, getRemainingStock]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
      }

      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const maxStock = product.stock;
      if (newQuantity > maxStock) {
        addNotification(`재고는 ${maxStock}개까지만 있습니다.`, "error");
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    },
    [products, removeFromCart, addNotification, getRemainingStock]
  );

  const applyCoupon = useCallback(
    (coupon: Coupon) => {
      const currentTotal = calculateCartTotal().totalAfterDiscount;

      if (currentTotal < 10000 && coupon.discountType === "percentage") {
        addNotification(
          "percentage 쿠폰은 10,000원 이상 구매 시 사용 가능합니다.",
          "error"
        );
        return;
      }

      setSelectedCoupon(coupon);
      addNotification("쿠폰이 적용되었습니다.", "success");
    },
    [addNotification, calculateCartTotal]
  );

  const completeOrder = useCallback(() => {
    const orderNumber = `ORD-${Date.now()}`;
    addNotification(
      `주문이 완료되었습니다. 주문번호: ${orderNumber}`,
      "success"
    );
    setCart([]);
    setSelectedCoupon(null);
  }, [addNotification]);

  const totals = calculateCartTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationToast
        notifications={notifications}
        onRemove={removeNotification}
      />
      <Header
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        cartItemCount={totalItemCount}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isAdmin ? (
          <AdminPanel
            products={products}
            editingProduct={editingProduct}
            showProductForm={showProductForm}
            productForm={productForm}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            startEditProduct={startEditProduct}
            setEditingProduct={setEditingProduct}
            setShowProductForm={setShowProductForm}
            setProductForm={setProductForm}
            coupons={coupons}
            setCoupons={setCoupons}
            formatPrice={formatPrice}
            addNotification={addNotification}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <ProductList
              products={products}
              filteredProducts={filteredProducts}
              debouncedSearchTerm={debouncedSearchTerm}
              getRemainingStock={getRemainingStock}
              onAddToCart={addToCart}
              formatPrice={formatPrice}
            />

            <CartSidebar
              cart={cart}
              coupons={coupons}
              selectedCoupon={selectedCoupon}
              calculateItemTotal={calculateItemTotal}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              applyCoupon={applyCoupon}
              setSelectedCoupon={setSelectedCoupon}
              completeOrder={completeOrder}
              totals={totals}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
