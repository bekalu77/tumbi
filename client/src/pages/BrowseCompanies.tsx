import { useState, useMemo } from "react";
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
import CompanyCard from "@/components/CompanyCard";
import FilterPanel from "@/components/FilterPanel";
import CompanyDetailModal from "@/components/CompanyDetailModal";
import CompanyFormDialog from "@/components/CompanyFormDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Company, Item } from "@shared/schema";
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

async function fetchCompanies(userId?: string): Promise<Company[]> {
  const url = userId ? `/api/companies?userId=${userId}` : "/api/companies";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch companies");
  }
  return res.json();
}

async function fetchProductsByCompany(companyId: string): Promise<Item[]> {
  const res = await fetch(`/api/companies/${companyId}/products`);
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  return res.json();
}

export default function BrowseCompanies() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [sort, setSort] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  const { data: companies = [], isLoading, error } = useQuery<Company[]>({
    queryKey: ["companies", filters.userId || "all"],
    queryFn: () => fetchCompanies(filters.userId),
  });

  const { data: selectedCompanyProducts = [] } = useQuery<Item[]>({
    queryKey: ["products", selectedCompany?.id],
    queryFn: () => fetchProductsByCompany(selectedCompany!.id),
    enabled: !!selectedCompany,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Auto-apply search filter immediately
    setFilters((prev: any) => ({
      ...prev,
      search: query,
      showMyCompanies: user?.id ? prev.showMyCompanies || false : false,
      userId: prev.showMyCompanies ? user?.id : undefined
    }));
  };

  const handleReset = () => {
    setFilters({});
    setSearchQuery("");
  };

  const filteredAndSortedCompanies = useMemo(() => {
    let result = [...companies];

    // Apply user filtering first (server-side filtering should already be applied)
    // But if user filter is active, we should only show user's companies
    if (filters.userId) {
      // Server should already filter by userId, but double-check
      result = result.filter((c) => c.userId === filters.userId);
    }

    // Search filtering
    if (filters.search && filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      const queryWords = query.split(/\s+/);

      result = result.filter((company) => {
        const searchableText = `${company.name} ${company.description || ''} ${company.companyType || ''} ${company.location || ''}`.toLowerCase();

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
        result = result.filter((c) => selectedCategories.includes(c.companyType || ""));
      }
    }

    // Location filtering
    if (filters.location) {
      result = result.filter((c) => c.location?.toLowerCase().includes(filters.location.toLowerCase()));
    }

    // Sorting
    switch (sort) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "latest":
      default:
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    return result;
  }, [companies, filters, sort]);

  const ITEMS_PER_PAGE = 9;
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedCompanies, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedCompanies.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen">
      <div className="flex">
        <aside className="hidden lg:block w-80 border-r p-6 min-h-screen sticky top-16">
          <FilterPanel
            type="companies"
            onApply={setFilters}
            onReset={handleReset}
            onSearch={handleSearch}
            userId={user?.id}
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
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCompany(null);
                    setShowCompanyForm(true);
                  }}
                  data-testid="button-register-company"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("registerCompany")}
                </Button>
              </div>
            </div>

            {isLoading && <p>Loading companies...</p>}
            {error && <p className="text-red-500">Error fetching companies.</p>}
            {!isLoading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedCompanies.map((company) => (
                    <CompanyCard
                      key={company.id}
                      {...company}
                    description={company.description || ""}
                    location={company.location || ""}
                    category={company.companyType || "General"}
                    onClick={() => setSelectedCompany(company)}
                    onDelete={() => {
                      setCompanyToDelete(company.id);
                      setShowDeleteConfirm(true);
                    }}
                    isVerified={company.isVerified ?? false}
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
        This action cannot be undone. This will permanently delete your company
        and remove its data from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={async () => {
        if (companyToDelete) {
          try {
            const response = await fetch(`/api/companies/${companyToDelete}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              toast({
                title: "Success",
                description: "Company deleted successfully.",
              });
              // Refresh companies
              window.location.reload(); // Or use queryClient.invalidateQueries
            } else {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to delete company');
            }
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "An error occurred during deletion.",
              variant: "destructive",
            });
          } finally {
            setCompanyToDelete(null);
            setSelectedCompany(null); // Close detail modal after deletion
          }
        }
      }}>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>



      <CompanyFormDialog
        open={showCompanyForm}
        onOpenChange={(open) => {
          setShowCompanyForm(open);
          if (!open) {
            setEditingCompany(null);
          }
        }}
        company={editingCompany ? {
          id: editingCompany.id,
          name: editingCompany.name,
          email: editingCompany.email || "",
          phone: editingCompany.phone || "",
          description: editingCompany.description || "",
          location: editingCompany.location || "",
          website: editingCompany.website || "",
        } : undefined}
        mode={editingCompany ? "edit" : "add"}
        onSuccess={() => {
          setShowCompanyForm(false);
          setEditingCompany(null);
        }}
      />

      {selectedCompany && (
        <CompanyDetailModal
          open={!!selectedCompany}
          onOpenChange={(open: boolean) => !open && setSelectedCompany(null)}
          company={{
            ...selectedCompany,
            description: selectedCompany.description || "",
            location: selectedCompany.location || "",
            email: selectedCompany.email || undefined,
            phone: selectedCompany.phone || undefined,
            website: selectedCompany.website || undefined,
            logoUrl: selectedCompany.logoUrl || undefined,
            typeId: selectedCompany.typeId || undefined,
            products: selectedCompanyProducts.map(p => ({
              id: p.id,
              name: p.name,
              company: selectedCompany.name,
              category: "Unknown",
              price: p.price || 0,
              unit: p.unit || "N/A",
              imageUrls: p.imageUrls || [], // Changed to imageUrls and ensured it's an array
            })),
            isOwner: user?.id === selectedCompany.userId,
          }}
          mode="view" // Added mode prop
          onDelete={() => {
            setCompanyToDelete(selectedCompany.id);
            setShowDeleteConfirm(true);
          }}
        />
      )}
    </div>
  );
}
