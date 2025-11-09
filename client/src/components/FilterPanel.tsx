import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ItemCategory as BaseItemCategory, Location, CompanyType } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

// Extend BaseItemCategory to include subcategories for frontend display
interface ItemCategoryWithSubcategories extends BaseItemCategory {
  subcategories?: ItemCategoryWithSubcategories[];
}

async function fetchCategories(): Promise<ItemCategoryWithSubcategories[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  return res.json();
}

async function fetchProductsServicesCategories(): Promise<ItemCategoryWithSubcategories[]> {
  const res = await fetch("/api/categories/products-services");
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  return res.json();
}

async function fetchCompanyTypes(): Promise<CompanyType[]> {
  const res = await fetch("/api/company-types");
  if (!res.ok) {
    throw new Error("Failed to fetch company types");
  }
  return res.json();
}

async function fetchLocations(): Promise<Location[]> {
  const res = await fetch("/api/cities");
  if (!res.ok) {
    throw new Error("Failed to fetch locations");
  }
  return res.json();
}

interface FilterPanelProps {
  type: "products" | "companies" | "articles" | "tenders" | "products-services" | "jobs"; // Add "jobs" type
  categories?: string[]; // For articles and tenders
  onApply?: (filters: any) => void;
  onReset?: () => void;
  onSearch?: (query: string) => void;
  userId?: string; // Add userId prop for user-specific filters
}

