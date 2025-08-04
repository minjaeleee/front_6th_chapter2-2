import { useState, useCallback } from "react";
import { ProductWithUI } from "../models";
import { useLocalStorage } from "./useLocalStorage";
import { initialProducts } from "../constants";

export const useProducts = () => {
  const [products, setProducts] = useLocalStorage("products", initialProducts);

  // 상품 폼 관련 상태
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    stock: 0,
    description: "",
    discounts: [] as Array<{ quantity: number; rate: number }>,
  });

  // 상품 추가
  const addProduct = useCallback(
    (product: {
      name: string;
      price: number;
      stock: number;
      description: string;
      discounts: Array<{ quantity: number; rate: number }>;
    }) => {
      const newProduct: ProductWithUI = {
        id: Date.now().toString(),
        ...product,
      };
      setProducts((prev) => [...prev, newProduct]);
    },
    [setProducts]
  );

  // 상품 수정
  const updateProduct = useCallback(
    (
      id: string,
      updatedProduct: {
        name: string;
        price: number;
        stock: number;
        description: string;
        discounts: Array<{ quantity: number; rate: number }>;
      }
    ) => {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? { ...product, ...updatedProduct } : product
        )
      );
    },
    [setProducts]
  );

  // 상품 삭제
  const deleteProduct = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((product) => product.id !== id));
    },
    [setProducts]
  );

  // 상품 편집 시작
  const startEditProduct = useCallback((product: ProductWithUI) => {
    setEditingProduct(product.id);
    setProductForm({
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description || "",
      discounts: product.discounts || [],
    });
    setShowProductForm(true);
  }, []);

  // 상품 폼 리셋
  const resetProductForm = useCallback(() => {
    setProductForm({
      name: "",
      price: 0,
      stock: 0,
      description: "",
      discounts: [],
    });
    setEditingProduct(null);
    setShowProductForm(false);
  }, []);

  return {
    // 상품 데이터
    products,

    // 폼 상태
    editingProduct,
    showProductForm,
    productForm,

    // 액션 함수들
    addProduct,
    updateProduct,
    deleteProduct,
    startEditProduct,
    resetProductForm,

    // 상태 설정 함수들
    setEditingProduct,
    setShowProductForm,
    setProductForm,
  };
};
