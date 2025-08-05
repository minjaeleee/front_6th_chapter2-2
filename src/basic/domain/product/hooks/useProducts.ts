import { useState, useCallback } from "react";
import { ProductWithUI } from "../models";
import { useLocalStorage } from "../../../shared/hooks";
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
    (newProduct: Omit<ProductWithUI, "id">) => {
      const product: ProductWithUI = {
        ...newProduct,
        id: Date.now().toString(),
      };
      setProducts((prev) => [...prev, product]);
      setShowProductForm(false);
      setProductForm({
        name: "",
        price: 0,
        stock: 0,
        description: "",
        discounts: [],
      });
    },
    [setProducts]
  );

  // 상품 수정
  const updateProduct = useCallback(
    (productId: string, updates: Partial<ProductWithUI>) => {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, ...updates } : product
        )
      );
      setEditingProduct(null);
      setShowProductForm(false);
      setProductForm({
        name: "",
        price: 0,
        stock: 0,
        description: "",
        discounts: [],
      });
    },
    [setProducts]
  );

  // 상품 삭제
  const deleteProduct = useCallback(
    (productId: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
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

  // 할인 추가
  const addDiscount = useCallback(() => {
    setProductForm((prev) => ({
      ...prev,
      discounts: [...prev.discounts, { quantity: 0, rate: 0 }],
    }));
  }, []);

  // 할인 제거
  const removeDiscount = useCallback((index: number) => {
    setProductForm((prev) => ({
      ...prev,
      discounts: prev.discounts.filter((_, i) => i !== index),
    }));
  }, []);

  // 할인 업데이트
  const updateDiscount = useCallback(
    (index: number, field: string, value: number) => {
      setProductForm((prev) => ({
        ...prev,
        discounts: prev.discounts.map((discount, i) =>
          i === index ? { ...discount, [field]: value } : discount
        ),
      }));
    },
    []
  );

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
    products,
    editingProduct,
    showProductForm,
    productForm,
    setEditingProduct,
    setShowProductForm,
    setProductForm,
    addProduct,
    updateProduct,
    deleteProduct,
    startEditProduct,
    resetProductForm,
    addDiscount,
    removeDiscount,
    updateDiscount,
  };
};
