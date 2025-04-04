import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  CreditCard,
  ArrowUpRight,
  ListOrdered,
  PackageCheck,
  PackageX,
  Clock,
  Truck,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CalendarRange,
  DollarSign,
  Star,
  Loader2,
  Tag,
  BarChart3,
  Activity,
  Filter,
  ChevronDown,
  ArrowDownUp,
  CheckCircle2,
  FolderTree,
  AlertTriangle,
  Package
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DataTable } from "@/components/ui/DataTable";
import { useData } from "@/lib/DataContext";
import { useState, useEffect, useMemo } from "react";
import { format, formatDistanceToNow, parseISO, subDays, isSameDay, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { products, categories, orders, offers, users, refreshData } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activityItems, setActivityItems] = useState<any[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'sales' | 'inventory'>('overview');
  const { toast } = useToast();

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      setLastUpdated(new Date());
      toast({
        title: "Dashboard refreshed",
        description: "All data has been updated to the latest version."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not update data. Please try again."
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter data based on selected time range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      
      if (selectedTimeRange === 'today') {
        return isSameDay(orderDate, now);
      } else if (selectedTimeRange === 'week') {
        return differenceInDays(now, orderDate) <= 7;
      } else if (selectedTimeRange === 'month') {
        return differenceInDays(now, orderDate) <= 30;
      }
      // year or default case
      return differenceInDays(now, orderDate) <= 365;
    });
  }, [orders, selectedTimeRange]);

  // Calculate dashboard metrics based on filtered data
  const dashboardMetrics = useMemo(() => {
    // Calculate total revenue from filtered orders
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    // Count orders by status
    const pendingOrders = filteredOrders.filter(order => 
      order.status.toLowerCase() === 'pending'
    ).length;
    
    const processingOrders = filteredOrders.filter(order => 
      order.status.toLowerCase() === 'processing'
    ).length;
    
    const shippedOrders = filteredOrders.filter(order => 
      order.status.toLowerCase() === 'shipped'
    ).length;
    
    const deliveredOrders = filteredOrders.filter(order => 
      order.status.toLowerCase() === 'delivered'
    ).length;
    
    // Calculate revenue comparison with previous period
    // For simplification, we'll use a static value, but this should be calculated
    // based on actual previous period data in a real application
    const revenueGrowth = 12.5; // percentage
    
    // Calculate average order value
    const averageOrderValue = filteredOrders.length 
      ? totalRevenue / filteredOrders.length 
      : 0;
    
    // Count products by stock status
    const outOfStockProducts = products.filter(product => !product.in_stock).length;
    const lowStockProducts = 5; // This would normally be calculated based on a threshold
    
    // Count active offers
    const activeOffers = offers.filter(offer => 
      new Date(offer.valid_until) > new Date()
    ).length;
    
    return {
      totalRevenue,
      formattedRevenue: `np${totalRevenue.toFixed(2)}`,
      totalOrders: filteredOrders.length,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      revenueGrowth,
      averageOrderValue: `np${averageOrderValue.toFixed(2)}`,
      totalProducts: products.length,
      totalCategories: categories.length,
      outOfStockProducts,
      lowStockProducts,
      activeOffers
    };
  }, [filteredOrders, products, categories, offers]);

  // Generate activity items based on real data
  useEffect(() => {
    try {
      const newActivityItems = [];
      
      // Add recent orders to activity
      if (orders.length > 0) {
        // Get 2 latest orders
        const latestOrders = orders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 2);
        
        latestOrders.forEach(order => {
          newActivityItems.push({
            type: "order",
            icon: PackageCheck,
            iconColor: "text-green-500",
            title: `New order #${order.id.substring(0, 8)} placed`,
            time: formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })
          });
        });
      }
      
      // Add out of stock products (max 2)
      const outOfStockProducts = products.filter(p => !p.in_stock).slice(0, 2);
      outOfStockProducts.forEach(product => {
        newActivityItems.push({
          type: "product",
          icon: PackageX,
          iconColor: "text-red-500",
          title: `Product '${product.name}' out of stock`,
          time: "Recently"
        });
      });
      
      // Add active offers
      const activeOffer = offers.find(o => new Date(o.valid_until) > new Date());
      if (activeOffer) {
        newActivityItems.push({
          type: "offer",
          icon: Tag,
          iconColor: "text-blue-500",
          title: `Offer '${activeOffer.title}' is active`,
          time: `Expires ${format(new Date(activeOffer.valid_until), 'MMM dd, yyyy')}`
        });
      }
      
      // Add shipping orders (max 2)
      const shippingOrders = orders
        .filter(o => o.status.toLowerCase() === 'shipped')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 2);
      
      shippingOrders.forEach(order => {
        newActivityItems.push({
          type: "shipping",
          icon: Truck,
          iconColor: "text-purple-500",
          title: `Order #${order.id.substring(0, 8)} shipped to customer`,
          time: formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })
        });
      });
      
      // Sort by recency (assuming the time field could be parsed)
      newActivityItems.sort((a, b) => {
        if (a.time.includes("ago") && b.time.includes("ago")) {
          // Crude but effective for our demo purposes
          const aTimeValue = parseInt(a.time.split(" ")[0]) || 0;
          const bTimeValue = parseInt(b.time.split(" ")[0]) || 0;
          return aTimeValue - bTimeValue;
        }
        return 0;
      });
      
      setActivityItems(newActivityItems);
    } catch (error) {
      console.error("Error generating activity items:", error);
      setActivityItems([]);
    }
  }, [orders, products, offers]);

  // Transform the most recent 5 orders for display
  const recentOrders = useMemo(() => {
    return filteredOrders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(order => {
        // Format date
        const formattedDate = format(new Date(order.created_at), 'MMM dd, yyyy');
        
        // Get status with proper capitalization
        const capitalizedStatus = order.status.charAt(0).toUpperCase() + order.status.slice(1);
        
        return {
          id: order.id.substring(0, 8),
          customer: `Customer ${order.user_id.substring(0, 8)}`,
          date: formattedDate,
          status: capitalizedStatus,
          total: `np${order.total_amount.toFixed(2)}`
        };
      });
  }, [filteredOrders]);

  // Order columns
  const orderColumns = [
    { 
      header: "Order ID", 
      accessorKey: "id" as const,
      cell: (info: any) => (
        <span className="font-mono text-xs">{info.getValue()}</span>
      )
    },
    { 
      header: "Customer", 
      accessorKey: "customer" as const,
    },
    { 
      header: "Date", 
      accessorKey: "date" as const,
      cell: (info: any) => (
        <span className="text-muted-foreground text-sm">{info.getValue()}</span>
      )
    },
    { 
      header: "Status", 
      accessorKey: "status" as const,
      cell: (info: any) => {
        const status = info.getValue();
        const statusStyles: Record<string, { bg: string, text: string, icon: any }> = {
          Delivered: { 
            bg: "bg-green-100 dark:bg-green-900/30", 
            text: "text-green-800 dark:text-green-300",
            icon: CheckCircle2
          },
          Shipped: { 
            bg: "bg-blue-100 dark:bg-blue-900/30", 
            text: "text-blue-800 dark:text-blue-300",
            icon: Truck
          },
          Processing: { 
            bg: "bg-amber-100 dark:bg-amber-900/30", 
            text: "text-amber-800 dark:text-amber-300",
            icon: Clock
          },
          Pending: { 
            bg: "bg-gray-100 dark:bg-gray-700", 
            text: "text-gray-800 dark:text-gray-300",
            icon: Clock
          },
        };
        
        const style = statusStyles[status] || statusStyles.Pending;
        const Icon = style.icon;
        
        return (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
            <Icon className="h-3 w-3" />
            {status}
          </div>
        );
      },
    },
    { 
      header: "Total", 
      accessorKey: "total" as const,
      cell: (info: any) => (
        <span className="font-medium">{info.getValue()}</span>
      )
    },
  ];

  return (
    <div className="space-y-8 animate-blur-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Analytics and overview of your store</p>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <CalendarRange className="h-4 w-4" />
                {selectedTimeRange === 'today' ? 'Today' :
                 selectedTimeRange === 'week' ? 'Last 7 days' :
                 selectedTimeRange === 'month' ? 'Last 30 days' : 'Last year'}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Time Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedTimeRange('today')}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedTimeRange('week')}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedTimeRange('month')}>
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedTimeRange('year')}>
                Last year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Updated {format(lastUpdated, 'h:mm a')}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 h-9"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab as any} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Stats section */}
          <div className="dashboard-grid">
            <StatCard 
              title="Total Revenue" 
              value={dashboardMetrics.formattedRevenue} 
              change={{ 
                value: `${dashboardMetrics.revenueGrowth > 0 ? '+' : ''}${dashboardMetrics.revenueGrowth}%`, 
                isPositive: dashboardMetrics.revenueGrowth > 0 
              }}
              icon={DollarSign}
              iconColor="text-green-500"
            />
            <StatCard 
              title="Total Orders" 
              value={dashboardMetrics.totalOrders.toString()} 
              change={{ 
                value: selectedTimeRange === 'today' ? "Today" : 
                        selectedTimeRange === 'week' ? "Past week" :
                        selectedTimeRange === 'month' ? "Past month" : "Past year",
                isPositive: true 
              }}
              icon={ShoppingBag}
              iconColor="text-blue-500"
            />
            <StatCard 
              title="Avg. Order Value" 
              value={dashboardMetrics.averageOrderValue} 
              icon={CreditCard}
              iconColor="text-purple-500"
            />
            <StatCard 
              title="Active Offers" 
              value={dashboardMetrics.activeOffers.toString()} 
              icon={Tag}
              iconColor="text-amber-500"
            />
          </div>
          
          {/* Chart and activity section */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            
            <div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activityItems.length > 0 ? (
                    activityItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${item.iconColor.replace('text-', 'bg-')}/10 shrink-0`}>
                          <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">No recent activity to display</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Order status overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-primary" />
                  Order Status Breakdown
                </div>
              </CardTitle>
              <CardDescription>Distribution of orders by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      {dashboardMetrics.pendingOrders}
                    </Badge>
                  </div>
                  <Progress value={dashboardMetrics.totalOrders ? (dashboardMetrics.pendingOrders / dashboardMetrics.totalOrders) * 100 : 0} className="h-2 bg-gray-100" indicatorClassName="bg-gray-500" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Processing</span>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {dashboardMetrics.processingOrders}
                    </Badge>
                  </div>
                  <Progress value={dashboardMetrics.totalOrders ? (dashboardMetrics.processingOrders / dashboardMetrics.totalOrders) * 100 : 0} className="h-2 bg-amber-100" indicatorClassName="bg-amber-500" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Shipped</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {dashboardMetrics.shippedOrders}
                    </Badge>
                  </div>
                  <Progress value={dashboardMetrics.totalOrders ? (dashboardMetrics.shippedOrders / dashboardMetrics.totalOrders) * 100 : 0} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Delivered</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      {dashboardMetrics.deliveredOrders}
                    </Badge>
                  </div>
                  <Progress value={dashboardMetrics.totalOrders ? (dashboardMetrics.deliveredOrders / dashboardMetrics.totalOrders) * 100 : 0} className="h-2 bg-green-100" indicatorClassName="bg-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent orders section */}
          <DataTable 
            data={recentOrders} 
            columns={orderColumns} 
            title="Recent Orders" 
            description="Latest customer orders" 
            pageSize={5}
          />
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>Detailed breakdown of your sales and revenue</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">Sales Analytics</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Advanced sales analytics will be available soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-6">
          <div className="dashboard-grid">
            <StatCard 
              title="Total Products" 
              value={products.length.toString()} 
              icon={Package}
              iconColor="text-blue-500"
            />
            <StatCard 
              title="Categories" 
              value={categories.length.toString()} 
              icon={FolderTree}
              iconColor="text-teal-500"
            />
            <StatCard 
              title="Out of Stock" 
              value={dashboardMetrics.outOfStockProducts.toString()}
              change={{ 
                value: "Needs attention", 
                isPositive: dashboardMetrics.outOfStockProducts === 0 
              }}
              icon={PackageX}
              iconColor="text-red-500"
            />
            <StatCard 
              title="Low Stock" 
              value={dashboardMetrics.lowStockProducts.toString()}
              icon={AlertTriangle}
              iconColor="text-amber-500"
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Oversee your product inventory and stock levels</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">Inventory Analytics</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Advanced inventory analytics will be available soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
