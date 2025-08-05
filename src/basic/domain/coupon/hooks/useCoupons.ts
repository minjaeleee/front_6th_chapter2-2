import { useState, useCallback, useEffect } from "react";
import { Coupon } from "../../../models";
import { initialCoupons } from "../../../constants";

export const useCoupons = () => {
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

  // 관리자 페이지용 폼 상태
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({
    name: "",
    code: "",
    discountType: "amount" as "amount" | "percentage",
    discountValue: 0,
  });

  // localStorage 동기화
  useEffect(() => {
    localStorage.setItem("coupons", JSON.stringify(coupons));
  }, [coupons]);

  // 쿠폰 추가
  const addCoupon = useCallback((newCoupon: Omit<Coupon, "code">) => {
    const coupon: Coupon = {
      ...newCoupon,
      code: newCoupon.name.replace(/\s+/g, "").toUpperCase() + Date.now(),
    };
    setCoupons((prev) => [...prev, coupon]);
    setShowCouponForm(false);
    setCouponForm({
      name: "",
      code: "",
      discountType: "percentage",
      discountValue: 0,
    });
  }, []);

  // 쿠폰 삭제
  const deleteCoupon = useCallback((couponCode: string) => {
    setCoupons((prev) => prev.filter((coupon) => coupon.code !== couponCode));
  }, []);

  // 쿠폰 검증
  const validateCoupon = useCallback(
    (couponCode: string): Coupon | null => {
      const coupon = coupons.find((c) => c.code === couponCode);
      return coupon || null;
    },
    [coupons]
  );

  // 쿠폰 적용 가능 여부 확인
  const canApplyCoupon = useCallback(
    (couponCode: string, cartTotal: number): boolean => {
      const coupon = validateCoupon(couponCode);
      if (!coupon) return false;

      // percentage 쿠폰은 10,000원 이상 구매 시에만 사용 가능
      if (coupon.discountType === "percentage" && cartTotal < 10000) {
        return false;
      }

      return true;
    },
    [validateCoupon]
  );

  // 할인 금액 계산
  const calculateDiscount = useCallback(
    (coupon: Coupon, cartTotal: number): number => {
      if (coupon.discountType === "amount") {
        return Math.min(coupon.discountValue, cartTotal);
      } else {
        return Math.round(cartTotal * (coupon.discountValue / 100));
      }
    },
    []
  );

  // 최종 금액 계산
  const calculateFinalAmount = useCallback(
    (coupon: Coupon, cartTotal: number): number => {
      const discount = calculateDiscount(coupon, cartTotal);
      return Math.max(0, cartTotal - discount);
    },
    [calculateDiscount]
  );

  // 쿠폰 폼 제출 처리
  const handleCouponSubmit = useCallback(
    (
      e: React.FormEvent,
      addNotification: (
        message: string,
        type?: "success" | "error" | "warning"
      ) => void
    ) => {
      e.preventDefault();
      const existingCoupon = coupons.find((c) => c.code === couponForm.code);
      if (existingCoupon) {
        addNotification("이미 존재하는 쿠폰 코드입니다.", "error");
        return;
      }

      const newCoupon: Coupon = {
        name: couponForm.name,
        code:
          couponForm.code ||
          couponForm.name.replace(/\s+/g, "").toUpperCase() + Date.now(),
        discountType: couponForm.discountType,
        discountValue: couponForm.discountValue,
      };

      setCoupons((prev) => [...prev, newCoupon]);
      addNotification("쿠폰이 추가되었습니다.", "success");
      setCouponForm({
        name: "",
        code: "",
        discountType: "percentage",
        discountValue: 0,
      });
      setShowCouponForm(false);
    },
    [coupons, couponForm]
  );

  // 쿠폰 폼 리셋
  const resetCouponForm = useCallback(() => {
    setCouponForm({
      name: "",
      code: "",
      discountType: "percentage",
      discountValue: 0,
    });
    setShowCouponForm(false);
  }, []);

  return {
    // 상태
    coupons,
    showCouponForm,
    couponForm,

    // 상태 변경 함수들
    setCoupons,
    setShowCouponForm,
    setCouponForm,

    // 액션 함수들
    addCoupon,
    deleteCoupon,
    validateCoupon,
    canApplyCoupon,
    calculateDiscount,
    calculateFinalAmount,
    handleCouponSubmit,
    resetCouponForm,
  };
};
