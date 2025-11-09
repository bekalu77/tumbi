import { Heart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import productImage from "@assets/stock_images/construction_materia_151531d6.jpg";

export default function Favorites() {
  const { t } = useLanguage();

  // TODO: Implement actual favorites fetching from a state management solution or API.
  // The current `favoriteProducts` array is placeholder data for demonstration purposes.
  const favoriteProducts = [
    {
      id: "1",
      name: "Portland Cement Grade 42.5",
      company: "Derba Midroc Cement",
      category: "Cement",
      price: 450,
      unit: "bag",
      imageUrls: [productImage],
      companyPhone: "+251 11 123 4567",
      companyEmail: "contact@derba.com",
    },
    {
      id: "2",
      name: "Steel Rebar 12mm",
      company: "Ethiopian Steel",
      category: "Steel",
      price: 2800,
      unit: "ton",
      imageUrls: [productImage],
      companyPhone: "+251 25 111 2233",
      companyEmail: "info@ethsteel.com",
    },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="h-6 w-6 text-primary fill-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-semibold">{t("favorites")}</h1>
            <p className="text-muted-foreground">Your saved construction materials</p>
          </div>
        </div>

        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onClick={() => console.log(`Product ${product.id} clicked`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground">
              Start adding products to your favorites to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
