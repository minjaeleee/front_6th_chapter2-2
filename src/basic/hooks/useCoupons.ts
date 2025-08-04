import { useState, useCallback, useEffect } from "react";
import { Coupon } from "../models";

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
  const addCoupon = useCallback(
    (
      newCoupon: Coupon,
      addNotification: (
        message: string,
        type?: "success" | "error" | "warning"
      ) => void
    ) => {
      const existingCoupon = coupons.find((c) => c.code === newCoupon.code);
      if (existingCoupon) {
        addNotification("이미 존재하는 쿠폰 코드입니다.", "error");
        return;
      }
      setCoupons((prev) => [...prev, newCoupon]);
      addNotification("쿠폰이 추가되었습니다.", "success");
    },
    [coupons]
  );

  // 쿠폰 삭제
  const deleteCoupon = useCallback(
    (
      couponCode: string,
      selectedCoupon: Coupon | null,
      setSelectedCoupon: (coupon: Coupon | null) => void,
      addNotification: (
        message: string,
        type?: "success" | "error" | "warning"
      ) => void
    ) => {
      setCoupons((prev) => prev.filter((c) => c.code !== couponCode));
      if (selectedCoupon?.code === couponCode) {
        setSelectedCoupon(null);
      }
      addNotification("쿠폰이 삭제되었습니다.", "success");
    },
    []
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
      addCoupon(couponForm, addNotification);
      setCouponForm({
        name: "",
        code: "",
        discountType: "amount",
        discountValue: 0,
      });
      setShowCouponForm(false);
    },
    [couponForm, addCoupon]
  );

  // 쿠폰 폼 리셋
  const resetCouponForm = useCallback(() => {
    setCouponForm({
      name: "",
      code: "",
      discountType: "amount",
      discountValue: 0,
    });
    setShowCouponForm(false);
  }, []);

  return {
    // 쿠폰 데이터
    coupons,

    // 폼 상태
    showCouponForm,
    couponForm,

    // 액션 함수들
    addCoupon,
    deleteCoupon,
    handleCouponSubmit,
    resetCouponForm,

    // 상태 설정 함수들
    setCoupons,
    setShowCouponForm,
    setCouponForm,
  };
};
