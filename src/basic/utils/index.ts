// Product domain utilities (migrated to domain/product/utils)
export {
  calculateProductDiscount,
  calculateRemainingStock,
} from "../domain/product/utils";

// Cart domain utilities (migrated to domain/cart/utils)
export {
  applyBulkDiscount,
  calculateItemPrice,
  hasBulkPurchase,
} from "../domain/cart/utils";

// Shared utilities (migrated to shared/utils)
export {
  formatUserPrice,
  formatAdminPrice,
  SOLD_OUT_TEXT,
} from "../shared/utils";
