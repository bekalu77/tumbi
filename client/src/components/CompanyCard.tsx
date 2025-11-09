import { MapPin, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";

interface CompanyCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  category: string;
  logo?: string;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isVerified?: boolean;
}

export default function CompanyCard({
  id,
  name,
  description,
  location,
  category,
  logo,
  onClick,
  onDelete,
  onEdit,
  isVerified,
}: CompanyCardProps) {
  const { user } = useAuth();
  return (
    <Card
      className="cursor-pointer hover-elevate active-elevate-2 transition-transform hover:-translate-y-1 flex flex-col"
      onClick={onClick}
      data-testid={`card-company-${id}`}
    >
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <Avatar className="h-16 w-16">
          {logo ? (
            <img src={logo} alt={name} className="object-cover" />
          ) : (
            <AvatarFallback className="text-xl">{name[0]}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-xl line-clamp-1">{name}</h3>
            {isVerified && <CheckCircle className="h-5 w-5 text-green-500" />}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{category}</Badge>
        </div>
      </CardContent>
      {user?.username === "admin77" && (
        <CardFooter className="p-4 pt-0">
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" className="w-full" onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Are you sure you want to delete this company? All related products/services and jobs will also be deleted.")) {
                onDelete?.();
              }
            }}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
