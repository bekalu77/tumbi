import { useState, useEffect } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ProductCard from "@/components/ProductCard";
import FilterPanel from "@/components/FilterPanel";
import ProductDetailModal from "@/components/ProductDetailModal";
import ProductFormDialog from "@/components/ProductFormDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import productImage from "@assets/stock_images/construction_materia_151531d6.jpg";

export default function BrowseProducts() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const category = params.get('category');
    if (category) {
      setSelectedCategory(category);
      console.log("Category filter applied:", category);
    }
  }, [location]);

  const products = Array.from({ length: 12 }, (_, i) => ({
    id: `${i + 1}`,
    name: `Product ${i + 1}`,
    company: "Sample Company",
    category: ["Cement", "Steel", "Wood", "Tiles"][i % 4],
    price: 450 + i * 50,
    unit: "bag",
    image: productImage,
    companyPhone: "+251 11 123 4567",
    companyEmail: "contact@samplecompany.com",
    madeOf: "Quality materials",
    description: "High-quality construction material suitable for all types of projects.",
    images: [productImage, productImage, productImage],
    isOwner: i === 0,
  }));

  return (
    <div className="min-h-screen">
      <div className="flex">
        <aside className="hidden lg:block w-80 border-r p-6 min-h-screen sticky top-16">
          <FilterPanel
            type="products"
            onApply={(filters) => console.log("Filters applied:", filters)}
            onReset={() => console.log("Filters reset")}
          />
        </aside>

        <main className="flex-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <h1 className="text-3xl font-heading font-semibold">{t("browseProducts")}</h1>
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden" data-testid="button-filters-mobile">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {t("filters")}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>{t("filters")}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterPanel
                        type="products"
                        onApply={(filters) => console.log("Filters applied:", filters)}
                        onReset={() => console.log("Filters reset")}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select defaultValue="latest">
                  <SelectTrigger className="w-48" data-testid="select-sort">
                    <SelectValue placeholder={t("sortBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">{t("latest")}</SelectItem>
                    <SelectItem value="price-low">{t("priceLowHigh")}</SelectItem>
                    <SelectItem value="price-high">{t("priceHighLow")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      <Button
        size="lg"
        onClick={() => setShowProductForm(true)}
        className="fixed top-24 right-6 rounded-full h-14 px-6 shadow-2xl z-40"
        data-testid="button-add-product"
      >
        <Plus className="h-5 w-5 mr-2" />
        {t("addProduct")}
      </Button>

      <ProductFormDialog open={showProductForm} onOpenChange={setShowProductForm} mode="add" />

      {selectedProduct && (
        <ProductDetailModal
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          product={selectedProduct}
          onEdit={() => console.log("Edit product")}
          onDelete={() => console.log("Delete product")}
        />
      )}
    </div>
  );
}
