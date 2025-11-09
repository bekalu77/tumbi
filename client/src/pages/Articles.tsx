import { useState, useEffect, useMemo } from "react";
import { SlidersHorizontal, ChevronLeft, ChevronRight, ArrowLeft, Calendar, User, Clock, Share, Bookmark, Eye } from "lucide-react";
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
import FilterPanel from "@/components/FilterPanel";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import matter from "gray-matter";
import ReactMarkdown from 'react-markdown';

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

const ARTICLE_CATEGORIES = [
  "Industry News",
  "Project Updates",
  "Government Policies",
  "Construction Materials",
  "Infrastructure",
  "Housing & Real Estate",
  "Technology & Innovation",
  "Sustainability",
  "Tenders & Bids",
  "Workforce Development",
  "Market Analysis",
  "Case Studies",
  "Regulatory Changes",
  "Safety Guidelines",
  "Architectural Trends",
  "Building Codes",
  "Environmental Impact",
  "Supply Chain",
  "Investment Opportunities",
  "Web Content"
];

const ARTICLES_PER_PAGE = 5;

// Utility functions
const calculateReadTime = (content: string): string => {
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);
  return `${readTime} min read`;
};

const categoryImages: { [key: string]: string } = {
  'Case Studies': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop',
  'Sustainability': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=500&fit=crop',
  'Technology & Innovation': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=500&fit=crop',
  'Infrastructure': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=500&fit=crop',
  'Construction Materials': 'https://images.unsplash.com/photo-1541976590-713941681591?w=800&h=500&fit=crop',
  'Industry News': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop',
  'Project Updates': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop',
  'Government Policies': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=500&fit=crop',
  'Housing & Real Estate': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=500&fit=crop',
  'Tenders & Bids': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=500&fit=crop',
  'Workforce Development': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop',
  'Market Analysis': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
  'Regulatory Changes': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=500&fit=crop',
  'default': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop'
};

// Create sample articles for fallback
const createSampleArticles = (): Article[] => {
  return [
    {
      id: 'sample-1',
      title: 'Ethiopian Construction Companies Embrace Digital Transformation',
      slug: 'ethiopian-construction-technology-adoption',
      excerpt: 'From BIM software to drone surveying, Ethiopian construction firms are leveraging cutting-edge technology to achieve 40% faster project completion.',
      content: `# Ethiopian Construction Enters Digital Age

Ethiopia's construction industry is undergoing a remarkable digital transformation as local companies increasingly embrace modern technologies.

## Key Technology Adoption
- Building Information Modeling (BIM) software
- Drone surveying and monitoring
- Automated construction equipment
- Project management software platforms

## Benefits Achieved
- 40% reduction in project timelines
- 25% decrease in labor costs
- 30% improvement in equipment utilization
- Enhanced safety monitoring

Major international construction technology providers have established local offices to serve the growing Ethiopian market.`,
      category: 'Technology & Innovation',
      published_date: '2024-03-15',
      author: 'Sara Mohammed',
      fileType: 'md',
      featured: true,
      image: categoryImages['Technology & Innovation'],
      read_time: '3 min read',
      views: 245
    },
    {
      id: 'sample-2',
      title: 'Major Future Construction Projects Planned for Ethiopia',
      slug: 'future-construction-projects',
      excerpt: 'Upcoming mega-projects set to transform Ethiopia\'s infrastructure landscape with $15 billion investment.',
      content: `# Ethiopia's Infrastructure Vision

Several transformative construction projects are in planning and early implementation phases.

## Transportation Projects
- Addis Ababa-Djibouti standard gauge railway extension
- New international airport in Adama
- Expressway network expansion (1,000 km planned)

## Urban Development
- 'Sheger City' satellite city project
- Riverside development along Akaki River
- Modern commercial districts in regional capitals

These projects represent an estimated $15 billion investment.`,
      category: 'Project Updates',
      published_date: '2024-03-29',
      author: 'Eleni Gebre',
      fileType: 'md',
      featured: true,
      image: categoryImages.Infrastructure,
      read_time: '2 min read',
      views: 189
    },
    {
      id: 'sample-3',
      title: 'Green Building Practices Gain Traction in Ethiopian Construction',
      slug: 'green-building-ethiopia',
      excerpt: 'Sustainable construction methods and energy-efficient designs become priority in new Ethiopian buildings.',
      content: `# Sustainable Construction in Ethiopia

Ethiopian construction companies are increasingly adopting green building practices.

## Key Initiatives
- LEED certification requirements for large projects
- Solar panel integration in new buildings
- Rainwater harvesting systems
- Energy-efficient insulation materials

## Benefits Observed
- 30% reduction in energy consumption
- Lower operational costs for building owners
- Improved indoor air quality
- Reduced environmental impact`,
      category: 'Sustainability',
      published_date: '2024-02-18',
      author: 'Tewodros Assefa',
      fileType: 'md',
      featured: false,
      image: categoryImages.Sustainability,
      read_time: '2 min read',
      views: 156
    }
  ];
};

