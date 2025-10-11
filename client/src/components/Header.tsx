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
import ProfileEditDialog from "./ProfileEditDialog";
import ProductFormDialog from "./ProductFormDialog";
import CompanyFormDialog from "./CompanyFormDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

interface HeaderProps {
  onMenuClick: () => void;
  isAuthenticated?: boolean;
}

export default function Header({ onMenuClick, isAuthenticated = false }: HeaderProps) {
  const { t } = useLanguage();
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);

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

        <Link href="/" className="flex items-center gap-2">
          <div className="font-heading font-bold text-xl md:text-2xl text-primary">
            BuildEthio
          </div>
        </Link>

        <div className="flex-1 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("searchMaterials")}
              className="pl-10 rounded-full"
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-profile">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowProfileEdit(true)} data-testid="menu-edit-profile">
                  <User className="mr-2 h-4 w-4" />
                  {t("editProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowProductForm(true)} data-testid="menu-add-product">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addProduct")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCompanyForm(true)} data-testid="menu-register-company">
                  {t("registerCompany")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-logout">
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" data-testid="button-login">
                {t("login")}
              </Button>
              <Button size="sm" data-testid="button-register">
                {t("register")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <ProfileEditDialog open={showProfileEdit} onOpenChange={setShowProfileEdit} />
      <ProductFormDialog open={showProductForm} onOpenChange={setShowProductForm} mode="add" />
      <CompanyFormDialog open={showCompanyForm} onOpenChange={setShowCompanyForm} mode="register" />
    </header>
  );
}
