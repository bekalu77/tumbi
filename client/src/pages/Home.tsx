import { useEffect, useState } from "react";
import { Search, Package, Building2, Hammer, Wrench, PaintBucket, Grid3x3, Newspaper, Factory } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import AdCard from "@/components/AdCard";
import TenderCard from "@/components/TenderCard"; // Import TenderCard
import ArticleCard from "@/components/ArticleCard"; // Import ArticleCard
import CompanyCard from "@/components/CompanyCard"; // Import CompanyCard
import ProductDetailModal from "@/components/ProductDetailModal";
import CompanyDetailModal from "@/components/CompanyDetailModal"; // Import CompanyDetailModal
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth hook
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import heroImage from "@assets/stock_images/modern_construction__205af1a1.jpg";
import productImage from "@assets/stock_images/construction_materia_151531d6.jpg";
import matter from "gray-matter"; // For parsing markdown front matter
import yaml from 'js-yaml';

// Define interfaces for data types
interface Ad {
  id: string;
  title: string;
  link: string;
  banner: string;
  status: 'on' | 'off';
}

interface Product {
  id: string;
  name: string;
  company: string;
  category: string;
  price: number;
  unit: string;
  imageUrls: string[];
  companyPhone?: string;
  companyEmail?: string;
  madeOf?: string;
  description?: string;
  isOwner?: boolean;
}

interface Tender {
  id: string;
  tenderNo: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  publishedOn: string;
  bidClosingDate: string;
  bidOpeningDate: string;
  region: string;
  featured?: boolean;
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
  views?: number; // Now explicitly included from backend
}

interface Company {
  id: string;
  name: string;
  description: string;
  location: string;
  companyType: string;
  logoUrl?: string;
  isVerified?: boolean;
}

