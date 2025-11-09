import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Phone, Mail, Upload, X } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import type { Company, ItemCategory } from "@shared/schema";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    company: string | null;
    category: string;
    categoryId: string;
    companyId: string;
    price: number;
    unit: string | null;
    description: string | null;
    images: string[];
    companyPhone?: string;
    companyEmail?: string;
    isOwner?: boolean;
  };
  onDelete?: () => void;
  mode: "view" | "edit"; // Added mode prop
}

interface ProductFormData {
  name: string;
  categoryId: string;
  companyId: string;
  price: number;
  unit: string | null;
  description: string | null;
}

export default function ProductDetailModal({
  open,
  onOpenChange,
  product,
  onDelete,
  mode: initialMode, // Renamed to initialMode to avoid conflict with state
}: ProductDetailModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isEditing, setIsEditing] = useState(initialMode === "edit"); // State to toggle between view and edit
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(product.images);
  const [newProductImages, setNewProductImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: companies, isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ["companies", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/companies?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    },
    enabled: !!user?.id && isEditing, // Only fetch if in edit mode
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<ItemCategory[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: isEditing, // Only fetch if in edit mode
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<ProductFormData>({
    defaultValues: {
      name: product.name,
      categoryId: product.categoryId,
      companyId: product.companyId,
      price: product.price,
      unit: product.unit || "",
      description: product.description || "",
    },
  });

  const categoryId = watch("categoryId");
  const companyId = watch("companyId");

  useEffect(() => {
    if (product) {
      setExistingImageUrls(product.images);
      reset({
        name: product.name,
        categoryId: product.categoryId,
        companyId: product.companyId,
        price: product.price,
        unit: product.unit || "",
        description: product.description || "",
      });
    }
    setIsEditing(initialMode === "edit");
  }, [product, reset, initialMode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const uploadedFiles = Array.from(files);
      const totalImages = existingImageUrls.length + newProductImages.length + uploadedFiles.length;

      if (totalImages > 3) {
        setError("You can upload a maximum of 3 images (including existing ones).");
        return;
      }
      setNewProductImages((prev) => [...prev, ...uploadedFiles]);
      setError(null);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);

    if (!isAuthenticated) {
      setError("You must be logged in to edit a product.");
      setIsSubmitting(false);
      return;
    }

    try {
      const submissionData = new FormData();

      newProductImages.forEach(image => {
        submissionData.append('productImages', image);
      });

      submissionData.append('existingImageUrls', JSON.stringify(existingImageUrls));
      submissionData.append('name', data.name);
      submissionData.append('categoryId', data.categoryId);
      submissionData.append('companyId', data.companyId);
      submissionData.append('price', data.price.toString());
      submissionData.append('unit', data.unit || ""); // Provide fallback for null
      submissionData.append('description', data.description || ""); // Provide fallback for null

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        body: submissionData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update product');
      }

      setNewProductImages([]);
      setIsEditing(false); // Switch back to view mode after successful edit
      onOpenChange(false); // Close the modal

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating the product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-row items-center justify-between"> {/* Modified DialogHeader */}
          <DialogTitle className="text-2xl font-heading">
            {isEditing ? "Edit Product" : product.name}
          </DialogTitle>
          {!isEditing && (product.isOwner || user?.username === "admin77") && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)} // Toggle to edit mode
                data-testid="button-edit-product"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                data-testid="button-delete-product"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
          {isEditing && (
            <DialogDescription>Update product information</DialogDescription>
          )}
        </DialogHeader>

        {isEditing ? (
          <div className="py-6">
            {!isAuthenticated ? (
              <div className="text-center">
                <h3 className="text-lg font-medium">Authentication Required</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  Please log in to edit a product.
                </p>
              </div>
            ) : isLoadingCompanies || isLoadingCategories ? (
              <div className="text-center">Loading...</div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Product Images (up to 3) *</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        multiple
                      />
                      <label htmlFor="image-upload" className="cursor-pointer block">
                        <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload product images
                        </p>
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4">
                      {existingImageUrls.map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Existing product image ${index + 1}`}
                            className="h-20 w-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {newProductImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`New product preview ${index + 1}`}
                            className="h-20 w-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/15 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        {...register("name", { required: "Product name is required" })}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyId">Company *</Label>
                      <Select
                        value={companyId}
                        onValueChange={(value) => setValue("companyId", value)}
                      >
                        <SelectTrigger id="companyId">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies?.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.companyId && <p className="text-sm text-destructive">{errors.companyId.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category *</Label>
                    <Select
                      value={categoryId}
                      onValueChange={(value) => setValue("categoryId", value)}
                    >
                      <SelectTrigger id="categoryId">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (ETB) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        {...register("price", { required: "Price is required", valueAsNumber: true })}
                      />
                      {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit *</Label>
                      <Input
                        id="unit"
                        {...register("unit", { required: "Unit is required" })}
                      />
                      {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...register("description", { required: "Description is required" })}
                      rows={4}
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)} // Go back to view mode
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || (existingImageUrls.length + newProductImages.length) === 0}
                  >
                    {isSubmitting ? "Updating..." : "Update Product"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
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
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">Category:</div>
                <Badge className="mb-2">{product.category}</Badge>
                <div className="text-sm text-muted-foreground mb-1">Company:</div>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{product.company}</h4>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-primary">
                  {product.price.toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground">ETB/{product.unit}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Unit</div>
                  <div className="font-semibold">{product.unit}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Contact</div>
                  <div className="space-y-1">
                    {product.companyPhone && product.companyPhone.trim() && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        <span>{product.companyPhone}</span>
                      </div>
                    )}
                    {product.companyEmail && product.companyEmail.trim() && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{product.companyEmail}</span>
                      </div>
                    )}
                    {(!product.companyPhone || !product.companyPhone.trim()) && (!product.companyEmail || !product.companyEmail.trim()) && (
                      <span className="text-sm text-muted-foreground">No contact info</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
