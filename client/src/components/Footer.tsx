import { Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Footer() {
  return (
    <footer className="bg-card border-t p-4 text-sm mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-muted-foreground text-center md:text-left">
          © {new Date().getFullYear()} BuildEthio. All rights reserved.
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="space-y-2">
            <h3 className="text-md font-heading font-semibold">Contact Information</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <div className="text-muted-foreground">contact@buildethio.com</div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <div className="text-muted-foreground">+251 11 123 4567</div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div className="text-muted-foreground">Bole Road, Addis Ababa, Ethiopia</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-md font-heading font-semibold">Office Hours</h3>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Mon - Fri:</span>
                <span className="font-semibold text-foreground">8:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday:</span>
                <span className="font-semibold text-foreground">9:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday:</span>
                <span className="font-semibold text-foreground">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
