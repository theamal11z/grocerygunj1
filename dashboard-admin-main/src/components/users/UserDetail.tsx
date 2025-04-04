import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Mail, Phone, MapPin, ShoppingBag, User, Shield, Clock, FileEdit, Clipboard, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Database } from "@/lib/database.types";
import { cn } from "@/lib/utils";

// Define profile type
type Profile = Database['public']['Tables']['profiles']['Row'];

// Enhanced profile with additional calculated fields
interface EnhancedProfile extends Profile {
  timeAgo: string;
  addressCount?: number;
  orderCount?: number;
  totalSpent?: number;
  last_order_date?: string;
}

// User detail component for dialog
export const UserDetail = ({ user }: { user: EnhancedProfile }) => {
  // Role badge styling based on role
  const getRoleBadge = (role: string = 'customer') => {
    const roleColors: Record<string, string> = {
      "admin": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/30",
      "manager": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/30",
      "staff": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/30",
      "customer": "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700/50",
    };
    
    return (
      <Badge variant="outline" className={cn("px-2.5 py-0.5 capitalize", roleColors[role.toLowerCase()] || roleColors.customer)}>
        {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
        {role}
      </Badge>
    );
  };

  // Format date with fallback
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), 'PP');
    } catch (e) {
      return "Invalid date";
    }
  };

  // Calculate spending patterns
  const averageOrderValue = user.orderCount && user.totalSpent 
    ? (user.totalSpent / user.orderCount).toFixed(2) 
    : "0.00";

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
      {/* User header with avatar and basic info */}
      <div className="flex items-start gap-4 pb-2">
        <Avatar className="h-20 w-20 border">
          <AvatarImage src={user.avatar_url || ""} alt={user.full_name || "User"} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold">{user.full_name || "Unnamed User"}</h2>
            {getRoleBadge(user.role || 'customer')}
          </div>
          
          <div className="flex items-center text-muted-foreground gap-1.5">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{user.email}</span>
          </div>
          
          {user.phone_number && (
            <div className="flex items-center text-muted-foreground gap-1.5">
              <Phone className="h-4 w-4" />
              <span className="text-sm">{user.phone_number}</span>
            </div>
          )}
          
          <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Active {user.timeAgo}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            <span>Orders ({user.orderCount || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>Addresses</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* User Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="text-2xl font-bold">{user.orderCount || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="text-2xl font-bold">{user.addressCount || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                  <Clipboard className="h-4 w-4 mr-2" />
                  Total Spent
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="text-2xl font-bold">np{user.totalSpent?.toFixed(2) || "0.00"}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* User details */}
          <Card>
            <CardHeader className="py-4 px-6">
              <CardTitle className="text-base">User Information</CardTitle>
            </CardHeader>
            <CardContent className="py-0 px-6">
              <div className="grid grid-cols-2 gap-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">User ID</Label>
                  <div className="flex items-center">
                    <code className="text-xs font-mono bg-muted py-0.5 px-1 rounded">{user.id}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <Clipboard className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Account Status</Label>
                  <div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                      Active
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Created Date</Label>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Last Updated</Label>
                  <div className="flex items-center gap-1.5">
                    <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDate(user.updated_at)}</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-1 pb-4">
                <Label className="text-xs text-muted-foreground">Average Order Value</Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-medium">np{averageOrderValue}</span>
                  {user.last_order_date && (
                    <span className="text-xs text-muted-foreground ml-2">
                      Last order: {formatDate(user.last_order_date)}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {user.orderCount ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order History</CardTitle>
                <CardDescription>
                  Customer has placed {user.orderCount} orders with a total value of np{user.totalSpent?.toFixed(2) || "0.00"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Average Order Value</Label>
                    <div className="text-xl font-bold">np{averageOrderValue}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Last Order</Label>
                    <div>{user.last_order_date ? formatDate(user.last_order_date) : "N/A"}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-4">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  <span>View Order History</span>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="text-center py-8 space-y-2">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="font-medium">No Orders Yet</h3>
                <p className="text-sm text-muted-foreground">This user hasn't placed any orders yet.</p>
              </div>
            </Card>
          )}
        </TabsContent>
        
        {/* Addresses Tab */}
        <TabsContent value="addresses">
          {user.addressCount ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saved Addresses</CardTitle>
                <CardDescription>
                  Customer has {user.addressCount} saved delivery addresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* We don't have the actual addresses so we show a placeholder */}
                  <div className="bg-muted/50 p-3 rounded-md border">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">Primary Address</div>
                        <div className="text-sm text-muted-foreground">Address details would be shown here</div>
                      </div>
                      <Badge>Default</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-4">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  <span>Manage Addresses</span>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="text-center py-8 space-y-2">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="font-medium">No Addresses</h3>
                <p className="text-sm text-muted-foreground">This user hasn't added any delivery addresses yet.</p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 