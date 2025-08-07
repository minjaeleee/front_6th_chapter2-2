import { atom } from "jotai";
import { Product } from "../models";

export const productsAtom = atom<Product[]>([]);
export const editingProductAtom = atom<Product | null>(null);
export const showProductFormAtom = atom(false);
export const productFormAtom = atom({
  name: "",
  price: 0,
  stock: 0,
  category: "",
  description: "",
  image: "",
});
