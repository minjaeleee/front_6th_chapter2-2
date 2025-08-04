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
  useCart,
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

  // useCart 훅 사용
  const {
    cart,
    selectedCoupon,
    totalItemCount,
    getRemainingStock,
    calculateItemTotal,
    calculateCartTotal,
    addToCart: addToCartBase,
    removeFromCart,
    updateQuantity: updateQuantityBase,
    applyCoupon: applyCouponBase,
    setSelectedCoupon,
    completeOrder: completeOrderBase,
  } = useCart();

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

  const [isAdmin, setIsAdmin] = useState(false);
  const { notifications, addNotification, removeNotification } =
    useNotifications();
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "coupons">(
    "products"
  );

  const { searchTerm, setSearchTerm, debouncedSearchTerm, filteredProducts } =
    useSearch(products);

  const [couponForm, setCouponForm] = useState({
    name: "",
    code: "",
    discountType: "amount" as "amount" | "percentage",
    discountValue: 0,
  });

  const formatPrice = (price: number, productId?: string): string => {
    if (productId) {
      const product = products.find((p: ProductWithUI) => p.id === productId);
      if (product && getRemainingStock(product) <= 0) {
        return SOLD_OUT_TEXT;
      }
    }

    if (isAdmin) {
      return formatAdminPrice(price);
    }

    return formatUserPrice(price);
  };

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("coupons", JSON.stringify(coupons));
  }, [coupons]);

  // useCart의 함수들을 addNotification과 함께 사용하도록 래핑
  const addToCart = useCallback(
    (product: ProductWithUI) => {
      addToCartBase(product, addNotification);
    },
    [addToCartBase, addNotification]
  );

  const updateQuantity = useCallback(
    (productId: string, newQuantity: number) => {
      updateQuantityBase(productId, newQuantity, products, addNotification);
    },
    [updateQuantityBase, products, addNotification]
  );

  const applyCoupon = useCallback(
    (coupon: Coupon) => {
      applyCouponBase(coupon, addNotification);
    },
    [applyCouponBase, addNotification]
  );

  const completeOrder = useCallback(() => {
    completeOrderBase(addNotification);
  }, [completeOrderBase, addNotification]);

  const addCoupon = useCallback(
    (newCoupon: Coupon) => {
      const existingCoupon = coupons.find((c) => c.code === newCoupon.code);
      if (existingCoupon) {
        addNotification("이미 존재하는 쿠폰 코드입니다.", "error");
        return;
      }
      setCoupons((prev) => [...prev, newCoupon]);
      addNotification("쿠폰이 추가되었습니다.", "success");
    },
    [coupons, addNotification]
  );

  const deleteCoupon = useCallback(
    (couponCode: string) => {
      setCoupons((prev) => prev.filter((c) => c.code !== couponCode));
      if (selectedCoupon?.code === couponCode) {
        setSelectedCoupon(null);
      }
      addNotification("쿠폰이 삭제되었습니다.", "success");
    },
    [selectedCoupon, addNotification]
  );

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct && editingProduct !== "new") {
      updateProduct(editingProduct, productForm);
      setEditingProduct(null);
    } else {
      addProduct({
        ...productForm,
        discounts: productForm.discounts,
      });
    }
    setProductForm({
      name: "",
      price: 0,
      stock: 0,
      description: "",
      discounts: [],
    });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCoupon(couponForm);
    setCouponForm({
      name: "",
      code: "",
      discountType: "amount",
      discountValue: 0,
    });
    setShowCouponForm(false);
  };

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
