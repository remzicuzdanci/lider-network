export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  slug: string;
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  series: string;
  name: string;
  shortName: string;
  description: string;
  targetAudience: string[];
  specs: ProductSpec[];
  highlights: string[];
  badge?: string;
  isNew?: boolean;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export interface BrandData {
  slug: string;
  name: string;
  description: string;
  accentColor: string;
  logo?: string;
  categories: { slug: string; label: string }[];
}
