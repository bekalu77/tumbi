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
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import type { Company, ItemCategory } from "@shared/schema";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: {
    id: string;
    name: string;
    categoryId: string;
    companyId: string;
    price: number;
    unit: string;
    // madeOf: string; // Removed
    description: string;
    minOrder?: number;
    stock?: number;
    imageUrls: string[];
  };
  mode?: "add" | "edit";
  onOpenCompanyForm: () => void;
}

interface ProductFormData {
  name: string;
  categoryId: string;
  companyId: string;
  price: number;
  unit: string;
  // madeOf: string; // Removed
  description: string;
  minOrder?: number;
  stock?: number;
}

export default function ProductFormDialog({
  open,
  onOpenChange,
  product,
  mode = "add",
  onOpenCompanyForm,
}: ProductFormDialogProps) {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newProductImages, setNewProductImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);

  const { data: companies, isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ["companies", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/companies?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<ItemCategory[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: product ? {
      ...product,
      categoryId: product.categoryId || "",
      companyId: product.companyId || "",
    } : {
      name: "",
      categoryId: "",
      companyId: "",
      price: 0,
      unit: "bag",
      // madeOf: "", // Removed
      description: "",
      minOrder: 1,
      stock: 0,
    },
  });

  // Manually register categoryId to apply validation rules
  useEffect(() => {
    register("categoryId", { required: "Category is required" });
  }, [register]);

  const categoryId = watch("categoryId");
  const companyId = watch("companyId");
  const unit = watch("unit");

  const timeBasedCategories = useMemo(() => {
    if (!categories) return [];
    const keywords = ['rental', 'service', 'consulting', 'labour work', 'equipment rental'];
    return categories.filter(c => keywords.some(keyword => c.category.toLowerCase().includes(keyword))).map(c => c.id);
  }, [categories]);

  useEffect(() => {
    const standardUnits = [
      "m²", "m³", "kg", "ton", "liter", "gallon", "bag", "quintal", 
      "piece", "roll", "sheet", "bundle", "foot (ft)", "inch (in)", "lm", "Per Point"
    ];
    const rentalUnits = [
      "Per hour", "Per day", "Per week", "Per month", "Per shift", "Per project (lumpsum)"
    ];

    if (timeBasedCategories.includes(categoryId)) {
      setUnitOptions(rentalUnits);
      if (!rentalUnits.includes(unit)) {
        setValue("unit", rentalUnits[0]);
      }
    } else {
      setUnitOptions(standardUnits);
      if (!standardUnits.includes(unit)) {
        setValue("unit", standardUnits[0]);
      }
    }
  }, [categoryId, timeBasedCategories, setValue, unit]);

  useEffect(() => {
    if (companies?.length === 1 && !product) {
      setValue("companyId", companies[0].id);
    }
  }, [companies, product, setValue]);

  useEffect(() => {
    if (product && product.imageUrls) {
      setExistingImageUrls(product.imageUrls);
    }
  }, [product]);

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
        setError("You must be logged in to add a product.");
        setIsSubmitting(false);
        return;
    }

    try {
      const submissionData = new FormData();
      
      newProductImages.forEach(image => {
        submissionData.append('productImages', image);
      });

      if (mode === "edit") {
        submissionData.append('existingImageUrls', JSON.stringify(existingImageUrls));
      }

      submissionData.append('name', data.name);
      submissionData.append('categoryId', data.categoryId);
      submissionData.append('companyId', data.companyId);
      submissionData.append('price', data.price.toString());
      submissionData.append('unit', data.unit);
      submissionData.append('description', data.description);
      
      if (data.minOrder) {
        submissionData.append('minOrder', data.minOrder.toString());
      }
      
      if (data.stock) {
        submissionData.append('stock', data.stock.toString());
      }

      const url = mode === "add" ? '/api/products' : `/api/products/${product?.id}`;
      const method = mode === "add" ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method: method,
        body: submissionData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to save product');
      }

      setNewProductImages([]);
      onOpenChange(false);
      toast({
        title: "Success",
        description: `Product ${mode === "add" ? "added" : "updated"} successfully.`,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            {mode === "add" ? t("addNewProduct") : t("editProduct")}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? t("addProductDescription")
              : t("updateProductInformation")
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {!isAuthenticated ? (
            <div className="text-center">
              <h3 className="text-lg font-medium">{t("authenticationRequired")}</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                {t("pleaseLogInToAddProduct")}
              </p>
              <Button onClick={() => {
                onOpenChange(false);
                navigate("/login");
              }}>
                {t("goToLogin")}
              </Button>
            </div>
          ) : isLoadingCompanies || isLoadingCategories ? (
            <div className="text-center">{t("loading")}</div>
          ) : mode === "add" && companies && companies.length === 0 ? (
            <div className="text-center">
              <h3 className="text-lg font-medium">{t("companyRegistrationRequired")}</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                {t("registerCompanyBeforeAddingProducts")}
              </p>
              <Button onClick={() => {
                onOpenChange(false);
                onOpenCompanyForm();
              }}>
                {t("registerCompany")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-upload">{t("productImages")} *</Label>
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
                        {t("clickToUploadProductImages")}
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
                    <Label htmlFor="name">{t("productName")} *</Label>
                    <Input
                      id="name"
                      {...register("name", { required: t("productNameIsRequired") })}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyId">{t("company")} *</Label>
                    <Select
                      value={companyId}
                      onValueChange={(value) => setValue("companyId", value)}
                    >
                      <SelectTrigger id="companyId">
                        <SelectValue placeholder={t("selectCompany")} />
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
                  <Label htmlFor="categoryId">{t("category")} *</Label>
                  <Select
                    value={categoryId}
                    onValueChange={(value) => setValue("categoryId", value, { shouldValidate: true })}
                  >
                    <SelectTrigger id="categoryId">
                      <SelectValue placeholder={t("selectCategory")} />
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
                    <Label htmlFor="price">{t("priceETB")} *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...register("price", { required: t("priceIsRequired"), valueAsNumber: true })}
                    />
                    {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">{t("unit")} *</Label>
                    <Select
                      value={unit}
                      onValueChange={(value) => setValue("unit", value)}
                    >
                      <SelectTrigger id="unit">
                        <SelectValue placeholder={t("selectUnit")} />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">{t("stockQuantity")}</Label>
                    <Input
                      id="stock"
                      type="number"
                      {...register("stock", { valueAsNumber: true })}
                    />
                    {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
                  </div>
                </div>
                {/* Removed Made Of field */}
                {/* <div className="space-y-2">
                  <Label htmlFor="madeOf">Made Of</Label>
                  <Input
                    id="madeOf"
                    {...register("madeOf")}
                  />
                  {errors.madeOf && <p className="text-sm text-destructive">{errors.madeOf.message}</p>}
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="description">{t("description")} *</Label>
                  <Textarea
                    id="description"
                    {...register("description", { required: t("descriptionIsRequired") })}
                    rows={4}
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  {t("cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || (existingImageUrls.length + newProductImages.length) === 0}
                >
                  {isSubmitting ? t("saving") : (mode === "add" ? t("addProductButton") : t("saveChanges"))}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
