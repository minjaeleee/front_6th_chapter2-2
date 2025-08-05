import { useState, useCallback, useEffect } from "react";
import { CartItem } from "../models";
import { ProductWithUI, Product } from "../../product/models";
import { Coupon } from "../../coupon/models";
import {
  applyBulkDiscount,
  calculateItemPrice,
  hasBulkPurchase,
} from "../utils";
import {
  calculateProductDiscount,
  calculateRemainingStock,
} from "../../product/utils";

export const useCart = () => {
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

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [totalItemCount, setTotalItemCount] = useState(0);

  // localStorage 동기화
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("cart");
    }
  }, [cart]);

  // 총 아이템 수 계산
  useEffect(() => {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setTotalItemCount(count);
  }, [cart]);

  // 남은 재고 계산
  const getRemainingStock = useCallback(
    (product: Product): number => {
      const cartItem = cart.find((item) => item.product.id === product.id);
      return calculateRemainingStock(product.stock, cartItem?.quantity || 0);
    },
    [cart]
  );

  // 아이템별 최대 할인율 계산
  const getMaxApplicableDiscount = useCallback(
    (item: CartItem): number => {
      const { discounts } = item.product;
      const { quantity } = item;

      const baseDiscount = calculateProductDiscount(discounts, quantity);
      const hasBulkPurchaseFlag = hasBulkPurchase(cart);

      return applyBulkDiscount(baseDiscount, hasBulkPurchaseFlag);
    },
    [cart]
  );

  // 아이템별 총액 계산
  const calculateItemTotal = useCallback(
    (item: CartItem): number => {
      const { price } = item.product;
      const { quantity } = item;
      const discountRate = getMaxApplicableDiscount(item);

      return calculateItemPrice(price, quantity, discountRate);
    },
    [getMaxApplicableDiscount]
  );

  // 장바구니 전체 총액 계산
  const calculateCartTotal = useCallback((): {
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
  }, [cart, selectedCoupon, calculateItemTotal]);

  // 장바구니에 상품 추가
  const addToCart = useCallback(
    (
      product: ProductWithUI,
      addNotification: (
        message: string,
        type?: "success" | "error" | "warning"
      ) => void
    ) => {
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
    [getRemainingStock]
  );

  // 장바구니에서 상품 제거
  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    );
  }, []);

  // 수량 업데이트
  const updateQuantity = useCallback(
    (
      productId: string,
      newQuantity: number,
      products: ProductWithUI[],
      addNotification: (
        message: string,
        type?: "success" | "error" | "warning"
      ) => void
    ) => {
      if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
      }

      const product = products.find((p: ProductWithUI) => p.id === productId);
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
    [removeFromCart]
  );

  // 쿠폰 적용
  const applyCoupon = useCallback(
    (
      coupon: Coupon,
      addNotification: (
        message: string,
        type?: "success" | "error" | "warning"
      ) => void
    ) => {
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
    [calculateCartTotal]
  );

  // 주문 완료
  const completeOrder = useCallback(
    (
      addNotification: (
        message: string,
        type?: "success" | "error" | "warning"
      ) => void
    ) => {
      const orderNumber = `ORD-${Date.now()}`;
      addNotification(
        `주문이 완료되었습니다. 주문번호: ${orderNumber}`,
        "success"
      );
      setCart([]);
      setSelectedCoupon(null);
    },
    []
  );

  return {
    // 상태
    cart,
    selectedCoupon,
    totalItemCount,

    // 계산 함수들
    getRemainingStock,
    getMaxApplicableDiscount,
    calculateItemTotal,
    calculateCartTotal,

    // 액션 함수들
    addToCart,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    setSelectedCoupon,
    completeOrder,
  };
};