export default function Home() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [displayedAds, setDisplayedAds] = useState<Ad[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [newTenders, setNewTenders] = useState<Tender[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [recentCompanies, setRecentCompanies] = useState<Company[]>([]);
  const [searchInputValue, setSearchInputValue] = useState("");


  useEffect(() => {
    (async () => {
      try {
        const [catsRes, prodRes, tenderFilenamesRes, articlesRes, companiesRes, adsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products"),
          fetch("/api/tenders/filenames"),
          fetch("/api/search?types=articles"),
          fetch("/api/companies"),
          fetch('/api/ads/markdown'),
        ]);

        const cats = await catsRes.json();
        const prods = await prodRes.json();
        const tenderFilenames: string[] = await tenderFilenamesRes.json();
        const articlesData: { articles: Article[] } = await articlesRes.json();
        const companiesData: Company[] = await companiesRes.json();
        const adsData = await adsRes.json();
        
        if (Array.isArray(adsData)) {
          const activeAds = adsData.filter(ad => ad.status === 'on');
          setAds(activeAds);
        }

        console.log("Fetched products:", prods);
        console.log("Fetched tenders:", tenderFilenames);
        console.log("Fetched articles:", articlesData);
        console.log("Fetched companies:", companiesData);

        setCategories(cats);

        // Process recent products
        setRecentProducts(prods.slice(0, 4).map((p: any) => ({
          id: p.id,
          name: p.name,
          company: p.companyName,
          category: p.categoryName,
          price: Number(p.price),
          unit: p.unit,
          imageUrls: p.imageUrls || [productImage],
          companyPhone: p.companyPhone,
          companyEmail: p.companyEmail,
          madeOf: p.madeOf,
          description: p.description,
          isOwner: false,
        })));

        // Process new tenders (fetch content for a few)
        const tendersPromises = tenderFilenames.slice(0, 4).map(async (filename) => {
          const contentRes = await fetch(`/api/tenders/content/${filename}`);
          const rawContent = await contentRes.text();
          const { data, content } = matter(rawContent);

          const firstParagraphMatch = content.match(/\n\n([^\n]+)/);
          const excerpt = firstParagraphMatch && firstParagraphMatch[1].trim() ? firstParagraphMatch[1].trim().substring(0, 150) + '...' : t('clickToViewFullTenderDocument');

          return {
            id: filename.replace(/\.md$/, ''),
            tenderNo: data.tender_no || 0,
            title: data.title || 'Untitled Tender',
            slug: data.opening || filename.replace(/\.md$/, ''),
            excerpt: excerpt,
            content: content,
            category: data.category || 'General',
            publishedOn: data.published || 'N/A',
            bidClosingDate: data.closing || 'N/A',
            bidOpeningDate: data.opening || 'N/A',
            region: data.region || 'N/A',
            featured: data.featured || false,
          } as Tender;
        });
        setNewTenders(await Promise.all(tendersPromises));

        // Process most talked about articles (sort by views)
        const sortedArticles = articlesData.articles.sort((a, b) => (b.views || 0) - (a.views || 0));
        setFeaturedArticles(sortedArticles.slice(0, 4)); // Renaming to mostTalkedArticles might be better, but keeping for now.

        // Process recent companies
        setRecentCompanies(companiesData.slice(0, 4).map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || "",
          location: c.location || "",
          companyType: c.companyType || "General",
          logoUrl: c.logoUrl,
          isVerified: c.isVerified || false,
        })));

      } catch (e) {
        console.error("Error fetching data for Home page:", e);
      }
        })();
  }, []);

  useEffect(() => {
    if (ads.length > 0) {
      const shuffleAds = () => {
        const shuffled = [...ads].sort(() => 0.5 - Math.random());
        setDisplayedAds(shuffled.slice(0, 4));
      };

      shuffleAds(); // Initial display
      const intervalId = setInterval(shuffleAds, 15000); // Shuffle every 15 seconds

      return () => clearInterval(intervalId);
    }
  }, [ads]);

  // Get currentUser from AuthContext
  // For example: const { user } = useAuth();
  const { user } = useAuth();

  const handleDeleteCompany = async (id: string) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setRecentCompanies(recentCompanies.filter((c) => c.id !== id));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete company: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("An error occurred while deleting the company.");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputValue.trim()) {
      setLocation(`/search?query=${encodeURIComponent(searchInputValue.trim())}`);
    }
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return t('notSpecified');
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

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
            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto mt-6 flex items-center border rounded-full shadow-sm bg-background">
              <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("searchMaterials")}
                className="flex-1 pl-12 h-14 text-lg bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                data-testid="input-hero-search"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
              />
              <Button type="submit" className="h-12 px-8 mr-2 rounded-full">
                {t("search")}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="default"
                onClick={() => setLocation("/products-services")}
                data-testid="button-browse-products"
              >
                <Package className="h-4 w-4 mr-2" />
                {t("browseProducts")}
              </Button>
              {/* Conditional rendering for admin button based on currentUser */}
              {/* Assuming useAuth() returns an object with a 'user' property, and 'user' has a 'username' property */}
              {user?.username === 'admin77' && (
                <Button
                  variant="default"
                  onClick={() => setLocation("/admin77")} // Navigate to admin dashboard
                  data-testid="button-admin-dashboard"
                  className="bg-red-500 hover:bg-red-600 text-white" // Example styling for admin button
                >
                  {t("dashboard")}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setLocation("/companies")}
                className="bg-background/80 backdrop-blur-sm"
                data-testid="button-browse-companies"
              >
                <Building2 className="h-4 w-4 mr-2" />
                {t("browseCompanies")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ads Section */}
      <section className="py-10 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-heading font-semibold mb-4 text-center uppercase tracking-wider">
            {t("advertisement")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedAds.length > 0 ? (
              displayedAds.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                />
              ))
            ) : (
              <p>{t("loadingAds")}</p>
            )}
          </div>
        </div>
      </section>

      {/* Recently Added Products Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-10">
            {t("recentlyAdded")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentProducts.length > 0 ? (
              recentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))
            ) : (
              <p>{t("loadingProducts")}</p>
            )}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" onClick={() => setLocation("/products-services")}>
              {t("viewAllProducts")}
            </Button>
          </div>
        </div>
      </section>

      {/* New Tenders Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8">
            {t("newTenders")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {newTenders.map((tender) => (
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
          <div className="text-center mt-12">
            <Button variant="outline" onClick={() => setLocation("/products-services")}>
              {t("viewAllProducts")}
            </Button>
          </div>
        </div>
      </section>

      {/* Most Talked About Articles Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8">
            {t("mostTalkedAboutArticles")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.id}
                title={article.title}
                excerpt={article.excerpt}
                content={article.content}
                author={article.author}
                publishedDate={article.published_date}
                category={article.category}
                slug={article.slug}
                fileType={article.fileType}
                onClick={() => setSelectedArticle(article)}
              />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" onClick={() => setLocation("/articles")}>
              {t("viewAllArticles")}
            </Button>
          </div>
        </div>
      </section>

      {/* Recently Added Companies Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8">
            {t("recentlyAddedCompanies")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                id={company.id}
                name={company.name}
                description={company.description}
                location={company.location}
                category={company.companyType}
                logo={company.logoUrl}
                isVerified={company.isVerified}
                onClick={() => setSelectedCompany(company)}
                onDelete={() => handleDeleteCompany(company.id)}
              />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" onClick={() => setLocation("/companies")}>
              {t("viewAllCompanies")}
            </Button>
          </div>
        </div>
      </section>

      {selectedProduct && (
        <ProductDetailModal
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          product={{
            ...selectedProduct,
            images: selectedProduct.imageUrls,
            categoryId: "", // Placeholder
            companyId: "", // Placeholder
            price: selectedProduct.price || 0,
            unit: selectedProduct.unit || "",
            description: selectedProduct.description || "", // Ensure description is always a string
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

      {selectedArticle && (
        <ArticleCard
          id={selectedArticle.id}
          title={selectedArticle.title}
          excerpt={selectedArticle.excerpt}
          content={selectedArticle.content}
          author={selectedArticle.author}
          publishedDate={selectedArticle.published_date}
          category={selectedArticle.category}
          slug={selectedArticle.slug}
          fileType={selectedArticle.fileType}
          isExpanded={true}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {/* No specific modal for CompanyCard, it usually navigates to a detail page or uses a modal from BrowseCompanies */}

      {selectedCompany && (
        <CompanyDetailModal
          open={!!selectedCompany}
          onOpenChange={(open) => !open && setSelectedCompany(null)}
          company={{
            ...selectedCompany,
            products: [], // Products are fetched within the modal, so pass an empty array initially
          }}
          mode="view"
        />
      )}
    </div>
  );
}
