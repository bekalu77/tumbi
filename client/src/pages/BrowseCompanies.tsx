import { useState } from "react";
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
import CompanyCard from "@/components/CompanyCard";
import FilterPanel from "@/components/FilterPanel";
import CompanyDetailModal from "@/components/CompanyDetailModal";
import { useLanguage } from "@/contexts/LanguageContext";
import productImage from "@assets/stock_images/construction_materia_151531d6.jpg";

export default function BrowseCompanies() {
  const { t } = useLanguage();
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const companies = Array.from({ length: 8 }, (_, i) => ({
    id: `${i + 1}`,
    name: `Company ${i + 1}`,
    description: "Leading construction materials supplier with state-of-the-art facilities and commitment to quality.",
    location: "Addis Ababa, Ethiopia",
    category: ["Cement", "Steel", "Wood", "Tiles"][i % 4],
    productCount: 12 + i * 3,
    products: [
      {
        id: "1",
        name: "Product 1",
        company: `Company ${i + 1}`,
        category: "Cement",
        price: 450,
        unit: "bag",
        image: productImage,
      },
    ],
    isOwner: i === 0,
  }));

  return (
    <div className="min-h-screen">
      <div className="flex">
        <aside className="hidden lg:block w-80 border-r p-6 min-h-screen sticky top-16">
          <FilterPanel
            type="companies"
            onApply={(filters) => console.log("Filters applied:", filters)}
            onReset={() => console.log("Filters reset")}
          />
        </aside>

        <main className="flex-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <h1 className="text-3xl font-heading font-semibold">{t("browseCompanies")}</h1>
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
                        type="companies"
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
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="products">Most Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <CompanyCard
                  key={company.id}
                  {...company}
                  onClick={() => setSelectedCompany(company)}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      <Button
        size="lg"
        className="fixed top-24 right-6 rounded-full h-14 px-6 shadow-2xl z-40"
        data-testid="button-register-company"
      >
        <Plus className="h-5 w-5 mr-2" />
        {t("registerCompany")}
      </Button>

      {selectedCompany && (
        <CompanyDetailModal
          open={!!selectedCompany}
          onOpenChange={(open) => !open && setSelectedCompany(null)}
          company={selectedCompany}
          onEdit={() => console.log("Edit company")}
          onDelete={() => console.log("Delete company")}
        />
      )}
    </div>
  );
}
