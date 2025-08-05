/**
 * 대량 구매 할인 적용 (순수 함수)
 */
export const applyBulkDiscount = (
  baseDiscount: number,
  hasBulkPurchase: boolean
): number => {
  if (hasBulkPurchase) {
    return Math.min(baseDiscount + 0.05, 0.5); // 대량 구매 시 추가 5% 할인
  }
  return baseDiscount;
};

/**
 * 아이템 총 가격 계산 (순수 함수)
 */
export const calculateItemPrice = (
  price: number,
  quantity: number,
  discountRate: number
): number => {
  return Math.round(price * quantity * (1 - discountRate));
};

/**
 * 대량 구매 여부 확인 (순수 함수)
 */
export const hasBulkPurchase = (
  cartItems: Array<{ quantity: number }>
): boolean => {
  return cartItems.some((item) => item.quantity >= 10);
};
