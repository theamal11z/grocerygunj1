import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  ShoppingBag, 
  Calendar, 
  Truck, 
  CreditCard, 
  Package, 
  Eye,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  product_name?: string;
  product_image?: string;
};

// Define the data we need for our order history component
interface OrderWithItems extends Order {
  items: OrderItem[];
  coupon_code?: string;
  coupon_discount?: string;
}

interface UserOrderHistoryProps {
  userId: string;
}

export const UserOrderHistory = ({ userId }: UserOrderHistoryProps) => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  useEffect(() => {
    fetchUserOrders();
  }, [userId]);
  
  const fetchUserOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch orders for this user
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }
      
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(ordersData.map(async (order) => {
        // Get order items
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*, products(name, image_urls)')
          .eq('order_id', order.id);
        
        if (itemsError) throw itemsError;
        
        // Get coupon info if present
        let couponCode = undefined;
        let couponDiscount = undefined;
        
        if (order.applied_coupon_id) {
          const { data: couponData, error: couponError } = await supabase
            .from('offers')
            .select('code, discount')
            .eq('id', order.applied_coupon_id)
            .single();
          
          if (!couponError && couponData) {
            couponCode = couponData.code;
            couponDiscount = couponData.discount;
          }
        }
        
        // Format the items with product info
        const formattedItems = itemsData?.map(item => ({
          ...item,
          product_name: item.products?.name,
          product_image: item.products?.image_urls?.[0]
        })) || [];
        
        return {
          ...order,
          items: formattedItems,
          coupon_code: couponCode,
          coupon_discount: couponDiscount
        };
      }));
      
      setOrders(ordersWithItems);
    } catch (err: any) {
      console.error("Error fetching user orders:", err);
      setError(err.message || "Failed to load order history");
    } finally {
      setLoading(false);
    }
  };
  
  // Get status badge styling based on order status
  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { color: string, icon: JSX.Element }> = {
      'pending': { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500', 
        icon: <Clock className="h-3.5 w-3.5 mr-1" />
      },
      'processing': { 
        color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-500', 
        icon: <RefreshCw className="h-3.5 w-3.5 mr-1" /> 
      },
      'shipped': { 
        color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-500', 
        icon: <Truck className="h-3.5 w-3.5 mr-1" /> 
      },
      'delivered': { 
        color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-500', 
        icon: <CheckCircle className="h-3.5 w-3.5 mr-1" /> 
      },
      'cancelled': { 
        color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-500', 
        icon: <XCircle className="h-3.5 w-3.5 mr-1" /> 
      },
    };
    
    const style = statusStyles[status] || statusStyles.pending;
    
    return (
      <Badge variant="outline" className={cn("px-2.5 py-0.5 capitalize flex items-center", style.color)}>
        {style.icon}
        {status}
      </Badge>
    );
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), 'PP');
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Show order details dialog
  const showOrderDetails = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };
  
  // Filter orders by status
  const filteredOrders = activeFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === activeFilter);
  
  // Render loading skeletons
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  // Show error message if there's an error
  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Loading Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={fetchUserOrders}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state if no orders
  if (orders.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 space-y-2">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-medium">No Orders Yet</h3>
          <p className="text-sm text-muted-foreground">This user hasn't placed any orders yet.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex justify-between items-center">
        <Tabs 
          value={activeFilter} 
          onValueChange={setActiveFilter}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-4"
          onClick={fetchUserOrders}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Order list */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-4 space-y-2">
              <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <h3 className="font-medium">No {activeFilter !== 'all' ? activeFilter : ''} Orders Found</h3>
              <p className="text-sm text-muted-foreground">
                {activeFilter !== 'all' 
                  ? `This user doesn't have any orders with status "${activeFilter}".` 
                  : 'This user hasn\'t placed any orders yet.'}
              </p>
              {activeFilter !== 'all' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setActiveFilter('all')}
                >
                  Show All Orders
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredOrders.map(order => (
            <Card key={order.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Order #{order.id.substring(0, 8)}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(order.created_at)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex justify-between mb-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Items:</span>{' '}
                    <span className="font-medium">{order.items.length}</span>
                  </div>
                  <div className="text-sm font-medium">
                    <span className="text-muted-foreground mr-1">Total:</span>
                    np{order.total_amount.toFixed(2)}
                  </div>
                </div>
                
                {/* Preview of items */}
                <div className="flex flex-wrap gap-2 mb-1">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 bg-muted/50 rounded-md py-1 px-2 text-sm">
                      {item.product_image ? (
                        <img 
                          src={item.product_image} 
                          alt={item.product_name || 'Product'} 
                          className="w-6 h-6 rounded-sm object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="truncate max-w-[140px]">
                        {item.product_name || 'Product'} x {item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-xs bg-muted/50 rounded-md py-1 px-2 flex items-center">
                      +{order.items.length - 3} more
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between border-t mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5" />
                  {order.payment_method || 'Cash on Delivery'}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1.5"
                  onClick={() => showOrderDetails(order)}
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Order details dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <div className="flex flex-wrap gap-2 items-center mt-1">
                  <span>Order #{selectedOrder.id.substring(0, 8)}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{formatDate(selectedOrder.created_at)}</span>
                  <span className="text-muted-foreground">•</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 mt-2">
              {/* Order summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Package className="h-4 w-4" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Order ID:</span>
                        <span className="font-mono">{selectedOrder.id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date Placed:</span>
                        <span>{formatDate(selectedOrder.created_at)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span>{selectedOrder.payment_method || 'Cash on Delivery'}</span>
                      </div>
                      {selectedOrder.coupon_code && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Coupon Applied:</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {selectedOrder.coupon_code} ({selectedOrder.coupon_discount})
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Truck className="h-4 w-4" />
                      Shipping Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    {selectedOrder.shipping_address ? (
                      <div className="space-y-3 text-sm">
                        {Object.entries(selectedOrder.shipping_address as Record<string, any>).map(([key, value]) => (
                          <div className="flex justify-between" key={key}>
                            <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">No shipping address provided</div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Order items */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="flex items-center gap-2">
                            {item.product_image ? (
                              <img 
                                src={item.product_image} 
                                alt={item.product_name || 'Product'} 
                                className="w-8 h-8 rounded-sm object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <span>{item.product_name || 'Product'}</span>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">np{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">
                            np{(item.quantity * item.price).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2 ml-auto w-full max-w-[240px]">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>
                        np{selectedOrder.items.reduce((sum, item) => 
                          sum + (item.quantity * item.price), 0).toFixed(2)}
                      </span>
                    </div>
                    {selectedOrder.coupon_code && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount ({selectedOrder.coupon_code}):</span>
                        <span className="text-green-600">-np{
                          (selectedOrder.items.reduce((sum, item) => 
                            sum + (item.quantity * item.price), 0) - selectedOrder.total_amount).toFixed(2)
                        }</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-medium">
                      <span>Total:</span>
                      <span>np{selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Download className="h-4 w-4" />
                          Invoice
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download invoice (coming soon)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
              
              {/* Order timeline/activity - could add if needed */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 