import React, { useState, useEffect } from 'react';
import { Heart, Calendar, ArrowLeft, Image as ImageIcon, Clock, MapPin, Newspaper, DollarSign, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Define the props types (Expected Snake_Case Keys) ---
interface TenderFrontMatter {
  tender_no: number;
  closing: string; // This will be the title
  opening: string; // This will be the slug
  region: string;
  category: string;
  published: string; // This will be the publishedOn
  featured?: boolean;
}

interface TenderCardProps {
  id: string;
  frontMatter: TenderFrontMatter;
  contentHtml: string;
  onClick?: () => void;
  isExpanded?: boolean;
  onClose?: () => void;
}

// Helper to safely display data and prevent "N/A" issues
const safeDisplay = (value: string | number | undefined | null) => value !== undefined && value !== null && value !== '' ? value.toString() : 'Not specified';

// Format date if needed
const formatDate = (dateString: string) => {
  if (!dateString || dateString === 'N/A') return 'Not specified';
  
  // If it's already a readable date, return as is
  if (dateString.includes('working days') || dateString.includes('PM') || dateString.includes('AM')) {
    return dateString;
  }
  
  // Otherwise try to parse and format
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

// Extract summary from content HTML
const extractSummary = (html: string, maxLength: number = 150) => {
  if (!html) return 'No description available';
  
  // Remove HTML tags and get plain text
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// --- The Modal Component ---
const TenderModal: React.FC<{ frontMatter: TenderFrontMatter, contentHtml: string, onClose: () => void }> = ({ 
  frontMatter, 
  contentHtml, 
  onClose 
}) => {
    const [isFavorite, setIsFavorite] = useState(false);

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsFavorite(!isFavorite);
    };

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
                            Back to Tenders
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

                    {/* Tender Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Badge 
                                variant="secondary" 
                                className="text-sm px-3 py-1 font-medium"
                            >
                                {safeDisplay(frontMatter.category)}
                            </Badge>
                            {frontMatter.tender_no !== undefined && (
                                <Badge variant="outline" className="text-xs">
                                    Tender No: {safeDisplay(frontMatter.tender_no)}
                                </Badge>
                            )}
                        </div>
                        
                        <h1 className="text-3xl font-bold mb-6 leading-tight">
                            {safeDisplay(frontMatter.closing)}
                        </h1>

                        {/* Key Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                                <Newspaper className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <span className="font-medium">Published: </span>
                                    <span>{formatDate(frontMatter.published)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <span className="font-medium">Region: </span>
                                    <span>{safeDisplay(frontMatter.region)}</span>
                                </div>
                            </div>
                            {/* Removed bid_closing_date, bid_opening_date, bid_document_price, bid_bond, tender_authority, tender_value, location */}
                        </div>
                    </div>

                    {/* Tender Content */}
                    <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
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
                            {contentHtml}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- The Main Card Component ---
const TenderCard: React.FC<TenderCardProps> = ({ 
  id, 
  frontMatter, 
  contentHtml, 
  onClick, 
  isExpanded, 
  onClose 
}) => {
    const [isFavorite, setIsFavorite] = useState(false);

    // 🛑 DATA SAFETY GUARD: Prevents the "Cannot read properties of undefined" error
    if (!frontMatter) {
        return (
            <Card className="border-2 border-dashed border-muted-foreground/20">
                <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground">⚠️ Error: Missing tender metadata</div>
                </CardContent>
            </Card>
        );
    }

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFavorite(!isFavorite);
    };

    const summary = extractSummary(contentHtml);

    return (
        <>
            {isExpanded && (
                <TenderModal 
                    frontMatter={frontMatter}
                    contentHtml={contentHtml}
                    onClose={onClose || (() => {})}
                />
            )}

            {!isExpanded && (
                <Card
                    className="group cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-lg overflow-hidden bg-card h-full flex flex-col"
                    onClick={onClick}
                    data-testid={`card-tender-${id}`}
                >
                    {/* Card Header */}
                    <div className="p-4 pb-0">
                        <div className="flex items-center justify-between mb-2">
                            <Badge 
                                variant="secondary" 
                                className="text-sm px-3 py-1 font-medium"
                            >
                                {safeDisplay(frontMatter.category)}
                            </Badge>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="hover:bg-accent"
                                onClick={handleFavoriteClick}
                                data-testid={`button-favorite-${id}`}
                            >
                                <Heart className={`h-4 w-4 transition-colors ${
                                    isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
                                }`} />
                            </Button>
                        </div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {safeDisplay(frontMatter.closing)}
                        </h3>
                    </div>
                    
                    {/* Card Content */}
                    <CardContent className="p-4 space-y-3 flex-grow">
                        {/* Summary */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {summary}
                        </p>
                        
                        {/* Key Details */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Newspaper className="h-3 w-3 flex-shrink-0" />
                                <span className="line-clamp-1">Published: {formatDate(frontMatter.published)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="line-clamp-1">{safeDisplay(frontMatter.region)}</span>
                            </div>
                            
                            {frontMatter.tender_no !== undefined && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <DollarSign className="h-3 w-3 flex-shrink-0" />
                                    <span>Tender No: {safeDisplay(frontMatter.tender_no)}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    
                    {/* Card Footer */}
                    <CardFooter className="p-4 pt-0 mt-auto">
                        <Button 
                            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                            size="sm"
                        >
                            View Full Details
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </>
    );
};

export default TenderCard;
