import { useState, useEffect, useMemo } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import CompanyFormDialog from "@/components/CompanyFormDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Product, Company, ItemWithRelations } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Extend ItemWithRelations for client-side display properties
type ProductWithCompany = ItemWithRelations & {
  companyName: string;
  categoryName: string;
  companyPhone: string;
  companyEmail: string;
};

async function fetchProducts(userId?: string): Promise<ProductWithCompany[]> {
  const url = userId ? `/api/products?userId=${userId}` : "/api/products";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  return res.json();
}

export default function ProductsAndServices() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCompany | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCompany | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [sort, setSort] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { data: products = [], isLoading, error } = useQuery<ProductWithCompany[]>({
    queryKey: ["products", filters.userId || "all"],
    queryFn: () => fetchProducts(filters.userId),
  });

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const category = params.get('category');
    if (category) {
      setFilters((prev: any) => ({ ...prev, category }));
    }
  }, [location]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Auto-apply search filter immediately
    setFilters((prev: any) => ({
      ...prev,
      search: query,
      showMyProducts: user?.id ? prev.showMyProducts || false : false,
      userId: prev.showMyProducts ? user?.id : undefined
    }));
  };

  const handleReset = () => {
    setFilters({});
    setSearchQuery("");
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Apply user filtering first (server-side filtering should already be applied)
    // But if user filter is active, we should only show user's products
    if (filters.userId) {
      // Server should already filter by userId, but double-check
      result = result.filter((p) => p.userId === filters.userId);
    }

    // Search filtering
    if (filters.search && filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      const queryWords = query.split(/\s+/);

      result = result.filter((product) => {
        const searchableText = `${product.name} ${product.description || ''} ${product.categoryName} ${product.companyName}`.toLowerCase();

        // Check if all query words are found in the searchable text (spelling tolerant by allowing partial matches)
        return queryWords.every((word: string) =>
          searchableText.includes(word)
        );
      });
    }

    // Category filtering
    if (filters.category) {
      const selectedCategories = filters.category.split(',');
      if (selectedCategories.length > 0) {
        result = result.filter((p) => selectedCategories.includes(p.categoryName));
      }
    }

    // Price filtering
    if (filters.priceRange) {
      result = result.filter((p) => {
        const price = p.price || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    // Sorting
    switch (sort) {
      case "price-low":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "latest":
      default:
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    return result;
  }, [products, filters, sort]);

  const ITEMS_PER_PAGE = 16;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen">
      <div className="flex">
        <aside className="hidden lg:block w-80 border-r p-6 min-h-screen sticky top-16">
          <FilterPanel
            type="products-services"
            onApply={setFilters}
            onReset={handleReset}
            onSearch={handleSearch}
            userId={user?.id}
          />
        </aside>

        <main className="flex-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <h1 className="text-3xl font-heading font-semibold">{t("browseProductsAndServices")}</h1>
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
                        type="products-services"
                        onApply={setFilters}
                        onReset={handleReset}
                        onSearch={handleSearch}
                        userId={user?.id}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-48" data-testid="select-sort">
                    <SelectValue placeholder={t("sortBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">{t("latest")}</SelectItem>
                    <SelectItem value="price-low">{t("priceLowHigh")}</SelectItem>
                    <SelectItem value="price-high">{t("priceHighLow")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductForm(true);
                  }}
                  data-testid="button-add-product"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addProduct")}
                </Button>
              </div>
            </div>

            {isLoading && <p>Loading products...</p>}
            {error && <p className="text-red-500">Error fetching products.</p>}
            {!isLoading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                    name={product.name}
                    company={product.companyName}
                    category={product.categoryName}
                    price={product.price || 0}
                    unit={product.unit || ""}
                    imageUrls={product.imageUrls || []} // imageUrls is already string[] | null
                    companyPhone={product.companyPhone}
                    companyEmail={product.companyEmail}
                    onClick={() => setSelectedProduct(product)}
                  />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-8">
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                    >
                      {t("previous")}
                    </Button>
                    <span className="mx-4">
                      {t("page")} {currentPage} {t("of")} {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                    >
                      {t("next")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your product
        and remove its data from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={async () => {
        if (productToDelete) {
          try {
            const response = await fetch(`/api/products/${productToDelete}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              toast({
                title: "Success",
                description: "Product deleted successfully.",
              });
              // Refresh products
              window.location.reload(); // Or use queryClient.invalidateQueries
            } else {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to delete product');
            }
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "An error occurred during deletion.",
              variant: "destructive",
            });
          } finally {
            setProductToDelete(null);
            setSelectedProduct(null); // Close detail modal after deletion
          }
        }
      }}>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>



      <ProductFormDialog
        open={showProductForm}
        onOpenChange={(open) => {
          setShowProductForm(open);
          if (!open) {
            setEditingProduct(null);
          }
        }}
        product={editingProduct ? {
          id: editingProduct.id,
          name: editingProduct.name,
          categoryId: editingProduct.categoryId || "",
          companyId: editingProduct.companyId || "",
          price: editingProduct.price || 0,
          unit: editingProduct.unit || "",
          description: editingProduct.description || "",
          imageUrls: editingProduct.imageUrls || [],
        } : undefined}
        mode={editingProduct ? "edit" : "add"}
        onOpenCompanyForm={() => setShowCompanyForm(true)}
      />

      <CompanyFormDialog open={showCompanyForm} onOpenChange={setShowCompanyForm} mode="add" />

      {selectedProduct && (
        <ProductDetailModal
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          product={{
            ...selectedProduct,
            company: selectedProduct.companyName,
            category: selectedProduct.categoryName,
            price: selectedProduct.price || 0,
            unit: selectedProduct.unit || "",
            categoryId: selectedProduct.categoryId || "", // Provide default empty string
            companyId: selectedProduct.companyId || "",   // Provide default empty string
            images: selectedProduct.imageUrls || [], // imageUrls is already string[] | null
            description: selectedProduct.description || "",
            companyPhone: selectedProduct.companyPhone,
            companyEmail: selectedProduct.companyEmail,
            isOwner: user?.id === selectedProduct.userId,
          }}
          mode="view"
          onDelete={() => {
            setProductToDelete(selectedProduct.id);
            setShowDeleteConfirm(true);
          }}
        />
      )}
    </div>
  );
}
