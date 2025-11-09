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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Phone, Mail, Globe, Pencil, Trash2, Upload, X } from "lucide-react";
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
import ProductCard from "./ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/types";

interface CompanyType {
  id: string;
  name: string;
}

interface CompanyProduct {
  id: string;
  name: string;
  companyName: string;
  categoryName: string;
  price: number;
  unit: string;
  imageUrls: string[];
  companyPhone?: string;
  companyEmail?: string;
}

interface CompanyDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    description: string;
    location: string;
    email?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    typeId?: string;
    products?: Array<{ // Make products optional initially
      id: string;
      name: string;
      company: string;
      category: string;
      price: number;
      unit: string;
      imageUrls: string[]; // Changed to imageUrls array
    }>;
    isOwner?: boolean;
  };
  onDelete?: () => void;
  mode: "view" | "edit"; // Added mode prop
}

interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  description: string;
  location: string;
  website?: string;
  typeId?: string;
}

export default function CompanyDetailModal({
  open,
  onOpenChange,
  company,
  onDelete,
  mode: initialMode, // Renamed to initialMode to avoid conflict with state
}: CompanyDetailModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(initialMode === "edit"); // State to toggle between view and edit
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(company.logoUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: companyTypes, isLoading: isLoadingCompanyTypes } = useQuery<CompanyType[], Error>({
    queryKey: ["companyTypes"],
    queryFn: async () => {
      const res = await fetch('/api/company-types');
      if (!res.ok) throw new Error('Failed to fetch company types');
      return res.json();
    },
    enabled: isEditing, // Only fetch if in edit mode
  });

  const { data: companyProducts, isLoading: isLoadingCompanyProducts } = useQuery<CompanyProduct[], Error>({
    queryKey: ["companyProducts", company.id],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${company.id}/products`);
      if (!res.ok) throw new Error('Failed to fetch company products');
      return res.json();
    },
    enabled: open && !isEditing, // Only fetch if modal is open and in view mode
  });

  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(company.typeId || undefined);

  const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm<CompanyFormData>({
    defaultValues: {
      name: company.name,
      email: company.email || "",
      phone: company.phone || "",
      description: company.description,
      location: company.location,
      website: company.website || "",
    },
  });

  useEffect(() => {
    if (company) {
      setExistingLogoUrl(company.logoUrl || null);
      setSelectedTypeId(company.typeId || undefined);
      reset({
        name: company.name,
        email: company.email || "",
        phone: company.phone || "",
        description: company.description,
        location: company.location,
        website: company.website || "",
      });
    }
    setIsEditing(initialMode === "edit");
  }, [company, reset, initialMode]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }
      setCompanyLogo(file);
      setError(null);
    }
  };

  const removeLogo = () => {
    setCompanyLogo(null);
    setExistingLogoUrl(null); // Also clear existing logo
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const submissionData = new FormData();

      // Append the logo file
      if (companyLogo) {
        submissionData.append('companyLogo', companyLogo);
      } else if (existingLogoUrl) {
        // If no new logo but existing one is present, send it as a string
        submissionData.append('existingLogoUrl', existingLogoUrl);
      } else {
        // If no logo at all, send an empty string or null to clear it on backend
        submissionData.append('existingLogoUrl', '');
      }

      // Append all text fields
      submissionData.append('name', data.name);
      submissionData.append('email', data.email || '');
      submissionData.append('phone', data.phone || '');
      submissionData.append('description', data.description);
      submissionData.append('location', data.location);
      if (data.website) {
        submissionData.append('website', data.website);
      }
      if (selectedTypeId) {
        submissionData.append('typeId', selectedTypeId);
      const selectedType = companyTypes?.find((ct) => ct.id === selectedTypeId);
        if (selectedType) {
          submissionData.append('companyType', selectedType.name);
        }
      } else {
        submissionData.append('typeId', ''); // Clear type if none selected
      }


      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        body: submissionData,
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || 'Failed to update company');
      }
      const responseData = await response.json();

      setIsEditing(false); // Switch back to view mode after successful edit
      onOpenChange(false); // Close the modal

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating the company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCompanyLogo(null);
    setError(null);
    reset();
    setIsEditing(false); // Go back to view mode
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        handleCancel();
      }
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0"> {/* Modified DialogHeader */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {(companyLogo || existingLogoUrl) ? (
                <img src={companyLogo ? URL.createObjectURL(companyLogo) : existingLogoUrl!} alt={company.name} className="object-cover" />
              ) : (
                <AvatarFallback className="text-2xl">
                  {company.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-heading">
                {isEditing ? "Edit Company" : company.name}
              </DialogTitle>
              {!isEditing && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{company.location}</span>
                </div>
              )}
            </div>
          </div>
          {!isEditing && (company.isOwner || user?.username === "admin77") && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)} // Toggle to edit mode
                data-testid="button-edit-company"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Company
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this company? All related products/services and jobs will also be deleted.")) {
                    onDelete?.();
                  }
                }}
                data-testid="button-delete-company"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Company
              </Button>
            </div>
          )}
        </DialogHeader>

        {isEditing ? (
          <div className="py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo-upload">Company Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer block">
                      <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload company logo
                      </p>
                    </label>
                  </div>

                  {(companyLogo || existingLogoUrl) && (
                    <div className="mt-4 relative inline-block">
                      <div className="relative group">
                        <img
                          src={companyLogo ? URL.createObjectURL(companyLogo) : existingLogoUrl!}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded-full border"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/15 rounded-md">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      {...register("name", {
                        required: "Company name is required",
                        minLength: { value: 2, message: "Company name must be at least 2 characters" }
                      })}
                      placeholder="Derba Midroc Cement"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      placeholder="contact@company.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      {...register("phone", {
                        required: "Phone is required",
                        pattern: {
                          value: /^\+?[\d\s-()]+$/,
                          message: "Invalid phone number format"
                        }
                      })}
                      placeholder="+251 11 123 4567"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      {...register("location", {
                        required: "Location is required",
                        minLength: { value: 2, message: "Location must be at least 2 characters" }
                      })}
                      placeholder="Addis Ababa, Ethiopia"
                    />
                    {errors.location && (
                      <p className="text-sm text-destructive">{errors.location.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    {...register("website")}
                    placeholder="https://company.com"
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive">{errors.website.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeId">Company Type</Label>
                  <Select value={selectedTypeId} onValueChange={(v) => setSelectedTypeId(v)}>
                    <SelectTrigger id="typeId">
                      <SelectValue placeholder={isLoadingCompanyTypes ? "Loading types..." : "Select company type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {companyTypes?.map((ct) => (
                        <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register("description", {
                      required: "Description is required",
                      minLength: { value: 10, message: "Description must be at least 10 characters" }
                    })}
                    placeholder="Describe your company, services, and expertise in construction materials..."
                    rows={4}
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
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Company"
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="products" data-testid="tab-products">Products/Services</TabsTrigger> {/* Renamed tab */}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-3">
                {company.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-semibold">{company.phone}</div>
                    </div>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-semibold">{company.email}</div>
                    </div>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Website</div>
                      <div className="font-semibold">
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-semibold">{company.location}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{company.description}</p>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoadingCompanyProducts ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    Loading products...
                  </div>
                ) : companyProducts && companyProducts.length > 0 ? (
                  companyProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      company={product.companyName}
                      category={product.categoryName}
                      price={Number(product.price)}
                      unit={product.unit}
                      imageUrls={product.imageUrls || []} // Ensure imageUrls is an array
                      companyPhone={product.companyPhone}
                      companyEmail={product.companyEmail}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No products/services listed yet.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
