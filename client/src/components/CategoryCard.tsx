import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CategoryCardProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  onClick?: () => void;
}

export default function CategoryCard({ icon: Icon, label, count, onClick }: CategoryCardProps) {
  return (
    <Card
      className="aspect-square flex flex-col items-center justify-center gap-3 cursor-pointer hover-elevate active-elevate-2 transition-transform hover:-translate-y-1"
      onClick={onClick}
      data-testid={`card-category-${(label ?? '').toLowerCase()}`}
    >
      <Icon className="h-12 w-12 text-primary" />
      <div className="text-center">
        <div className="font-semibold">{label}</div>
        {count !== undefined && (
          <div className="text-xs text-muted-foreground">{count} items</div>
        )}
      </div>
    </Card>
  );
}
