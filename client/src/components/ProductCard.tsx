import { useState } from "react";
import { Heart, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  name: string;
  company: string | null;
  category: string;
  price: number;
  unit: string | null;
  imageUrls: string[]; // Array of image URLs
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
  imageUrls,
  companyPhone,
  companyEmail,
  onClick,
}: ProductCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    console.log(`Product ${id} favorite toggled:`, !isFavorite);
  };

  const primaryImage = (imageUrls && imageUrls.length > 0)
    ? imageUrls[0]
    : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlMGUwZTAiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSIjODg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==";

  return (
    <Card
      className="overflow-hidden cursor-pointer group border-2 border-transparent hover:border-primary transition-all duration-300"
      onClick={onClick}
      data-testid={`card-product-${id}`}
    >
      <div className="aspect-video overflow-hidden bg-muted relative">
        <img src={primaryImage} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full"
          onClick={handleFavoriteClick}
          data-testid={`button-favorite-${id}`}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : "text-gray-500"}`} />
        </Button>
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
          <Badge variant="secondary">{category}</Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 mb-1">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">{price != null ? price.toLocaleString() : '0'}</span>
          <span className="text-sm text-muted-foreground">ETB/{unit}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button className="w-full" variant="outline">View Details</Button>
        {user?.username === "admin77" && (
          <>
            <Button size="icon" variant="outline" onClick={(e) => { e.stopPropagation(); console.log("Edit clicked for product", id); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); console.log("Delete clicked for product", id); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
