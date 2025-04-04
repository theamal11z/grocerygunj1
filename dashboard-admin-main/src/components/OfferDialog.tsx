import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Database } from "@/lib/database.types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { XCircle, CalendarIcon, PercentIcon, AlertCircle, RefreshCcw, CoinsIcon, CreditCardIcon, TagIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, addDays, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types
type Offer = Database['public']['Tables']['offers']['Row'];
type OfferInsert = Database['public']['Tables']['offers']['Insert'];

// Initial offer state
const initialOfferState: Partial<Offer> = {
  title: '',
  code: '',
  discount: '',
  description: '',
  image_url: '',
  valid_until: new Date(addDays(new Date(), 30)).toISOString(),
  min_purchase_amount: 0,
  max_discount_amount: null,
  usage_limit: null,
  used_count: 0,
  coupon_type: 'percent',
  applicable_products: null,
  applicable_categories: null
};

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer?: Offer;
  onSave: () => void;
}

const OfferDialog: React.FC<OfferDialogProps> = ({
  open,
  onOpenChange,
  offer,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Offer>>(initialOfferState);
  const [loading, setLoading] = useState(false);
  const [validUntilDate, setValidUntilDate] = useState<Date | undefined>(addDays(new Date(), 30));
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [imageValidating, setImageValidating] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  // Set form data when offer changes (editing mode)
  useEffect(() => {
    if (offer) {
      setFormData(offer);
      setImagePreview(offer.image_url || '');
      
      // Try to parse the valid_until date
      try {
        if (offer.valid_until) {
          const date = parseISO(offer.valid_until);
          if (isValid(date)) {
            setValidUntilDate(date);
          }
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    } else {
      setFormData(initialOfferState);
      setValidUntilDate(addDays(new Date(), 30));
      setImagePreview('');
    }
    
    // Reset errors and connection error when dialog opens/closes
    setErrors({});
    setConnectionError(null);
    setImageUrl('');
    setImageError('');
  }, [offer, open]);

  // Update form data when validUntilDate changes
  useEffect(() => {
    if (validUntilDate) {
      setFormData(prev => ({
        ...prev,
        valid_until: validUntilDate.toISOString()
      }));
    }
  }, [validUntilDate]);

  // Validate form before saving
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.code?.trim()) {
      newErrors.code = 'Offer code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'Code should contain only uppercase letters, numbers, and underscores';
    }
    
    if (!formData.discount?.trim()) {
      newErrors.discount = 'Discount amount is required';
    }
    
    if (!formData.valid_until) {
      newErrors.valid_until = 'Expiration date is required';
    }

    // Validate min_purchase_amount is not negative
    if (formData.min_purchase_amount !== null && formData.min_purchase_amount! < 0) {
      newErrors.min_purchase_amount = 'Minimum purchase amount cannot be negative';
    }

    // Validate max_discount_amount is not negative
    if (formData.max_discount_amount !== null && formData.max_discount_amount! < 0) {
      newErrors.max_discount_amount = 'Maximum discount amount cannot be negative';
    }

    // Validate usage_limit is not negative
    if (formData.usage_limit !== null && formData.usage_limit! < 0) {
      newErrors.usage_limit = 'Usage limit cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate image URL with a fetch request to check if image exists
  const validateImageUrl = useCallback(async (url: string): Promise<boolean> => {
    if (!url.trim()) {
      setImageError('Image URL cannot be empty');
      return false;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setImageError('Please enter a valid URL (starting with http:// or https://)');
      return false;
    }
    
    setImageValidating(true);
    
    try {
      // Attempt to fetch the image to verify it's valid
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        setImageError(`Image could not be loaded (HTTP ${response.status})`);
        return false;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        setImageError('URL does not point to a valid image');
        return false;
      }
      
      // Image is valid
      setImageError('');
      return true;
    } catch (error) {
      console.error('Error validating image URL:', error);
      setImageError('Failed to validate image. Please check the URL and try again.');
      return false;
    } finally {
      setImageValidating(false);
    }
  }, []);

  // Handle input changes
  const handleChange = (field: keyof Offer, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle image URL input
  const handleUpdateImageUrl = async () => {
    if (!imageUrl.trim()) {
      setImageError('Image URL cannot be empty');
      return;
    }
    
    const isValid = await validateImageUrl(imageUrl);
    
    if (isValid) {
      setFormData(prev => ({
        ...prev,
        image_url: imageUrl
      }));
      setImagePreview(imageUrl);
      setImageUrl('');
      toast.success('Image URL updated');
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image_url: null
    }));
    setImagePreview('');
    toast.success('Image removed');
  };

  // Handle image URL input change
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setImageError('');
  };

  // Handle Enter key in image URL input
  const handleImageUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdateImageUrl();
    }
  };

  // Handle saving the offer
  const handleSave = async () => {
    if (!validateForm()) {
      // Show the tab that contains errors
      if (
        errors.title || 
        errors.code || 
        errors.discount || 
        errors.description || 
        errors.valid_until
      ) {
        setActiveTab("basic");
      } else if (
        errors.min_purchase_amount || 
        errors.max_discount_amount || 
        errors.usage_limit || 
        errors.coupon_type
      ) {
        setActiveTab("advanced");
      }
      return;
    }
    
    setLoading(true);
    setConnectionError(null);
    
    try {
      // Prepare the offer data
      const offerData: OfferInsert = {
        title: formData.title!,
        code: formData.code!,
        discount: formData.discount!,
        description: formData.description || null,
        valid_until: formData.valid_until!,
        image_url: formData.image_url || null,
        min_purchase_amount: formData.min_purchase_amount || 0,
        max_discount_amount: formData.max_discount_amount || null,
        usage_limit: formData.usage_limit || null,
        coupon_type: formData.coupon_type || 'percent'
      };
      
      let result;
      
      if (offer?.id) {
        // Update existing offer
        result = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', offer.id);
      } else {
        // Insert new offer
        result = await supabase
          .from('offers')
          .insert(offerData);
      }
      
      const { error } = result;
      
      if (error) {
        console.error('Error saving offer:', error);
        setConnectionError(`Error saving offer: ${error.message}`);
        return;
      }
      
      // Success
      toast.success(offer?.id ? 'Offer updated successfully' : 'New offer created');
      onSave();
      onOpenChange(false);
      
    } catch (err) {
      console.error('Exception saving offer:', err);
      setConnectionError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Image loading fallback handler
  const handleImageLoadError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = "https://placehold.co/300x200?text=Image+Error";
    setImageError('The image could not be loaded. Please check the URL.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{offer ? 'Edit Offer' : 'Create New Offer'}</DialogTitle>
        </DialogHeader>
        
        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 py-4">
            {/* Basic information fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Offer Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">
                  Offer Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code || ''}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  className={errors.code ? 'border-red-500' : ''}
                  placeholder="e.g. SUMMER20"
                />
                {errors.code && (
                  <p className="text-red-500 text-sm">{errors.code}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">
                  Discount Amount <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="discount"
                    value={formData.discount || ''}
                    onChange={(e) => handleChange('discount', e.target.value)}
                    className={cn(
                      errors.discount ? 'border-red-500' : '',
                      'pr-10'
                    )}
                    placeholder="e.g. 20% OFF or ₹100 OFF"
                  />
                  <PercentIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.discount && (
                  <p className="text-red-500 text-sm">{errors.discount}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valid_until">
                  Valid Until <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        errors.valid_until ? "border-red-500" : "",
                        !validUntilDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {validUntilDate ? format(validUntilDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={validUntilDate}
                      onSelect={setValidUntilDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.valid_until && (
                  <p className="text-red-500 text-sm">{errors.valid_until}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Offer Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Describe the offer conditions and any other important details"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Offer Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageError('');
                  }}
                  className={imageError ? 'border-red-500' : ''}
                />
                <Button 
                  type="button" 
                  onClick={handleUpdateImageUrl}
                  variant="outline"
                  disabled={imageValidating || !imageUrl.trim()}
                >
                  {imageValidating ? (
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Update'
                  )}
                </Button>
              </div>
              
              {imageError && (
                <p className="text-red-500 text-sm">{imageError}</p>
              )}
              
              {imagePreview && (
                <div className="mt-4 relative">
                  <img 
                    src={imagePreview} 
                    alt="Offer preview" 
                    className="max-h-40 rounded-md border" 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1"
                    onClick={() => {
                      setImagePreview('');
                      setFormData(prev => ({
                        ...prev,
                        image_url: ''
                      }));
                    }}
                  >
                    <XCircle className="h-4 w-4 text-white" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 py-4">
            {/* Coupon Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="coupon_type">Discount Type</Label>
              <Select
                value={formData.coupon_type || 'percent'}
                onValueChange={(val) => handleChange('coupon_type', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage Discount</SelectItem>
                  <SelectItem value="fixed">Fixed Amount Discount</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                {formData.coupon_type === 'percent' 
                  ? 'Percentage discount applies a % off the order total.' 
                  : 'Fixed amount applies a specific amount off the order total.'}
              </p>
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_purchase_amount">
                  Minimum Purchase Amount (₹)
                </Label>
                <div className="relative">
                  <Input
                    id="min_purchase_amount"
                    type="number"
                    value={formData.min_purchase_amount !== null ? formData.min_purchase_amount : ''}
                    onChange={(e) => handleChange('min_purchase_amount', e.target.value === '' ? null : Number(e.target.value))}
                    className={cn(
                      errors.min_purchase_amount ? 'border-red-500' : '',
                      'pl-10'
                    )}
                    placeholder="0"
                  />
                  <CoinsIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.min_purchase_amount && (
                  <p className="text-red-500 text-sm">{errors.min_purchase_amount}</p>
                )}
                <p className="text-sm text-gray-500">
                  Set 0 for no minimum requirement, or enter an amount customers must spend to use this offer.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_discount_amount">
                  Maximum Discount Amount (₹)
                </Label>
                <div className="relative">
                  <Input
                    id="max_discount_amount"
                    type="number"
                    value={formData.max_discount_amount !== null ? formData.max_discount_amount : ''}
                    onChange={(e) => handleChange('max_discount_amount', e.target.value === '' ? null : Number(e.target.value))}
                    className={cn(
                      errors.max_discount_amount ? 'border-red-500' : '',
                      'pl-10'
                    )}
                    placeholder="No limit"
                  />
                  <CreditCardIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.max_discount_amount && (
                  <p className="text-red-500 text-sm">{errors.max_discount_amount}</p>
                )}
                <p className="text-sm text-gray-500">
                  Leave empty for no maximum, or cap the discount amount for percentage-based discounts.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usage_limit">
                Usage Limit
              </Label>
              <div className="relative">
                <Input
                  id="usage_limit"
                  type="number"
                  value={formData.usage_limit !== null ? formData.usage_limit : ''}
                  onChange={(e) => handleChange('usage_limit', e.target.value === '' ? null : Number(e.target.value))}
                  className={cn(
                    errors.usage_limit ? 'border-red-500' : '',
                    'pl-10'
                  )}
                  placeholder="Unlimited"
                />
                <TagIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.usage_limit && (
                <p className="text-red-500 text-sm">{errors.usage_limit}</p>
              )}
              <p className="text-sm text-gray-500">
                How many times this offer can be used in total. Leave empty for unlimited use.
              </p>
              
              {formData.used_count !== undefined && formData.used_count > 0 && (
                <p className="text-sm font-medium">
                  Current usage: {formData.used_count} {formData.used_count === 1 ? 'time' : 'times'}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            type="button"
            disabled={loading} 
            onClick={handleSave}
          >
            {loading ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                {offer ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              offer ? 'Update Offer' : 'Create Offer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfferDialog; 