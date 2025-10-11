# BuildEthio - Construction Materials Catalog Web App

## Project Overview
A bilingual (English/Amharic) construction materials catalog web application for Ethiopia. Built with React, TypeScript, Tailwind CSS, and PostgreSQL. Features user authentication with Replit Auth, company and product management, advanced filtering, and a modern marketplace UI inspired by Material Design with Alibaba/BuildDirect aesthetics.

## Recent Changes (October 11, 2025)

### User Interface Improvements
- **Sidebar Navigation**: Removed "Categories" menu item from sidebar. Sidebar now auto-collapses 2 seconds after menu selection for better UX
- **Profile Dropdown**: Added "Add Product" button to profile dropdown menu for quick access
- **Fixed Action Buttons**: "Add Product" and "Register Company" buttons now fixed at top-right (below header) and stay visible while scrolling

### Product Features
- **Favorite System**: Added heart icon favorite button on each product card. Clicking toggles favorite status
- **Favorites Page**: Created dedicated favorites page (`/favorites`) to view all saved products
- **Company Contact Info**: Product cards now display company phone number and email for easy contact
- **Product Detail Modal**: Recently Added Materials products on home page are now clickable and show full product details in a modal

### Navigation & Routing
- **Browse Buttons**: Home page "Browse Products" and "Browse Companies" buttons now navigate to their respective pages
- **Category Filtering**: Category cards on home page navigate to products page with pre-applied category filter
- **URL Parameters**: Products page reads category from URL query parameter and applies filter automatically

### Forms & Data Management
- **Profile Editor**: Edit Profile opens comprehensive profile editor with avatar upload, personal info, company, location, and bio
- **Product Form**: Add/Edit Product dialog with image upload, category selection, pricing, inventory, materials, and description
- **Company Registration**: Register/Edit Company form with logo upload, business details, contact info, location, and company stats
- **Data Structure**: All forms designed with proper field validation and database-ready structure:
  - Profile: fullName, email, phone, company, bio, location
  - Product: name, category, price, unit, madeOf, description, images, minOrder, stock
  - Company: name, description, email, phone, website, address, city, region, postalCode, established, employees, specialization

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn UI components
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Routing**: Wouter
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React, React Icons

## Design System
- **Primary Color**: Construction Orange (HSL 25 70% 45%)
- **Typography**: 
  - Body: Inter
  - Headings: Poppins (600/700)
  - Amharic: Noto Sans Ethiopic
- **Theme**: Material Design foundation with marketplace aesthetics
- **Dark Mode**: Fully supported with theme toggle

## Project Structure
```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx       # Top navigation with search and profile
│   │   ├── AppSidebar.tsx   # Collapsible sidebar navigation
│   │   ├── ProductCard.tsx  # Product display card with favorites
│   │   ├── CompanyCard.tsx  # Company display card
│   │   ├── CategoryCard.tsx # Category selector
│   │   ├── FilterPanel.tsx  # Advanced filtering panel
│   │   ├── ProfileEditDialog.tsx    # User profile editor form
│   │   ├── ProductFormDialog.tsx    # Add/Edit product form
│   │   ├── CompanyFormDialog.tsx    # Register/Edit company form
│   │   ├── ProductDetailModal.tsx   # Product detail view
│   │   └── CompanyDetailModal.tsx   # Company detail view
│   ├── pages/               # Route pages
│   │   ├── Home.tsx         # Landing page with hero, categories, recent products
│   │   ├── BrowseProducts.tsx
│   │   ├── BrowseCompanies.tsx
│   │   ├── Favorites.tsx    # User's saved products
│   │   └── About.tsx
│   ├── contexts/            # React contexts
│   │   ├── ThemeContext.tsx # Dark/light theme
│   │   └── LanguageContext.tsx # English/Amharic i18n
│   └── App.tsx              # Main app component
server/
├── index.ts                 # Express server entry
└── routes.ts                # API endpoints
```

## Key Features

### Implemented
- ✅ User authentication (Replit Auth ready)
- ✅ Bilingual support (English/Amharic)
- ✅ Dark/Light theme toggle
- ✅ Product browsing with filters
- ✅ Company directory
- ✅ Favorites system
- ✅ Responsive design
- ✅ Product detail modals
- ✅ Category filtering
- ✅ Contact information on product cards

### Pending Implementation
- 🔄 Database integration for products and companies
- 🔄 User authentication flow
- 🔄 Product/Company CRUD operations
- 🔄 Google Maps integration for company locations
- 🔄 Advanced search functionality
- 🔄 Image upload for products

## Development Notes

### Stock Images
- Using placeholder stock images for hero and products
- Marked with `//todo` comments for replacement with real content
- Images stored in `attached_assets/stock_images/`

### Data Flow
- Currently using mock data in components
- Ready for PostgreSQL integration with Drizzle ORM
- Storage interface defined in `server/storage.ts`

### User Preferences
- Sidebar auto-collapses after 2 seconds on menu selection
- Fixed action buttons for persistent access to key features
- Category navigation with URL-based filtering
