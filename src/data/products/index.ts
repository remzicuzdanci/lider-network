import type { Product, BrandData } from "./types";
import { fortinetProducts } from "./fortinet";
import { synologyProducts } from "./synology";
import { hpeProducts } from "./hpe";
import { dellProducts } from "./dell";

export type { Product, BrandData };

export const allProducts: Product[] = [
  ...fortinetProducts,
  ...synologyProducts,
  ...hpeProducts,
  ...dellProducts,
];

export const brands: BrandData[] = [
  {
    slug: "fortinet",
    name: "Fortinet",
    description: "FortiGate, FortiSwitch, FortiAP ve yönetim platformlarını kapsayan tam kurumsal ağ güvenliği portföyü.",
    accentColor: "#EE3124",
    categories: [
      { slug: "fortigate", label: "FortiGate" },
      { slug: "fortiswitch", label: "FortiSwitch Erişim" },
      { slug: "fortiswitch-omurga", label: "FortiSwitch Omurga" },
      { slug: "fortiap", label: "FortiAP" },
      { slug: "fortianalyzer", label: "FortiAnalyzer" },
      { slug: "fortimanager", label: "FortiManager" },
    ],
  },
  {
    slug: "synology",
    name: "Synology",
    description: "Masaüstü NAS'tan all-flash veri merkezi çözümlerine kadar her ölçekte depolama ve yedekleme platformları.",
    accentColor: "#B5121B",
    categories: [
      { slug: "diskstation", label: "DiskStation" },
      { slug: "rackstation", label: "RackStation" },
      { slug: "all-flash", label: "All-Flash (PAS)" },
    ],
  },
  {
    slug: "hpe",
    name: "HPE",
    description: "ProLiant DL rack ve ML tower sunucu aileleri ile kurumsal hesaplama ve veri merkezi altyapısı.",
    accentColor: "#01A982",
    categories: [
      { slug: "proliant-dl", label: "ProLiant DL (Rack)" },
      { slug: "proliant-ml", label: "ProLiant ML (Tower)" },
    ],
  },
  {
    slug: "dell",
    name: "Dell",
    description: "PowerEdge rack ve tower sunucu portföyü ile KOBİ'den büyük veri merkezine geniş sunucu yelpazesi.",
    accentColor: "#007DB8",
    categories: [
      { slug: "poweredge-rack", label: "PowerEdge Rack" },
      { slug: "poweredge-tower", label: "PowerEdge Tower" },
    ],
  },
];

export function getBrand(slug: string): BrandData | undefined {
  return brands.find((b) => b.slug === slug);
}

export function getProductsByBrand(brandSlug: string): Product[] {
  return allProducts.filter((p) => p.brandSlug === brandSlug);
}

export function getProductsByCategory(brandSlug: string, categorySlug: string): Product[] {
  return allProducts.filter((p) => p.brandSlug === brandSlug && p.categorySlug === categorySlug);
}

export function getProduct(brandSlug: string, productSlug: string): Product | undefined {
  return allProducts.find((p) => p.brandSlug === brandSlug && p.slug === productSlug);
}
