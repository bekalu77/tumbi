import { useState } from "react";
import { Heart, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  name: string;
  company: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  companyPhone?: string;
  companyEmail?: string;
  onClick?: () => void;
}

export default function ProductCard({
  id,
  name,
  company,
  category,
  price,
  unit,
  image,
  companyPhone,
  companyEmail,
  onClick,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    console.log(`Product ${id} favorite toggled:`, !isFavorite);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-transform hover:-translate-y-1"
      onClick={onClick}
      data-testid={`card-product-${id}`}
    >
      <div className="aspect-square overflow-hidden bg-muted relative">
        <img src={image} alt={name} className="w-full h-full object-cover" />
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
          onClick={handleFavoriteClick}
          data-testid={`button-favorite-${id}`}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
        </Button>
      </div>
      <CardContent className="p-4">
        <Badge className="mb-2" variant="secondary">{category}</Badge>
        <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{company}</p>
        {(companyPhone || companyEmail) && (
          <div className="mt-3 pt-3 border-t space-y-1">
            {companyPhone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{companyPhone}</span>
              </div>
            )}
            {companyEmail && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{companyEmail}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">{price.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">ETB/{unit}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
