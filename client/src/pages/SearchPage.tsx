import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/ProductCard";
import CompanyCard from "@/components/CompanyCard";
import TenderCard from "@/components/TenderCard";
import JobCard from "@/components/JobCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { Search as SearchIcon, Package, Building2, Newspaper, Factory, Briefcase } from "lucide-react";
import { Company, Job, ItemWithRelations } from "@shared/schema";

// Define Product as ItemWithRelations to include company and category details
type Product = ItemWithRelations;

interface Tender {
  id: string;
  tenderNo: number;
  title: string;
  bidOpeningDate: string;
  region: string;
  category: string;
  publishedOn: string;
  featured?: boolean;
  content: string;
}

// ... your interfaces remain the same ...

export default function SearchPage() {
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("all");

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);

  // Function to fetch search results
  const fetchSearchResults = async (query: string) => {
    if (!query.trim()) {
      setFilteredProducts([]);
      setFilteredCompanies([]);
      setFilteredTenders([]);
      setFilteredJobs([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&types=products,companies,tenders,jobs`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      setFilteredProducts(data.products || []);
      setFilteredCompanies(data.companies || []);
      setFilteredTenders(data.tenders || []);
      setFilteredJobs(data.jobs || []);

    } catch (err: any) {
      console.error("Error fetching search data:", err);
      setError("Failed to load search results. Please try again.");
      
      // Clear results on error
      setFilteredProducts([]);
      setFilteredCompanies([]);
      setFilteredTenders([]);
      setFilteredJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract search query from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query") || "";
    setSearchQuery(query);
    
    // If there's a query in the URL, fetch results
    if (query) {
      fetchSearchResults(query);
    } else {
      // If no query, clear all results
      setFilteredProducts([]);
      setFilteredCompanies([]);
      setFilteredTenders([]);
      setFilteredJobs([]);
    }
  }, []); // Empty dependency array - only run on mount

  // Handle search submission - THIS IS THE KEY FIX
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    
    if (trimmedQuery) {
      // Update the URL
      setLocation(`/search?query=${encodeURIComponent(trimmedQuery)}`);
      // DIRECTLY call fetchSearchResults instead of relying on useEffect
      fetchSearchResults(trimmedQuery);
    } else {
      // If search is empty, go to search page without query
      setLocation('/search');
      // Clear results
      setFilteredProducts([]);
      setFilteredCompanies([]);
      setFilteredTenders([]);
      setFilteredJobs([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setFilteredCompanies(filteredCompanies.filter((c) => c.id !== id));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete company: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("An error occurred while deleting the company.");
    }
  };

  const totalResults = filteredProducts.length + filteredCompanies.length + filteredTenders.length + filteredJobs.length;

  return (
    <div className="min-h-screen bg-background">
      <section className="py-12 px-4 border-b">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">{t("searchResults")}</h1>
          <p className="text-muted-foreground text-lg">
            {searchQuery ? `${totalResults} results found for "${searchQuery}"` : "Enter a search term to find products, companies, tenders, and jobs"}
          </p>
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto mt-6 flex items-center gap-2">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="search"
              placeholder={t("searchAll")}
              className="flex-1 pl-12 h-12 rounded-full text-lg bg-background shadow-sm"
              value={searchQuery}
              onChange={handleInputChange}
            />
            <Button 
              type="submit" 
              className="h-12 px-8 rounded-full"
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : t("search")}
            </Button>
          </form>
        </div>
      </section>

      {/* Only show results if there's a search query */}
      {searchQuery && (
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto mb-8">
                <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
                <TabsTrigger value="products">Products ({filteredProducts.length})</TabsTrigger>
                <TabsTrigger value="companies">Companies ({filteredCompanies.length})</TabsTrigger>
                <TabsTrigger value="tenders">Tenders ({filteredTenders.length})</TabsTrigger>
                <TabsTrigger value="jobs">Jobs ({filteredJobs.length})</TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Searching for "{searchQuery}"...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-lg text-red-500 mb-4">Error: {error}</p>
                  <Button onClick={() => fetchSearchResults(searchQuery)}>Try Again</Button>
                </div>
              ) : (
                <>
                  <TabsContent value="all">
                    {totalResults === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No results found for "{searchQuery}". Try different keywords.
                      </div>
                    ) : (
                      <div className="space-y-12">
                        {filteredProducts.length > 0 && (
                          <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                              <Package className="h-6 w-6 text-primary" /> Products ({filteredProducts.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {filteredProducts.map((product) => (
                                <ProductCard 
                                  key={product.id} 
                                  {...product}
                                  company={product.company?.name || null}
                                  category={product.category?.category || 'N/A'}
                                  price={product.price || 0}
                                  imageUrls={product.imageUrls || []}
                                  onClick={() => setSelectedProduct(product)} 
                                />
                              ))}
                            </div>
                            {filteredProducts.length > 4 && (
                              <div className="text-center mt-8">
                                <Button variant="outline" onClick={() => setCurrentTab("products")}>View All Products</Button>
                              </div>
                            )}
                          </div>
                        )}

                        {filteredCompanies.length > 0 && (
                          <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                              <Factory className="h-6 w-6 text-primary" /> Companies ({filteredCompanies.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {filteredCompanies.map((company) => (
                                <CompanyCard 
                                  key={company.id} 
                                  {...company} 
                                  category={company.companyType || 'N/A'}
                                  description={company.description || 'N/A'}
                                  location={company.location || 'N/A'}
                                  isVerified={company.isVerified || false}
                                  onClick={() => setLocation(`/companies?id=${company.id}`)}
                                  onDelete={() => handleDeleteCompany(company.id)}
                                />
                              ))}
                            </div>
                            {filteredCompanies.length > 3 && (
                              <div className="text-center mt-8">
                                <Button variant="outline" onClick={() => setCurrentTab("companies")}>View All Companies</Button>
                              </div>
                            )}
                          </div>
                        )}

                        {filteredTenders.length > 0 && (
                          <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                              <Newspaper className="h-6 w-6 text-primary" /> Tenders ({filteredTenders.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {filteredTenders.map((tender) => (
                                <TenderCard
                                  key={tender.id}
                                  id={tender.id}
                                  frontMatter={{
                                    tender_no: tender.tenderNo,
                                    closing: tender.title,
                                    opening: tender.bidOpeningDate,
                                    region: tender.region,
                                    category: tender.category,
                                    published: tender.publishedOn,
                                    featured: tender.featured,
                                  }}
                                  contentHtml={tender.content}
                                  onClick={() => setSelectedTender(tender)}
                                />
                              ))}
                            </div>
                            {filteredTenders.length > 4 && (
                              <div className="text-center mt-8">
                                <Button variant="outline" onClick={() => setCurrentTab("tenders")}>View All Tenders</Button>
                              </div>
                            )}
                          </div>
                        )}

                        {filteredJobs.length > 0 && (
                          <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                              <Briefcase className="h-6 w-6 text-primary" /> Jobs ({filteredJobs.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {filteredJobs.map((job) => (
                                <JobCard key={job.id} {...job} />
                              ))}
                            </div>
                            {filteredJobs.length > 4 && (
                              <div className="text-center mt-8">
                                <Button variant="outline" onClick={() => setCurrentTab("jobs")}>View All Jobs</Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="products">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No products found for "{searchQuery}".</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                          <ProductCard 
                            key={product.id} 
                            {...product} 
                            company={product.company?.name || null}
                            category={product.category?.category || 'N/A'}
                            price={product.price || 0}
                            imageUrls={product.imageUrls || []}
                            onClick={() => setSelectedProduct(product)} 
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="companies">
                    {filteredCompanies.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No companies found for "{searchQuery}".</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCompanies.map((company) => (
                          <CompanyCard 
                            key={company.id} 
                            {...company} 
                            category={company.companyType || 'N/A'}
                            description={company.description || 'N/A'}
                            location={company.location || 'N/A'}
                            isVerified={company.isVerified || false}
                            onClick={() => setLocation(`/companies?id=${company.id}`)}
                            onDelete={() => handleDeleteCompany(company.id)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tenders">
                    {filteredTenders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No tenders found for "{searchQuery}".</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTenders.map((tender) => (
                          <TenderCard
                            key={tender.id}
                            id={tender.id}
                            frontMatter={{
                              tender_no: tender.tenderNo,
                              closing: tender.title,
                              opening: tender.bidOpeningDate,
                              region: tender.region,
                              category: tender.category,
                              published: tender.publishedOn,
                              featured: tender.featured,
                            }}
                            contentHtml={tender.content}
                            onClick={() => setSelectedTender(tender)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="jobs">
                    {filteredJobs.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No jobs found for "{searchQuery}".</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredJobs.map((job) => (
                          <JobCard key={job.id} {...job} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </section>
      )}

      {/* Your modals remain the same */}
      {selectedProduct && (
        <ProductDetailModal
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          product={{
            ...selectedProduct,
            company: selectedProduct.company?.name || null,
            category: selectedProduct.category?.category || 'N/A',
            images: selectedProduct.imageUrls || [],
            categoryId: selectedProduct.categoryId || "",
            companyId: selectedProduct.companyId || "",
            price: selectedProduct.price || 0,
            unit: selectedProduct.unit || "",
            description: selectedProduct.description || "",
          }}
          mode="view"
        />
      )}

      {selectedTender && (
        <TenderCard
          id={selectedTender.id}
          frontMatter={{
            tender_no: selectedTender.tenderNo,
            closing: selectedTender.title,
            opening: selectedTender.bidOpeningDate,
            region: selectedTender.region,
            category: selectedTender.category,
            published: selectedTender.publishedOn,
            featured: selectedTender.featured,
          }}
          contentHtml={selectedTender.content}
          isExpanded={true}
          onClose={() => setSelectedTender(null)}
        />
      )}
    </div>
  );
}
