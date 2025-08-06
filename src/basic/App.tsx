import { useState, useCallback, useEffect } from "react";
// models
import { ProductWithUI } from "./domain/product/models";
import { Coupon } from "./domain/coupon/models";
// 더 이상 직접 사용하지 않음 - useFormatPrice hook에서 사용

// Shared hooks
import { useSearch, useFormatPrice } from "./shared/hooks";
// Domain hooks
import { useProducts } from "./domain/product/hooks";
import { useCart } from "./domain/cart/hooks";
import { useCoupons } from "./domain/coupon/hooks";
import { useNotifications } from "./domain/notification/hooks";

// Shared components
import { Header } from "./shared/components";
// Domain components
import { ProductList } from "./domain/product/components";
import { CartSidebar } from "./domain/cart/components";
import { NotificationToast } from "./domain/notification/components";
// Feature components
import { AdminPanel } from "./features/admin";

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
    setEditingProduct,
    setShowProductForm,
    setProductForm,
    handleProductSubmit,
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

  // useCoupons 훅 사용
  const {
    coupons,
    showCouponForm,
    couponForm,
    addCoupon: addCouponBase,
    deleteCoupon: deleteCouponBase,
    handleCouponSubmit: handleCouponSubmitBase,
    setShowCouponForm,
    setCouponForm,
  } = useCoupons();

  const [isAdmin, setIsAdmin] = useState(false);
  const { notifications, addNotification, removeNotification } =
    useNotifications();

  const { searchTerm, setSearchTerm, debouncedSearchTerm, filteredProducts } =
    useSearch(products);

  const { formatPrice } = useFormatPrice(products, isAdmin, getRemainingStock);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  // useCoupons의 함수들을 addNotification과 함께 사용하도록 래핑
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
      addCouponBase(newCoupon, addNotification);
    },
    [addCouponBase, addNotification]
  );

  const deleteCoupon = useCallback(
    (couponCode: string) => {
      deleteCouponBase(
        couponCode,
        selectedCoupon,
        setSelectedCoupon,
        addNotification
      );
    },
    [deleteCouponBase, selectedCoupon, setSelectedCoupon, addNotification]
  );

  const handleCouponSubmit = useCallback(
    (e: React.FormEvent) => {
      handleCouponSubmitBase(e, addNotification);
    },
    [handleCouponSubmitBase, addNotification]
  );

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
            showCouponForm={showCouponForm}
            couponForm={couponForm}
            addCoupon={addCoupon}
            deleteCoupon={deleteCoupon}
            handleCouponSubmit={handleCouponSubmit}
            setShowCouponForm={setShowCouponForm}
            setCouponForm={setCouponForm}
            formatPrice={formatPrice}
            handleProductSubmit={handleProductSubmit}
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
