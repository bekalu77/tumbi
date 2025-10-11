import { Home, Package, Building2, Heart, Info } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "./LanguageToggle";
import { Link, useLocation } from "wouter";

export function AppSidebar() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const { setOpenMobile } = useSidebar();

  const menuItems = [
    { icon: Home, label: t("home"), path: "/" },
    { icon: Package, label: t("browseProducts"), path: "/products" },
    { icon: Building2, label: t("browseCompanies"), path: "/companies" },
    { icon: Heart, label: t("favorites"), path: "/favorites" },
    { icon: Info, label: t("about"), path: "/about" },
  ];

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={location === item.path}>
                    <Link href={item.path} data-testid={`link-${item.label.toLowerCase()}`} onClick={handleLinkClick}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Language</span>
          <LanguageToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
