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
import { Upload, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { CompanyType } from "@shared/schema"; // Import CompanyType
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: any; // Consider creating a more specific type for company
  mode?: "add" | "edit";
  onSuccess?: () => void;
}

interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  description: string;
  location: string;
  website?: string;
  typeId?: string; // Re-adding typeId
  companyType?: string; // Keeping this for display/custom types
}

export default function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  mode = "add",
  onSuccess,
}: CompanyFormDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm<CompanyFormData>({
    defaultValues: company || {
      name: "",
      email: "",
      phone: "",
      description: "",
      location: "",
      website: "",
    },
  });

  const { data: companyTypes, isLoading: isLoadingCompanyTypes } = useQuery<CompanyType[]>({
    queryKey: ["companyTypes"],
    queryFn: async () => {
      const res = await fetch('/api/company-types');
      if (!res.ok) throw new Error('Failed to fetch company types');
      return res.json();
    },
  });

  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(company?.typeId ?? undefined);

  useEffect(() => {
    if (company) {
      setExistingLogoUrl(company.logoUrl || null);
      setSelectedTypeId(company.typeId || undefined);
      reset(company);
    } else {
      setExistingLogoUrl(null);
      setSelectedTypeId(undefined);
      reset({
        name: "",
        email: "",
        phone: "",
        description: "",
        location: "",
        website: "",
        typeId: "", // Initialize typeId
        companyType: "", // Initialize companyType
      });
    }
  }, [company, reset]);

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
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    setError(null);

    if (!isAuthenticated) {
      setError("You must be logged in to register a company.");
      setIsSubmitting(false);
      return;
    }

    try {
      // DEBUG: Check what react-hook-form gives us
      console.log('=== REACT-HOOK-FORM DATA ===');
      console.log('Form data:', data);
      console.log('Current values:', getValues());

      const submissionData = new FormData();

      // Append the logo file
      if (companyLogo) {
        submissionData.append('companyLogo', companyLogo);
        console.log('Logo file added:', companyLogo.name);
      }

      // CRITICAL FIX: Get values directly from form to ensure they're not undefined
      const formValues = getValues();

      // Append all text fields - use explicit values
      submissionData.append('name', formValues.name || '');
      submissionData.append('email', formValues.email || '');
      submissionData.append('phone', formValues.phone || '');
      submissionData.append('description', formValues.description || '');
      submissionData.append('location', formValues.location || '');
      if (formValues.website) {
        submissionData.append('website', formValues.website);
      }
      // append typeId and companyType if selected
      if (selectedTypeId) {
        submissionData.append('typeId', selectedTypeId);
        const selectedType = companyTypes?.find((ct) => ct.id === selectedTypeId);
        if (selectedType) {
          submissionData.append('companyType', selectedType.name);
        }
      }

      // DEBUG: Check FormData contents
      console.log('=== FORM DATA CONTENTS ===');
      for (let [key, value] of submissionData.entries()) {
        console.log(`${key}:`, value, '(type:', typeof value, ')');
      }

      const url = mode === "add" ? '/api/companies' : `/api/companies/${company?.id}`;
      const method = mode === "add" ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method: method,
        body: submissionData,
        // DO NOT set Content-Type header - let browser set it automatically for FormData
      });

      console.log('Response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('Failed to parse response as JSON');
        throw new Error('Server returned invalid response');
      }

      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to create company. Status: ${response.status}`);
      }

      console.log('Company saved successfully!', responseData);

      // Reset and close
      setCompanyLogo(null);
      reset();
      if (onSuccess) onSuccess();
      onOpenChange(false);
      toast({
        title: "Success",
        description: `Company ${mode === "add" ? "registered" : "updated"} successfully.`,
      });

    } catch (err) {
      console.error('Error creating company:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCompanyLogo(null);
    setError(null);
    reset({
      name: "",
      email: "",
      phone: "",
      description: "",
      location: "",
      website: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        handleCancel();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            {mode === "add" ? t("registerNewCompany") : t("editCompany")}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? t("registerCompanyDescription")
              : t("updateCompanyInformation")
            }
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="text-center">
            <h3 className="text-lg font-medium">{t("authenticationRequired")}</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              {t("pleaseLogInToRegisterCompany")}
            </p>
            <Button onClick={() => {
              onOpenChange(false);
              navigate("/login");
            }}>
              {t("goToLogin")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-upload">{t("companyLogo")}</Label>
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
                      {t("clickToUploadCompanyLogo")}
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
                  <strong>{t("error")}:</strong> {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("companyName")} *</Label>
                  <Input
                    id="name"
                    {...register("name", {
                      required: t("companyNameIsRequired"),
                      minLength: { value: 2, message: t("companyNameMinLength") }
                    })}
                    placeholder="Derba Midroc Cement"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")} *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: t("emailIsRequired"),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t("invalidEmailAddress")
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
                  <Label htmlFor="phone">{t("phone")} *</Label>
                  <Input
                    id="phone"
                    {...register("phone", {
                      required: t("phoneIsRequired"),
                      pattern: {
                        value: /^\+?[\d\s-()]+$/,
                        message: t("invalidPhoneNumberFormat")
                      }
                    })}
                    placeholder="+251 11 123 4567"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">{t("location")} *</Label>
                  <Input
                    id="location"
                    {...register("location", {
                      required: t("locationIsRequired"),
                      minLength: { value: 2, message: t("locationMinLength") }
                    })}
                    placeholder="Addis Ababa, Ethiopia"
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t("website")}</Label>
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
                <Label htmlFor="typeId">{t("companyType")}</Label>
                <Select value={selectedTypeId} onValueChange={(v) => setSelectedTypeId(v)}>
                  <SelectTrigger id="typeId">
                    <SelectValue className="text-foreground" placeholder={isLoadingCompanyTypes ? t("loadingTypes") : t("selectCompanyType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {companyTypes?.map((companyType) => (
                      <SelectItem key={companyType.id} value={companyType.id}>{companyType.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("description")} *</Label>
                <Textarea
                  id="description"
                  {...register("description", {
                    required: t("descriptionIsRequired"),
                    minLength: { value: 10, message: t("descriptionMinLength") }
                  })}
                  placeholder={t("describeCompanyPlaceholder")}
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
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    {mode === "add" ? t("registering") : t("saving")}
                  </>
                ) : (
                  mode === "add" ? t("registerCompanyButton") : t("saveChanges")
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
