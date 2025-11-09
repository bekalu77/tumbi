import { useState, useEffect, useMemo } from "react";
import { SlidersHorizontal, ChevronLeft, ChevronRight, ArrowLeft, Calendar, MapPin, Newspaper, Clock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import FilterPanel from "@/components/FilterPanel";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { ItemCategory } from "@shared/schema";
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Tender {
  id: string;
  tenderNo: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Raw markdown content
  category: string;
  publishedOn: string;
  bidClosingDate: string; // New field
  bidOpeningDate: string; // New field
  region: string;
  featured?: boolean;
}

const TENDERS_PER_PAGE = 5;

export default function Tenders() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [location] = useLocation();
  const [filters, setFilters] = useState<any>({});
  const [sort, setSort] = useState("published-latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTenderId, setExpandedTenderId] = useState<string | null>(null);

  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [tenderCategories, setTenderCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState<Error | null>(null);

  // Fetch tender categories
  useEffect(() => {
    const fetchTenderCategories = async () => {
      try {
        const res = await fetch("/api/tender-categories");
        if (!res.ok) {
          throw new Error("Failed to fetch tender categories");
        }
        const data: ItemCategory[] = await res.json();
        setTenderCategories(data.map(cat => cat.category));
      } catch (err) {
        setErrorCategories(err as Error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchTenderCategories();
  }, []);

  // Fetch tenders from API
  useEffect(() => {
    const fetchTenders = async () => {
      try {
        console.log("Fetching tender filenames...");
        const filenamesRes = await fetch("/api/tenders/filenames");
        if (!filenamesRes.ok) {
          throw new Error("Failed to fetch tender filenames");
        }
        const filenames: string[] = await filenamesRes.json();
        console.log("Tender filenames found:", filenames.length, filenames);

        const tendersData = await Promise.all(
          filenames.map(async (filename) => {
            console.log(`Fetching content for file: ${filename}`);
            const contentRes = await fetch(`/api/tenders/content/${filename}`);
            if (!contentRes.ok) {
              console.warn(`Failed to fetch content for ${filename}, skipping...`);
              return null;
            }
            const rawContent = await contentRes.text();
            console.log(`Processing file: ${filename}`);

            const { data, content } = matter(rawContent);

            const tenderNo = (data.tender_no as number) || 0;
            const title = (data.title as string) || 'Untitled Tender'; // Strictly use data.title
            const slug = (data.opening as string) || filename.replace(/\.md$/, '');
            const category = (data.category as string) || 'General';
            const publishedOn = (data.published as string) || 'N/A'; // Strictly use data.published
            const bidClosingDate = (data.closing as string) || 'N/A'; // Map data.closing to bidClosingDate
            const bidOpeningDate = (data.opening as string) || 'N/A'; // Map data.opening to bidOpeningDate
            const region = (data.region as string) || 'N/A';
            const featured = (data.featured as boolean) || false;

            // Extract excerpt from the first paragraph of the content (after front matter)
            const firstParagraphMatch = content.match(/\n\n([^\n]+)/);
            const excerpt = firstParagraphMatch && firstParagraphMatch[1].trim() ? firstParagraphMatch[1].trim().substring(0, 250) + '...' : 'Click to view full tender document.';

            return {
              id: filename.replace(/\.md$/, ''),
              tenderNo,
              title,
              slug,
              excerpt,
              content: content, // Store raw markdown content
              category,
              publishedOn,
              bidClosingDate,
              bidOpeningDate,
              region,
              featured,
            } as Tender;
          })
        );

        const validTenders = tendersData.filter((tender): tender is Tender => tender !== null);
        console.log("Successfully loaded tenders:", validTenders.length);
        setTenders(validTenders);
        
        if (validTenders.length === 0) {
          console.warn("No tenders were parsed. Check .md file content and API endpoints.");
        }
      } catch (err) {
        console.error("Error fetching or parsing tenders:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenders();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const category = params.get('category');
    if (category) {
      setFilters((prev: any) => ({ ...prev, category }));
    }
  }, [location]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const filteredAndSortedTenders = useMemo(() => {
    let result = [...tenders];

    // Search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const queryWords = query.split(/\s+/);

      result = result.filter((tender) => {
        const searchableText = `${tender.title} ${tender.excerpt} ${tender.category} ${tender.region} ${tender.publishedOn} ${tender.bidClosingDate} ${tender.bidOpeningDate}`.toLowerCase();
        return queryWords.every(word => searchableText.includes(word));
      });
    }

    // Category filtering
    if (filters.category) {
      const selectedCategories = filters.category.split(',');
      if (selectedCategories.length > 0) {
        result = result.filter((tender) =>
          selectedCategories.includes(tender.category)
        );
      }
    }

    // Sort by featured first
    result.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    // Secondary sorting
    switch (sort) {
      case "published-latest":
      default:
        result.sort((a, b) => new Date(b.publishedOn).getTime() - new Date(a.publishedOn).getTime());
        break;
    }

    return result;
  }, [tenders, filters, sort, searchQuery]);

  // Get featured and regular tenders
  const featuredTenders = filteredAndSortedTenders.filter(tender => tender.featured).slice(0, 3);
  const mainFeaturedTender = featuredTenders[0];
  const regularTenders = filteredAndSortedTenders.filter(tender => !tender.featured);

  // Pagination
  const totalPages = Math.ceil(regularTenders.length / TENDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * TENDERS_PER_PAGE;
  const endIndex = startIndex + TENDERS_PER_PAGE;
  const currentTenders = regularTenders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReadMore = (tenderId: string) => {
    setExpandedTenderId(tenderId);
  };

  const handleBackToList = () => {
    setExpandedTenderId(null);
  };

  const expandedTender = tenders.find(tender => tender.id === expandedTenderId);

  // Helper to format date
  const formatDateDisplay = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Single Tender View
  if (expandedTender) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Tenders
            </Button>
          </div>

          {/* Expanded Tender */}
          <article className="bg-card rounded-xl shadow-sm border">
            {/* Tender Header */}
            <div className="p-8 pb-0">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                {expandedTender.category}
              </div>
              
              <h1 className="text-4xl font-bold mb-6 leading-tight tracking-tight">
                {expandedTender.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4" />
                  <span>Published: {formatDateDisplay(expandedTender.publishedOn)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Closing: {formatDateDisplay(expandedTender.bidClosingDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Opening: {formatDateDisplay(expandedTender.bidOpeningDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Region: {expandedTender.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Tender No: {expandedTender.tenderNo}</span>
                </div>
              </div>
            </div>

            {/* Tender Content */}
            <div className="px-8 pb-8">
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children, node, ref, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground" {...props}>{children}</h1>,
                    h2: ({ children, node, ref, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3 text-foreground" {...props}>{children}</h2>,
                    h3: ({ children, node, ref, ...props }) => <h3 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props}>{children}</h3>,
                    h4: ({ children, node, ref, ...props }) => <h4 className="text-lg font-bold mt-4 mb-2 text-foreground" {...props}>{children}</h4>,
                    p: ({ children, node, ref, ...props }) => <p className="mb-4 leading-relaxed text-foreground/90" {...props}>{children}</p>,
                    ul: ({ children, node, ref, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-foreground/90" {...props}>{children}</ul>,
                    ol: ({ children, node, ref, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground/90" {...props}>{children}</ol>,
                    li: ({ children, node, ref, ...props }) => <li className="leading-relaxed" {...props}>{children}</li>,
                    strong: ({ children, node, ref, ...props }) => <strong className="font-bold text-foreground" {...props}>{children}</strong>,
                    em: ({ children, node, ref, ...props }) => <em className="italic text-foreground/90" {...props}>{children}</em>,
                    blockquote: ({ children, node, ref, ...props }) => <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-foreground/80" {...props}>{children}</blockquote>,
                    a: ({ children, node, ref, ...props }) => <a className="text-primary hover:underline" {...props}>{children}</a>,
                  }}
                  remarkPlugins={[remarkGfm]}
                >
                  {expandedTender.content}
                </ReactMarkdown>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  // Main Tenders List View
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Tenders</h1>
            <p className="text-muted-foreground">Latest tender opportunities</p>
          </div>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <Input
                    type="text"
                    placeholder={t("searchTenders") || "Search tenders..."}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full mb-4"
                  />
                  <FilterPanel
                    type="tenders"
                    categories={tenderCategories}
                    onApply={setFilters}
                    onReset={() => setFilters({})}
                    onSearch={handleSearch}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published-latest">Latest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <Input
                type="text"
                placeholder={t("searchTenders") || "Search tenders..."}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full mb-4"
              />
              <FilterPanel
                type="tenders"
                categories={tenderCategories}
                onApply={setFilters}
                onReset={() => setFilters({})}
                onSearch={handleSearch}
              />
            </div>
          </aside>

          {/* Tenders Content */}
          <main className="lg:col-span-3">
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading tenders...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-lg text-red-500 mb-4">Error: {error.message}</p>
                <p className="text-muted-foreground mb-4">Please ensure the server is running and tender files are correctly formatted.</p>
              </div>
            )}

            {!isLoading && (
              <>
                {/* Featured Tenders Section */}
                {mainFeaturedTender && (
                  <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-foreground border-b pb-2">Featured Tenders</h2>
                    
                    {/* Main Featured Tender */}
                    <div className="bg-card rounded-xl shadow-sm border overflow-hidden mb-8 group cursor-pointer hover:shadow-md transition-shadow">
                      <div className="p-8 flex flex-col justify-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                            {mainFeaturedTender.category}
                          </div>
                          <h3 className="text-2xl font-bold mb-4 leading-tight group-hover:text-primary transition-colors">
                            {mainFeaturedTender.title}
                          </h3>
                          <p className="text-muted-foreground mb-6 leading-relaxed">
                            {mainFeaturedTender.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                            <div className="flex items-center gap-4">
                              <span>Published: {formatDateDisplay(mainFeaturedTender.publishedOn)}</span>
                              <span>Closing: {formatDateDisplay(mainFeaturedTender.bidClosingDate)}</span>
                              <span>Opening: {formatDateDisplay(mainFeaturedTender.bidOpeningDate)}</span>
                              <span>Region: {mainFeaturedTender.region}</span>
                            </div>
                            <span>Tender No: {mainFeaturedTender.tenderNo}</span>
                          </div>
                          <Button 
                            onClick={() => handleReadMore(mainFeaturedTender.id)}
                            size="lg"
                            className="w-fit"
                          >
                            View Full Details
                          </Button>
                        </div>
                    </div>

                    {/* Secondary Featured Tenders */}
                    {featuredTenders.slice(1).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {featuredTenders.slice(1).map((tender) => (
                          <article 
                            key={tender.id}
                            className="bg-card rounded-lg border overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="p-6">
                              <div className="inline-flex items-center px-2 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium mb-3">
                                {tender.category}
                              </div>
                              <h4 className="font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                {tender.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                {tender.excerpt}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                <span>Published: {formatDateDisplay(tender.publishedOn)}</span>
                                <span>Closing: {formatDateDisplay(tender.bidClosingDate)}</span>
                                <span>Opening: {formatDateDisplay(tender.bidOpeningDate)}</span>
                                <span>Region: {tender.region}</span>
                              </div>
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleReadMore(tender.id)}
                                className="w-full"
                              >
                                View Details
                              </Button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Latest Tenders Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      {mainFeaturedTender ? 'Latest Tenders' : 'All Tenders'}
                    </h2>
                    <p className="text-muted-foreground">
                      Showing {currentTenders.length} of {regularTenders.length} tenders
                    </p>
                  </div>

                  {currentTenders.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <p className="text-lg text-muted-foreground mb-4">No tenders found matching your criteria.</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setFilters({});
                          setSearchQuery('');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Tenders List */}
                      <div className="space-y-6">
                        {currentTenders.map((tender) => (
                          <article 
                            key={tender.id}
                            className="bg-card rounded-lg border p-6 group cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary/20"
                          >
                            <div className="grid grid-cols-1 gap-6">
                              <div>
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                    {tender.category}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Published: {formatDateDisplay(tender.publishedOn)}</span>
                                    <span>Closing: {formatDateDisplay(tender.bidClosingDate)}</span>
                                    <span>Opening: {formatDateDisplay(tender.bidOpeningDate)}</span>
                                    <span>Region: {tender.region}</span>
                                  </div>
                                </div>
                                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                                  {tender.title}
                                </h3>
                                <p className="text-muted-foreground mb-4 line-clamp-2">
                                  {tender.excerpt}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>Tender No: {tender.tenderNo}</span>
                                  </div>
                                  <Button 
                                    variant="outline"
                                    onClick={() => handleReadMore(tender.id)}
                                    className="group-hover:bg-primary group-hover:text-primary-foreground"
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-12">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                  className="w-10 h-10 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
