import { useState, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { ProductWithUI } from "../../domain/product/models";
import { searchTermAtom } from "../atoms";

export const useSearch = (products: ProductWithUI[], debounceDelay = 500) => {
  const [searchTerm] = useAtom(searchTermAtom);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // 디바운싱 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceDelay]);

  // 필터링된 상품 목록 계산
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm) {
      return products;
    }

    return products.filter((product) => {
      const matchesName = product.name
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());

      const matchesDescription =
        product.description &&
        product.description
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      return matchesName || matchesDescription;
    });
  }, [products, debouncedSearchTerm]);

  return {
    debouncedSearchTerm,
    filteredProducts,
  };
};
