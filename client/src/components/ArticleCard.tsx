import { useState, HTMLProps } from "react";
import { Heart, User, Calendar, ArrowLeft, Image as ImageIcon } from "lucide-react";
import ReactMarkdown, { ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Define a more accurate type for ReactMarkdown custom components
type CustomComponentProps<T extends keyof HTMLElementTagNameMap> = React.ComponentPropsWithoutRef<T> & ExtraProps;

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedDate: string;
  category: string;
  slug: string;
  fileType?: 'md' | 'html';
  isExpanded?: boolean;
  onClick?: () => void;
  onClose?: () => void;
}

export default function ArticleCard({
  id,
  title,
  excerpt,
  content,
  author,
  publishedDate,
  category,
  slug,
  fileType = 'md',
  isExpanded = false,
  onClick,
  onClose,
}: ArticleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Extract metadata from HTML content
  const extractMetadataFromHtml = (htmlContent: string) => {
    const metadata = {
      id: id,
      title: title,
      excerpt: excerpt,
      author: author,
      publishedDate: publishedDate,
      category: category,
      slug: slug,
      content: content
    };

    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;

      // Extract from meta tags
      const metaTags = tempDiv.querySelectorAll('meta');
      metaTags.forEach(meta => {
        const name = meta.getAttribute('name');
        const content = meta.getAttribute('content');
        
        if (name && content) {
          switch (name) {
            case 'article-id':
              metadata.id = content;
              break;
            case 'article-title':
              metadata.title = content;
              break;
            case 'article-excerpt':
              metadata.excerpt = content;
              break;
            case 'article-author':
              metadata.author = content;
              break;
            case 'article-published_date':
              metadata.publishedDate = content;
              break;
            case 'article-category':
              metadata.category = content;
              break;
            case 'article-slug':
              metadata.slug = content;
              break;
          }
        }
      });

      // If excerpt is still empty, try to extract from content
      if (!metadata.excerpt || metadata.excerpt.trim() === '') {
        const firstParagraph = tempDiv.querySelector('p');
        if (firstParagraph && firstParagraph.textContent) {
          const text = firstParagraph.textContent.substring(0, 150);
          metadata.excerpt = text + (firstParagraph.textContent.length > 150 ? '...' : '');
        } else {
          // Fallback: use first 150 characters of content
          const textContent = tempDiv.textContent || '';
          const text = textContent.substring(0, 150);
          metadata.excerpt = text + (textContent.length > 150 ? '...' : '');
        }
      }

      // Ensure we have at least some title
      if (!metadata.title || metadata.title.trim() === '') {
        const titleTag = tempDiv.querySelector('title');
        if (titleTag && titleTag.textContent) {
          metadata.title = titleTag.textContent;
        } else {
          const h1 = tempDiv.querySelector('h1');
          if (h1 && h1.textContent) {
            metadata.title = h1.textContent;
          }
        }
      }

      // Ensure we have at least some author
      if (!metadata.author || metadata.author.trim() === '') {
        metadata.author = 'Unknown Author';
      }

      // Ensure we have at least some category
      if (!metadata.category || metadata.category.trim() === '') {
        metadata.category = 'uncategorized';
      }

    } catch (error) {
      console.warn('Error extracting metadata from HTML:', error);
    }

    return metadata;
  };

  const getFirstImageUrl = (content: string): string | null => {
    if (fileType === 'md') {
      const imgRegex = /!\[.*?\]\((.*?)\)/;
      const match = content.match(imgRegex);
      if (match && match[1]) {
        let imageUrl = match[1];
        if (imageUrl.startsWith('/client/src/')) {
          imageUrl = imageUrl.replace('/client', '');
        } else if (imageUrl.startsWith('/public/')) {
          imageUrl = imageUrl.replace('/public', '/src');
        }
        return imageUrl;
      }
    } else if (fileType === 'html') {
      const imgRegex = /<img[^>]+src="([^">]+)"/;
      const match = content.match(imgRegex);
      if (match && match[1]) {
        let imageUrl = match[1];
        if (imageUrl.startsWith('/client/src/')) {
          imageUrl = imageUrl.replace('/client', '');
        } else if (imageUrl.startsWith('/public/')) {
          imageUrl = imageUrl.replace('/public', '/src');
        }
        return imageUrl;
      }
    }
    return null;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const formatCategory = (cat: string | undefined) => {
    if (!cat || cat === 'unknown' || cat === 'uncategorized') return 'Uncategorized';
    return cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const extractMainContent = (fullContent: string): string => {
    if (fullContent.startsWith('---')) {
      const frontmatterEnd = fullContent.indexOf('---', 3);
      if (frontmatterEnd !== -1) {
        const mainContent = fullContent.slice(frontmatterEnd + 3).trim();
        return mainContent;
      }
    }
    return fullContent;
  };

  // Extract main content from HTML files (remove metadata)
  const extractHtmlContent = (fullContent: string): string => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = fullContent;

      // Remove head section with metadata
      const head = tempDiv.querySelector('head');
      if (head) head.remove();

      // Remove any other metadata elements
      const metaTags = tempDiv.querySelectorAll('meta');
      metaTags.forEach(meta => meta.remove());

      return tempDiv.innerHTML.trim();
    } catch (error) {
      console.warn('Error extracting HTML content:', error);
      return fullContent;
    }
  };

  // Handle image loading errors
  const handleImageError = (src: string) => {
    console.warn(`Failed to load image: ${src}`);
    setFailedImages(prev => new Set(prev).add(src));
  };

  // Process HTML content to ensure proper styling
  const processHtmlContent = (htmlContent: string): string => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;

      const elementsToStyle = {
        'h1': 'text-3xl font-bold mt-8 mb-4 text-foreground',
        'h2': 'text-2xl font-bold mt-10 mb-4 text-foreground',
        'h3': 'text-xl font-bold mt-8 mb-3 text-foreground',
        'h4': 'text-lg font-bold mt-6 mb-2 text-foreground',
        'h5': 'text-base font-bold mt-4 mb-2 text-foreground',
        'h6': 'text-sm font-bold mt-3 mb-1 text-foreground',
        'p': 'mb-6 leading-relaxed text-foreground text-lg',
        'ul': 'list-disc list-inside mb-6 pl-5 space-y-2 text-foreground',
        'ol': 'list-decimal list-inside mb-6 pl-5 space-y-2 text-foreground',
        'li': 'mb-2 text-foreground',
        'blockquote': 'border-l-4 border-primary pl-6 py-4 my-6 bg-muted/30 italic text-foreground',
        'code': 'bg-muted px-2 py-1 rounded-md text-sm font-mono text-foreground',
        'pre': 'bg-muted p-4 rounded-lg my-6 overflow-x-auto border text-foreground',
        'table': 'w-full border-collapse my-6',
        'th': 'border border-border px-4 py-2 bg-muted font-semibold text-left',
        'td': 'border border-border px-4 py-2',
        'a': 'text-primary underline hover:text-primary/80 font-medium',
        'strong': 'font-bold text-foreground',
        'em': 'italic text-foreground',
        '.image-caption': 'text-sm text-muted-foreground mt-2 italic text-center',
        '.image-container': 'my-8 text-center'
      };

      Object.entries(elementsToStyle).forEach(([selector, className]) => {
        if (selector.startsWith('.')) {
          const elements = tempDiv.querySelectorAll(selector);
          elements.forEach(element => {
            element.classList.add(...className.split(' '));
          });
        } else {
          const elements = tempDiv.querySelectorAll(selector);
          elements.forEach(element => {
            element.classList.add(...className.split(' '));
          });
        }
      });

      // Handle images
      const images = tempDiv.querySelectorAll('img');
      images.forEach(img => {
        let src = img.getAttribute('src');
        if (src) {
          if (src.startsWith('/client/src/')) {
            src = src.replace('/client', '');
          } else if (src.startsWith('/public/')) {
            src = src.replace('/public', '/src');
          } else if (!src.startsWith('/') && !src.startsWith('http')) {
            src = `/${src}`;
          }
          img.setAttribute('src', src);
        }
        img.setAttribute('loading', 'lazy');
        img.classList.add('max-w-4xl', 'w-full', 'rounded-xl', 'shadow-lg', 'border', 'mx-auto');
        
        if (!img.closest('.image-container')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'image-container my-8';
          img.parentNode?.insertBefore(wrapper, img);
          wrapper.appendChild(img);
        }
      });

      return tempDiv.innerHTML;
    } catch (error) {
      console.warn('Error processing HTML content:', error);
      return htmlContent;
    }
  };

  // Get metadata for both expanded and collapsed states
  const getArticleMetadata = () => {
    if (fileType === 'html') {
      return extractMetadataFromHtml(content);
    }
    return {
      id,
      title,
      excerpt,
      author,
      publishedDate,
      category,
      slug,
      content
    };
  };

  if (isExpanded) {
    const metadata = getArticleMetadata();
    const articleContent = fileType === 'md' ? extractMainContent(content) : extractHtmlContent(content);

    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl h-full overflow-y-auto">
          <div className="min-h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-2 hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Articles
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleFavoriteClick}
                className="hover:bg-accent"
              >
                <Heart className={`h-5 w-5 transition-colors ${
                  isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
                }`} />
              </Button>
            </div>

            {/* Article Header */}
            <div className="mb-12">
              <Badge 
                variant="secondary" 
                className="text-sm px-4 py-2 mb-6 font-medium"
              >
                {formatCategory(metadata.category)}
              </Badge>
              
              <h1 className="text-4xl font-bold mb-8 leading-tight tracking-tight">
                {metadata.title}
              </h1>

              {metadata.excerpt && (
                <div className="mb-8 p-6 bg-primary/5 rounded-r-xl border-l-4 border-primary">
                  <p className="text-xl text-muted-foreground leading-relaxed italic">
                    {metadata.excerpt}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{metadata.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(metadata.publishedDate)}</span>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="mb-16">
              <article className="max-w-none">
                {fileType === 'html' ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: processHtmlContent(articleContent) 
                    }} 
                  />
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      img: ({ src, alt, ...props }: any) => {
                        let resolvedSrc = src;
                        if (resolvedSrc.startsWith('/client/src/')) {
                          resolvedSrc = resolvedSrc.replace('/client', '');
                        } else if (resolvedSrc.startsWith('/public/')) {
                          resolvedSrc = resolvedSrc.replace('/public', '/src');
                        } else if (!resolvedSrc.startsWith('/') && !resolvedSrc.startsWith('http')) {
                          resolvedSrc = `/${resolvedSrc}`;
                        }
                        return (
                          <div className="my-8 text-center">
                            <img
                              className="max-w-4xl w-full rounded-xl shadow-lg border mx-auto"
                              src={resolvedSrc}
                              alt={alt}
                              onError={() => handleImageError(resolvedSrc)}
                              {...props}
                            />
                            {alt && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                {alt}
                              </p>
                            )}
                          </div>
                        );
                      },
                      p: (props: CustomComponentProps<'p'>) => (
                        <p className="mb-6 leading-relaxed text-foreground text-lg" {...props} />
                      ),
                      h1: (props: CustomComponentProps<'h1'>) => (
                        <h1 className="text-3xl font-bold mt-12 mb-6 text-foreground border-b pb-2" {...props} />
                      ),
                      h2: (props: CustomComponentProps<'h2'>) => (
                        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground" {...props} />
                      ),
                      h3: (props: CustomComponentProps<'h3'>) => (
                        <h3 className="text-xl font-bold mt-8 mb-3 text-foreground" {...props} />
                      ),
                      h4: (props: CustomComponentProps<'h4'>) => (
                        <h4 className="text-lg font-bold mt-6 mb-2 text-foreground" {...props} />
                      ),
                      ul: (props: CustomComponentProps<'ul'>) => (
                        <ul className="list-disc list-inside mb-6 pl-5 space-y-2 text-foreground" {...props} />
                      ),
                      ol: (props: CustomComponentProps<'ol'>) => (
                        <ol className="list-decimal list-inside mb-6 pl-5 space-y-2 text-foreground" {...props} />
                      ),
                      li: (props: CustomComponentProps<'li'>) => (
                        <li className="mb-2 text-foreground" {...props} />
                      ),
                      blockquote: (props: CustomComponentProps<'blockquote'>) => (
                        <blockquote className="border-l-4 border-primary pl-6 py-4 my-6 bg-muted/30 italic text-foreground" {...props} />
                      ),
                      code: ({ node, inline, className, children, ...props }: any) => {
                        if (inline) {
                          return (
                            <code className="bg-muted px-2 py-1 rounded-md text-sm font-mono text-foreground" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <pre className="bg-muted p-4 rounded-lg my-6 overflow-x-auto border">
                            <code className={`text-sm font-mono text-foreground ${className}`} {...props}>
                              {children}
                            </code>
                          </pre>
                        );
                      },
                      strong: (props: CustomComponentProps<'strong'>) => (
                        <strong className="font-bold text-foreground" {...props} />
                      ),
                      em: (props: CustomComponentProps<'em'>) => (
                        <em className="italic text-foreground" {...props} />
                      ),
                      a: (props: CustomComponentProps<'a'>) => (
                        <a className="text-primary underline hover:text-primary/80 font-medium" {...props} />
                      ),
                    }}
                  >
                    {articleContent}
                  </ReactMarkdown>
                )}
              </article>
            </div>

            {/* Article Metadata Footer */}
            <div className="border-t pt-12">
              <h3 className="text-xl font-semibold mb-6 text-foreground">Article Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-muted/20 rounded-xl border">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Author</p>
                      <p className="text-muted-foreground">{metadata.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Published</p>
                      <p className="text-muted-foreground">{formatDate(metadata.publishedDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Article ID</p>
                    <p className="text-muted-foreground font-mono text-sm">#{metadata.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Category</p>
                    <p className="text-muted-foreground">{formatCategory(metadata.category)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Slug</p>
                    <p className="text-muted-foreground font-mono text-sm break-all">{metadata.slug}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact Card View - Use extracted metadata for HTML files
  const metadata = getArticleMetadata();
  const firstImageUrl = getFirstImageUrl(content);

  return (
    <Card
      className="group cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-lg overflow-hidden bg-card"
      onClick={onClick}
      data-testid={`card-article-${metadata.id}`}
    >
      <div className="aspect-video overflow-hidden relative">
        {firstImageUrl ? (
          <img
            src={firstImageUrl}
            alt={metadata.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => handleImageError(firstImageUrl)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-blue-500/90 to-purple-600/90">
            <ImageIcon className="h-16 w-16 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center p-6">
          <h3 className="font-bold text-xl text-white text-center line-clamp-3 leading-tight">
            {metadata.title}
          </h3>
        </div>
        
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 bg-background/20 backdrop-blur-sm rounded-full hover:bg-background/30 border-0"
          onClick={handleFavoriteClick}
          data-testid={`button-favorite-${metadata.id}`}
        >
          <Heart className={`h-4 w-4 transition-colors ${
            isFavorite ? "fill-white text-white" : "text-white/80"
          }`} />
        </Button>
        
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0">
            {formatCategory(metadata.category)}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-5 space-y-3">
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {metadata.excerpt}
        </p>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
          <User className="h-4 w-4" />
          <span className="line-clamp-1 font-medium">{metadata.author}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(metadata.publishedDate)}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-5 pt-0">
        <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          Read More
        </Button>
      </CardFooter>
    </Card>
  );
}