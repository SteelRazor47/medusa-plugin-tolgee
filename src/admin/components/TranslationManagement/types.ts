import { AdminProduct } from "@medusajs/framework/types";
import { toast as medusaToast } from "@medusajs/ui";

export interface Language {
  label: string;
  tag: string;
};



export interface Props {
  product: AdminProduct;
  notify: typeof medusaToast;
  availableLanguages: Language[];
  defaultLanguage: string;
  handleLanguageChange: (lang: string) => void;
};

export interface RequestQuery {
  productId: string;
};

export interface ResponseData {
  keyNames: string[];
};
