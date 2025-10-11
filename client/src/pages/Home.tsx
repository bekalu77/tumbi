import { useState } from "react";
import { Search, Package, Building2, Hammer, Wrench, PaintBucket, Grid3x3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@assets/stock_images/modern_construction__205af1a1.jpg";
import productImage from "@assets/stock_images/construction_materia_151531d6.jpg";

export default function Home() {
  const { t } = useLanguage();
  const [browseMode, setBrowseMode] = useState<"products" | "companies">("products");

  const categories = [
    { icon: Hammer, label: t("cement"), count: 24 },
    { icon: Grid3x3, label: t("steel"), count: 18 },
    { icon: Package, label: t("wood"), count: 32 },
    { icon: Grid3x3, label: t("tiles"), count: 15 },
    { icon: PaintBucket, label: t("paint"), count: 28 },
    { icon: Wrench, label: t("other"), count: 42 },
  ];

  const recentProducts = [
    {
      id: "1",
      name: "Portland Cement Grade 42.5",
      company: "Derba Midroc Cement",
      category: "Cement",
      price: 450,
      unit: "bag",
      image: productImage,
      companyPhone: "+251 11 123 4567",
      companyEmail: "contact@derba.com",
    },
    {
      id: "2",
      name: "Steel Rebar 12mm",
      company: "Ethiopian Steel",
      category: "Steel",
      price: 2800,
      unit: "ton",
      image: productImage,
      companyPhone: "+251 25 111 2233",
      companyEmail: "info@ethsteel.com",
    },
    {
      id: "3",
      name: "Ceramic Floor Tiles",
      company: "Addis Tiles",
      category: "Tiles",
      price: 180,
      unit: "m2",
      image: productImage,
      companyPhone: "+251 11 555 6677",
      companyEmail: "sales@addistiles.com",
    },
    {
      id: "4",
      name: "Hardwood Planks",
      company: "Forest Products",
      category: "Wood",
      price: 850,
      unit: "m2",
      image: productImage,
      companyPhone: "+251 11 888 9900",
      companyEmail: "info@forestproducts.com",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative h-[500px] flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Construction site"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-6 drop-shadow-lg">
            {t("findQualityMaterials")}
          </h1>

          <div className="space-y-4">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("searchMaterials")}
                className="pl-12 h-14 rounded-full text-lg bg-background shadow-xl"
                data-testid="input-hero-search"
              />
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant={browseMode === "products" ? "default" : "outline"}
                onClick={() => setBrowseMode("products")}
                className={browseMode === "products" ? "" : "bg-background/80 backdrop-blur-sm"}
                data-testid="button-browse-products"
              >
                <Package className="h-4 w-4 mr-2" />
                {t("browseProducts")}
              </Button>
              <Button
                variant={browseMode === "companies" ? "default" : "outline"}
                onClick={() => setBrowseMode("companies")}
                className={browseMode === "companies" ? "" : "bg-background/80 backdrop-blur-sm"}
                data-testid="button-browse-companies"
              >
                <Building2 className="h-4 w-4 mr-2" />
                {t("browseCompanies")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-center">
            {t("popularCategories")}
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category, idx) => (
              <CategoryCard
                key={idx}
                icon={category.icon}
                label={category.label}
                count={category.count}
                onClick={() => console.log(`Category ${category.label} clicked`)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8">
            {t("recentlyAdded")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onClick={() => console.log(`Product ${product.id} clicked`)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
