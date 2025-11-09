import { useState, useMemo } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import JobCard from "@/components/JobCard";
import FilterPanel from "@/components/FilterPanel";
import JobDetailModal from "@/components/JobDetailModal"; // Import JobDetailModal
import JobFormDialog from "@/components/JobFormDialog"; // Import JobFormDialog
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Job, Company } from "@shared/schema"; // Import Company
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

async function fetchJobs(userId?: string): Promise<Job[]> {
  const url = userId ? `/api/jobs?userId=${userId}` : "/api/jobs";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch jobs");
  }
  return res.json();
}

async function fetchCompanies(): Promise<Company[]> {
  const res = await fetch("/api/companies");
  if (!res.ok) {
    throw new Error("Failed to fetch companies");
  }
  return res.json();
}

export default function JobsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient(); // Initialize queryClient
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [sort, setSort] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  const { data: jobs = [], isLoading, error } = useQuery<Job[]>({
    queryKey: ["jobs", filters.userId || "all"],
    queryFn: () => fetchJobs(filters.userId),
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Auto-apply search filter immediately
    setFilters((prev: any) => ({
      ...prev,
      search: query,
      showMyJobs: user?.id ? prev.showMyJobs || false : false,
      userId: prev.showMyJobs ? user?.id : undefined
    }));
  };

  const handleReset = () => {
    setFilters({});
    setSearchQuery("");
  };

  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];

    // Apply user filtering first (server-side filtering should already be applied)
    if (filters.userId) {
      result = result.filter((j) => j.userId === filters.userId);
    }

    // Search filtering
    if (filters.search && filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      const queryWords = query.split(/\s+/);

      result = result.filter((job) => {
        const searchableText = `${job.title} ${job.description || ''} ${job.location || ''} ${job.type || ''}`.toLowerCase();

        return queryWords.every((word: string) =>
          searchableText.includes(word)
        );
      });
    }

    // Location filtering
    if (filters.location) {
      result = result.filter((j) => j.location?.toLowerCase().includes(filters.location.toLowerCase()));
    }

    // Job Type filtering
    if (filters.jobType) {
      const selectedJobTypes = filters.jobType.split(',');
      if (selectedJobTypes.length > 0) {
        result = result.filter((j) => selectedJobTypes.includes(j.type || ""));
      }
    }

    // Sorting
    switch (sort) {
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "latest":
      default:
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    return result;
  }, [jobs, filters, sort]);

  return (
    <div className="min-h-screen">
      <div className="flex">
        <aside className="hidden lg:block w-80 border-r p-6 min-h-screen sticky top-16">
          <FilterPanel
            type="jobs"
            onApply={setFilters}
            onReset={handleReset}
            onSearch={handleSearch}
            userId={user?.id}
          />
        </aside>

        <main className="flex-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <h1 className="text-3xl font-heading font-semibold">{t("browseJobs")}</h1>
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden" data-testid="button-filters-mobile">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {t("filters")}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>{t("filters")}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterPanel
                        type="jobs"
                        onApply={setFilters}
                        onReset={handleReset}
                        onSearch={handleSearch}
                        userId={user?.id}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-48" data-testid="select-sort">
                    <SelectValue placeholder={t("sortBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">{t("latest")}</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingJob(null);
                    setShowJobForm(true);
                  }}
                  data-testid="button-post-job"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("postJob")}
                </Button>
              </div>
            </div>

            {isLoading && <p>Loading jobs...</p>}
            {error && <p className="text-red-500">Error fetching jobs.</p>}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedJobs.map((job) => {
                  const company = companies.find(c => c.id === job.companyId);
                  return (
                    <JobCard
                      key={job.id}
                      {...(job as Job)}
                      onClick={() => setSelectedJob(job)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this job
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (jobToDelete) {
                try {
                  const response = await fetch(`/api/jobs/${jobToDelete}`, {
                    method: 'DELETE',
                  });
                  if (response.ok) {
                    toast({
                      title: "Success",
                      description: "Job deleted successfully.",
                    });
                    queryClient.invalidateQueries({ queryKey: ["jobs"] });
                  } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete job');
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "An error occurred during deletion.",
                    variant: "destructive",
                  });
                } finally {
                  setJobToDelete(null);
                  setSelectedJob(null); // Close detail modal after deletion
                }
              }
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <JobFormDialog
        open={showJobForm}
        onOpenChange={(open) => {
          setShowJobForm(open);
          if (!open) {
            setEditingJob(null);
          }
        }}
          job={editingJob ? ({
            id: editingJob.id,
            title: editingJob.title,
            category: editingJob.category ?? undefined,
            description: editingJob.description ?? undefined,
            companyId: editingJob.companyId ?? undefined,
            location: editingJob.location ?? undefined,
            salary: editingJob.salary ?? undefined,
            type: editingJob.type ?? undefined,
            position: editingJob.position ?? undefined,
            experience: editingJob.experience ?? undefined,
            requiredSkills: editingJob.requiredSkills ?? undefined,
            qualifications: editingJob.qualifications ?? undefined,
            howToApply: editingJob.howToApply ?? undefined,
            additionalNotes: editingJob.additionalNotes ?? undefined,
            applicationLink: editingJob.applicationLink ?? undefined,
            deadline: editingJob.deadline ?? undefined,
            userId: editingJob.userId,
            createdAt: editingJob.createdAt,
          } as Job) : undefined}
        mode={editingJob ? "edit" : "add"}
        onSuccess={() => {
          setShowJobForm(false);
          setEditingJob(null);
          queryClient.invalidateQueries({ queryKey: ["jobs"] }); // Invalidate jobs query
        }}
      />

      {selectedJob && (
        <JobDetailModal
          open={!!selectedJob}
          onOpenChange={(open: boolean) => !open && setSelectedJob(null)}
          job={{
            ...(selectedJob as Job), // Explicitly cast to Job type
            isOwner: user?.id === selectedJob.userId,
            companyName: companies.find(c => c.id === selectedJob.companyId)?.name || "N/A",
          }}
          mode="view"
          onDelete={async () => {
            try {
              const response = await fetch(`/api/jobs/${selectedJob.id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                queryClient.invalidateQueries({ queryKey: ["jobs"] }); // Invalidate jobs query
                setSelectedJob(null); // Close modal after deletion
              } else {
                alert('Failed to delete job');
              }
            } catch (error) {
              toast({
                title: "Error",
                description: error instanceof Error ? error.message : "An error occurred during deletion.",
                variant: "destructive",
              });
            }
          }}
        />
      )}
    </div>
  );
}