export default function FilterPanel({ type, categories = [], onApply, onReset, onSearch, userId }: FilterPanelProps) {
  const { t } = useLanguage();
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // For products
  const [selectedArticleCategories, setSelectedArticleCategories] = useState<string[]>([]); // For articles
  const [selectedTenderCategories, setSelectedTenderCategories] = useState<string[]>([]); // For tenders
  const [selectedCompanyTypes, setSelectedCompanyTypes] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMyProducts, setShowMyProducts] = useState(false); // For products
  const [showMyCompanies, setShowMyCompanies] = useState(false); // For companies
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]); // For jobs
  const [showMyJobs, setShowMyJobs] = useState(false); // For jobs

  const { data: productCategories = [] } = useQuery<ItemCategoryWithSubcategories[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    enabled: type === "products",
  });

  const { data: productsServicesCategories = [] } = useQuery<ItemCategoryWithSubcategories[]>({
    queryKey: ["products-services-categories"],
    queryFn: fetchCategories, // Use the more general fetchCategories
    enabled: type === "products-services",
  });

  const { data: companyTypes = [] } = useQuery<CompanyType[]>({
    queryKey: ["companyTypes"],
    queryFn: fetchCompanyTypes,
    enabled: type === "companies",
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    enabled: type === "companies",
  });

  const handleApply = () => {
    if (type === "products") {
      onApply?.({
        priceRange,
        category: selectedCategories.join(","),
        showMyProducts: userId ? showMyProducts : false,
        userId: showMyProducts ? userId : undefined
      });
    } else if (type === "products-services") {
      onApply?.({
        priceRange,
        category: selectedCategories.join(","),
        showMyProducts: userId ? showMyProducts : false,
        userId: showMyProducts ? userId : undefined
      });
    } else if (type === "articles") {
      onApply?.({ category: selectedArticleCategories.join(",") });
    } else if (type === "tenders") { // Handle tenders type
      onApply?.({ category: selectedTenderCategories.join(",") });
    } else if (type === "jobs") {
      onApply?.({
        jobType: selectedJobTypes.join(","),
        location: selectedLocation,
        showMyJobs: userId ? showMyJobs : false,
        userId: showMyJobs ? userId : undefined
      });
    }
    else {
      onApply?.({
        category: selectedCompanyTypes.join(","),
        location: selectedLocation,
        showMyCompanies: userId ? showMyCompanies : false,
        userId: showMyCompanies ? userId : undefined
      });
    }
  };

  // Auto-apply other filters when they change
  const handleCategoryChange = (category: string, checked: boolean, subcategories?: ItemCategoryWithSubcategories[]) => {
    let newCategories = [...selectedCategories];

    if (checked) {
      newCategories.push(category);
      if (subcategories) {
        subcategories.forEach(sub => {
          if (!newCategories.includes(sub.category)) {
            newCategories.push(sub.category);
          }
        });
      }
    } else {
      newCategories = newCategories.filter((c) => c !== category);
      if (subcategories) {
        subcategories.forEach(sub => {
          newCategories = newCategories.filter((c) => c !== sub.category);
        });
      }
    }
    setSelectedCategories(newCategories);

    // Auto-apply immediately
    if (type === "products" || type === "products-services") {
      onApply?.({
        priceRange,
        category: newCategories.join(","),
        showMyProducts: userId ? showMyProducts : false,
        userId: showMyProducts ? userId : undefined
      });
    }
  };

  const handleJobTypeChange = (jobType: string, checked: boolean) => {
    let newTypes;
    if (checked) {
      newTypes = [...selectedJobTypes, jobType];
    } else {
      newTypes = selectedJobTypes.filter((c) => c !== jobType);
    }
    setSelectedJobTypes(newTypes);

    // Auto-apply immediately
    if (type === "jobs") {
      onApply?.({
        jobType: newTypes.join(","),
        location: selectedLocation,
        showMyJobs: userId ? showMyJobs : false,
        userId: showMyJobs ? userId : undefined
      });
    }
  };

  const handleCompanyTypeChange = (companyType: string, checked: boolean) => {
    let newTypes;
    if (checked) {
      newTypes = [...selectedCompanyTypes, companyType];
    } else {
      newTypes = selectedCompanyTypes.filter((c) => c !== companyType);
    }
    setSelectedCompanyTypes(newTypes);

    // Auto-apply immediately
    if (type === "companies") {
      onApply?.({
        category: newTypes.join(","),
        location: selectedLocation,
        showMyCompanies: userId ? showMyCompanies : false,
        userId: showMyCompanies ? userId : undefined
      });
    }
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);

    // Auto-apply immediately
    if (type === "companies") {
      onApply?.({
        category: selectedCompanyTypes.join(","),
        location: location,
        showMyCompanies: userId ? showMyCompanies : false,
        userId: showMyCompanies ? userId : undefined
      });
    }
  };

  const handlePriceRangeChange = (range: number[]) => {
    setPriceRange(range);

    // Auto-apply immediately
    if (type === "products" || type === "products-services") {
      onApply?.({
        priceRange: range,
        category: selectedCategories.join(","),
        showMyProducts: userId ? showMyProducts : false,
        userId: showMyProducts ? userId : undefined
      });
    }
  };

  const handleReset = () => {
    setPriceRange([0, 10000]);
    setSelectedCategories([]);
    setSelectedArticleCategories([]);
    setSelectedTenderCategories([]); // Reset tender categories
    setSelectedCompanyTypes([]);
    setSelectedJobTypes([]); // Reset job types
    setSelectedLocation("");
    setSearchQuery("");
    setShowMyProducts(false);
    setShowMyCompanies(false);
    setShowMyJobs(false); // Reset showMyJobs
    onReset?.();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">{t("filters")}</h3>
      </div>

      {/* User-specific filter buttons - positioned above search */}
      {userId && (type === "products" || type === "companies" || type === "products-services" || type === "jobs") && (
        <div className="space-y-2">
          {(type === "products" || type === "products-services") && (
            <Button
              variant={showMyProducts ? "default" : "outline"}
              className={cn(
                "w-full justify-start",
                showMyProducts
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                  : "hover:bg-accent hover:border-accent-foreground/20 hover:text-accent-foreground"
              )}
              onClick={() => {
                const newState = !showMyProducts;
                setShowMyProducts(newState);
                // Auto-apply filter immediately
                onApply?.({
                  priceRange,
                  category: selectedCategories.join(","),
                  showMyProducts: userId ? newState : false,
                  userId: newState ? userId : undefined
                });
              }}
              data-testid="button-my-products"
            >
              My Products & Services
            </Button>
          )}
          {type === "companies" && (
            <Button
              variant={showMyCompanies ? "default" : "outline"}
              className={cn(
                "w-full justify-start",
                showMyCompanies
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                  : "hover:bg-accent hover:border-accent-foreground/20 hover:text-accent-foreground"
              )}
              onClick={() => {
                const newState = !showMyCompanies;
                setShowMyCompanies(newState);
                // Auto-apply filter immediately
                onApply?.({
                  category: selectedCompanyTypes.join(","),
                  location: selectedLocation,
                  showMyCompanies: userId ? newState : false,
                  userId: newState ? userId : undefined
                });
              }}
              data-testid="button-my-companies"
            >
              My Companies
            </Button>
          )}
          {type === "jobs" && (
            <Button
              variant={showMyJobs ? "default" : "outline"}
              className={cn(
                "w-full justify-start",
                showMyJobs
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                  : "hover:bg-accent hover:border-accent-foreground/20 hover:text-accent-foreground"
              )}
              onClick={() => {
                const newState = !showMyJobs;
                setShowMyJobs(newState);
                // Auto-apply filter immediately
                onApply?.({
                  jobType: selectedJobTypes.join(","),
                  location: selectedLocation,
                  showMyJobs: userId ? newState : false,
                  userId: newState ? userId : undefined
                });
              }}
              data-testid="button-my-jobs"
            >
              My Jobs
            </Button>
          )}
        </div>
      )}

      {(type === "products" || type === "companies" || type === "articles" || type === "products-services" || type === "jobs") && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={
              type === "products" ? "Search products..." :
              type === "products-services" ? "Search products & services..." :
              type === "companies" ? "Search companies..." :
              type === "articles" ? "Search articles..." :
              type === "jobs" ? "Search jobs..." :
              "Search tenders..."
            }
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      )}

      <div className="space-y-4">
        {type === "products" && (
          <div>
            <Label className="mb-3 block">{t("category")}</Label>
            <div className="space-y-2">
              {productCategories.map((category) => (
                <div key={category.id}>
                  {category.subcategories && category.subcategories.length > 0 ? (
                    <Collapsible className="w-full space-y-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={category.category}
                            checked={selectedCategories.includes(category.category)}
                            onCheckedChange={(checked) => handleCategoryChange(category.category, checked as boolean, category.subcategories)}
                            data-testid={`checkbox-${(category.category ?? '').toLowerCase()}`}
                          />
                          <label
                            htmlFor={category.category}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {t((category.category ?? '').toLowerCase())}
                          </label>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-9 p-0">
                            <ChevronDown className="h-4 w-4" />
                            <span className="sr-only">Toggle</span>
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="space-y-2 pl-6">
                        {category.subcategories.map((subCategory) => (
                          <div key={subCategory.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={subCategory.category}
                              checked={selectedCategories.includes(subCategory.category)}
                              onCheckedChange={(checked) => handleCategoryChange(subCategory.category, checked as boolean)}
                              data-testid={`checkbox-${(subCategory.category ?? '').toLowerCase()}`}
                            />
                            <label
                              htmlFor={subCategory.category}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {t((subCategory.category ?? '').toLowerCase())}
                            </label>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={category.category}
                        checked={selectedCategories.includes(category.category)}
                        onCheckedChange={(checked) => handleCategoryChange(category.category, checked as boolean)}
                        data-testid={`checkbox-${(category.category ?? '').toLowerCase()}`}
                      />
                      <label
                        htmlFor={category.category}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {t((category.category ?? '').toLowerCase())}
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "articles" && (
          <div>
            <Label className="mb-3 block">Article Categories</Label>
            <div className="space-y-2">
              {categories.map((category) => ( // Use 'categories' directly
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedArticleCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedArticleCategories([...selectedArticleCategories, category]);
                      } else {
                        setSelectedArticleCategories(
                          selectedArticleCategories.filter((c) => c !== category)
                        );
                      }
                    }}
                    data-testid={`checkbox-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <label
                    htmlFor={category}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "tenders" && ( // New section for tenders
          <div>
            <Label className="mb-3 block">Tender Categories</Label>
            <div className="space-y-2">
              {categories?.map((category) => ( // Use the 'categories' prop for tenders
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedTenderCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTenderCategories([...selectedTenderCategories, category]);
                      } else {
                        setSelectedTenderCategories(
                          selectedTenderCategories.filter((c) => c !== category)
                        );
                      }
                    }}
                    data-testid={`checkbox-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <label
                    htmlFor={category}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "companies" && (
          <div>
            <Label className="mb-3 block">{t("companyType")}</Label>
            <div className="space-y-2">
              {companyTypes.map((companyType) => (
                <div key={companyType.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={companyType.name}
                    checked={selectedCompanyTypes.includes(companyType.name)}
                    onCheckedChange={(checked) => handleCompanyTypeChange(companyType.name, checked as boolean)}
                    data-testid={`checkbox-${(companyType.name ?? '').toLowerCase()}`}
                  />
                  <label
                    htmlFor={companyType.name}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {t((companyType.name ?? '').toLowerCase())}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "jobs" && (
          <div>
            <Label className="mb-3 block">{t("jobType")}</Label>
            <div className="space-y-2">
              {["Full-time", "Part-time", "Contract", "Temporary", "Internship"].map((jobType) => (
                <div key={jobType} className="flex items-center space-x-2">
                  <Checkbox
                    id={jobType}
                    checked={selectedJobTypes.includes(jobType)}
                    onCheckedChange={(checked) => handleJobTypeChange(jobType, checked as boolean)}
                    data-testid={`checkbox-${jobType.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <label
                    htmlFor={jobType}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {jobType}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "products-services" && (
          <div>
            <Label className="mb-3 block">{t("category")}</Label>
            <div className="space-y-2">
              {productsServicesCategories.map((category) => (
                <div key={category.id}>
                  {category.subcategories && category.subcategories.length > 0 ? (
                    <Collapsible className="w-full space-y-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={category.category}
                            checked={selectedCategories.includes(category.category)}
                            onCheckedChange={(checked) => handleCategoryChange(category.category, checked as boolean, category.subcategories)}
                            data-testid={`checkbox-${(category.category ?? '').toLowerCase()}`}
                          />
                          <label
                            htmlFor={category.category}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {t((category.category ?? '').toLowerCase())}
                          </label>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-9 p-0">
                            <ChevronDown className="h-4 w-4" />
                            <span className="sr-only">Toggle</span>
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="space-y-2 pl-6">
                        {category.subcategories.map((subCategory) => (
                          <div key={subCategory.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={subCategory.category}
                              checked={selectedCategories.includes(subCategory.category)}
                              onCheckedChange={(checked) => handleCategoryChange(subCategory.category, checked as boolean)}
                              data-testid={`checkbox-${(subCategory.category ?? '').toLowerCase()}`}
                            />
                            <label
                              htmlFor={subCategory.category}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {t((subCategory.category ?? '').toLowerCase())}
                            </label>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={category.category}
                        checked={selectedCategories.includes(category.category)}
                        onCheckedChange={(checked) => handleCategoryChange(category.category, checked as boolean)}
                        data-testid={`checkbox-${(category.category ?? '').toLowerCase()}`}
                      />
                      <label
                        htmlFor={category.category}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {t((category.category ?? '').toLowerCase())}
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(type === "products" || type === "products-services") && (
          <div>
            <Label className="mb-3 block">{t("priceRange")}</Label>
            <div className="space-y-4">
              <Slider
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                max={10000}
                step={100}
                className="w-full"
                data-testid="slider-price"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{priceRange[0]} ETB</span>
                <span>{priceRange[1]} ETB</span>
              </div>
            </div>
          </div>
        )}

        {(type === "companies" || type === "jobs") && (
          <div>
            <Label className="mb-3 block">{t("location")}</Label>
            <Select value={selectedLocation} onValueChange={handleLocationChange}>
              <SelectTrigger data-testid="select-location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.city}>
                    {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleReset}
          data-testid="button-reset-filters"
        >
          {t("resetFilters")}
        </Button>
        <Button
          className="flex-1"
          onClick={handleApply}
          data-testid="button-apply-filters"
        >
          {t("applyFilters")}
        </Button>
      </div>
    </div>
  );
}
