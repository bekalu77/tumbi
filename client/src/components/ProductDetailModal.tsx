import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import ProductFormDialog from "./ProductFormDialog";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    company: string;
    category: string;
    price: number;
    unit: string;
    madeOf: string;
    description: string;
    images: string[];
    isOwner?: boolean;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ProductDetailModal({
  open,
  onOpenChange,
  product,
  onEdit,
  onDelete,
}: ProductDetailModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleEdit = () => {
    setShowEditForm(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? "border-primary" : "border-transparent"
                  }`}
                  data-testid={`button-thumbnail-${idx}`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Badge className="mb-2">{product.category}</Badge>
              <button className="text-sm text-primary hover:underline" data-testid="link-company">
                {product.company}
              </button>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-primary">
                  {product.price.toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground">ETB/{product.unit}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Unit</div>
                <div className="font-semibold">{product.unit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Made of</div>
                <div className="font-semibold">{product.madeOf}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {product.isOwner && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleEdit}
                  data-testid="button-edit-product"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={onDelete}
                  data-testid="button-delete-product"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <ProductFormDialog
        open={showEditForm}
        onOpenChange={setShowEditForm}
        product={product}
        mode="edit"
      />
    </Dialog>
  );
}
