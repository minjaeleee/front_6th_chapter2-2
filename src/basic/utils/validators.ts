/**
 * 대량 구매 여부 확인 (순수 함수)
 */
export const hasBulkPurchase = (
  cartItems: Array<{ quantity: number }>
): boolean => {
  return cartItems.some((item) => item.quantity >= 10);
};

/**
 * 재고 계산 (순수 함수)
 */
export const calculateRemainingStock = (
  totalStock: number,
  usedStock: number
): number => {
  return totalStock - usedStock;
};
