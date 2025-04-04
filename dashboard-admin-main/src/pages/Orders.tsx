import { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  Filter as FilterIcon, 
  Download, 
  Eye, 
  Pencil, 
  Trash2,
  Plus,
  Calendar,
  ShoppingBag,
  X,
  Check,
  AlertTriangle,
  BarChart3,
  Clock,
  TruckIcon,
  PackageCheck,
  Ban,
  ChevronDown,
  ChevronUp,
  ListFilter,
  CheckSquare
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/DataContext";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";

// Define the type for our enhanced order data
interface EnhancedOrder {
  id: string;
  user_id: string;
  customer: string;
  email: string | null;
  phone_number: string | null;
  formattedDate: string;
  status: string;
  items: number;
  payment: string;
  total_amount: number;
  displayTotal: string;
  products?: string[];
  created_at: string;
  is_cash_on_delivery: boolean;
  delivery_fee: number;
  delivery_address?: {
    id: string;
    type: string;
    address: string;
    area: string;
    city: string;
  };
  orderItems?: Array<{
    id: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  coupon?: {
    id: string;
    code: string;
    discount: string;
    coupon_type: string;
  } | null;
  discount_amount?: number;
}

// Define the order status options
const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

// Define the form schema for updating order status
const orderStatusSchema = z.object({
  status: z.string().min(1, "Please select a status"),
});

const Orders = () => {
  const { orders, orderItems, products, profiles, addresses, refreshData, updateOrderStatus, deleteOrder, offers } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enhancedOrders, setEnhancedOrders] = useState<EnhancedOrder[]>([]);
  const [viewOrderDialog, setViewOrderDialog] = useState(false);
  const [editOrderDialog, setEditOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<EnhancedOrder | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [showStats, setShowStats] = useState(true);
  const [advancedFiltersVisible, setAdvancedFiltersVisible] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [batchActionDialogOpen, setBatchActionDialogOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState("");
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Form for order status update
  const statusForm = useForm<z.infer<typeof orderStatusSchema>>({
    resolver: zodResolver(orderStatusSchema),
    defaultValues: {
      status: undefined,
    },
  });

  // Prepare enhanced order data
  useEffect(() => {
    if (orders && orderItems && products && profiles && addresses && offers) {
      // Group order items by order ID
      const orderItemsMap = orderItems.reduce((acc, item) => {
        if (!item.order_id) return acc;
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }
        acc[item.order_id].push(item);
        return acc;
      }, {} as Record<string, typeof orderItems>);
      
      // Create enhanced order data
      const enhanced = orders.map(order => {
        // Find corresponding order items
        const items = orderItemsMap[order.id] || [];
        
        // Find customer profile
        const customer = profiles.find(p => p.id === order.user_id);
        
        // Find delivery address if available
        const deliveryAddress = addresses.find(addr => 
          addr.id === (order as any).delivery_address_id || addr.id === (order as any).address_id
        );
        
        // Format date from ISO string
        const formattedDate = order.created_at ? 
          format(new Date(order.created_at), 'yyyy-MM-dd') : 
          'Unknown date';
        
        // Get status with proper capitalization
        let capitalizedStatus = order.status ? 
          order.status.charAt(0).toUpperCase() + order.status.slice(1) : 
          'Pending';
        
        // Get product names for items
        const orderProducts = items.map(item => {
          if (!item.product_id) return 'Unknown product';
          const product = products.find(p => p.id === item.product_id);
          return product ? product.name : 'Unknown product';
        });

        // Create enhanced order items with product details
        const enhancedOrderItems = items.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return {
            id: item.id,
            product_id: item.product_id,
            product_name: product ? product.name : 'Unknown product',
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.quantity * item.unit_price
          };
        });
        
        // Find the applied coupon if any
        let coupon = null;
        let discountAmount = 0;
        
        if (order.applied_coupon_id) {
          // You'll need to fetch offers data for this
          const appliedCoupon = offers.find(offer => offer.id === order.applied_coupon_id);
          if (appliedCoupon) {
            coupon = {
              id: appliedCoupon.id,
              code: appliedCoupon.code,
              discount: appliedCoupon.discount,
              coupon_type: appliedCoupon.coupon_type || 'percent'
            };
            
            // Calculate discount amount if available
            if (order.discount_amount) {
              discountAmount = order.discount_amount;
            }
          }
        }
        
        return {
          ...order,
          formattedDate,
          status: capitalizedStatus,
          displayTotal: `np${order.total_amount.toFixed(2)}`,
          customer: customer?.full_name || `Customer ${order.user_id.substring(0, 8)}`,
          email: customer?.email || `user_${order.user_id.substring(0, 6)}@example.com`,
          phone_number: customer?.phone_number || null,
          items: items.length,
          payment: order.is_cash_on_delivery ? "Cash on Delivery" : "Card Payment",
          products: orderProducts,
          orderItems: enhancedOrderItems,
          delivery_address: deliveryAddress ? {
            id: deliveryAddress.id,
            type: deliveryAddress.type,
            address: deliveryAddress.address,
            area: deliveryAddress.area,
            city: deliveryAddress.city
          } : undefined,
          coupon: coupon,
          discount_amount: discountAmount
        };
      });
      
      setEnhancedOrders(enhanced);
    }
  }, [orders, orderItems, products, profiles, addresses, offers]);

  // Calculate order stats
  const orderStats = useMemo(() => {
    if (!enhancedOrders.length) return {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
      todayOrders: 0,
      todayRevenue: 0
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      total: enhancedOrders.length,
      pending: enhancedOrders.filter(o => o.status.toLowerCase() === 'pending').length,
      processing: enhancedOrders.filter(o => o.status.toLowerCase() === 'processing').length,
      shipped: enhancedOrders.filter(o => o.status.toLowerCase() === 'shipped').length,
      delivered: enhancedOrders.filter(o => o.status.toLowerCase() === 'delivered').length,
      cancelled: enhancedOrders.filter(o => o.status.toLowerCase() === 'cancelled').length,
      totalRevenue: enhancedOrders.reduce((sum, order) => sum + order.total_amount, 0),
      todayOrders: enhancedOrders.filter(o => new Date(o.created_at) >= today).length,
      todayRevenue: enhancedOrders
        .filter(o => new Date(o.created_at) >= today)
        .reduce((sum, order) => sum + order.total_amount, 0)
    };
  }, [enhancedOrders]);
  
  // Apply multiple filters
  const filteredOrders = useMemo(() => {
    let filtered = enhancedOrders;
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(order => 
        order.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Payment filter
    if (paymentFilter) {
      const isCashOnDelivery = paymentFilter === 'cod';
      filtered = filtered.filter(order => 
        order.is_cash_on_delivery === isCashOnDelivery
      );
    }
    
    // Date range filter
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= fromDate;
      });
    }
    
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate <= toDate;
      });
    }
    
    return filtered;
  }, [enhancedOrders, statusFilter, paymentFilter, dateRange]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  // Handle view order details
  const handleViewOrder = (order: EnhancedOrder) => {
    setSelectedOrder(order);
    setViewOrderDialog(true);
  };

  // Handle edit order status
  const handleEditOrder = (order: EnhancedOrder) => {
    setSelectedOrder(order);
    // Ensure we're not setting an empty string value
    const statusValue = order.status.toLowerCase();
    statusForm.setValue('status', statusValue);
    setEditOrderDialog(true);
  };

  // Handle delete order
  const handleDeleteOrder = (order: EnhancedOrder) => {
    setSelectedOrder(order);
    setDeleteConfirmDialog(true);
  };

  // Handle filter click
  const handleFilterClick = () => {
    setFilterDialogOpen(true);
  };

  // Handle applying status filter
  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    setFilterDialogOpen(false);
  };

  /**
   * Update order status with optimistic UI update and error handling
   */
  const handleUpdateOrderStatus = async (values: z.infer<typeof orderStatusSchema>) => {
    if (!selectedOrder) return;
    
    // Input validation
    if (!values.status) {
      setErrorMessage("Please select a status to update.");
      return;
    }
    
    // Prevent unnecessary updates
    if (values.status.toLowerCase() === selectedOrder.status.toLowerCase()) {
      setEditOrderDialog(false);
      return;
    }
    
    setIsProcessing(true);
    
    // Create a formatted status value with first letter capitalized
    const formattedStatus = values.status.charAt(0).toUpperCase() + values.status.slice(1);
    
    try {
      // Optimistic UI update - update local state before the API call completes
      setEnhancedOrders(prev => prev.map(order => {
        if (order.id === selectedOrder.id) {
          return {
            ...order,
            status: formattedStatus
          };
        }
        return order;
      }));
      
      // Make API call to update status
      const result = await updateOrderStatus(selectedOrder.id, values.status);
      
      if (result.success) {
      // Show success message
        setSuccessMessage(`Order #${selectedOrder.id.substring(0, 8)} status updated to ${formattedStatus}`);
      
        // Close dialog and reset form
      setEditOrderDialog(false);
        statusForm.reset({ status: undefined });
        
        // Refresh data from server to ensure consistency
      await refreshData();
      } else {
        // If the update failed, revert the optimistic update
        setEnhancedOrders(prev => prev.map(order => {
          if (order.id === selectedOrder.id) {
            return {
              ...order,
              status: selectedOrder.status // Revert to original status
            };
          }
          return order;
        }));
        
        // Show error message
        setErrorMessage(result.error || "Failed to update order status. Please try again.");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      
      // Revert optimistic update
      setEnhancedOrders(prev => prev.map(order => {
        if (order.id === selectedOrder.id) {
          return {
            ...order,
            status: selectedOrder.status // Revert to original status
          };
        }
        return order;
      }));
      
      // Show error message
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
      
      // Auto-dismiss success message after 5 seconds
      if (successMessage) {
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    }
  };

  // Handle delete order
  const handleConfirmDelete = async () => {
    if (!selectedOrder) return;
    
    setIsProcessing(true);
    setErrorMessage("");
    
    try {
      const result = await deleteOrder(selectedOrder.id);
      
      if (!result.success) throw new Error(result.error);
      
      // Show success message
      setSuccessMessage("Order deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      
      // Close the dialog and refresh the data
      setDeleteConfirmDialog(false);
      await refreshData();
    } catch (error) {
      console.error('Error deleting order:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Define UI status colors based on order status
  const statusColors = {
    Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    Processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    Delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  // Order columns with improved formatting and visualization
  const orderColumns = [
    { 
      header: "Order ID", 
      accessorKey: "id" as const,
      cell: (info: any) => {
        const order = info.row.original;
        return (
          <div className="flex flex-col">
          <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
            {order.id.substring(0, 8)}...
          </span>
            <span className="text-xs text-muted-foreground mt-1">
              {format(new Date(order.created_at), 'MMM dd, yyyy')}
            </span>
          </div>
        );
      }
    },
    { 
      header: "Customer", 
      accessorKey: "customer" as const,
      cell: (info: any) => {
        const order = info.row.original;
        return (
          <div>
            <div className="font-medium">{order.customer}</div>
            <div className="text-xs text-muted-foreground">{order.email}</div>
            {order.phone_number && (
              <div className="text-xs text-muted-foreground">{order.phone_number}</div>
            )}
          </div>
        );
      }
    },
    { 
      header: "Order Details", 
      accessorKey: "items" as const,
      cell: (info: any) => {
        const order = info.row.original;
        return (
          <div>
          <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{order.items} items</span>
            </div>
            <div className="text-xs mt-1 text-muted-foreground line-clamp-1">
              {order.products?.slice(0, 2).join(", ")}
              {order.products?.length > 2 && " + more..."}
            </div>
          </div>
        );
      }
    },
    { 
      header: "Payment", 
      accessorKey: "payment" as const,
      cell: (info: any) => {
        const order = info.row.original;
        const isCashOnDelivery = order.is_cash_on_delivery;
        return (
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isCashOnDelivery ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span>{isCashOnDelivery ? 'Cash on Delivery' : 'Card Payment'}</span>
          </div>
        );
      }
    },
    { 
      header: "Status", 
      accessorKey: "status" as const,
      cell: (info: any) => {
        const order = info.row.original;
        return (
          <Badge variant="outline" className={`px-2 py-1 ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
            {order.status === "Processing" && <RefreshCw className="h-3 w-3 mr-1 inline animate-spin" />}
            {order.status === "Shipped" && <TruckIcon className="h-3 w-3 mr-1 inline" />}
            {order.status === "Delivered" && <PackageCheck className="h-3 w-3 mr-1 inline" />}
            {order.status === "Cancelled" && <Ban className="h-3 w-3 mr-1 inline" />}
            {order.status}
          </Badge>
        );
      },
    },
    { 
      header: "Total", 
      accessorKey: "total_amount" as const,
      cell: (info: any) => {
        const order = info.row.original;
        return (
          <div>
            <div className="font-medium">{order.displayTotal}</div>
            {order.discount_amount > 0 && (
              <div className="text-xs text-green-600">
                (-np{order.discount_amount.toFixed(2)})
                </div>
            )}
          </div>
        );
      }
    },
    {
      header: "Actions",
      id: "actions",
      cell: (info: any) => {
        const order = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
            <button 
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
              onClick={() => handleViewOrder(order)}
            >
              <Eye className="h-4 w-4" />
            </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">View Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
            <button 
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
              onClick={() => handleEditOrder(order)}
            >
              <Pencil className="h-4 w-4" />
            </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Update Status</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
            <button 
              className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
              onClick={() => handleDeleteOrder(order)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Delete Order</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      }
    }
  ] as const;

  // Clear selected orders when filters change
  useEffect(() => {
    setSelectedOrders([]);
  }, [statusFilter, paymentFilter, dateRange]);
  
  const handleSelectOrder = (orderId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };
  
  const handleSelectAllOrders = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };
  
  const handleBatchStatusUpdate = async () => {
    if (!batchStatus || selectedOrders.length === 0) {
      setErrorMessage("Please select orders and a status to update");
      return;
    }
    
    setBatchProcessing(true);
    
    // Format status with capitalized first letter
    const formattedStatus = batchStatus.charAt(0).toUpperCase() + batchStatus.slice(1);
    
    try {
      // Optimistic UI update
      setEnhancedOrders(prev => prev.map(order => {
        if (selectedOrders.includes(order.id)) {
          return {
            ...order,
            status: formattedStatus
          };
        }
        return order;
      }));
      
      // Process each order update sequentially
      let successCount = 0;
      let errorCount = 0;
      
      for (const orderId of selectedOrders) {
        const result = await updateOrderStatus(orderId, batchStatus);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }
      
      // Show result message
      if (errorCount === 0) {
        setSuccessMessage(`Successfully updated ${successCount} orders to ${formattedStatus}`);
      } else {
        setSuccessMessage(`Updated ${successCount} orders to ${formattedStatus}. Failed to update ${errorCount} orders.`);
      }
      
      // Close dialog and reset
      setBatchActionDialogOpen(false);
      setBatchStatus("");
      setSelectedOrders([]);
      
      // Refresh data to ensure consistency
      await refreshData();
    } catch (error) {
      console.error("Error in batch update:", error);
      setErrorMessage("An error occurred during batch update. Some updates may have failed.");
    } finally {
      setBatchProcessing(false);
    }
  };
  
  const handleBatchDelete = async () => {
    if (selectedOrders.length === 0) return;
    
    setBatchProcessing(true);
    
    try {
      // Optimistic UI update
      setEnhancedOrders(prev => prev.filter(order => !selectedOrders.includes(order.id)));
      
      // Process each deletion sequentially
      let successCount = 0;
      let errorCount = 0;
      
      for (const orderId of selectedOrders) {
        const result = await deleteOrder(orderId);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }
      
      // Show result message
      if (errorCount === 0) {
        setSuccessMessage(`Successfully deleted ${successCount} orders`);
      } else {
        setSuccessMessage(`Deleted ${successCount} orders. Failed to delete ${errorCount} orders.`);
      }
      
      // Close dialog and reset
      setBatchActionDialogOpen(false);
      setSelectedOrders([]);
      
      // Refresh data to ensure consistency
      await refreshData();
    } catch (error) {
      console.error("Error in batch delete:", error);
      setErrorMessage("An error occurred during batch deletion. Some deletions may have failed.");
    } finally {
      setBatchProcessing(false);
    }
  };
  
  // Add selection column to order columns
  const orderColumnsWithSelection = [
    {
      header: ({ table }: any) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
            onChange={(e) => handleSelectAllOrders(e.target.checked)}
          />
        </div>
      ),
      id: "select",
      cell: ({ row }: any) => {
        const order = row.original;
        const isSelected = selectedOrders.includes(order.id);
  return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary"
              checked={isSelected}
              onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
            />
          </div>
        );
      },
    },
    ...orderColumns
  ];

  return (
    <div className="space-y-6 animate-blur-in">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage("")}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage("")}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders ({filteredOrders.length} orders)</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
            onClick={() => setAdvancedFiltersVisible(!advancedFiltersVisible)}
          >
            <ListFilter className="h-4 w-4" />
            Advanced Filters
            {(statusFilter || paymentFilter || dateRange.from || dateRange.to) && (
              <Badge variant="secondary" className="ml-1 h-5 px-1">
                {[statusFilter, paymentFilter, dateRange.from, dateRange.to].filter(Boolean).length}
              </Badge>
            )}
          </Button>
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
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="h-4 w-4" />
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Order Stats Dashboard */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <h3 className="text-2xl font-bold mt-1">{orderStats.total}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500 font-medium">{orderStats.todayOrders} today</span>
                </p>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">np{orderStats.totalRevenue.toFixed(2)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500 font-medium">np{orderStats.todayRevenue.toFixed(2)} today</span>
                </p>
              </div>
              <div className="bg-green-500/10 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <h3 className="text-2xl font-bold mt-1">{orderStats.pending}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">Processing: </span>
                  <span className="text-xs font-medium text-amber-500">{orderStats.processing}</span>
                </div>
              </div>
              <div className="bg-amber-500/10 p-2 rounded-full">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fulfillment</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1">
                    <PackageCheck className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{orderStats.delivered}</span>
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1">
                    <TruckIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{orderStats.shipped}</span>
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1">
                    <Ban className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">{orderStats.cancelled}</span>
                  </span>
                </div>
                <div className="h-2 bg-secondary mt-2 rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full" style={{ width: `${(orderStats.delivered / orderStats.total) * 100}%` }} />
                  <div className="bg-blue-500 h-full" style={{ width: `${(orderStats.shipped / orderStats.total) * 100}%` }} />
                  <div className="bg-amber-500 h-full" style={{ width: `${((orderStats.pending + orderStats.processing) / orderStats.total) * 100}%` }} />
                  <div className="bg-red-500 h-full" style={{ width: `${(orderStats.cancelled / orderStats.total) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Advanced Filters */}
      {advancedFiltersVisible && (
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Advanced Filters</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setStatusFilter(null);
                setPaymentFilter(null);
                setDateRange({ from: null, to: null });
              }}
              className="h-8 px-2 text-xs"
            >
              Reset all filters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium block mb-1.5">Order Status</label>
              <Select 
                value={statusFilter || 'any'} 
                onValueChange={(value) => handleStatusFilter(value === 'any' ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any status</SelectItem>
                  {ORDER_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Payment Method Filter */}
            <div>
              <label className="text-xs font-medium block mb-1.5">Payment Method</label>
              <Select 
                value={paymentFilter || 'any'} 
                onValueChange={(value) => setPaymentFilter(value === 'any' ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any payment method</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Range Filter */}
            <div className="col-span-1 sm:col-span-2">
              <label className="text-xs font-medium block mb-1.5">Date Range</label>
              <div className="flex gap-2">
                <div className="relative w-full">
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 rounded-md text-sm border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDateRange({ 
                      ...dateRange, 
                      from: e.target.value ? new Date(e.target.value) : null 
                    })}
                  />
                </div>
                <span className="text-muted-foreground self-center">to</span>
                <div className="relative w-full">
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 rounded-md text-sm border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDateRange({ 
                      ...dateRange, 
                      to: e.target.value ? new Date(e.target.value) : null 
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Active filters summary */}
      {(statusFilter || paymentFilter || dateRange.from || dateRange.to) && (
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-md">
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span className="font-semibold">Active filters:</span>
            
            {statusFilter && (
            <Badge variant="secondary" className="gap-1.5 h-6">
              Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-1 h-4 w-4 p-0"
                onClick={() => setStatusFilter(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
            )}
            
            {paymentFilter && (
              <Badge variant="secondary" className="gap-1.5 h-6">
                Payment: {paymentFilter === 'cod' ? 'Cash on Delivery' : 'Card Payment'}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => setPaymentFilter(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {dateRange.from && (
              <Badge variant="secondary" className="gap-1.5 h-6">
                From: {dateRange.from.toLocaleDateString()}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => setDateRange({ ...dateRange, from: null })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {dateRange.to && (
              <Badge variant="secondary" className="gap-1.5 h-6">
                To: {dateRange.to.toLocaleDateString()}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1 h-4 w-4 p-0"
                  onClick={() => setDateRange({ ...dateRange, to: null })}
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
              setStatusFilter(null);
              setPaymentFilter(null);
              setDateRange({ from: null, to: null });
            }}
            className="h-7 text-xs"
          >
            Reset all
          </Button>
        </div>
      )}
      
      {/* Batch Actions Bar */}
      {selectedOrders.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-md px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{selectedOrders.length} orders selected</span>
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
              onClick={() => setSelectedOrders([])}
              className="h-8"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}
      
      <DataTable 
        data={filteredOrders} 
        columns={selectedOrders.length > 0 ? orderColumnsWithSelection : orderColumns}
        searchable
        searchPlaceholder="Search orders..."
      />

      {/* Order Details Dialog */}
      <Dialog open={viewOrderDialog} onOpenChange={setViewOrderDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-xl">Order Details</DialogTitle>
            <DialogDescription>
                  Order #{selectedOrder?.id.substring(0, 8)}
            </DialogDescription>
              </div>
              
              {selectedOrder && (
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`${statusColors[selectedOrder.status] || ""} px-3 py-1`}
                  >
                    {selectedOrder.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewOrderDialog(false);
                      if (selectedOrder) {
                        handleEditOrder(selectedOrder);
                      }
                    }}
                    className="h-8"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Update Status
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-grow">
            {selectedOrder && (
              <div className="space-y-6 py-4 px-1">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="min-w-[200px] flex-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Created on {format(new Date(selectedOrder.created_at), 'PPP p')}</span>
                  </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div>
                        <h3 className="text-xs font-medium text-muted-foreground">Payment Method</h3>
                        <p className="text-sm font-medium flex items-center gap-1.5 mt-1">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          {selectedOrder.payment}
                        </p>
                  </div>
                  <div>
                        <h3 className="text-xs font-medium text-muted-foreground">Items</h3>
                        <p className="text-sm font-medium flex items-center gap-1.5 mt-1">
                          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                          {selectedOrder.orderItems?.length || 0} items
                        </p>
                  </div>
                  </div>
                </div>

                  <div className="flex flex-col items-end">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Total Amount</div>
                    <div className="text-2xl font-bold">{selectedOrder.displayTotal}</div>
                    
                    {selectedOrder.discount_amount > 0 && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        includes discount of np{selectedOrder.discount_amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        Order Items
                      </h3>
                      <div className="space-y-3">
                        {selectedOrder.orderItems?.map((item, i) => (
                          <div key={item.id} className="flex items-center justify-between pb-3 border-b border-border last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground">
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                <div>
                                <p className="text-sm font-medium">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <span>np{item.unit_price.toFixed(2)}</span>
                                  <span>•</span>
                                  <span>Qty: {item.quantity}</span>
                                </p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold">
                              np{item.subtotal.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {selectedOrder.coupon && (
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                            Applied Discount
                          </h3>
                          <Badge variant="outline" className="bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                            {selectedOrder.coupon.code}
                          </Badge>
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-400">
                          {selectedOrder.coupon.coupon_type === 'percent' ? (
                            <p>Discount of {selectedOrder.coupon.discount}% applied to order</p>
                          ) : (
                            <p>Fixed discount of np{selectedOrder.coupon.discount} applied to order</p>
                          )}
                          {selectedOrder.discount_amount > 0 && (
                            <p className="font-medium mt-1">Saved amount: np{selectedOrder.discount_amount.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-3">Customer Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {selectedOrder.customer.charAt(0).toUpperCase()}
                            </span>
                    </div>
                    <div>
                            <p className="text-sm font-medium">{selectedOrder.customer}</p>
                            <p className="text-xs text-muted-foreground">{selectedOrder.email}</p>
                    </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                            <p className="text-xs text-muted-foreground">User ID</p>
                            <p className="text-xs font-mono mt-0.5">{selectedOrder.user_id}</p>
                    </div>
                    <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-xs mt-0.5">{selectedOrder.phone_number || "Not provided"}</p>
                          </div>
                    </div>
                  </div>
                </div>
                
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-3">Delivery Information</h3>
                  {selectedOrder.delivery_address ? (
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <TruckIcon className="h-4 w-4 text-green-500" />
                      </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="h-5 px-1.5 text-xs">
                                  {selectedOrder.delivery_address.type}
                                </Badge>
                                <p className="text-sm font-medium">{selectedOrder.delivery_address.address}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                        {selectedOrder.delivery_address.area}, {selectedOrder.delivery_address.city}
                      </p>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <p className="text-xs text-muted-foreground">Delivery Fee</p>
                            <p className="text-sm font-medium mt-0.5">np{selectedOrder.delivery_fee.toFixed(2)}</p>
                          </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No address information available</p>
                  )}
                </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>np{(selectedOrder.total_amount - selectedOrder.delivery_fee).toFixed(2)}</span>
                  </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>np{selectedOrder.delivery_fee.toFixed(2)}</span>
                  </div>
                          {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-np{selectedOrder.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total</span>
                      <span>{selectedOrder.displayTotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter className="border-t border-border pt-4 mt-4">
            <div className="flex justify-between w-full gap-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`#order-invoice-${selectedOrder?.id}`} target="_blank">
                    <Download className="h-4 w-4 mr-1" />
                    Invoice
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => {
                  setViewOrderDialog(false);
                  if (selectedOrder) {
                    handleDeleteOrder(selectedOrder);
                  }
                }}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setViewOrderDialog(false)}>
                  Close
                </Button>
            <Button onClick={() => {
              setViewOrderDialog(false);
              if (selectedOrder) {
                handleEditOrder(selectedOrder);
              }
                }}>
                  Edit Status
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Status Dialog */}
      <Dialog open={editOrderDialog} onOpenChange={setEditOrderDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of order #{selectedOrder?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="flex gap-3 items-center mb-4 bg-muted/50 p-3 rounded-md">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Current Status</span>
                <Badge 
                  className={`mt-1 ${statusColors[selectedOrder.status] || ""}`}
                  variant="outline"
                >
                  {selectedOrder.status}
                </Badge>
              </div>
              <div className="text-muted-foreground">→</div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">New Status</span>
                <div className="h-6 mt-1">
                  {statusForm.watch("status") ? (
                    <Badge 
                      className={`${statusColors[statusForm.watch("status").charAt(0).toUpperCase() + statusForm.watch("status").slice(1)] || ""}`}
                      variant="outline"
                    >
                      {statusForm.watch("status").charAt(0).toUpperCase() + statusForm.watch("status").slice(1)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Select a status</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(handleUpdateOrderStatus)} className="space-y-6">
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || undefined}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORDER_STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value} className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              {status.value === 'pending' && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                              {status.value === 'processing' && <RefreshCw className="h-3.5 w-3.5 text-blue-500" />}
                              {status.value === 'shipped' && <TruckIcon className="h-3.5 w-3.5 text-indigo-500" />}
                              {status.value === 'delivered' && <PackageCheck className="h-3.5 w-3.5 text-green-500" />}
                              {status.value === 'cancelled' && <Ban className="h-3.5 w-3.5 text-red-500" />}
                            {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status descriptions to help admin understand what each status means */}
              <div className="bg-muted/30 p-3 rounded text-xs text-muted-foreground space-y-2">
                <h4 className="font-medium text-foreground text-sm">Status Information</h4>
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span><strong>Pending</strong>: Order has been received but not yet processed</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                  <span><strong>Processing</strong>: Order has been processed and is being prepared</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <TruckIcon className="h-3.5 w-3.5 text-indigo-500" />
                  <span><strong>Shipped</strong>: Order has been shipped and is on the way</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <PackageCheck className="h-3.5 w-3.5 text-green-500" />
                  <span><strong>Delivered</strong>: Order has been delivered to the customer</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Ban className="h-3.5 w-3.5 text-red-500" />
                  <span><strong>Cancelled</strong>: Order has been cancelled</span>
                </p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditOrderDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={isProcessing || !statusForm.watch("status")}>
                  {isProcessing ? 'Updating...' : 'Update Status'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete order #{selectedOrder?.id.substring(0, 8)} and all its items.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Action Dialog */}
      <Dialog open={batchActionDialogOpen} onOpenChange={setBatchActionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Batch Actions</DialogTitle>
            <DialogDescription>
              Apply actions to {selectedOrders.length} selected orders
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Update Status</h3>
              <div className="flex gap-2">
                <Select 
                  value={batchStatus || undefined} 
                  onValueChange={setBatchStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          {status.value === 'pending' && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                          {status.value === 'processing' && <RefreshCw className="h-3.5 w-3.5 text-blue-500" />}
                          {status.value === 'shipped' && <TruckIcon className="h-3.5 w-3.5 text-indigo-500" />}
                          {status.value === 'delivered' && <PackageCheck className="h-3.5 w-3.5 text-green-500" />}
                          {status.value === 'cancelled' && <Ban className="h-3.5 w-3.5 text-red-500" />}
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBatchStatusUpdate} 
                  disabled={!batchStatus || batchProcessing}
                >
                  {batchProcessing ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-destructive">Delete Orders</h3>
              <p className="text-sm text-muted-foreground">
                This will permanently delete all selected orders. This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleBatchDelete}
                disabled={batchProcessing}
              >
                {batchProcessing ? 'Deleting...' : `Delete ${selectedOrders.length} Orders`}
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

export default Orders;
