import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Database } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  AlertCircle, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Tag,
  Clock,
  Grid3X3,
  BarChart3,
  DollarSign
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

// Define types
type Category = Database['public']['Tables']['categories']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface CategoryViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  products: Product[];
}

const CategoryViewDialog: React.FC<CategoryViewDialogProps> = ({
  open,
  onOpenChange,
  category,
  products
}) => {
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState("products");
  const PRODUCTS_PER_PAGE = 9;
  
  // Reset error and page when dialog opens or category changes
  useEffect(() => {
    if (open) {
      setError(null);
      setCurrentPage(0);
    }
  }, [open, category]);
  
  // Validate category data
  useEffect(() => {
    if (!open) return;
    
    if (!category) {
      setError("Category data is missing or invalid");
      return;
    }
    
    if (!products) {
      setError("Product data could not be loaded");
      return;
    }
  }, [category, products, open]);
  
  if (!category) {
    return open ? (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to display category. Category data is missing or invalid.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    ) : null;
  }
  
  // Get products in this category
  const categoryProducts = products?.filter(product => product.category_id === category.id) || [];
  
  // Calculate statistics for this category
  const statistics = {
    totalProducts: categoryProducts.length,
    averagePrice: categoryProducts.length
      ? Math.round(categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length * 100) / 100
      : 0,
    inStockCount: categoryProducts.filter(p => p.in_stock).length,
    hasDiscount: categoryProducts.filter(p => p.discount && p.discount > 0).length,
    createdDate: new Date(category.created_at).toLocaleDateString(),
    createdTime: new Date(category.created_at).toLocaleTimeString(),
    newestProduct: categoryProducts.length 
      ? categoryProducts.reduce((newest, p) => 
          new Date(p.created_at) > new Date(newest.created_at) ? p : newest
        , categoryProducts[0])
      : null,
    oldestProduct: categoryProducts.length
      ? categoryProducts.reduce((oldest, p) => 
          new Date(p.created_at) < new Date(oldest.created_at) ? p : oldest
        , categoryProducts[0])
      : null
  };
  
  // Paginate products
  const pageCount = Math.ceil(categoryProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = categoryProducts.slice(
    currentPage * PRODUCTS_PER_PAGE, 
    (currentPage + 1) * PRODUCTS_PER_PAGE
  );
  
  const nextPage = () => {
    if (currentPage < pageCount - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Category Details
          </DialogTitle>
        </DialogHeader>
        
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Category header with image */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-2/5">
                <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
                  <img 
                    src={category.image_url || "https://placehold.co/600x400?text=No+Image"} 
                    alt={category.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Error loading image from URL: ${category.image_url}`);
                      (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Error";
                    }}
                  />
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-semibold">{category.name}</h3>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(category.created_at)}
                    </Badge>
                    
                    <Badge variant={categoryProducts.length > 0 ? "default" : "secondary"}>
                      {categoryProducts.length} Products
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-mono text-xs">{category.id}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Created at</p>
                    <p className="text-sm flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {statistics.createdTime}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Products in stock</p>
                    <p className="text-sm font-medium">
                      {statistics.inStockCount} of {statistics.totalProducts}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Average price</p>
                    <p className="text-sm font-medium">
                      {statistics.averagePrice > 0 ? `np${statistics.averagePrice.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="products" className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  <span>Products ({categoryProducts.length})</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  <span>Statistics</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="space-y-4 mt-4">
                {categoryProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {currentProducts.map(product => (
                        <Card key={product.id} className="overflow-hidden h-full">
                          <div className="aspect-square bg-muted relative">
                            <img 
                              src={product.image_urls && product.image_urls.length > 0 
                                ? product.image_urls[0] 
                                : "https://placehold.co/200x200?text=No+Image"
                              } 
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/200x200?text=Error";
                              }}
                            />
                            
                            {/* Status indicator */}
                            <div className="absolute top-2 right-2">
                              <Badge 
                                variant={product.in_stock ? "success" : "destructive"} 
                                className="text-xs"
                              >
                                {product.in_stock ? "In Stock" : "Out of Stock"}
                              </Badge>
                            </div>
                            
                            {/* Multiple images indicator */}
                            {product.image_urls && product.image_urls.length > 1 && (
                              <div className="absolute bottom-2 right-2">
                                <Badge variant="outline" className="bg-background/80">
                                  {product.image_urls.length} images
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <CardContent className="p-3">
                            <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                            
                            <div className="flex justify-between items-center mt-1">
                              <div className="flex items-baseline gap-1">
                                <span className="font-semibold">np{product.price.toFixed(2)}</span>
                                <span className="text-xs text-muted-foreground">/{product.unit}</span>
                              </div>
                              
                              {product.discount && product.discount > 0 && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  {product.discount}% off
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {pageCount > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevPage}
                          disabled={currentPage === 0}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage + 1} of {pageCount}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextPage}
                          disabled={currentPage >= pageCount - 1}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="border rounded-md p-8 text-center text-muted-foreground flex flex-col items-center">
                    <Package className="h-10 w-10 mb-2 text-muted-foreground/50" />
                    <p>No products in this category</p>
                    <p className="text-xs mt-1">Add products to this category to see them here</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="stats" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        Product Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Products</p>
                          <p className="text-xl font-bold">{statistics.totalProducts}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">In Stock</p>
                          <p className="text-xl font-bold">{statistics.inStockCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">With Discount</p>
                          <p className="text-xl font-bold">{statistics.hasDiscount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Out of Stock</p>
                          <p className="text-xl font-bold">{statistics.totalProducts - statistics.inStockCount}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Price Range</p>
                        {categoryProducts.length > 0 ? (
                          <div className="flex items-baseline gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">
                                  <span className="text-lg font-bold">
                                    np{Math.min(...categoryProducts.map(p => p.price)).toFixed(2)} - np{Math.max(...categoryProducts.map(p => p.price)).toFixed(2)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Min-max price range</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Category Created</p>
                        <p className="font-medium">{formatDate(category.created_at)}</p>
                      </div>
                      
                      {statistics.oldestProduct && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Oldest Product</p>
                          <p className="font-medium">{statistics.oldestProduct.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(statistics.oldestProduct.created_at)}</p>
                        </div>
                      )}
                      
                      {statistics.newestProduct && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Newest Product</p>
                          <p className="font-medium">{statistics.newestProduct.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(statistics.newestProduct.created_at)}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryViewDialog; 