import { MapPin, Briefcase, DollarSign, CalendarDays, Layers, UserRound, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Company } from "@shared/schema"; // Import Company

interface JobCardProps {
  id: string;
  title: string;
  category?: string | null;
  description: string;
  location?: string | null;
  type?: string | null; // e.g., Full-time, Part-time, Remote
  salary?: string | null; // e.g., "Negotiable", "50k-70k"
  companyId?: string | null; // Now optional, as companyName will be fetched
  position?: string | null;
  experience?: string | null;
  deadline?: number | Date | null; // Unix timestamp or Date object
  onClick?: () => void;
}

async function fetchCompany(companyId: string): Promise<Company> {
  const res = await fetch(`/api/companies/${companyId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch company");
  }
  return res.json();
}

export default function JobCard({
  id,
  title,
  category,
  description,
  location,
  type,
  salary,
  companyId, // Now destructure companyId
  position,
  experience,
  deadline,
  onClick,
}: JobCardProps) {
  const { user } = useAuth();
  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleDateString()
    : undefined;

  const { data: company } = useQuery<Company>({
    queryKey: ["company", companyId],
    queryFn: () => fetchCompany(companyId!),
    enabled: !!companyId, // Only fetch if companyId is available
  });

  const companyName = company?.name || "N/A";

  return (
    <Card
      className="cursor-pointer hover-elevate active-elevate-2 transition-transform hover:-translate-y-1"
      onClick={onClick}
      data-testid={`card-job-${id}`}
    >
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-xl line-clamp-1">{title}</h3>
          {companyName && companyName !== "N/A" && ( // Only display if a valid company name is found
            <p className="text-sm text-muted-foreground line-clamp-1">{companyName}</p>
          )}
          {location && ( // Conditionally render location
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm line-clamp-2 mb-3">{description}</p>
        <div className="flex flex-wrap items-center gap-2">
          {type && ( // Conditionally render type
            <Badge variant="secondary" className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {type}
            </Badge>
          )}
          {position && (
            <Badge variant="outline" className="flex items-center gap-1">
              <UserRound className="h-3 w-3" />
              {position}
            </Badge>
          )}
          {experience && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {experience}
            </Badge>
          )}
          {category && (
            <Badge variant="outline" className="flex items-center gap-1">
              {category}
            </Badge>
          )}
          {salary && (
            <Badge variant="outline" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {salary}
            </Badge>
          )}
          {formattedDeadline && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formattedDeadline}
            </Badge>
          )}
        </div>
      </CardContent>
      {user?.username === "admin77" && (
        <CardFooter className="p-4 pt-0">
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); console.log("Edit clicked for job", id); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); console.log("Delete clicked for job", id); }}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
