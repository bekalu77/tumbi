import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import ProductCard from "@/components/ProductCard";
import CompanyCard from "@/components/CompanyCard";
import CompanyDetailModal from "@/components/CompanyDetailModal";
import JobCard from "@/components/JobCard";
import TenderCard from "@/components/TenderCard";
import ArticleCard from "@/components/ArticleCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import AdCard from "@/components/AdCard";
import TenderFormDialog from "@/components/TenderFormDialog";
import { Search as SearchIcon } from "lucide-react";
import { ItemWithRelations, Company, Job } from "@shared/schema";
import matter from "gray-matter";
import yaml from 'js-yaml';
import { toast } from "sonner";

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

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  published_date: string;
  author: string;
  fileType?: 'md' | 'html';
  image?: string;
  read_time?: string;
  featured?: boolean;
  views?: number;
}

interface Ad {
  id: string;
  title: string;
  link: string;
  banner: string;
  status: 'on' | 'off';
}

export default function Admin() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("products");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTenderForm, setShowTenderForm] = useState(false);
  const [showAdForm, setShowAdForm] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null); // To track which ad is being edited
  const [adTitle, setAdTitle] = useState("");
  const [adLink, setAdLink] = useState("");
  const [adBanner, setAdBanner] = useState<File | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchData("products", 1);
  }, []);

  const handleAdStatusChange = async (id: string, status: "on" | "off") => {
    try {
      const response = await fetch(`/api/ads/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update ad status");
      }
  
      toast.success(`Ad status updated to ${status}`);
      setAds(ads.map(ad => ad.id === id ? {...ad, status} : ad))
    } catch (error) {
      toast.error("Failed to update ad status");
    }
  };

  const fetchData = async (type: string, page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?types=${type}&page=${page}&limit=16`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      switch (type) {
        case "products":
          const newProducts = data.products || [];
          setProducts(prev => page === 1 ? newProducts : [...prev, ...newProducts]);
          setFilteredProducts(prev => page === 1 ? newProducts : [...prev, ...newProducts]);
          setHasMore(newProducts.length > 0);
          break;
        case "companies":
          setCompanies(data.companies || []);
          setFilteredCompanies(data.companies || []);
          break;
        case "jobs":
          setJobs(data.jobs || []);
          setFilteredJobs(data.jobs || []);
          break;
        case "tenders":
          setTenders(data.tenders || []);
          setFilteredTenders(data.tenders || []);
          break;
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(`Failed to load ${type}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = async (value: string) => {
    setCurrentTab(value);

    switch (value) {
      case "products":
        if (products.length === 0) {
          setCurrentPage(1);
          setHasMore(true);
          await fetchData("products", 1);
        } else {
          setFilteredProducts(products);
        }
        break;
      case "companies":
        if (companies.length === 0) {
          await fetchData("companies", 1);
        } else {
          setFilteredCompanies(companies);
        }
        break;
      case "jobs":
        if (jobs.length === 0) {
          await fetchData("jobs", 1);
        } else {
          setFilteredJobs(jobs);
        }
        break;
      case "tenders":
        if (tenders.length === 0) {
          await fetchData("tenders", 1);
        } else {
          setFilteredTenders(tenders);
        }
        break;
      case "articles":
        if (articles.length === 0) {
          const fetchArticles = async () => {
            setIsLoading(true);
            try {
              const files = import.meta.glob('../../../data/articles/*.md', { query: '?raw', import: 'default' });
              const articlesData = await Promise.all(
                Object.entries(files).map(async ([path, loader]) => {
                  const fileContents = await loader() as string;
                  const { data, content } = matter(fileContents);
                  return { ...data, content, id: path } as Article;
                })
              );
              setArticles(articlesData);
              setFilteredArticles(articlesData);
            } catch (err) {
              console.error("Error fetching articles:", err);
              setError("Failed to load articles.");
            } finally {
              setIsLoading(false);
            }
          };
          fetchArticles();
        } else {
          setFilteredArticles(articles);
        }
        break;
      case "ads":
        if (ads.length === 0) {
          const fetchAds = async () => {
            setIsLoading(true);
            try {
              const response = await fetch('/api/ads/markdown');
              if (!response.ok) {
                throw new Error('Failed to fetch ads data');
              }
              const adsData = await response.json();
              setAds(adsData);
            } catch (err) {
              console.error("Error fetching ad data:", err);
              setError("Failed to load ads.");
            } finally {
              setIsLoading(false);
            }
          };
          fetchAds();
        }
        break;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("article", selectedFile);

    try {
      const response = await fetch("/api/articles/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Article uploaded successfully!");
        setShowUploadForm(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Refresh the articles list
        handleTabChange("articles");
      } else {
        const errorData = await response.json();
        alert(`Upload failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error uploading article:", error);
      alert("An error occurred while uploading the article.");
    }
  };

  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle || !adLink) {
      alert("Please fill in the title and link fields.");
      return;
    }

    // Banner is required for new ads, but optional for edits
    if (!editingAdId && !adBanner) {
      alert("Please select a banner image for the new ad.");
      return;
    }

    const formData = new FormData();
    formData.append("title", adTitle);
    formData.append("link", adLink);
    formData.append("banner", adBanner!);

    const url = editingAdId ? `/api/ads/${editingAdId}` : "/api/ads";
    const method = editingAdId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      if (response.ok) {
        alert(editingAdId ? "Ad updated successfully!" : "Ad created successfully!");
        setShowAdForm(false);
        setAdTitle("");
        setAdLink("");
        setAdBanner(null);
        setEditingAdId(null); // Reset editing state
        handleTabChange("ads"); // Refresh ads list
      } else {
        const errorData = await response.json();
        alert(`Operation failed: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error during ad operation:", error);
      alert("An error occurred during the ad operation.");
    }
  };

  const handleEditAd = (adToEdit: Ad) => {
    setEditingAdId(adToEdit.id);
    setAdTitle(adToEdit.title);
    setAdLink(adToEdit.link);
    setShowAdForm(true);
  };

  const handleAddAdClick = () => {
    setEditingAdId(null); // Ensure we are in create mode
    setAdTitle("");
    setAdLink("");
    setAdBanner(null);
    setShowAdForm(true);
  };

  const handleCancelAdForm = () => {
    setShowAdForm(false);
    setEditingAdId(null);
    setAdTitle("");
    setAdLink("");
    setAdBanner(null);
  };

  const handleDeleteAd = async (adToDelete: Ad) => {
    if (window.confirm(`Are you sure you want to delete the ad "${adToDelete.title}"?`)) {
      try {
        const response = await fetch(`/api/ads/${adToDelete.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const updatedAds = ads.filter(ad => ad.id !== adToDelete.id);
          setAds(updatedAds);
          setSelectedAd(null); // Close the modal
          alert('Ad deleted successfully!');
        } else {
          const errorData = await response.json();
          alert(`Failed to delete ad: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting ad:', error);
        alert('An error occurred while deleting the ad.');
      }
    }
  };

  const handleUpdateAd = async (formData: FormData) => {
    if (!editingAdId) return;
    try {
      const response = await fetch(`/api/ads/${editingAdId}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        alert('Ad updated successfully!');
        setSelectedAd(null);
        // Refresh ads list
        handleTabChange("ads");
      } else {
        const errorData = await response.json();
        alert(`Failed to update ad: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating ad:', error);
      alert('An error occurred while updating the ad.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setProducts(products.filter((p) => p.id !== id));
          setFilteredProducts(filteredProducts.filter((p) => p.id !== id));
          setSelectedProduct(null);
        } else {
          const errorData = await response.json();
          alert(`Failed to delete product: ${errorData.message}`);
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("An error occurred while deleting the product.");
      }
    }
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCompanies(companies.filter((c) => c.id !== id));
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    const lowercasedQuery = query.toLowerCase();

    switch (currentTab) {
      case "products":
        setFilteredProducts(
          products.filter(p =>
            (p.name && p.name.toLowerCase().includes(lowercasedQuery)) ||
            (p.description && p.description.toLowerCase().includes(lowercasedQuery)) ||
            (p.company && p.company.name && p.company.name.toLowerCase().includes(lowercasedQuery))
          )
        );
        break;
      case "companies":
        setFilteredCompanies(
          companies.filter(c =>
            (c.name && c.name.toLowerCase().includes(lowercasedQuery)) ||
            (c.description && c.description.toLowerCase().includes(lowercasedQuery))
          )
        );
        break;
      case "jobs":
        setFilteredJobs(
          jobs.filter(j =>
            (j.title && j.title.toLowerCase().includes(lowercasedQuery)) ||
            (j.description && j.description.toLowerCase().includes(lowercasedQuery))
          )
        );
        break;
      case "tenders":
        setFilteredTenders(
          tenders.filter(t =>
            (t.title && t.title.toLowerCase().includes(lowercasedQuery)) ||
            (t.content && t.content.toLowerCase().includes(lowercasedQuery))
          )
        );
        break;
      case "articles":
        setFilteredArticles(
          articles.filter(a =>
            (a.title && a.title.toLowerCase().includes(lowercasedQuery)) ||
            (a.content && a.content.toLowerCase().includes(lowercasedQuery))
          )
        );
        break;
      case "ads":
        // TODO: Filter ads
        break;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-8">
          <TabsTrigger value="products">Products & Services</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="tenders">Tenders</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="ads">ADs</TabsTrigger>
        </TabsList>

        <div className="relative mb-6 max-w-lg">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="search"
            placeholder={`Search in ${currentTab}...`}
            className="pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-lg text-red-500 mb-4">Error: {error}</p>
            <Button onClick={() => handleTabChange(currentTab)}>Try Again</Button>
          </div>
        ) : (
          <>
            <TabsContent value="products">
              <h2 className="text-xl font-semibold mb-4">{filteredProducts.length} Products Found</h2>
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
              {hasMore && (
                <div className="text-center mt-6">
                  <Button onClick={() => {
                    const nextPage = currentPage + 1;
                    setCurrentPage(nextPage);
                    fetchData("products", nextPage);
                  }} disabled={isLoading}>
                    {isLoading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="companies">
              <h2 className="text-xl font-semibold mb-4">{filteredCompanies.length} Companies Found</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    {...company}
                    category={company.companyType || 'N/A'}
                    description={company.description || 'N/A'}
                    location={company.location || 'N/A'}
                    isVerified={company.isVerified || false}
                    onDelete={() => handleDeleteCompany(company.id)}
                    onEdit={() => setSelectedCompany(company)}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="jobs">
              <h2 className="text-xl font-semibold mb-4">{filteredJobs.length} Jobs Found</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} {...job} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="tenders">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{filteredTenders.length} Tenders Found</h2>
                <Button onClick={() => setShowTenderForm(true)}>Add Tender</Button>
              </div>
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
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="articles">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{filteredArticles.length} Articles Found</h2>
                <Button onClick={() => setShowUploadForm(!showUploadForm)}>
                  {showUploadForm ? "Cancel" : "Upload Article"}
                </Button>
              </div>

              {showUploadForm && (
                <div className="bg-card p-4 rounded-lg border mb-6">
                  <h3 className="text-lg font-semibold mb-2">Upload New Article</h3>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".md"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                    <Button onClick={handleUpload} disabled={!selectedFile}>
                      Upload
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    id={article.id}
                    slug={article.slug}
                    title={article.title}
                    excerpt={article.excerpt}
                    category={article.category}
                    author={article.author}
                    publishedDate={article.published_date}
                    content={article.content}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="ads">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Advertisements</h2>
                <Button onClick={() => setShowAdForm(!showAdForm)}>
                  {showAdForm ? "Cancel" : "Add an AD"}
                </Button>
              </div>

              {showAdForm && (
                <div className="bg-card p-6 rounded-lg border mb-6 max-w-lg mx-auto">
                  <h3 className="text-lg font-semibold mb-4 text-center">{editingAdId ? 'Update Ad' : 'Create New Ad'}</h3>
                  <form onSubmit={handleAdSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="adTitle">Ad Title</Label>
                      <Input
                        id="adTitle"
                        type="text"
                        value={adTitle}
                        onChange={(e) => setAdTitle(e.target.value)}
                        placeholder="Enter ad title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="adLink">Ad Link</Label>
                      <Input
                        id="adLink"
                        type="url"
                        value={adLink}
                        onChange={(e) => setAdLink(e.target.value)}
                        placeholder="https://example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="adBanner">Ad Banner</Label>
                      <Input
                        id="adBanner"
                        type="file"
                        accept="image/*,.gif"
                        onChange={(e) => setAdBanner(e.target.files ? e.target.files[0] : null)}
                        required={!editingAdId} // Only required when creating a new ad
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingAdId ? 'Update Ad' : 'Create Ad'}
                    </Button>
                  </form>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {ads.map((ad) => (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    onStatusChange={handleAdStatusChange}
                    onEdit={handleEditAd}
                    onDelete={handleDeleteAd}
                  />
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

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
          onDelete={() => handleDeleteProduct(selectedProduct.id)}
        />
      )}

      {selectedCompany && (
        <CompanyDetailModal
          open={!!selectedCompany}
          onOpenChange={(open) => !open && setSelectedCompany(null)}
          company={{
            ...selectedCompany,
            description: selectedCompany.description || "",
            location: selectedCompany.location || "",
            email: selectedCompany.email ?? undefined,
            phone: selectedCompany.phone ?? undefined,
            website: selectedCompany.website ?? undefined,
            logoUrl: selectedCompany.logoUrl ?? undefined,
            typeId: selectedCompany.typeId ?? undefined,
          }}
          mode="edit"
          onDelete={() => handleDeleteCompany(selectedCompany.id)}
        />
      )}

      <TenderFormDialog
        open={showTenderForm}
        onOpenChange={setShowTenderForm}
      />
    </div>
  );
}