// Helper function for fallback articles
const createFallbackArticle = (path: string, error: string): Article => {
  return {
    id: path,
    title: 'Error Loading Article',
    slug: 'error-' + Math.random().toString(36).substr(2, 9),
    excerpt: `There was an error loading this article: ${error}`,
    content: 'Please check the console for detailed error information.',
    category: 'Error',
    published_date: new Date().toISOString().split('T')[0],
    author: 'System',
    fileType: 'md',
    featured: false,
    image: categoryImages.default,
    read_time: '1 min read',
    views: 0
  };
};

export default function Articles() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [filters, setFilters] = useState<any>({});
  const [sort, setSort] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [viewedArticles, setViewedArticles] = useState<Set<string>>(new Set());

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        console.log("Fetching article filenames...");
        const filenamesRes = await fetch("/api/articles/filenames");
        if (!filenamesRes.ok) {
          throw new Error("Failed to fetch article filenames");
        }
        const filenames: string[] = await filenamesRes.json();
        console.log("Article filenames found:", filenames.length, filenames);

        if (filenames.length === 0) {
          console.log('No article files found. Using sample articles.');
          setArticles(createSampleArticles());
          setIsLoading(false);
          return;
        }

        const articlesData = await Promise.all(
          filenames.map(async (filename) => {
            try {
              console.log(`Fetching content for file: ${filename}`);
              const contentRes = await fetch(`/api/articles/content/${filename}`);
              if (!contentRes.ok) {
                console.warn(`Failed to fetch content for ${filename}, skipping...`);
                return null;
              }
              const rawContent = await contentRes.text();
              console.log(`Processing file: ${filename}`);

              if (!rawContent || rawContent.trim().length === 0) {
                console.warn(`Empty content in: ${filename}`);
                return createFallbackArticle(filename, 'Empty file content');
              }

              // Parse front matter using gray-matter
              let matterResult;
              try {
                matterResult = matter(rawContent);
              } catch (matterError) {
                console.error(`Front matter parsing error in ${filename}:`, matterError);
                return createFallbackArticle(filename, 'Invalid front matter format');
              }

              const data = matterResult.data;
              const isHtml = filename.endsWith('.html');
              
              // Get content - for markdown, use the parsed content
              let articleContent = matterResult.content;
              
              // For HTML files, handle differently
              if (isHtml) {
                if (!data.title) {
                  const titleMatch = rawContent.match(/<title>(.*?)<\/title>/i);
                  data.title = titleMatch ? titleMatch[1] : 'Untitled HTML Article';
                }
                articleContent = rawContent;
              }

              // Get image from front matter or use category default
              let image = data.image;
              if (!image) {
                image = categoryImages[data.category] || categoryImages.default;
              }

              // Validate required fields and provide defaults
              const articleData: Article = {
                id: data.id || filename,
                title: data.title || 'Untitled Article',
                slug: data.slug || filename.replace(/\.(md|html)$/, ''),
                excerpt: data.excerpt || (articleContent.substring(0, 150) + '...'),
                content: articleContent,
                category: data.category || 'Industry News',
                published_date: data.published_date || new Date().toISOString().split('T')[0],
                author: data.author || 'Unknown Author',
                fileType: isHtml ? 'html' : 'md',
                featured: Boolean(data.featured),
                image: image,
                read_time: calculateReadTime(articleContent),
                views: Math.floor(Math.random() * 1000) + 100
              };

              console.log(`Successfully processed: ${articleData.title}`);
              return articleData;

            } catch (error) {
              console.error(`Error processing ${filename}:`, error);
              return createFallbackArticle(filename, error instanceof Error ? error.message : 'Unknown error');
            }
          })
        );

        // Filter out any null values and set articles
        const validArticles = articlesData.filter(article => article !== null) as Article[];
        console.log(`Successfully loaded ${validArticles.length} articles`);
        setArticles(validArticles);

      } catch (err) {
        console.error('Critical error in fetchArticles:', err);
        setError(err as Error);
        // Fallback to sample articles on critical error
        setArticles(createSampleArticles());
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
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

  const filteredAndSortedArticles = useMemo(() => {
    let result = [...articles];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const queryWords = query.split(/\s+/);

      result = result.filter((article) => {
        const searchableText = `${article.title} ${article.excerpt || ''} ${article.author} ${article.category}`.toLowerCase();
        return queryWords.every(word => searchableText.includes(word));
      });
    }

    if (filters.category) {
      const selectedCategories = filters.category.split(',');
      if (selectedCategories.length > 0) {
        result = result.filter((article) => {
          const categoryMapping: { [key: string]: string } = {
            'future-projects': 'Project Updates',
            'rural-development': 'Infrastructure',
            'sustainability': 'Sustainability',
            'industry-news': 'Industry News',
            'government-policies': 'Government Policies',
            'construction-materials': 'Construction Materials',
            'housing-real-estate': 'Housing & Real Estate',
            'technology-innovation': 'Technology & Innovation',
            'tenders-bids': 'Tenders & Bids',
            'workforce-development': 'Workforce Development',
            'web-content': 'Web Content',
            'materials': 'Construction Materials',
            'housing': 'Housing & Real Estate',
            'workforce': 'Workforce Development',
            'regulations': 'Regulatory Changes'
          };

          const mappedCategory = categoryMapping[article.category] || article.category;
          return selectedCategories.includes(mappedCategory);
        });
      }
    }

    switch (sort) {
      case "oldest":
        result.sort((a, b) => new Date(a.published_date).getTime() - new Date(b.published_date).getTime());
        break;
      case "latest":
      default:
        result.sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime());
        break;
    }

    return result;
  }, [articles, filters, sort, searchQuery]);

  // Get featured and regular articles
  const featuredArticles = filteredAndSortedArticles.filter(article => article.featured).slice(0, 3);
  const mainFeaturedArticle = featuredArticles[0];
  const secondaryFeaturedArticles = featuredArticles.slice(1);
  const regularArticles = filteredAndSortedArticles.filter(article => !article.featured);

  // Pagination
  const totalPages = Math.ceil(regularArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const endIndex = startIndex + ARTICLES_PER_PAGE;
  const currentArticles = regularArticles.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReadMore = (articleId: string) => {
    setExpandedArticleId(articleId);
    setViewedArticles(prev => new Set([...prev, articleId]));
  };

  const handleBackToList = () => {
    setExpandedArticleId(null);
  };

  const expandedArticle = articles.find(article => article.id === expandedArticleId);

  // Single Article View
  if (expandedArticle) {
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
              Back to All Articles
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Save
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Expanded Article */}
          <article className="bg-card rounded-xl shadow-sm border">
            {/* Article Header */}
            <div className="p-8 pb-0">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                {expandedArticle.category}
              </div>
              
              <h1 className="text-4xl font-bold mb-6 leading-tight tracking-tight">
                {expandedArticle.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{expandedArticle.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(expandedArticle.published_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{expandedArticle.read_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{expandedArticle.views} views</span>
                </div>
              </div>
            </div>

            {/* Article Image */}
            {expandedArticle.image && (
              <div className="w-full h-96 mb-8">
                <img
                  src={expandedArticle.image}
                  alt={expandedArticle.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = categoryImages[expandedArticle.category] || categoryImages.default;
                  }}
                />
              </div>
            )}

            {/* Article Content */}
            <div className="px-8 pb-8">
              <div className="prose prose-lg max-w-none">
                {expandedArticle.fileType === 'html' ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: expandedArticle.content }}
                    className="html-content"
                  />
                ) : (
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
                  >
                    {expandedArticle.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  // Main Articles List View
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Construction News</h1>
            <p className="text-muted-foreground">Latest updates and insights from the construction industry</p>
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
                  <FilterPanel
                    type="articles"
                    categories={ARTICLE_CATEGORIES}
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
                <SelectItem value="latest">Latest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <FilterPanel
                type="articles"
                categories={ARTICLE_CATEGORIES}
                onApply={setFilters}
                onReset={() => setFilters({})}
                onSearch={handleSearch}
              />
            </div>
          </aside>

          {/* Articles Content */}
          <main className="lg:col-span-3">
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading articles...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-lg text-red-500 mb-4">Error: {error.message}</p>
                <p className="text-muted-foreground mb-4">Showing sample articles instead.</p>
              </div>
            )}

            {!isLoading && (
              <>
                {/* Featured Articles Section */}
                {mainFeaturedArticle && (
                  <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-foreground border-b pb-2">Featured Stories</h2>
                    
                    {/* Main Featured Article */}
                    <div className="bg-card rounded-xl shadow-sm border overflow-hidden mb-8 group cursor-pointer hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-80 lg:h-full">
                          <img
                            src={mainFeaturedArticle.image}
                            alt={mainFeaturedArticle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = categoryImages[mainFeaturedArticle.category] || categoryImages.default;
                            }}
                          />
                        </div>
                        <div className="p-8 flex flex-col justify-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                            {mainFeaturedArticle.category}
                          </div>
                          <h3 className="text-2xl font-bold mb-4 leading-tight group-hover:text-primary transition-colors">
                            {mainFeaturedArticle.title}
                          </h3>
                          <p className="text-muted-foreground mb-6 leading-relaxed">
                            {mainFeaturedArticle.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                            <div className="flex items-center gap-4">
                              <span>By {mainFeaturedArticle.author}</span>
                              <span>{mainFeaturedArticle.read_time}</span>
                            </div>
                            <span>{mainFeaturedArticle.views} views</span>
                          </div>
                          <Button 
                            onClick={() => handleReadMore(mainFeaturedArticle.id)}
                            size="lg"
                            className="w-fit"
                          >
                            Read Full Story
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Featured Articles */}
                    {secondaryFeaturedArticles.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {secondaryFeaturedArticles.map((article) => (
                          <article 
                            key={article.id}
                            className="bg-card rounded-lg border overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="h-48 overflow-hidden">
                              <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = categoryImages[article.category] || categoryImages.default;
                                }}
                              />
                            </div>
                            <div className="p-6">
                              <div className="inline-flex items-center px-2 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium mb-3">
                                {article.category}
                              </div>
                              <h4 className="font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                {article.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                {article.excerpt}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                <span>By {article.author}</span>
                                <span>{article.read_time}</span>
                              </div>
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleReadMore(article.id)}
                                className="w-full"
                              >
                                Read More
                              </Button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Latest Articles Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      {mainFeaturedArticle ? 'Latest News' : 'All Articles'}
                    </h2>
                    <p className="text-muted-foreground">
                      Showing {currentArticles.length} of {regularArticles.length} articles
                    </p>
                  </div>

                  {currentArticles.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <p className="text-lg text-muted-foreground mb-4">No articles found matching your criteria.</p>
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
                      {/* Articles List */}
                      <div className="space-y-6">
                        {currentArticles.map((article) => (
                          <article 
                            key={article.id}
                            className="bg-card rounded-lg border p-6 group cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary/20"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="md:col-span-2">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                                    {article.category}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>{new Date(article.published_date).toLocaleDateString()}</span>
                                    <span>{article.read_time}</span>
                                    {viewedArticles.has(article.id) && (
                                      <span className="text-primary">Viewed</span>
                                    )}
                                  </div>
                                </div>
                                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                                  {article.title}
                                </h3>
                                <p className="text-muted-foreground mb-4 line-clamp-2">
                                  {article.excerpt}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>By {article.author}</span>
                                    <span>{article.views} views</span>
                                  </div>
                                  <Button 
                                    variant="outline"
                                    onClick={() => handleReadMore(article.id)}
                                    className="group-hover:bg-primary group-hover:text-primary-foreground"
                                  >
                                    Read More
                                  </Button>
                                </div>
                              </div>
                              <div className="h-40 md:h-full rounded-lg overflow-hidden">
                                <img
                                  src={article.image}
                                  alt={article.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = categoryImages[article.category] || categoryImages.default;
                                  }}
                                />
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
