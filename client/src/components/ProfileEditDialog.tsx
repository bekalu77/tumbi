import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileFormData {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  bio?: string;
  location?: string;
  profilePicture: FileList;
}

export default function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { user, refetchUser } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<ProfileFormData>();

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
        bio: user.bio || "",
        location: user.location || "",
      });
      if (user.profilePictureUrl) {
        setPreview(user.profilePictureUrl);
      }
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'profilePicture') {
        if (data[key][0]) {
          formData.append(key, data[key][0]);
        }
      } else {
        // @ts-ignore
        formData.append(key, data[key]);
      }
    });

    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Failed to update profile");
      }
      await refetchUser();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  const profilePicture = watch("profilePicture");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">Edit Profile</DialogTitle>
          <DialogDescription>Update your personal information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {preview ? (
                  <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="text-2xl">U</AvatarFallback>
                )}
              </Avatar>
              <Input
                id="profilePicture"
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                {...register("profilePicture")}
                onChange={handleFileChange}
                data-testid="input-profile-picture"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 pointer-events-none"
                data-testid="button-change-avatar"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                {...register("username", { required: "Username is required" })}
                placeholder="john.doe"
                data-testid="input-username"
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                {...register("fullName", { required: "Full name is required" })}
                placeholder="John Doe"
                data-testid="input-full-name"
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...register("phone", { required: "Phone number is required" })}
                placeholder="+251 11 123 4567"
                data-testid="input-phone"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...register("email", { required: "Email is required" })}
              placeholder="john@example.com"
              data-testid="input-email"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                {...register("company")}
                placeholder="Your Company Name"
                data-testid="input-company"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="Addis Ababa, Ethiopia"
                data-testid="input-location"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              placeholder="Tell us about yourself..."
              rows={4}
              data-testid="input-bio"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-profile">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
