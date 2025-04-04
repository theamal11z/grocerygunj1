import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { 
  Tag, 
  ImagePlus, 
  Upload, 
  X, 
  Loader2, 
  ExternalLink, 
  Link as LinkIcon,
  Check,
  AlertCircle,
  Plus
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Database } from "@/lib/database.types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from 'uuid';

// Define types
type Category = Database['public']['Tables']['categories']['Row'] & {
  description?: string | null; // Add description as an optional property
};

// Define the type for saving a category that includes description
type SaveCategoryPayload = Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'> & {
  description?: string | null;
};

// Add Base64 encoding size limit (2MB recommended for database storage)
const MAX_BASE64_SIZE = 2 * 1024 * 1024; // 2MB

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveCategory: (category: SaveCategoryPayload) => Promise<void>;
  category?: Category;
  allCategories?: Category[]; // Added to allow parent category selection
}

// Form validation schema
const formSchema = z.object({
  name: z.string()
    .min(2, { message: "Category name must be at least 2 characters." })
    .max(50, { message: "Category name must be less than 50 characters." }),
  image_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  parent_id: z.string().optional().nullable(),
  updated_at: z.string().optional(),
  description: z.string().optional().nullable() // Added for better category description
});

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  onOpenChange,
  onSaveCategory,
  category,
  allCategories = []
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useBase64, setUseBase64] = useState(true);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  
  // Filter out the current category from parent options to prevent circular references
  const parentOptions = useMemo(() => {
    return allCategories.filter(c => c.id !== category?.id);
  }, [allCategories, category]);

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name ?? "",
      image_url: category?.image_url ?? "",
      parent_id: category?.parent_id ?? null,
      updated_at: new Date().toISOString(),
      description: "" // Initialize with empty string
    }
  });

  // Reset form and states when dialog opens or category changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? "",
        image_url: category?.image_url ?? "",
        parent_id: category?.parent_id ?? null,
        updated_at: new Date().toISOString(),
        description: category?.description ?? ""
      });
      
      setImageFile(null);
      
      if (category?.image_url) {
        setImagePreview(category.image_url);
        
        // Set base64Data if image URL is base64
        if (category.image_url.startsWith('data:image/')) {
          setBase64Data(category.image_url);
          setUseBase64(true);
        } else {
          setBase64Data(null);
          setUseBase64(true); // Default to Base64 for new uploads
        }
      } else {
        setImagePreview(null);
        setBase64Data(null);
      }
      
      // Set appropriate default tab
      setActiveTab("basic");
      setImageUrl('');
      setImageError('');
    }
  }, [open, category, form]);

  // Validate image URL
  const isValidImageUrl = (url: string): boolean => {
    return url.trim() !== '' && 
      (url.startsWith('http://') || url.startsWith('https://'));
  };

  // Handle image URL input change
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setImageError('');
  };

  // Handle URL input enter key
  const handleImageUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddImageUrl();
    }
  };

  // Handle add image URL
  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      setImageError('Image URL cannot be empty');
      return;
    }
    
    if (!isValidImageUrl(imageUrl)) {
      setImageError('Please enter a valid URL (starting with http:// or https://)');
      return;
    }
    
    handleUrlChange(imageUrl);
    setImageUrl('');
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Process uploaded file
  const processFile = (file: File) => {
    if (!file) return;
      
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image."
      });
      return;
    }
    
    // Validate file size 
    const MAX_SIZE = useBase64 ? MAX_BASE64_SIZE : 5 * 1024 * 1024; // 2MB for Base64, 5MB otherwise
    if (file.size > MAX_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `Maximum file size is ${MAX_SIZE/1024/1024}MB.`
      });
      return;
    }
    
    setImageFile(file);
      
    // If using Base64, convert and set directly
    if (useBase64) {
      convertToBase64(file);
    } else {
      // Create a URL for the file preview only
      const fileURL = URL.createObjectURL(file);
      setImagePreview(fileURL);
      // Clear any URL input
      form.setValue("image_url", "");
    }
  };

  // Handle base64 upload
  const handleBase64Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Invalid file type. Please upload JPEG, PNG, WebP, or GIF images only.');
      return;
    }
    
    // Validate file size (max 2MB for Base64 to avoid database issues)
    if (file.size > MAX_BASE64_SIZE) {
      setImageError(`File too large. Maximum size is ${MAX_BASE64_SIZE/1024/1024}MB for Base64 encoding.`);
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(10);
      
      console.log('Starting Base64 encoding for:', file.name);
      console.log('File size:', Math.round(file.size / 1024), 'KB');
      
      // Read the file as Base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          if (e.target?.result) {
            // Result contains the Base64 data URL
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };
        
        // Read file as data URL (includes Base64 data)
        reader.readAsDataURL(file);
      });
      
      setUploadProgress(90);
      console.log('Base64 encoding complete. Length:', base64Image.length);
      
      // Set the base64 data
      setBase64Data(base64Image);
      setImagePreview(base64Image);
      form.setValue("image_url", "");
      
      setUploadProgress(100);
      toast.success('Image encoded successfully');
      
    } catch (error) {
      console.error('Error processing image:', error);
      let errorMessage = 'Failed to process image.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setImageError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      event.target.value = '';
    }
  };

  // Combined file upload handler
  const handleFileUploadSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (useBase64) {
      handleBase64Upload(event);
    } else {
      handleFileChange(event);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (useBase64) {
        processFile(e.dataTransfer.files[0]);
      } else {
        processFile(e.dataTransfer.files[0]);
      }
    }
  };

  // Convert file to base64
  const convertToBase64 = (file: File) => {
    setUploading(true);
    setUploadProgress(10);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setUploadProgress(80);
      setBase64Data(reader.result as string);
      setImagePreview(reader.result as string);
      setUploadProgress(100);
      setUploading(false);
      
      toast.success('Image encoded successfully');
    };
    reader.onerror = (error) => {
      console.error('Error converting image to Base64:', error);
      toast({
        variant: "destructive",
        title: "Conversion failed",
        description: "Failed to convert image to Base64 format."
      });
      setUploading(false);
      setUploadProgress(0);
    };
  };

  // Handle URL input change
  const handleUrlChange = (url: string) => {
    form.setValue("image_url", url);
    setImagePreview(url || null);
    setImageFile(null);
    setBase64Data(null);
  };

  // Toggle base64 encoding option
  const handleToggleBase64 = (checked: boolean) => {
    setUseBase64(checked);
    if (checked && imageFile) {
      convertToBase64(imageFile);
    }
  };

  // Clear image selection
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setBase64Data(null);
    form.setValue("image_url", "");
  };

  // Test image URL
  const testImageUrl = () => {
    const url = form.getValues("image_url");
    if (!url) {
      toast({
        variant: "destructive",
        title: "No URL provided",
        description: "Please enter an image URL to test."
      });
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      toast({
        title: "Image loaded successfully",
        description: `${url} (${img.width}×${img.height})`
      });
    };
    img.onerror = () => {
      toast({
        variant: "destructive",
        title: "Invalid image URL",
        description: "The URL provided does not contain a valid image."
      });
    };
    img.src = url;
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      // Determine the image URL to save
      let finalImageUrl = '';
      
      if (base64Data) {
        finalImageUrl = base64Data;
      } else if (values.image_url) {
        finalImageUrl = values.image_url;
      }
      
      // Call the save function with form data
      await onSaveCategory({
        name: values.name,
        image_url: finalImageUrl,
        parent_id: values.parent_id === "none" ? null : values.parent_id,
        updated_at: new Date().toISOString(),
        description: values.description
      });
      
      // Close the dialog on success
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: `Category "${values.name}" has been ${category ? 'updated' : 'created'}.`,
      });
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${category ? 'update' : 'create'} category. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Tag className="h-5 w-5 text-primary" />
            {category ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b">
                <TabsList className="w-full justify-start rounded-none h-12 px-6 bg-transparent">
                  <TabsTrigger value="basic" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="image" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="hierarchy" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                    Hierarchy
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="mt-0 space-y-4">
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter category name" 
                              {...field} 
                              disabled={isLoading}
                              className="focus-visible:ring-primary"
                            />
                          </FormControl>
                          <FormDescription>
                            This name will be displayed to users browsing products.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter category description (optional)" 
                              className="resize-none focus-visible:ring-primary"
                              {...field} 
                              value={field.value || ""}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a brief description of this category.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                {/* Image Tab */}
                <TabsContent value="image" className="mt-0 space-y-6">
                  <Card>
                    <CardContent className="p-4 space-y-4 pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium flex items-center gap-2">
                            <ImagePlus className="h-4 w-4 text-muted-foreground" />
                            Category Image
                          </h3>
                          
                          {/* Clear image button */}
                          {imagePreview && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearImage}
                              disabled={isLoading}
                              className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Clear image
                            </Button>
                          )}
                        </div>

                        {/* Preview area */}
                        <div className="relative">
                          <div 
                            className={cn(
                              "border rounded-lg flex justify-center items-center overflow-hidden transition-all",
                              imagePreview ? "aspect-square max-h-[300px] bg-muted" : "h-[200px] bg-muted",
                              dragActive && "border-primary border-dashed border-2 bg-primary/5"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                          >
                            {imagePreview ? (
                              <img 
                                src={imagePreview} 
                                alt="Category preview" 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  console.error(`Error loading image from URL: ${imagePreview}`);
                                  (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Error+Loading+Image";
                                }}
                              />
                            ) : (
                              <div 
                                className="text-center p-4 flex flex-col items-center gap-2 cursor-pointer"
                                onClick={() => document.getElementById('image-upload')?.click()}
                              >
                                <div className="h-16 w-16 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium">
                                  {dragActive ? "Drop image here" : "No image selected"}
                                </p>
                                <p className="text-xs text-muted-foreground max-w-[250px] text-center">
                                  Drag and drop an image here or click to browse
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Add image section */}
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium">Add Image</Label>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <span>Using {useBase64 ? 'Base64 Encoding' : 'External URL'}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2"
                                onClick={() => setUseBase64(!useBase64)}
                                type="button"
                              >
                                Switch
                              </Button>
                            </div>
                          </div>
                          
                          {useBase64 ? (
                            <div className="flex items-center gap-3">
                              <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileUploadSwitch}
                                className="flex-1"
                                disabled={uploading || isLoading}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('image-upload')?.click()}
                                disabled={uploading || isLoading}
                              >
                                {uploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Input
                                type="url"
                                placeholder="Enter image URL"
                                value={imageUrl}
                                onChange={handleImageUrlChange}
                                onKeyDown={handleImageUrlKeyDown}
                                className="flex-1"
                                disabled={isLoading}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddImageUrl}
                                disabled={!imageUrl.trim() || isLoading}
                              >
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Add URL
                              </Button>
                            </div>
                          )}
                          
                          {imageError && (
                            <div className="text-xs text-destructive mt-1">{imageError}</div>
                          )}
                          
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Base64 info */}
                        {useBase64 && (
                          <div className="mt-4">
                            <Alert variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Base64 encoding stores image data directly in the database.
                                This is useful for small images without external hosting.
                                Maximum size: 2MB.
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Hierarchy Tab */}
                <TabsContent value="hierarchy" className="mt-0 space-y-4">
                  <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a parent category (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Top-level category)</SelectItem>
                            {parentOptions.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Organize categories in a hierarchy. Leave empty for a top-level category.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("parent_id") && form.watch("parent_id") !== "none" && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-sm">
                        This will be a subcategory. Products in subcategories may also appear when browsing the parent category.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </div>
            </Tabs>
            
            <Separator />
            
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {category ? (
                  <span>Last updated: {new Date(category.updated_at || category.created_at).toLocaleDateString()}</span>
                ) : (
                  <span>New category will be created immediately</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading} className="gap-1.5">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {category ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {category ? (
                        <>
                          <Check className="h-4 w-4" />
                          Update Category
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Create Category
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog; 