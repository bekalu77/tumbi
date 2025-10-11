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
import { Upload } from "lucide-react";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: any;
  mode?: "register" | "edit";
}

interface CompanyFormData {
  name: string;
  description: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  region: string;
  postalCode?: string;
  established?: number;
  employees?: number;
  specialization?: string;
}

export default function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  mode = "register",
}: CompanyFormDialogProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CompanyFormData>({
    defaultValues: company || {
      name: "",
      description: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      region: "",
      postalCode: "",
      established: new Date().getFullYear(),
      employees: 0,
      specialization: "",
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    console.log("Company data:", data);
    // TODO: Save to database
    onOpenChange(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement actual logo upload
    console.log("Logo upload:", e.target.files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            {mode === "register" ? "Register Your Company" : "Edit Company"}
          </DialogTitle>
          <DialogDescription>
            {mode === "register"
              ? "Add your company to the BuildEthio directory"
              : "Update your company information"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  data-testid="input-logo"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload company logo
                  </p>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                {...register("name", { required: "Company name is required" })}
                placeholder="Ethiopian Construction Co."
                data-testid="input-company-name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Company Description *</Label>
              <Textarea
                id="description"
                {...register("description", { required: "Description is required" })}
                placeholder="Brief description of your company and services..."
                rows={4}
                data-testid="input-company-description"
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  placeholder="info@company.com"
                  data-testid="input-company-email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...register("phone", { required: "Phone number is required" })}
                  placeholder="+251 11 123 4567"
                  data-testid="input-company-phone"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                type="url"
                {...register("website")}
                placeholder="https://www.company.com"
                data-testid="input-company-website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                {...register("address", { required: "Address is required" })}
                placeholder="123 Main Street"
                data-testid="input-company-address"
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register("city", { required: "City is required" })}
                  placeholder="Addis Ababa"
                  data-testid="input-company-city"
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Input
                  id="region"
                  {...register("region", { required: "Region is required" })}
                  placeholder="Addis Ababa"
                  data-testid="input-company-region"
                />
                {errors.region && (
                  <p className="text-sm text-destructive">{errors.region.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  {...register("postalCode")}
                  placeholder="1000"
                  data-testid="input-company-postal"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="established">Year Established</Label>
                <Input
                  id="established"
                  type="number"
                  {...register("established", { min: 1900, max: new Date().getFullYear() })}
                  placeholder="2020"
                  data-testid="input-company-established"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employees">Number of Employees</Label>
                <Input
                  id="employees"
                  type="number"
                  {...register("employees", { min: 0 })}
                  placeholder="50"
                  data-testid="input-company-employees"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  {...register("specialization")}
                  placeholder="Steel products"
                  data-testid="input-company-specialization"
                />
              </div>
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
            <Button type="submit" data-testid="button-save-company">
              {mode === "register" ? "Register Company" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
