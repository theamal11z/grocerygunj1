import { 
  Eye, 
  Pencil, 
  Trash2, 
  Plus, 
  Download,
  Search,
  Filter,
  FolderTree,
  RefreshCw,
  AlertCircle,
  Tag,
  CheckCircle2,
  XCircle,
  Grid3X3,
  List,
  BarChart3,
  ArrowUpDown,
  Package,
  Info,
  Layers
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/DataContext";
import { useState, useEffect, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CategoryDialog from "@/components/CategoryDialog";
import CategoryViewDialog from "@/components/CategoryViewDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Define types
type Category = Database['public']['Tables']['categories']['Row'];

const Categories = () => {
  const { categories, products, refreshData, loading, error } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transformedCategories, setTransformedCategories] = useState<any[]>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // View states
  const [viewType, setViewType] = useState<'table' | 'grid'>('table');
  const [showStats, setShowStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'products' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Selected category for operations
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

  // Transform and validate categories
  useEffect(() => {
    try {
      if (!categories || !products) {
        setTransformedCategories([]);
        return;
      }
      
      // Transform categories to display format
      const transformed = categories.map(category => {
        // Count products in this category
        const productCount = products.filter(p => p.category_id === category.id).length;
        
        // Get some sample products for this category (max 3)
        const categoryProducts = products
          .filter(p => p.category_id === category.id)
          .slice(0, 3)
          .map(p => p.name);
          
        const sampleProducts = categoryProducts.length 
          ? categoryProducts.join(", ")
          : "No products";
        
        return {
          ...category,
          products: productCount,
          sampleProducts,
          imageUrl: category.image_url || "https://placehold.co/100x100?text=No+Image",
          // Add a simple placeholder description since our schema doesn't have description
          description: `${category.name} category with ${productCount} products`
        };
      });
      
      setTransformedCategories(transformed);
      setProcessingError(null);
    } catch (error) {
      console.error("Error processing categories:", error);
      setProcessingError("Failed to process categories data. Please try refreshing.");
      setTransformedCategories([]);
    }
  }, [categories, products]);

  // Apply search and sorting
  const filteredCategories = useMemo(() => {
    let filtered = [...transformedCategories];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(query) ||
        category.sampleProducts.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'products') {
        return sortOrder === 'asc'
          ? a.products - b.products
          : b.products - a.products;
      } else if (sortBy === 'created') {
        return sortOrder === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

    return filtered;
  }, [transformedCategories, searchQuery, sortBy, sortOrder]);

  // Calculate category statistics
  const statistics = useMemo(() => {
    if (!categories || !products) {
      return {
        totalCategories: 0,
        totalProducts: 0,
        averageProductsPerCategory: 0,
        categoriesWithNoProducts: 0,
        categoriesWithMostProducts: [],
        categoriesWithNoImages: 0
      };
    }
    
    const totalCategories = categories.length;
    const totalProducts = products.length;
    const averageProductsPerCategory = totalCategories 
      ? Math.round((totalProducts / totalCategories) * 10) / 10
      : 0;
    
    // Categories with no products
    const categoriesWithNoProducts = transformedCategories.filter(c => c.products === 0).length;
    
    // Categories with most products (top 3)
    const sortedByProducts = [...transformedCategories].sort((a, b) => b.products - a.products);
    const categoriesWithMostProducts = sortedByProducts.slice(0, 3);
    
    // Categories with no images
    const categoriesWithNoImages = categories.filter(c => !c.image_url).length;
    
    return {
      totalCategories,
      totalProducts,
      averageProductsPerCategory,
      categoriesWithNoProducts,
      categoriesWithMostProducts,
      categoriesWithNoImages
    };
  }, [categories, products, transformedCategories]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log("Refreshing categories data...");
      await refreshData();
      console.log("Categories data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data", {
        description: "Please check your network connection and try again."
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle view category
  const handleViewCategory = (category: Category) => {
    setSelectedCategory(category);
    setViewDialogOpen(true);
  };
  
  // Handle edit category
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setEditDialogOpen(true);
  };
  
  // Handle delete category click
  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;
    
    try {
      // Check if category has products
      const categoryProducts = products.filter(p => p.category_id === selectedCategory.id);
      if (categoryProducts.length > 0) {
        toast.error(
          'Cannot delete category with products', 
          { description: `This category has ${categoryProducts.length} products. Remove or reassign them first.` }
        );
        setDeleteDialogOpen(false);
        return;
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id);
        
      if (error) throw error;
      
      toast.success('Category deleted successfully');
      refreshData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  // Handle add new category click
  const handleAddCategory = () => {
    setSelectedCategory(undefined);
    setAddDialogOpen(true);
  };
  
  // Export categories as CSV
  const handleExport = () => {
    // Prepare data for export
    const exportData = transformedCategories.map(category => ({
      ID: category.id,
      Name: category.name,
      'Product Count': category.products,
      'Sample Products': category.sampleProducts,
      'Created At': new Date(category.created_at).toLocaleDateString(),
      'Image URL': category.image_url || ''
    }));
    
    // Convert to CSV
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    // Download the file
    saveAs(blob, `categories-export-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Categories exported successfully');
  };

  // Toggle sort order
  const handleSort = (field: 'name' | 'products' | 'created') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Category columns
  const categoryColumns = [
    {
      header: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer hover:text-primary"
          onClick={() => handleSort('name')}
        >
          Category
          {sortBy === 'name' && (
            <ArrowUpDown className={cn(
              "h-3.5 w-3.5",
              sortOrder === 'desc' && "rotate-180 transform"
            )} />
          )}
        </div>
      ),
      accessorKey: "name" as const,
      cell: (info: any) => {
        const category = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary flex-shrink-0">
              <img 
                src={category.imageUrl} 
                alt={category.name} 
                className="h-full w-full object-cover" 
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Error";
                }}
              />
            </div>
            <div>
              <div className="font-medium">{category.name}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer hover:text-primary"
          onClick={() => handleSort('products')}
        >
          Products
          {sortBy === 'products' && (
            <ArrowUpDown className={cn(
              "h-3.5 w-3.5",
              sortOrder === 'desc' && "rotate-180 transform"
            )} />
          )}
        </div>
      ),
      accessorKey: "products" as const,
      cell: (info: any) => {
        const category = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {category.products}
            </span>
          </div>
        );
      }
    },
    {
      header: "Sample Products",
      accessorKey: "sampleProducts" as const,
      cell: (info: any) => {
        const category = info.row.original;
        return (
          <div className="max-w-[300px] truncate text-sm">
            {category.sampleProducts}
          </div>
        );
      }
    },
    {
      header: () => (
        <div 
          className="flex items-center gap-1 cursor-pointer hover:text-primary"
          onClick={() => handleSort('created')}
        >
          Created
          {sortBy === 'created' && (
            <ArrowUpDown className={cn(
              "h-3.5 w-3.5",
              sortOrder === 'desc' && "rotate-180 transform"
            )} />
          )}
        </div>
      ),
      accessorKey: "created_at" as const,
      cell: (info: any) => {
        const category = info.row.original;
        return (
          <div className="text-sm text-muted-foreground">
            {new Date(category.created_at).toLocaleDateString()}
          </div>
        );
      }
    },
    {
      header: "Actions",
      accessorKey: "actions" as const,
      cell: (info: any) => {
        const category = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => handleViewCategory(category)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => handleEditCategory(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              onClick={() => handleDeleteClick(category)}
              disabled={category.products > 0}
              title={category.products > 0 ? "Cannot delete category with products" : "Delete category"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-blur-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Manage product categories ({filteredCategories.length} of {categories.length} categories)
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
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
            onClick={handleAddCategory}
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories by name or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select
            value={sortBy}
            onValueChange={(value: 'name' | 'products' | 'created') => {
              setSortBy(value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="products">Sort by Products</SelectItem>
              <SelectItem value="created">Sort by Date Created</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowUpDown className={cn(
              "h-4 w-4",
              sortOrder === 'desc' && "rotate-180 transform"
            )} />
          </Button>
        </div>
      </div>
      
      {/* Show category statistics dashboard */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <FolderTree className="h-10 w-10 text-primary mb-2" />
              <div className="text-3xl font-bold">{statistics.totalCategories}</div>
              <p className="text-sm text-muted-foreground">Total Categories</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <Package className="h-10 w-10 text-primary mb-2" />
              <div className="text-3xl font-bold">{statistics.totalProducts}</div>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <Layers className="h-10 w-10 text-primary mb-2" />
              <div className="text-3xl font-bold">{statistics.averageProductsPerCategory}</div>
              <p className="text-sm text-muted-foreground">Avg. Products per Category</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <Info className="h-10 w-10 text-primary mb-2" />
              <div className="text-3xl font-bold">{statistics.categoriesWithNoImages}</div>
              <p className="text-sm text-muted-foreground">Categories Without Images</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {(error || processingError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error || processingError}</span>
            <Button variant="destructive" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Grid view */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden group">
              <div className="aspect-video relative overflow-hidden bg-muted">
                <img 
                  src={category.imageUrl} 
                  alt={category.name} 
                  className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/300x200?text=No+Image";
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full"
                    onClick={() => handleViewCategory(category)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {category.products === 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-full"
                      onClick={() => handleDeleteClick(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{category.name}</h3>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <span>{category.products} products</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Badge variant={category.products > 0 ? "default" : "secondary"}>
                  {category.products > 0 ? `${category.products} Products` : 'Empty'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(category.created_at).toLocaleDateString()}
                </span>
              </CardFooter>
            </Card>
          ))}
          
          {/* Add category card */}
          <Card 
            className="border-dashed cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center aspect-[4/3]" 
            onClick={handleAddCategory}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center h-full gap-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">Add New Category</p>
              <p className="text-xs text-muted-foreground">Create a new product category</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <DataTable 
          data={filteredCategories} 
          columns={categoryColumns}
          searchable={false} // We have our own search
          searchPlaceholder="Search categories..."
          loading={loading || isRefreshing}
        />
      )}
      
      {/* Add Category Dialog */}
      <CategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={refreshData}
      />
      
      {/* Edit Category Dialog */}
      <CategoryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        category={selectedCategory}
        onSave={refreshData}
      />
      
      {/* View Category Dialog */}
      <CategoryViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        category={selectedCategory}
        products={products}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default Categories;
