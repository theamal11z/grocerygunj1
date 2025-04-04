import React, { useState } from 'react';
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
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Image as ImageIcon,
  Info,
  FileText,
  Star,
  DollarSign,
  Package,
  Calendar,
  BarChart3,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

// Define types
type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface ProductViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  category?: Category;
}

const ProductViewDialog: React.FC<ProductViewDialogProps> = ({
  open,
  onOpenChange,
  product,
  category
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  if (!product) return null;
  
  const hasImages = product.image_urls && product.image_urls.length > 0;
  const imageCount = hasImages ? product.image_urls.length : 0;
  
  const nextImage = () => {
    if (!hasImages) return;
    setActiveImageIndex((prev) => (prev + 1) % imageCount);
  };
  
  const prevImage = () => {
    if (!hasImages) return;
    setActiveImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
  };
  
  const toggleFullscreen = () => {
    setFullscreenMode(!fullscreenMode);
  };

  // Format created date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "PPP");
    } catch (error) {
      return dateString;
    }
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "p");
    } catch (error) {
      return "";
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-[700px] max-h-[90vh] overflow-auto",
        fullscreenMode && "max-w-[95vw] sm:max-w-[95vw] h-[90vh] max-h-[90vh]"
      )}>
        {!fullscreenMode && (
          <DialogHeader>
            <DialogTitle className="text-xl">Product Details</DialogTitle>
          </DialogHeader>
        )}
        
        {fullscreenMode ? (
          // Fullscreen image gallery mode
          <div className="relative h-full flex flex-col">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 z-10" 
              onClick={toggleFullscreen}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 relative flex items-center justify-center">
              {hasImages ? (
                <img
                  src={product.image_urls[activeImageIndex]}
                  alt={`${product.name} - Image ${activeImageIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/500x500?text=No+Image";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="h-12 w-12 opacity-30" />
                  <span className="text-muted-foreground">No images available</span>
                </div>
              )}
              
              {hasImages && imageCount > 1 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-background/80 rounded-full"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-background/80 rounded-full"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>
            
            {hasImages && imageCount > 1 && (
              <div className="p-2 flex justify-center gap-1.5 mt-auto">
                {product.image_urls.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 w-8 rounded-full transition-all ${
                      index === activeImageIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                    onClick={() => setActiveImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Regular product view with tabs
          <div className="space-y-6">
            {/* Product header with image */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-2/5">
                <div className="relative aspect-square rounded-md overflow-hidden bg-secondary flex-shrink-0 group cursor-pointer" onClick={toggleFullscreen}>
                  {hasImages ? (
                    <>
                      <img
                        src={product.image_urls[activeImageIndex]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/500x500?text=No+Image";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="h-8 w-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                      <span className="text-muted-foreground mt-2">No Image</span>
                    </div>
                  )}
                </div>
                
                {/* Thumbnail gallery */}
                {hasImages && imageCount > 1 && (
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {product.image_urls.map((url, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "aspect-square rounded-md overflow-hidden bg-secondary cursor-pointer transition-all",
                          activeImageIndex === index ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                        )}
                        onClick={() => setActiveImageIndex(index)}
                      >
                        <img
                          src={url}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Error";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold">{product.name}</h3>
                    
                    {category && (
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <Tag className="h-3.5 w-3.5 mr-1.5" />
                        <span>{category.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="px-2 py-1 h-auto">
                            <Hash className="h-3 w-3 mr-1" />
                            {product.id.substring(0, 8)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Full ID: {product.id}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={product.in_stock ? "success" : "destructive"} className="px-2 py-1.5 h-auto text-sm">
                      {product.in_stock ? "In Stock" : "Out of Stock"}
                    </Badge>
                    
                    {product.discount && product.discount > 0 && (
                      <Badge variant="secondary" className="px-2 py-1.5 h-auto text-sm">
                        {product.discount}% Discount
                      </Badge>
                    )}
                    
                    {product.rating && (
                      <Badge variant="outline" className="px-2 py-1.5 h-auto text-sm">
                        <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                        {product.rating}
                        {product.review_count && (
                          <span className="text-muted-foreground ml-1">({product.review_count})</span>
                        )}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-primary">np{product.price.toFixed(2)}</span>
                    {product.discount && product.discount > 0 && (
                      <span className="text-lg text-muted-foreground line-through">
                        np{((product.price * 100) / (100 - product.discount)).toFixed(2)}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground ml-1">per {product.unit}</span>
                  </div>
                  
                  {product.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Tabbed content */}
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="details" className="flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger value="specs" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>Specifications</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  <span>Stats</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        Product Information
                      </h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Name:</dt>
                          <dd className="font-medium">{product.name}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Category:</dt>
                          <dd className="font-medium">{category?.name || 'Uncategorized'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Price:</dt>
                          <dd className="font-medium">np{product.price.toFixed(2)} per {product.unit}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Status:</dt>
                          <dd className={product.in_stock ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {product.in_stock ? "In Stock" : "Out of Stock"}
                          </dd>
                        </div>
                        {product.discount && product.discount > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Discount:</dt>
                            <dd className="text-green-600 font-medium">{product.discount}%</dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Dates & System Info
                      </h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Created:</dt>
                          <dd className="font-medium">{formatDate(product.created_at)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Time:</dt>
                          <dd className="font-medium">{formatTime(product.created_at)}</dd>
                        </div>
                        {product.updated_at && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Last Updated:</dt>
                            <dd className="font-medium">{formatDate(product.updated_at)}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">ID:</dt>
                          <dd className="font-mono text-xs">{product.id}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
                
                {product.description && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Description
                      </h4>
                      <p className="text-sm whitespace-pre-line">
                        {product.description}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="specs" className="mt-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Technical Specifications
                    </h4>
                    
                    {product.nutrition && Object.keys(product.nutrition).length > 0 ? (
                      <div className="rounded-md border">
                        <div className="bg-muted/50 px-4 py-2 text-sm font-medium">
                          Nutrition Information
                        </div>
                        <table className="w-full text-sm">
                          <tbody>
                            {Object.entries(product.nutrition).map(([key, value]) => (
                              <tr key={key} className="border-t">
                                <td className="px-4 py-2.5 align-top text-muted-foreground capitalize">
                                  {key.replace(/_/g, ' ')}
                                </td>
                                <td className="px-4 py-2.5 align-top">
                                  {value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center text-muted-foreground">
                        No specifications or nutrition information available.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stats" className="mt-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Analytics & Statistics
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-md border p-4">
                        <div className="text-muted-foreground text-xs mb-1">Rating</div>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold mr-2">
                            {product.rating?.toFixed(1) || 'N/A'}
                          </div>
                          <div className="flex items-center">
                            {product.rating ? (
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < Math.floor(product.rating || 0) 
                                      ? 'fill-yellow-500 text-yellow-500' 
                                      : i < (product.rating || 0) 
                                        ? 'fill-yellow-500/50 text-yellow-500/50' 
                                        : 'text-muted'}`} 
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No ratings yet</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {product.review_count 
                            ? `Based on ${product.review_count} review${product.review_count !== 1 ? 's' : ''}` 
                            : 'No reviews yet'}
                        </div>
                      </div>
                      
                      <div className="rounded-md border p-4">
                        <div className="text-muted-foreground text-xs mb-1">Price Info</div>
                        <div className="flex flex-col">
                          <div className="text-2xl font-bold">
                            np{product.price.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            per {product.unit}
                          </div>
                          {product.discount && product.discount > 0 && (
                            <div className="mt-1">
                              <div className="text-xs text-muted-foreground flex items-center">
                                <span className="line-through mr-2">
                                  np{((product.price * 100) / (100 - product.discount)).toFixed(2)}
                                </span>
                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                  Save {product.discount}%
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductViewDialog; 