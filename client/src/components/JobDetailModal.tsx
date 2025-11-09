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
import { MapPin, Briefcase, DollarSign, Link, Pencil, Trash2, CalendarDays, Layers, UserRound, Tag } from "lucide-react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Job, InsertJob, Company } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface JobDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job & {
    isOwner?: boolean;
    companyName?: string | null;
    category?: string | null;
    position?: string | null;
    experience?: string | null;
    requiredSkills?: string | null;
    qualifications?: string | null;
    howToApply?: string | null;
    additionalNotes?: string | null;
    deadline?: number | Date | null;
  };
  onDelete?: () => void;
  mode: "view" | "edit";
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

export default function JobDetailModal({
  open,
  onOpenChange,
  job,
  onDelete,
  mode: initialMode,
}: JobDetailModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(initialMode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: userCompanies = [] } = useQuery<Company[]>({
    queryKey: ["userCompanies", user?.id],
    queryFn: () => fetchCompaniesByUserId(user!.id),
    enabled: !!user?.id && isEditing, // Only fetch if in edit mode and user is logged in
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<JobFormData>({
    defaultValues: {
      title: job.title,
      category: job.category ?? "",
      description: job.description || "",
      companyId: job.companyId || "",
      location: job.location || "",
      salary: job.salary || "",
      type: job.type || "",
      position: job.position ?? "",
      experience: job.experience ?? "",
      requiredSkills: job.requiredSkills ?? "",
      qualifications: job.qualifications ?? "",
      howToApply: job.howToApply ?? "",
      additionalNotes: job.additionalNotes ?? "",
      applicationLink: job.applicationLink || "",
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : "",
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
      setValue("companyId", job.companyId || ""); // Ensure select is updated
      setValue("type", job.type || ""); // Ensure select is updated
    }
    setIsEditing(initialMode === "edit");
  }, [job, reset, initialMode, setValue]);

  const updateJobMutation = useMutation({
    mutationFn: async (updatedJob: Partial<InsertJob>) => {
      const res = await fetch(`/api/jobs/${job.id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onOpenChange(false);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const jobPayload: Partial<InsertJob> = {
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
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      };

      updateJobMutation.mutate(jobPayload);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating the job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden text-wrap">
        <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-heading break-all">
                {isEditing ? t("editJob") : job.title}
              </DialogTitle>
              {!isEditing && (
                <>
                  {job.companyName && (
                    <p className="text-sm text-muted-foreground line-clamp-1 break-all min-w-0">{job.companyName}</p>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground break-all min-w-0">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          {!isEditing && (job.isOwner || user?.username === "admin77") && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-job"
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t("editJob")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                data-testid="button-delete-job"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("deleteJob")}
              </Button>
            </div>
          )}
        </DialogHeader>

        {isEditing ? (
          <div className="py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/15 rounded-md">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">{t("jobTitle")} *</Label>
                  <Input
                    id="title"
                    {...register("title", { required: t("jobTitleRequired") })}
                    placeholder={t("jobTitlePlaceholder")}
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
                    <SelectTrigger>
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
                      <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="salary">{t("salary")} (Optional)</Label>
                  <Input
                    id="salary"
                    {...register("salary")}
                    placeholder={t("salaryPlaceholder")}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t("category")} (Optional)</Label>
                    <Input
                      id="category"
                      {...register("category")}
                      placeholder={t("categoryPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">{t("position")} (Optional)</Label>
                    <Input
                      id="position"
                      {...register("position")}
                      placeholder={t("positionPlaceholder")}
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">{t("deadline")} (Optional)</Label>
                    <Input
                      id="deadline"
                      type="date"
                      {...register("deadline")}
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualifications">{t("qualifications")} (Optional)</Label>
                  <Textarea
                    id="qualifications"
                    {...register("qualifications")}
                    placeholder={t("qualificationsPlaceholder")}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="howToApply">{t("howToApply")} (Optional)</Label>
                  <Textarea
                    id="howToApply"
                    {...register("howToApply")}
                    placeholder={t("howToApplyPlaceholder")}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">{t("additionalNotes")} (Optional)</Label>
                  <Textarea
                    id="additionalNotes"
                    {...register("additionalNotes")}
                    placeholder={t("additionalNotesPlaceholder")}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">{t("salary")} (Optional)</Label>
                  <Input
                    id="salary"
                    {...register("salary")}
                    placeholder={t("salaryPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationLink">{t("applicationLink")} (Optional)</Label>
                  <Input
                    id="applicationLink"
                    type="url"
                    {...register("applicationLink")}
                    placeholder={t("applicationLinkPlaceholder")}
                  />
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
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      {t("updating")}...
                    </>
                  ) : (
                    t("updateJob")
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-1"> {/* Only one tab */}
              <TabsTrigger value="overview" data-testid="tab-overview">{t("overview")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t("about")}</h3>
                <p className="text-muted-foreground break-all w-full min-w-0">{job.description}</p>
              </div>

              <div className="space-y-3">
                {job.companyName && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="w-full min-w-0">
                      <div className="text-sm text-muted-foreground">{t("company")}</div>
                      <div className="font-semibold break-all">{job.companyName}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="w-full min-w-0">
                    <div className="text-sm text-muted-foreground">{t("location")}</div>
                    <div className="font-semibold break-all">{job.location}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="w-full min-w-0">
                    <div className="text-sm text-muted-foreground">{t("jobType")}</div>
                    <div className="font-semibold break-all">{job.type}</div>
                  </div>
                </div>

                {job.category && (
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="w-full min-w-0">
                      <div className="text-sm text-muted-foreground">{t("category")}</div>
                      <div className="font-semibold break-all">{job.category}</div>
                    </div>
                  </div>
                )}

                {job.position && (
                  <div className="flex items-center gap-3">
                    <UserRound className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="w-full min-w-0">
                      <div className="text-sm text-muted-foreground">{t("position")}</div>
                      <div className="font-semibold break-all">{job.position}</div>
                    </div>
                  </div>
                )}

                {job.experience && (
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="w-full min-w-0">
                      <div className="text-sm text-muted-foreground">{t("experience")}</div>
                      <div className="font-semibold break-all">{job.experience}</div>
                    </div>
                  </div>
                )}

                {job.deadline && (
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="w-full min-w-0">
                      <div className="text-sm text-muted-foreground">{t("deadline")}</div>
                      <div className="font-semibold break-all">{new Date(job.deadline).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}

                {job.salary && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="w-full min-w-0">
                      <div className="text-sm text-muted-foreground">{t("salary")}</div>
                      <div className="font-semibold break-all">{job.salary}</div>
                    </div>
                  </div>
                )}

                {job.requiredSkills && (
                  <div className="w-full min-w-0">
                    <h4 className="font-semibold mb-1">{t("requiredSkills")}</h4>
                    <p className="text-muted-foreground break-all w-full min-w-0">{job.requiredSkills}</p>
                  </div>
                )}

                {job.qualifications && (
                  <div className="w-full min-w-0">
                    <h4 className="font-semibold mb-1">{t("qualifications")}</h4>
                    <p className="text-muted-foreground break-all w-full min-w-0">{job.qualifications}</p>
                  </div>
                )}

                {job.howToApply && (
                  <div className="w-full min-w-0">
                    <h4 className="font-semibold mb-1">{t("howToApply")}</h4>
                    <p className="text-muted-foreground break-all w-full min-w-0">{job.howToApply}</p>
                  </div>
                )}

                {job.additionalNotes && (
                  <div className="w-full min-w-0">
                    <h4 className="font-semibold mb-1">{t("additionalNotes")}</h4>
                    <p className="text-muted-foreground break-all w-full min-w-0">{job.additionalNotes}</p>
                  </div>
                )}
                
                {job.applicationLink && (
                  <div className="flex items-center gap-3">
                    <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="w-full min-w-0">
                      <div className="text-sm text-muted-foreground">{t("applicationLink")}</div>
                      <div className="font-semibold break-all">
                        <a 
                          href={job.applicationLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {t("applyNow")}
                        </a>
                      </div>
                    </div>
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
