import { 
  Eye, 
  Pencil, 
  Trash2, 
  Plus, 
  Download,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  UserX,
  Calendar,
  MapPin,
  Clipboard,
  Search,
  X,
  Save,
  ExternalLink,
  User,
  ShoppingBag,
  Wallet,
  Clock,
  Users as UsersIcon,
  CreditCard,
  BarChart4,
  Award,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/DataContext";
import { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/lib/database.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { UserDetail } from "@/components/users/UserDetail";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Define profile type
type Profile = Database['public']['Tables']['profiles']['Row'] & {
  // Add role and other missing fields needed for the app
  role?: string;
  phone_number?: string;
  notes?: string;
  address_count?: number;
};

// Enhanced profile with additional calculated fields
interface EnhancedProfile extends Profile {
  timeAgo: string;
  addressCount?: number;
  orderCount?: number;
  totalSpent?: number;
  last_order_date?: string;
  status?: 'active' | 'inactive' | 'new';
  actions?: any; // Added for table column
}

// Default new user
const emptyUser: Partial<Profile> = {
  full_name: '',
  email: '',
  phone_number: '',
  phone: '',
  role: 'customer',
  avatar_url: '',
  notes: ''
};

// Users columns
const userColumns = [
  {
    header: "User",
    accessorKey: "full_name" as const,
    cell: (info: any) => {
      const user: EnhancedProfile = info.row.original;
      const avatarUrl = user.avatar_url || undefined;
      
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={user.full_name || "User"} 
                className="h-full w-full object-cover" 
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/40";
                }}
              />
            ) : (
              <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
          </div>
          <div>
            <div className="font-medium">{user.full_name || "Unknown User"}</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                    <Clipboard className="h-3 w-3" />
                    {user.id.substring(0, 10)}...
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{user.id}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      );
    }
  },
  {
    header: "Contact",
    accessorKey: "email" as const,
    cell: (info: any) => {
      const user: EnhancedProfile = info.row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{user.email || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{user.phone_number || "N/A"}</span>
          </div>
        </div>
      );
    }
  },
  {
    header: "Role",
    accessorKey: "role" as const,
    cell: (info: any) => {
      const user: EnhancedProfile = info.row.original;
      const role = user.role || "User";
      const roleColors: Record<string, string> = {
        "admin": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        "manager": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        "staff": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        "customer": "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
        "user": "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
      };
      
      const roleIcons: Record<string, JSX.Element> = {
        "admin": <ShieldCheck className="h-3.5 w-3.5 mr-1" />,
        "manager": <UserCheck className="h-3.5 w-3.5 mr-1" />,
        "staff": <UserCheck className="h-3.5 w-3.5 mr-1" />,
        "customer": <UserX className="h-3.5 w-3.5 mr-1" />,
        "user": <UserX className="h-3.5 w-3.5 mr-1" />,
      };
      
      const colorClass = roleColors[role.toLowerCase()] || roleColors.user;
      const icon = roleIcons[role.toLowerCase()] || null;
      
      return (
        <Badge variant="outline" className={`px-2 py-1 ${colorClass} flex items-center`}>
          {icon}
          {role}
        </Badge>
      );
    }
  },
  {
    header: "Activity",
    accessorKey: "timeAgo" as const,
    cell: (info: any) => {
      const user: EnhancedProfile = info.row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Active {user.timeAgo}</span>
          </div>
          {user.orderCount !== undefined && (
            <div className="text-xs text-muted-foreground">
              {user.orderCount} orders · np{user.totalSpent?.toFixed(2) || "0.00"} spent
            </div>
          )}
        </div>
      );
    }
  },
  {
    header: "Created At",
    accessorKey: "created_at" as const,
    cell: (info: any) => {
      const user: EnhancedProfile = info.row.original;
      try {
        return format(new Date(user.created_at), 'yyyy-MM-dd');
      } catch (e) {
        return "Unknown";
      }
    }
  }
];

