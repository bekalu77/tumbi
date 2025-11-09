import { useState } from "react";
import { Search, User, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import ProfileEditDialog from "./ProfileEditDialog";
import ProductFormDialog from "./ProductFormDialog";
import CompanyFormDialog from "./CompanyFormDialog";
import JobFormDialog from "./JobFormDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarImage } from "@radix-ui/react-avatar";
interface HeaderProps {
  onMenuClick: () => void;
}

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

export default function Header({ onMenuClick }: HeaderProps) {
  const { t } = useLanguage();
  const { isAuthenticated: authed, user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [animateLogo, setAnimateLogo] = useState(false);

  const handleLogoClick = () => {
    setAnimateLogo(true);
  };

  const handleAnimationEnd = () => {
    setAnimateLogo(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 md:h-20 items-center gap-4 px-4 md:px-6 max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          data-testid="button-menu"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <Link href="/" className="flex items-center gap-2" onClick={handleLogoClick}>
          <img
            src={`${R2_PUBLIC_URL}/public/logo.png`}
            alt="TUMBI Logo"
            className={`h-8 w-8 md:h-10 md:w-10 ${animateLogo ? 'animate-plumb-bob' : ''}`}
            onAnimationEnd={handleAnimationEnd}
          /> {/* Logo */}
          <div className="font-heading font-bold text-xl md:text-2xl text-primary">
            {t("websiteName")} {/* Conditional website name */}
          </div>
        </Link>

        <div className="flex-1 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/products-services">
              <Button variant="ghost">{t("productsAndServices")}</Button>
            </Link>
            <Link href="/companies">
              <Button variant="ghost">{t("browseCompanies")}</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="ghost">{t("browseJobs")}</Button>
            </Link>
            <Link href="/tenders">
              <Button variant="ghost">{t("tenders")}</Button>
            </Link>
            <Link href="/articles">
              <Button variant="ghost">{t("articles")}</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost">{t("about")}</Button>
            </Link>
          </div>
        </div>


        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          
          {authed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-profile">
                  <Avatar className="h-8 w-8">
                    {user?.profilePictureUrl && <AvatarImage src={user.profilePictureUrl} />}
                    <AvatarFallback>
                      {user?.fullName ? user.fullName[0].toUpperCase() : user?.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.fullName && <p className="text-sm font-medium">{user.fullName}</p>}
                    {user?.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setShowProductForm(true)} data-testid="menu-add-product">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addProduct")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setShowCompanyForm(true)} data-testid="menu-register-company">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("registerCompany")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setShowJobForm(true)} data-testid="menu-post-job">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("postAJob")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfileEdit(true)} data-testid="menu-edit-profile">
                  <User className="mr-2 h-4 w-4" />
                  {t("editProfile")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-logout" onClick={() => logout()}>
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" data-testid="button-login" onClick={() => setLocation("/login") }>
                {t("login")}
              </Button>
              <Button size="sm" data-testid="button-register" onClick={() => setLocation("/register") }>
                {t("register")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <ProfileEditDialog open={showProfileEdit} onOpenChange={setShowProfileEdit} />
      <ProductFormDialog open={showProductForm} onOpenChange={setShowProductForm} onOpenCompanyForm={() => setShowCompanyForm(true)} />
      <CompanyFormDialog open={showCompanyForm} onOpenChange={setShowCompanyForm} />
      <JobFormDialog open={showJobForm} onOpenChange={setShowJobForm} />
    </header>
  );
}
