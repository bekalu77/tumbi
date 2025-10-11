import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { useState } from "react";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  mode?: "add" | "edit";
}

interface ProductFormData {
  name: string;
  category: string;
  price: number;
  unit: string;
  madeOf: string;
  description: string;
  companyId?: string;
  minOrder?: number;
  stock?: number;
}

export default function ProductFormDialog({
  open,
  onOpenChange,
  product,
  mode = "add",
}: ProductFormDialogProps) {
  const [images, setImages] = useState<string[]>([]);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: product || {
      name: "",
      category: "",
      price: 0,
      unit: "bag",
      madeOf: "",
      description: "",
      minOrder: 1,
      stock: 0,
    },
  });

  const category = watch("category");

  const onSubmit = (data: ProductFormData) => {
    console.log("Product data:", { ...data, images });
    // TODO: Save to database
    onOpenChange(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement actual image upload
    console.log("Image upload:", e.target.files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? "Add a new construction material to your catalog"
              : "Update product information"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Images</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  data-testid="input-images"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload product images
                  </p>
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  {...register("name", { required: "Product name is required" })}
                  placeholder="Portland Cement Grade 42.5"
                  data-testid="input-product-name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={category}
                  onValueChange={(value) => setValue("category", value)}
                >
                  <SelectTrigger id="category" data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cement">Cement</SelectItem>
                    <SelectItem value="Steel">Steel</SelectItem>
                    <SelectItem value="Wood">Wood</SelectItem>
                    <SelectItem value="Tiles">Tiles</SelectItem>
                    <SelectItem value="Paint">Paint</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (ETB) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", { required: "Price is required", min: 0 })}
                  placeholder="450"
                  data-testid="input-price"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  {...register("unit", { required: "Unit is required" })}
                  placeholder="bag, m2, ton"
                  data-testid="input-unit"
                />
                {errors.unit && (
                  <p className="text-sm text-destructive">{errors.unit.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register("stock", { min: 0 })}
                  placeholder="100"
                  data-testid="input-stock"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="madeOf">Materials/Composition *</Label>
                <Input
                  id="madeOf"
                  {...register("madeOf", { required: "Materials information is required" })}
                  placeholder="Portland clinker and gypsum"
                  data-testid="input-made-of"
                />
                {errors.madeOf && (
                  <p className="text-sm text-destructive">{errors.madeOf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minOrder">Minimum Order Quantity</Label>
                <Input
                  id="minOrder"
                  type="number"
                  {...register("minOrder", { min: 1 })}
                  placeholder="1"
                  data-testid="input-min-order"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register("description", { required: "Description is required" })}
                placeholder="Detailed product description..."
                rows={4}
                data-testid="input-description"
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-product">
              {mode === "add" ? "Add Product" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
