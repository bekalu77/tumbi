import { useEffect, useState } from "react"; // Import useEffect and useState
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useAuth } from "@/contexts/AuthContext";
import { Job, InsertJob, Company, createJobSchema } from "@shared/schema"; // Import createJobSchema
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job | null;
  mode?: "add" | "edit";
  onSuccess?: () => void;
}

interface JobFormData {
  title: string;
  category?: string;
  description: string;
  companyId: string;
  location: string;
  salary?: string;
  type: string;
  position?: string;
  experience?: string;
  requiredSkills?: string;
  qualifications?: string;
  howToApply?: string;
  additionalNotes?: string;
  applicationLink?: string;
  deadline?: string; // Use string for input type="date"
}

async function fetchCompaniesByUserId(userId: string): Promise<Company[]> {
  const res = await fetch(`/api/companies?userId=${userId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch companies");
  }
  return res.json();
}

export default function JobFormDialog({
  open,
  onOpenChange,
  job,
  mode = "add",
  onSuccess,
}: JobFormDialogProps) {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: userCompanies = [] } = useQuery<Company[]>({
    queryKey: ["userCompanies", user?.id],
    queryFn: () => fetchCompaniesByUserId(user!.id),
    enabled: !!user?.id,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<JobFormData>({
    defaultValues: {
      title: job?.title ?? "",
      category: job?.category ?? "",
      description: job?.description ?? "",
      companyId: job?.companyId ?? "",
      location: job?.location ?? "",
      salary: job?.salary ?? "",
      type: job?.type ?? "",
      position: job?.position ?? "",
      experience: job?.experience ?? "",
      requiredSkills: job?.requiredSkills ?? "",
      qualifications: job?.qualifications ?? "",
      howToApply: job?.howToApply ?? "",
      additionalNotes: job?.additionalNotes ?? "",
      applicationLink: job?.applicationLink ?? "",
      deadline: job?.deadline ? new Date(job.deadline).toISOString().split('T')[0] : "",
    },
  });

  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        category: job.category || "",
        description: job.description || "",
        companyId: job.companyId || "",
        location: job.location || "",
        salary: job.salary || "",
        type: job.type || "",
        position: job.position || "",
        experience: job.experience || "",
        requiredSkills: job.requiredSkills || "",
        qualifications: job.qualifications || "",
        howToApply: job.howToApply || "",
        additionalNotes: job.additionalNotes || "",
        applicationLink: job.applicationLink || "",
        deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : "",
      });
    } else {
      reset({
        title: "",
        category: "",
        description: "",
        companyId: "",
        location: "",
        salary: "",
        type: "",
        position: "",
        experience: "",
        requiredSkills: "",
        qualifications: "",
        howToApply: "",
        additionalNotes: "",
        applicationLink: "",
        deadline: "",
      });
    }
  }, [job, reset]);

  const [error, setError] = useState<string | null>(null); // Add error state

  const createJobMutation = useMutation({
    mutationFn: async (newJob: Omit<InsertJob, 'id'>) => { // Use Omit<InsertJob, 'id'> for creation
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newJob),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] }); // Fix invalidateQueries
      onSuccess?.();
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Job posted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async (updatedJob: Partial<InsertJob>) => {
      const res = await fetch(`/api/jobs/${job?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedJob),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] }); // Fix invalidateQueries
      onSuccess?.();
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Job updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JobFormData) => {
    setError(null); // Clear previous errors

    if (!isAuthenticated) {
      setError("You must be logged in to post a job.");
      return;
    }

    const jobPayload = { // Use createJobSchema for validation, but construct payload manually
      title: data.title,
      category: data.category,
      description: data.description,
      companyId: data.companyId,
      location: data.location,
      salary: data.salary,
      type: data.type,
      position: data.position,
      experience: data.experience,
      requiredSkills: data.requiredSkills,
      qualifications: data.qualifications,
      howToApply: data.howToApply,
      additionalNotes: data.additionalNotes,
      applicationLink: data.applicationLink,
      deadline: data.deadline ? new Date(data.deadline) : undefined, // Convert to Date object
      userId: user!.id, // Non-null assertion as isAuthenticated check is done
      createdAt: new Date(),
    };

    if (mode === "add") {
      const parsedPayload = createJobSchema.parse(jobPayload); // Validate with createJobSchema
      createJobMutation.mutate(parsedPayload);
    } else {
      const parsedPayload = createJobSchema.partial().parse(jobPayload); // Validate with partial schema for updates
      updateJobMutation.mutate(parsedPayload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            {mode === "add" ? t("postNewJob") : t("editJob")}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? t("fillOutJobDetails")
              : t("updateJobDetails")
            }
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="text-center">
            <h3 className="text-lg font-medium">{t("authenticationRequired")}</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              {t("pleaseLogInToPostJob")}
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
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/15 rounded-md">
                  <strong>{t("error")}:</strong> {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">{t("jobTitle")} *</Label>
                <Input
                  id="title"
                  {...register("title", { required: t("jobTitleRequired") })}
                  placeholder={t("jobTitlePlaceholder")}
                  data-testid="input-job-title"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("jobDescription")} *</Label>
                <Textarea
                  id="description"
                  {...register("description", { required: t("jobDescriptionRequired") })}
                  placeholder={t("jobDescriptionPlaceholder")}
                  rows={4}
                  data-testid="input-job-description"
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyId">{t("company")} *</Label>
                <Select
                  onValueChange={(value) => setValue("companyId", value)}
                  value={job?.companyId || ""}
                >
                  <SelectTrigger data-testid="select-company">
                    <SelectValue placeholder={t("selectCompany")} />
                  </SelectTrigger>
                  <SelectContent>
                    {userCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companyId && (
                  <p className="text-sm text-destructive">{errors.companyId.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">{t("location")} *</Label>
                  <Input
                    id="location"
                    {...register("location", { required: t("locationRequired") })}
                    placeholder={t("locationPlaceholder")}
                    data-testid="input-job-location"
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">{t("jobType")} *</Label>
                  <Select
                    onValueChange={(value) => setValue("type", value)}
                    value={job?.type || ""}
                  >
                    <SelectTrigger data-testid="select-job-type">
                      <SelectValue placeholder={t("selectJobType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {["Full-time", "Part-time", "Contract", "Temporary", "Internship"].map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-destructive">{errors.type.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{t("category")} (Optional)</Label>
                  <Input
                    id="category"
                    {...register("category")}
                    placeholder={t("categoryPlaceholder")}
                    data-testid="input-job-category"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">{t("position")} (Optional)</Label>
                  <Input
                    id="position"
                    {...register("position")}
                    placeholder={t("positionPlaceholder")}
                    data-testid="input-job-position"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">{t("experience")} (Optional)</Label>
                  <Input
                    id="experience"
                    {...register("experience")}
                    placeholder={t("experiencePlaceholder")}
                    data-testid="input-job-experience"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">{t("deadline")} (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    {...register("deadline")}
                    data-testid="input-job-deadline"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredSkills">{t("requiredSkills")} (Optional)</Label>
                <Textarea
                  id="requiredSkills"
                  {...register("requiredSkills")}
                  placeholder={t("requiredSkillsPlaceholder")}
                  rows={3}
                  data-testid="input-job-required-skills"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualifications">{t("qualifications")} (Optional)</Label>
                <Textarea
                  id="qualifications"
                  {...register("qualifications")}
                  placeholder={t("qualificationsPlaceholder")}
                  rows={3}
                  data-testid="input-job-qualifications"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="howToApply">{t("howToApply")} (Optional)</Label>
                <Textarea
                  id="howToApply"
                  {...register("howToApply")}
                  placeholder={t("howToApplyPlaceholder")}
                  rows={3}
                  data-testid="input-job-how-to-apply"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">{t("additionalNotes")} (Optional)</Label>
                <Textarea
                  id="additionalNotes"
                  {...register("additionalNotes")}
                  placeholder={t("additionalNotesPlaceholder")}
                  rows={3}
                  data-testid="input-job-additional-notes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">{t("salary")} (Optional)</Label>
                <Input
                  id="salary"
                  {...register("salary")}
                  placeholder={t("salaryPlaceholder")}
                  data-testid="input-job-salary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationLink">{t("applicationLink")} (Optional)</Label>
                <Input
                  id="applicationLink"
                  type="url"
                  {...register("applicationLink")}
                  placeholder={t("applicationLinkPlaceholder")}
                  data-testid="input-job-application-link"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                {t("cancel")}
              </Button>
              <Button type="submit" data-testid="button-save-job">
                {mode === "add" ? t("postJob") : t("saveChanges")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