// User Form Component (used for both add and edit)
const UserForm = ({
  user,
  onSubmit,
  isLoading
}: {
  user: Partial<Profile>;
  onSubmit: (data: Partial<Profile>) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<Partial<Profile>>(user);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle avatar URL change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, avatar_url: url }));
    setAvatarPreview(url);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    // Phone validation (optional field)
    if (formData.phone_number && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone_number)) {
      errors.phone_number = "Please enter a valid phone number";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Test avatar URL
  const testAvatarUrl = () => {
    if (!formData.avatar_url) return;
    
    const img = new Image();
    img.onload = () => {
      toast({
        title: "Avatar URL is valid",
        description: "The image loaded successfully.",
      });
    };
    img.onerror = () => {
      toast({
        variant: "destructive",
        title: "Invalid image URL",
        description: "The URL does not point to a valid image.",
      });
    };
    img.src = formData.avatar_url;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="basic" className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span>Account Settings</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          {/* Avatar preview and URL */}
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start border rounded-lg p-4 bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-background border flex items-center justify-center">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="h-full w-full object-cover"
                    onError={() => {
                      setAvatarPreview(null);
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-medium">
                    {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 w-full sm:w-auto space-y-3">
              <div>
                <Label htmlFor="avatar_url" className="text-sm font-medium">
                  Avatar URL
                </Label>
                <div className="flex mt-1.5 gap-2">
                  <Input
                    id="avatar_url"
                    name="avatar_url"
                    value={formData.avatar_url || ''}
                    onChange={handleAvatarChange}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={testAvatarUrl}
                    disabled={!formData.avatar_url}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Enter a URL for the user's profile image (optional)
                </p>
              </div>
            </div>
          </div>
          
          {/* Name fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="required">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleChange}
                placeholder="Enter full name"
                className={cn(formErrors.full_name && "border-destructive")}
              />
              {formErrors.full_name && (
                <p className="text-xs text-destructive mt-1">{formErrors.full_name}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="required">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={cn(formErrors.email && "border-destructive")}
                  required
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number || ''}
                  onChange={handleChange}
                  placeholder="Enter phone number (optional)"
                  className={cn(formErrors.phone_number && "border-destructive")}
                />
                {formErrors.phone_number && (
                  <p className="text-xs text-destructive mt-1">{formErrors.phone_number}</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select
              name="role"
              value={formData.role || 'customer'}
              onValueChange={(value) => handleChange({ target: { name: 'role', value } } as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.role === 'admin' && "Admins have full access to all features and settings."}
              {formData.role === 'manager' && "Managers can manage products, orders, and customers."}
              {formData.role === 'staff' && "Staff can view and process orders."}
              {formData.role === 'customer' && "Customers can place orders but cannot access the admin dashboard."}
            </p>
          </div>
          
          <div className="space-y-2 mt-4">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Enter any additional notes about this user (optional)"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Internal notes about this user (not visible to the user)
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="mt-6 pt-4 border-t flex items-center justify-end gap-2">
        <DialogClose asChild>
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isLoading} className="gap-1.5">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{user.id ? 'Update' : 'Create'} User</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Enhanced Search component with filters
const UsersSearch = ({ 
  searchQuery, 
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  roles
}: { 
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  roles: string[];
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 rounded-lg bg-card border shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, email, phone..." 
          className="pl-9 pr-9 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchQuery("")}
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="role-filter" className="text-sm whitespace-nowrap">Role:</Label>
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
          >
            <SelectTrigger id="role-filter" className="w-[140px] h-10">
              <SelectValue placeholder="Filter roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.filter(r => r !== 'all').map(role => (
                <SelectItem key={role} value={role} className="capitalize">
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

// Enhanced user statistics component
const UserStats = ({ stats }: { stats: Record<string, number> }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/10 dark:from-primary/10 dark:to-primary/5">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4" />
                Total Users
              </div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </div>
            <div className="ml-auto h-full flex items-center pr-4">
              <div className="h-16 w-16">
                <BarChart4 className="h-8 w-8 text-primary/50" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Active (30d)
              </div>
              <div className="text-3xl font-bold">{stats.active}</div>
            </div>
            <div className="ml-auto h-full flex items-center pr-4">
              <div className="text-xs text-muted-foreground">
                {Math.round((stats.active / stats.total) * 100)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Admins
              </div>
              <div className="text-3xl font-bold">{stats.admins}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4" />
                Staff
              </div>
              <div className="text-3xl font-bold">{stats.staff}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <User className="h-4 w-4" />
                Customers
              </div>
              <div className="text-3xl font-bold">{stats.customers}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4" />
                With Orders
              </div>
              <div className="text-3xl font-bold">{stats.withOrders}</div>
            </div>
            <div className="ml-auto h-full flex items-center pr-4">
              <div className="text-xs text-muted-foreground">
                {Math.round((stats.withOrders / stats.total) * 100)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                Avg. Order
              </div>
              <div className="text-3xl font-bold">np{stats.averageOrderValue.toFixed(0)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Users = () => {
  const { profiles, orders, addresses, loading, error, refreshData } = useData();
  const [enhancedProfiles, setEnhancedProfiles] = useState<EnhancedProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EnhancedProfile[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // User management state
  const [selectedUser, setSelectedUser] = useState<EnhancedProfile | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formUser, setFormUser] = useState<Partial<Profile>>(emptyUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  
  // User statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    staff: 0,
    customers: 0,
    withOrders: 0,
    averageOrderValue: 0,
  });

  // Process user data
  useEffect(() => {
    if (profiles && profiles.length > 0) {
      // Create a map to count orders and total spent by user
      const orderSummaryByUser = orders.reduce((acc, order) => {
        if (!acc[order.user_id]) {
          acc[order.user_id] = {
            orderCount: 0,
            totalSpent: 0,
            lastOrderDate: null,
          };
        }
        acc[order.user_id].orderCount += 1;
        acc[order.user_id].totalSpent += order.total_amount;
        
        // Track the most recent order date
        const orderDate = new Date(order.created_at);
        if (!acc[order.user_id].lastOrderDate || 
            orderDate > new Date(acc[order.user_id].lastOrderDate)) {
          acc[order.user_id].lastOrderDate = order.created_at;
        }
        
        return acc;
      }, {} as Record<string, { 
        orderCount: number, 
        totalSpent: number,
        lastOrderDate: string | null 
      }>);
      
      // Calculate active users (active in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Enhance profiles with calculated fields
      const enhanced = profiles.map(profile => {
        // Calculate last active time
        let timeAgo = "never";
        try {
          timeAgo = formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true });
        } catch (e) {
          console.error("Date parsing error:", e);
        }
        
        // Get order data
        const orderData = orderSummaryByUser[profile.id];
        
        return {
          ...profile,
          timeAgo,
          // Use address_count from the database if it exists, otherwise use 0
          addressCount: profile.address_count || 0,
          orderCount: orderData?.orderCount || 0,
          totalSpent: orderData?.totalSpent || 0,
          last_order_date: orderData?.lastOrderDate || undefined
        };
      });
      
      setEnhancedProfiles(enhanced);
      
      // Calculate user statistics
      const activeUsers = enhanced.filter(user => {
        try {
          return new Date(user.updated_at) >= thirtyDaysAgo;
        } catch {
          return false;
        }
      }).length;
      
      const usersWithOrders = enhanced.filter(user => user.orderCount > 0).length;
      const totalOrderValue = enhanced.reduce((sum, user) => sum + (user.totalSpent || 0), 0);
      const avgOrderValue = usersWithOrders > 0 
        ? totalOrderValue / usersWithOrders 
        : 0;
      
      // Count users by role
      const adminCount = enhanced.filter(user => (user.role || "").toLowerCase() === "admin").length;
      const staffCount = enhanced.filter(user => 
        ["staff", "manager"].includes((user.role || "").toLowerCase())
      ).length;
      const customerCount = enhanced.filter(user => 
        (user.role || "").toLowerCase() === "customer" || !user.role
      ).length;
      
      setStats({
        total: enhanced.length,
        active: activeUsers,
        admins: adminCount,
        staff: staffCount,
        customers: customerCount,
        withOrders: usersWithOrders,
        averageOrderValue: avgOrderValue,
      });
      
      // Apply filters
      let filtered = enhanced;
      
      // Apply role filter
      if (roleFilter !== "all") {
        filtered = filtered.filter(user => 
          (user.role || "user").toLowerCase() === roleFilter.toLowerCase()
        );
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(user => 
          (user.full_name?.toLowerCase().includes(query) || 
           user.email?.toLowerCase().includes(query) ||
           user.phone_number?.toLowerCase().includes(query) ||
           user.id.toLowerCase().includes(query))
        );
      }
      
      setFilteredUsers(filtered);
    } else {
      setEnhancedProfiles([]);
      setFilteredUsers([]);
      setStats({
        total: 0,
        active: 0,
        admins: 0,
        staff: 0,
        customers: 0,
        withOrders: 0,
        averageOrderValue: 0,
      });
    }
  }, [profiles, orders, addresses, roleFilter, searchQuery]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast({
        title: "Data refreshed",
        description: "User data has been updated successfully.",
      });
    } catch (err) {
      console.error("Error refreshing user data:", err);
      toast({
        title: "Refresh failed",
        description: "There was an error refreshing user data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Open view user dialog
  const handleViewUser = (user: EnhancedProfile) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };
  
  // Open add user dialog
  const handleAddUserClick = () => {
    setFormUser(emptyUser);
    setIsAddOpen(true);
  };
  
  // Open edit user dialog
  const handleEditUser = (user: EnhancedProfile) => {
    setSelectedUser(user);
    setFormUser(user);
    setIsEditOpen(true);
  };
  
  // Open delete user dialog
  const handleDeleteUser = (user: EnhancedProfile) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };
  
  // Handle add user submit
  const handleAddUser = async (userData: Partial<Profile>) => {
    setIsSubmitting(true);
    try {
      // Generate UUID for new user
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...userData,
          id: crypto.randomUUID(), // Generate a UUID for the new user
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "User created",
        description: "New user has been successfully created.",
      });
      
      // Refresh data to include new user
      await refreshData();
      setIsAddOpen(false);
    } catch (err: any) {
      console.error("Error adding user:", err);
      toast({
        title: "Error creating user",
        description: err.message || "There was an error creating the user.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle edit user submit
  const handleUpdateUser = async (userData: Partial<Profile>) => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id)
        .select();
      
      if (error) throw error;
      
      toast({
        title: "User updated",
        description: "User details have been successfully updated.",
      });
      
      // Refresh data to reflect changes
      await refreshData();
      setIsEditOpen(false);
    } catch (err: any) {
      console.error("Error updating user:", err);
      toast({
        title: "Error updating user",
        description: err.message || "There was an error updating the user details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle delete user
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
      
      // Refresh data to reflect deletion
      await refreshData();
      setIsDeleteOpen(false);
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast({
        title: "Error deleting user",
        description: err.message || "There was an error deleting the user.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get unique roles for filter
  const uniqueRoles = ["all", ...new Set(enhancedProfiles.map(user => (user.role || "user").toLowerCase()))];
  
  // Add actions column for CRUD operations
  const columnsWithActions = [
    ...userColumns,
    {
      header: "Actions",
      accessorKey: "actions" as const,
      cell: (info: any) => {
        const user: EnhancedProfile = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <button 
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
              onClick={() => handleViewUser(user)}
              title="View user details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button 
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
              onClick={() => handleEditUser(user)}
              title="Edit user"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button 
              className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
              onClick={() => handleDeleteUser(user)}
              title="Delete user"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      }
    }
  ];

  // User card component
  const UserCard = ({ user }: { user: EnhancedProfile }) => {
    const roleColors: Record<string, string> = {
      "admin": "border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/5",
      "manager": "border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/5",
      "staff": "border-green-300 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/5",
      "customer": "border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900/10 dark:to-gray-800/5",
    };
    
    const statusColors: Record<string, string> = {
      "active": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      "inactive": "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
      "new": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    };
    
    // Determine status based on activity and orders
    const userStatus = user.orderCount && user.orderCount > 0 
      ? "active" 
      : user.timeAgo.includes("day") && !user.timeAgo.includes("days") 
        ? "active" 
        : user.timeAgo.includes("hour") || user.timeAgo.includes("minute")
          ? "active"
          : "inactive";

    const lastActive = new Date(user.updated_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    // If account is less than 7 days old
    const isNewAccount = daysDiff < 7;
    const status = isNewAccount ? "new" : userStatus;
    
    const role = (user.role || "customer").toLowerCase();
    const borderClass = roleColors[role] || roleColors.customer;
    const statusClass = statusColors[status] || statusColors.inactive;
    
    return (
      <Card className={`overflow-hidden hover:shadow-md transition-shadow border ${borderClass}`}>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center relative">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name || "User"} 
                    className="h-full w-full object-cover" 
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/40";
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                {status === "active" && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                )}
                {status === "new" && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] font-bold px-1 rounded">NEW</div>
                )}
              </div>
              <div>
                <div className="font-medium">{user.full_name || "Unknown User"}</div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Mail className="h-3 w-3 mr-1 text-muted-foreground/70" />
                  {user.email}
                </div>
              </div>
            </div>
            
            <Badge variant="outline" className={
              "px-2 py-0.5 " + (
                role === "admin" 
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" 
                  : role === "manager" || role === "staff"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
              )
            }>
              {role === "admin" && <ShieldCheck className="h-3 w-3 mr-1" />}
              {(role === "staff" || role === "manager") && <UserCheck className="h-3 w-3 mr-1" />}
              {role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center">
                <Phone className="h-3 w-3 mr-1 text-muted-foreground/70" />
                Phone
              </div>
              <div>{user.phone_number || user.phone || "N/A"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1 text-muted-foreground/70" />
                Last Active
              </div>
              <div className="whitespace-nowrap">{user.timeAgo}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center">
                <ShoppingBag className="h-3 w-3 mr-1 text-muted-foreground/70" />
                Orders
              </div>
              <div>{user.orderCount || 0}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center">
                <Wallet className="h-3 w-3 mr-1 text-muted-foreground/70" />
                Spent
              </div>
              <div>np{user.totalSpent?.toFixed(2) || "0.00"}</div>
            </div>
          </div>

          {user.last_order_date && (
            <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Last order: {format(new Date(user.last_order_date), 'PP')}</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-2 border-t flex justify-between items-center bg-muted/20">
          <Badge variant="outline" className={`${statusClass} h-5 rounded-sm`}>
            {status}
          </Badge>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => handleViewUser(user)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEditUser(user)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => handleDeleteUser(user)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-blur-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions ({filteredUsers.length} of {enhancedProfiles.length} users)
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="bg-muted/50 rounded-md p-1 flex">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('table')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
              </svg>
              Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('grid')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Grid
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
          
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
          
          <Button size="sm" className="gap-1.5" onClick={handleAddUserClick}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      
      {/* User Statistics */}
      <UserStats stats={stats} />
      
      {/* Search and Filters */}
      <UsersSearch 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        roles={uniqueRoles}
      />
      
      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <div>Error loading users: {error}</div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Retrying...</>
            ) : (
              <>Retry</>
            )}
          </Button>
        </div>
      )}
      
      {/* Grid or Table View */}
      {loading || isRefreshing ? (
        <div className="w-full py-12 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary/60" />
          <p>Loading user data...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="w-full py-12 flex flex-col items-center justify-center text-muted-foreground border rounded-lg">
          <UsersIcon className="h-12 w-12 mb-4 text-muted-foreground/60" />
          <p className="text-lg font-medium">No users found</p>
          <p className="text-sm max-w-md text-center mt-1">
            {searchQuery || roleFilter !== 'all' 
              ? 'Try adjusting your filters or search term to find what you\'re looking for.' 
              : 'There are no users in the system yet. Click "Add User" to create the first one.'}
          </p>
          {(searchQuery || roleFilter !== 'all') && (
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <DataTable 
          data={filteredUsers} 
          columns={columnsWithActions}
          searchable={false} // We're implementing our own search
          searchPlaceholder="Search users..."
          loading={loading || isRefreshing}
          pagination={{
            pageSize,
            pageIndex: currentPage,
            onPageChange: setCurrentPage,
            onPageSizeChange: setPageSize,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers
            .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
            .map(user => (
              <UserCard key={user.id} user={user} />
            ))}
        </div>
      )}
      
      {/* Pagination for grid view */}
      {viewMode === 'grid' && filteredUsers.length > pageSize && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(currentPage * pageSize + 1, filteredUsers.length)} to {Math.min((currentPage + 1) * pageSize, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, Math.ceil(filteredUsers.length / pageSize)) }).map((_, i) => {
              // Logic to show pagination numbers around the current page
              let pageNumber: number;
              const totalPages = Math.ceil(filteredUsers.length / pageSize);
              
              if (totalPages <= 5) {
                pageNumber = i;
              } else if (currentPage < 3) {
                pageNumber = i;
              } else if (currentPage > totalPages - 3) {
                pageNumber = totalPages - 5 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              if (pageNumber < 0 || pageNumber >= totalPages) return null;
              
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className="h-8 w-8 p-0"
                >
                  {pageNumber + 1}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={(currentPage + 1) * pageSize >= filteredUsers.length}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* View User Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && <UserDetail user={selectedUser} />}
        </DialogContent>
      </Dialog>
      
      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. All users will need to reset their password on first login.
            </DialogDescription>
          </DialogHeader>
          
          <UserForm 
            user={formUser} 
            onSubmit={handleAddUser} 
            isLoading={isSubmitting} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          
          <UserForm 
            user={formUser} 
            onSubmit={handleUpdateUser} 
            isLoading={isSubmitting} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete User</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
