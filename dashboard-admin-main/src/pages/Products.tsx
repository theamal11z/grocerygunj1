import { 
  Eye, 
  Pencil, 
  Trash2, 
  Plus, 
  Download,
  Search,
  Filter as FilterIcon,
  Tag,
  CheckCircle2,
  XCircle,
  BarChart3,
  RefreshCw,
  ShoppingBag,
  CircleDollarSign,
  CircleOff,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  CheckSquare,
  CalendarIcon,
  HashIcon,
  DollarSign,
  Clock,
  History
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/DataContext";
import { useState, useMemo, useEffect } from "react";
import { Database } from "@/lib/database.types";
import ProductDialog from "@/components/ProductDialog";
import ProductViewDialog from "@/components/ProductViewDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define product type from our database
type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

const Products = () => {
  const { products, categories, refreshData } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Selected product for operations
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  // Filter and view states
  const [viewType, setViewType] = useState<'table' | 'grid'>('table');
  const [showStats, setShowStats] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<boolean | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Advanced search states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchBy, setSearchBy] = useState<'name' | 'id' | 'description' | 'price' | 'date'>('name');
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [searchDate, setSearchDate] = useState<Date | undefined>(undefined);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  // Batch operations
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [batchActionDialogOpen, setBatchActionDialogOpen] = useState(false);
  const [batchStockStatus, setBatchStockStatus] = useState<boolean | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Transform products to display format
  const transformedProducts = products.map(product => {
    // Find the category name
    const category = categories.find(cat => cat.id === product.category_id);
    
    // Determine status based on stock
    const status = product.in_stock ? "In Stock" : "Out of Stock";
    
    return {
      ...product,
      category: category?.name || "Uncategorized",
      status,
      displayPrice: `np${product.price.toFixed(2)}`,
      imageUrl: product.image_urls && product.image_urls.length > 0 
        ? product.image_urls[0] 
        : "https://placehold.co/100x100?text=No+Image"
    };
  });

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    let filtered = transformedProducts;
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => 
        product.category_id === categoryFilter
      );
    }
    
    // Apply stock filter
    if (stockFilter !== null) {
      filtered = filtered.filter(product => 
        product.in_stock === stockFilter
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      
      if (searchBy === 'name') {
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(query)
        );
      } else if (searchBy === 'id') {
        filtered = filtered.filter(product => 
          product.id.toLowerCase().includes(query)
        );
      } else if (searchBy === 'description') {
        filtered = filtered.filter(product => 
          product.description?.toLowerCase().includes(query)
        );
      } else if (searchBy === 'price') {
        // Parse price search
        const numericQuery = parseFloat(query);
        if (!isNaN(numericQuery)) {
          filtered = filtered.filter(product => 
            product.price === numericQuery
          );
        }
        
        // Apply price range if set
        if (minPrice) {
          const min = parseFloat(minPrice);
          if (!isNaN(min)) {
            filtered = filtered.filter(product => product.price >= min);
          }
        }
        
        if (maxPrice) {
          const max = parseFloat(maxPrice);
          if (!isNaN(max)) {
            filtered = filtered.filter(product => product.price <= max);
          }
        }
      }
    }
    
    // Apply date filter
    if (searchDate) {
      const targetDate = new Date(searchDate);
      targetDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(product => {
        const productDate = new Date(product.created_at);
        productDate.setHours(0, 0, 0, 0);
        return productDate.getTime() === targetDate.getTime();
      });
    }
    
    return filtered;
  }, [transformedProducts, categoryFilter, stockFilter, searchQuery, searchBy, minPrice, maxPrice, searchDate]);

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
      // Add to search history (keep last 5)
      setSearchHistory(prev => [searchQuery, ...prev.slice(0, 4)]);
    }
  };
  
  // Apply search
  const applySearch = (value: string) => {
    setSearchQuery(value);
    setShowSearchHistory(false);
    handleSearch();
  };
  
  // Clear advanced search
  const clearAdvancedSearch = () => {
    setSearchBy('name');
    setMinPrice("");
    setMaxPrice("");
    setSearchDate(undefined);
  };

  // Calculate product statistics
  const productStats = useMemo(() => {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.in_stock).length;
    const outOfStock = totalProducts - inStock;
    const totalValue = products.reduce((sum, product) => 
      sum + (product.in_stock ? product.price : 0), 0);
    
    // Calculate counts by category
    const categoryStats = categories.map(category => {
      const count = products.filter(p => p.category_id === category.id).length;
      return {
        id: category.id,
        name: category.name,
        count
      };
    }).sort((a, b) => b.count - a.count);
    
    return {
      total: totalProducts,
      inStock,
      outOfStock,
      totalValue,
      topCategories: categoryStats.slice(0, 3)
    };
  }, [products, categories]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };
  
  // Handle view product
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };
  
  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };
  
  // Handle delete product click
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      setBatchProcessing(true);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);
        
      if (error) throw error;
      
      toast.success(`Product "${selectedProduct.name}" deleted successfully`);
      
      // Close the dialog and refresh the data
      setDeleteDialogOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setBatchProcessing(false);
    }
  };
  
  // Handle add new product click
  const handleAddProduct = () => {
    setSelectedProduct(undefined);
    setAddDialogOpen(true);
  };
  
  // Export products as CSV
  const handleExport = () => {
    // Prepare data for export
    const exportData = transformedProducts.map(product => ({
      ID: product.id,
      Name: product.name,
      Category: product.category,
      Price: product.price,
      Unit: product.unit,
      'In Stock': product.in_stock ? 'Yes' : 'No',
      Discount: product.discount || 0,
      Description: product.description || ''
    }));
    
    // Convert to CSV
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    // Download the file
    saveAs(blob, `products-export-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Products exported successfully');
  };

  // Get selected product's category
  const getSelectedProductCategory = () => {
    if (!selectedProduct || !selectedProduct.category_id) return undefined;
    return categories.find(cat => cat.id === selectedProduct.category_id);
  };

  // Products columns
  const productColumns = [
    {
      header: "Product",
      accessorKey: "name" as const,
      cell: (info: any) => {
        const product = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-md overflow-hidden bg-secondary flex-shrink-0">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="h-full w-full object-cover" 
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image";
                }}
              />
            </div>
            <div>
              <div className="font-medium line-clamp-1">{product.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Tag className="h-3 w-3" /> 
                <span className="line-clamp-1">{product.category}</span>
              </div>
              {product.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[200px]">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Price",
      accessorKey: "price" as const,
      cell: (info: any) => {
        const product = info.row.original;
        return (
          <div>
            <div className="font-medium">{product.displayPrice}</div>
            <div className="text-xs text-muted-foreground">per {product.unit}</div>
            {product.discount > 0 && (
              <div className="text-xs text-green-600 font-medium mt-0.5">
                {product.discount}% off
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (info: any) => {
        const product = info.row.original;
        const statusColors: Record<string, string> = {
          "In Stock": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          "Out of Stock": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };
        
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className={`${statusColors[product.status]}`}>
              {product.in_stock 
                ? <CheckCircle2 className="h-3 w-3 mr-1 inline" /> 
                : <XCircle className="h-3 w-3 mr-1 inline" />
              }
            {product.status}
            </Badge>
            
            {/* Add images count badge */}
            {product.image_urls && product.image_urls.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {product.image_urls.length} image{product.image_urls.length !== 1 ? 's' : ''}
          </span>
            )}
          </div>
        );
      }
    },
    {
      header: "Created",
      accessorKey: "created_at" as const,
      cell: (info: any) => {
        const product = info.row.original;
        const date = new Date(product.created_at);
        return (
          <div className="text-sm">
            {date.toLocaleDateString()}
            <div className="text-xs text-muted-foreground">
              {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      }
    },
    {
      header: "Actions",
      id: "actions",
      cell: (info: any) => {
        const product = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => handleViewProduct(product)}
            >
              <Eye className="h-4 w-4" />
            </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">View Product</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => handleEditProduct(product)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Edit Product</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              onClick={() => handleDeleteClick(product)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Delete Product</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      }
    }
  ];

  // Add selection column to product columns
  const productColumnsWithSelection = [
    {
      header: ({ table }: any) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
            onChange={(e) => handleSelectAllProducts(e.target.checked)}
          />
        </div>
      ),
      id: "select",
      cell: ({ row }: any) => {
        const product = row.original;
        const isSelected = selectedProducts.includes(product.id);
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary"
              checked={isSelected}
              onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
            />
          </div>
        );
      },
    },
    ...productColumns
  ];

  // Handle select product
  const handleSelectProduct = (productId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };
  
  // Handle select all products
  const handleSelectAllProducts = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedProducts(filteredProducts.map(product => product.id));
    } else {
      setSelectedProducts([]);
    }
  };
  
  // Handle batch stock update
  const handleBatchStockUpdate = async () => {
    if (batchStockStatus === null || selectedProducts.length === 0) {
      toast.error("Please select products and a stock status");
      return;
    }
    
    setBatchProcessing(true);
    
    try {
      // Update products in batches to avoid timeouts
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < selectedProducts.length; i += batchSize) {
        batches.push(selectedProducts.slice(i, i + batchSize));
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each batch
      for (const batch of batches) {
        const { data, error } = await supabase
          .from('products')
          .update({ in_stock: batchStockStatus })
          .in('id', batch);
          
        if (error) {
          console.error('Error in batch update:', error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }
      
      if (errorCount === 0) {
        toast.success(`Updated stock status for ${successCount} products`);
      } else {
        toast.warning(`Updated ${successCount} products successfully. Failed to update ${errorCount} products.`);
      }
      
      // Close dialog and refresh data
      setBatchActionDialogOpen(false);
      setBatchStockStatus(null);
      setSelectedProducts([]);
      await refreshData();
      
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error('Failed to update products. Please try again.');
    } finally {
      setBatchProcessing(false);
    }
  };
  
  // Handle batch delete
  const handleBatchDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    const confirm = window.confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`);
    if (!confirm) return;
    
    setBatchProcessing(true);
    
    try {
      // Delete products in batches
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < selectedProducts.length; i += batchSize) {
        batches.push(selectedProducts.slice(i, i + batchSize));
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each batch
      for (const batch of batches) {
        const { data, error } = await supabase
          .from('products')
          .delete()
          .in('id', batch);
          
        if (error) {
          console.error('Error in batch delete:', error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }
      
      if (errorCount === 0) {
        toast.success(`Deleted ${successCount} products successfully`);
      } else {
        toast.warning(`Deleted ${successCount} products successfully. Failed to delete ${errorCount} products.`);
      }
      
      // Close dialog and refresh data
      setBatchActionDialogOpen(false);
      setSelectedProducts([]);
      await refreshData();
      
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Failed to delete products. Please try again.');
    } finally {
      setBatchProcessing(false);
    }
  };

  // Clear selected products when filters change
  useEffect(() => {
    setSelectedProducts([]);
  }, [categoryFilter, stockFilter, searchQuery, searchBy, searchDate, minPrice, maxPrice]);

  return (
    <div className="space-y-6 animate-blur-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product inventory ({filteredProducts.length} of {products.length} products)
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(categoryFilter || stockFilter !== null) && (
              <Badge variant="secondary" className="ml-1 h-5 px-1">
                {[categoryFilter, stockFilter !== null ? 'stock' : null].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="h-4 w-4" />
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </Button>

          <div className="flex border border-input rounded-md overflow-hidden">
            <Button
              variant={viewType === 'table' ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none px-2"
              onClick={() => setViewType('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === 'grid' ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none px-2"
              onClick={() => setViewType('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          
          <Button 
            size="sm" 
            className="gap-1.5"
            onClick={handleAddProduct}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>
      
      {/* Product Statistics Dashboard */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <h3 className="text-2xl font-bold mt-1">{productStats.total}</h3>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Stock</p>
                  <h3 className="text-2xl font-bold mt-1">{productStats.inStock}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-green-500 font-medium">{((productStats.inStock / productStats.total) * 100).toFixed(0)}%</span> of total
                  </p>
                </div>
                <div className="bg-green-500/10 p-2 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <h3 className="text-2xl font-bold mt-1">{productStats.outOfStock}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-red-500 font-medium">{((productStats.outOfStock / productStats.total) * 100).toFixed(0)}%</span> of total
                  </p>
                </div>
                <div className="bg-red-500/10 p-2 rounded-full">
                  <CircleOff className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
                  <h3 className="text-2xl font-bold mt-1">np{productStats.totalValue.toFixed(2)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">In-stock products only</p>
                </div>
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <CircleDollarSign className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Enhanced Search Bar */}
      <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
        <div className="flex flex-col space-y-4">
          <div className="relative w-full">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={`Search by ${searchBy}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  onFocus={() => searchHistory.length > 0 && setShowSearchHistory(true)}
                  onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                  className="pl-10 pr-16 py-2.5 rounded-md w-full text-sm border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {searchQuery && (
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                
                {/* Search History Dropdown */}
                {showSearchHistory && searchHistory.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover rounded-md shadow-md border border-border">
                    <div className="py-1 px-2 text-xs font-medium text-muted-foreground border-b">Recent searches</div>
                    {searchHistory.map((query, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 flex items-center gap-2"
                        onClick={() => applySearch(query)}
                      >
                        <History className="h-3 w-3 text-muted-foreground" />
                        {query}
                      </button>
                    ))}
                    <button
                      className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50 border-t"
                      onClick={() => setSearchHistory([])}
                    >
                      Clear history
                    </button>
                  </div>
                )}
              </div>
              
              <Select
                value={searchBy}
                onValueChange={(value: 'name' | 'id' | 'description' | 'price' | 'date') => setSearchBy(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5" /> Name
                    </div>
                  </SelectItem>
                  <SelectItem value="id">
                    <div className="flex items-center gap-2">
                      <HashIcon className="h-3.5 w-3.5" /> ID
                    </div>
                  </SelectItem>
                  <SelectItem value="description">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">T</span> Description
                    </div>
                  </SelectItem>
                  <SelectItem value="price">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" /> Price
                    </div>
                  </SelectItem>
                  <SelectItem value="date">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5" /> Date
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={showAdvancedSearch ? "bg-accent text-accent-foreground" : ""}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              
              <Button
                variant="default"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>
          
          {/* Advanced Search Options */}
          {showAdvancedSearch && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {searchBy === 'price' && (
                <>
                  <div>
                    <Label className="text-xs font-medium block mb-1.5">Min Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Min price..."
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium block mb-1.5">Max Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Max price..."
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {searchBy === 'date' && (
                <div>
                  <Label className="text-xs font-medium block mb-1.5">Created Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {searchDate ? format(searchDate, "PP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={searchDate}
                        onSelect={setSearchDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAdvancedSearch}
                  className="ml-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Filters */}
      {filtersVisible && (
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filters</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setCategoryFilter(null);
                setStockFilter(null);
                setSearchQuery("");
              }}
              className="h-8 px-2 text-xs"
            >
              Reset all filters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-xs font-medium block mb-1.5">Category</label>
              <Select 
                value={categoryFilter || 'all'} 
                onValueChange={(value) => setCategoryFilter(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Stock Status Filter */}
            <div>
              <label className="text-xs font-medium block mb-1.5">Stock Status</label>
              <Select 
                value={stockFilter === null ? 'all' : stockFilter ? 'in' : 'out'} 
                onValueChange={(value) => {
                  if (value === 'all') setStockFilter(null);
                  else if (value === 'in') setStockFilter(true);
                  else setStockFilter(false);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="in">In Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Search */}
            <div>
              <label className="text-xs font-medium block mb-1.5">Search</label>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-md w-full text-sm border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {searchQuery && (
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Active filters summary */}
      {(categoryFilter || stockFilter !== null || searchQuery || searchDate || minPrice || maxPrice) && (
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-md">
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span className="font-semibold">Active filters:</span>
            
            {categoryFilter && (
              <Badge variant="secondary" className="gap-1.5 h-6">
                Category: {categories.find(c => c.id === categoryFilter)?.name || 'Unknown'}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => setCategoryFilter(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {stockFilter !== null && (
              <Badge variant="secondary" className="gap-1.5 h-6">
                {stockFilter ? 'In Stock' : 'Out of Stock'}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => setStockFilter(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {searchQuery && (
              <Badge variant="secondary" className="gap-1.5 h-6">
                Search ({searchBy}): {searchQuery}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {searchDate && (
              <Badge variant="secondary" className="gap-1.5 h-6">
                Date: {format(searchDate, "PP")}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => setSearchDate(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {(minPrice || maxPrice) && (
              <Badge variant="secondary" className="gap-1.5 h-6">
                Price Range: {minPrice || '0'} - {maxPrice || '∞'}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setCategoryFilter(null);
              setStockFilter(null);
              setSearchQuery("");
              setSearchDate(undefined);
              setMinPrice("");
              setMaxPrice("");
              clearAdvancedSearch();
            }}
            className="h-7 text-xs"
          >
            Reset all
          </Button>
        </div>
      )}
      
      {/* Batch Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-md px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{selectedProducts.length} products selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setBatchActionDialogOpen(true)}
              className="h-8"
            >
              Batch Actions
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedProducts([])}
              className="h-8"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}
      
      {/* Product Grid/Table View */}
      {viewType === 'table' ? (
      <DataTable 
          data={filteredProducts} 
          columns={selectedProducts.length > 0 ? productColumnsWithSelection : productColumns}
          searchable={false} // We're using our custom search now
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No products found matching your filters.
            </div>
          ) : (
            filteredProducts.map(product => (
              <Card key={product.id} className="overflow-hidden flex flex-col">
                <div className="relative aspect-square bg-muted group">
                  <img 
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-cover w-full h-full"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/300x300?text=No+Image";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewProduct(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Status Badge */}
                  <Badge 
                    className={`absolute top-2 right-2 ${
                      product.in_stock 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-400"
                    }`}
                  >
                    {product.in_stock ? "In Stock" : "Out of Stock"}
                  </Badge>
                  
                  {/* Discount Badge */}
                  {product.discount > 0 && (
                    <Badge className="absolute top-2 left-2 bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-400">
                      {product.discount}% OFF
                    </Badge>
                  )}
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {product.category}
                  </div>
                  <h3 className="font-medium mt-1 line-clamp-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-grow">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <div className="font-bold text-lg">{product.displayPrice}</div>
                      <div className="text-xs text-muted-foreground">per {product.unit}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
      
      {/* Add Product Dialog - keep existing code */}
      <ProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categories={categories}
        onSave={refreshData}
      />
      
      {/* Edit Product Dialog - keep existing code */}
      <ProductDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        product={selectedProduct}
        categories={categories}
        onSave={refreshData}
      />
      
      {/* View Product Dialog - keep existing code */}
      <ProductViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        product={selectedProduct}
        category={getSelectedProductCategory()}
      />
      
      {/* Delete Confirmation Dialog - keep existing code */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
      />
      
      {/* Batch Action Dialog */}
      <Dialog open={batchActionDialogOpen} onOpenChange={setBatchActionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Batch Actions</DialogTitle>
            <DialogDescription>
              Apply actions to {selectedProducts.length} selected products
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Update Stock Status</h3>
              <div className="flex gap-2">
                <Select 
                  value={batchStockStatus === null ? '' : batchStockStatus ? 'in' : 'out'} 
                  onValueChange={(value) => {
                    if (value === 'in') setBatchStockStatus(true);
                    else if (value === 'out') setBatchStockStatus(false);
                    else setBatchStockStatus(null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select stock status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">In Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBatchStockUpdate} 
                  disabled={batchStockStatus === null || batchProcessing}
                >
                  {batchProcessing ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-destructive">Delete Products</h3>
              <p className="text-sm text-muted-foreground">
                This will permanently delete all selected products. This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleBatchDelete}
                disabled={batchProcessing}
              >
                {batchProcessing ? 'Deleting...' : `Delete ${selectedProducts.length} Products`}
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchActionDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
