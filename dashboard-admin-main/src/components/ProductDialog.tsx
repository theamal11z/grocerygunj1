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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Database } from "@/lib/database.types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Link, XCircle, Upload, Edit2, Trash, Image, Camera, Loader2, Settings, Check, Tabs2, FileText, Package, CircleDollarSign } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Define types
type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

// CONFIGURATION: Set your bucket name here
// Replace "product_images" with the name of your existing bucket
const STORAGE_BUCKET_NAME = "product_images";

// Add Base64 encoding size limit (2MB recommended for database storage)
const MAX_BASE64_SIZE = 2 * 1024 * 1024; // 2MB

// Initial product state
const initialProductState: Partial<Product> = {
  name: '',
  description: '',
  price: 0,
  category_id: '',
  image_urls: [],
  in_stock: true,
  unit: '',
  discount: 0,
};

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  categories: Category[];
  onSave: () => void;
}

const ProductDialog: React.FC<ProductDialogProps> = ({
  open,
  onOpenChange,
  product,
  categories,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Product>>(initialProductState);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productId, setProductId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [imageEditIndex, setImageEditIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [bucketName, setBucketName] = useState<string>(STORAGE_BUCKET_NAME);
  const [showBucketConfig, setShowBucketConfig] = useState<boolean>(false);
  const [availableBuckets, setAvailableBuckets] = useState<string[]>([]);
  const [useBase64, setUseBase64] = useState<boolean>(true);

  // Load available buckets
  useEffect(() => {
    async function loadBuckets() {
      try {
        const { data, error } = await supabase.storage.listBuckets();
        if (!error && data && data.length > 0) {
          setAvailableBuckets(data.map(b => b.name));
          console.log('Available buckets loaded:', data.map(b => b.name));
        }
      } catch (err) {
        console.error('Error loading buckets:', err);
      }
    }
    
    if (open) {
      loadBuckets();
    }
  }, [open]);

  // Set form data when product changes (editing mode)
  useEffect(() => {
    if (product) {
      setFormData(product);
      setProductId(product.id);
    } else {
      setFormData(initialProductState);
      // Generate a UUID for new products
      setProductId(uuidv4());
    }
    
    // We'll let the user manually test storage access instead of doing it automatically
    // to avoid unnecessary API calls and potential errors on page load
  }, [product]);

  // Display note about the new Base64 approach on component mount
  useEffect(() => {
    if (open) {
      // Removed the toast notification about Base64 mode
    }
  }, [open]);

  // Function to test storage access
  const testStorageAccess = async () => {
    try {
      toast.info(`Testing access to "${bucketName}" storage bucket...`);
      
      // Step 1: First, check if we can list buckets (requires admin privileges)
      const { data: bucketsData, error: bucketsError } = await supabase
        .storage
        .listBuckets();
        
      if (bucketsError) {
        console.log('Cannot list buckets (normal for non-admin users):', bucketsError);
        // We'll continue - this is expected for normal users
      } else {
        console.log('Available buckets:', bucketsData);
        const productBucket = bucketsData?.find(b => b.name === bucketName);
        if (!productBucket) {
          toast.error(`Storage bucket "${bucketName}" not found in available buckets`);
          return;
        }
      }
      
      // Step 2: Try to list files to check permissions
      const { data: fileList, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
        
      if (listError) {
        console.error('Storage access test failed - list error:', listError);
        toast.error(`Storage access error: ${listError.message}`);
        return;
      }
      
      console.log('List access verified. Files found:', fileList?.length || 0);
      
      // Step 3: Try to create a small test file to verify write permissions
      const testContent = 'test';
      const testFile = new Blob([testContent], { type: 'text/plain' });
      const testPath = `test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(testPath, testFile, {
          upsert: true,
          contentType: 'text/plain',
        });
        
      if (uploadError) {
        console.error('Storage upload test failed:', uploadError);
        toast.error(`Upload permissions error: ${uploadError.message}`);
        return;
      }
      
      console.log('Test upload successful:', uploadData);
      
      // Try to get a public URL for the test file
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(testPath);
        
      console.log('Public URL generated:', urlData?.publicUrl);
      
      // Clean up the test file
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([testPath]);
        
      if (deleteError) {
        console.warn('Could not delete test file:', deleteError);
      }
      
      // If we've made it this far, everything is working
      toast.success(`Storage access to "${bucketName}" bucket is working properly!`);
      
    } catch (err) {
      console.error('Storage access test exception:', err);
      toast.error('Storage test failed with an unexpected error. Check console for details.');
    }
  };

  // Function to directly test bucket existence and accessibility
  const directBucketTest = async () => {
    setImageError('');
    toast.info(`Running direct bucket test on "${bucketName}"...`);
    
    try {
      console.log('============ DIRECT BUCKET TEST ============');
      console.log('Testing bucket:', bucketName);
      
      // Step 1: Check authentication status
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('Authentication error:', authError);
        toast.error('Authentication error. Please log in again.');
        return;
      }
      
      console.log('Authentication status: ' + (session ? 'LOGGED IN' : 'NOT LOGGED IN'));
      if (session) {
        console.log('User:', session.user.email);
        console.log('User ID:', session.user.id);
      } else {
        console.log('User is not logged in - this may cause issues if your policies require authentication');
        toast.warning('You are not currently logged in. Some features may be restricted.');
      }
      
      // Step 2: List buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        toast.error(`Cannot list buckets: ${bucketsError.message}`);
        
        // Try to create the bucket anyway since we can't check if it exists
        toast.info('Attempting to create bucket as fallback...');
        await forceCreateBucket();
        return;
      }
      
      console.log('Available buckets:', buckets?.map(b => b.name));
      const targetBucket = buckets?.find(b => b.name === bucketName);
      
      if (!targetBucket) {
        toast.error(`Bucket "${bucketName}" not found in your Supabase project!`);
        console.log('Target bucket not found!');
        
        // Offer to create it immediately
        if (confirm(`Bucket "${bucketName}" not found. Would you like to create it now?`)) {
          await forceCreateBucket();
        } else {
          toast.info('You can create the bucket later using the "Force Create with Policies" button');
        }
        
        return;
      }
      
      console.log('Target bucket found:', targetBucket);
      console.log('Is public:', targetBucket.public);
      
      if (!targetBucket.public) {
        console.warn('WARNING: The bucket is not set to public, images will not be accessible without authentication');
        toast.warning('Bucket is not public - uploaded images may not be visible');
      }
      
      // Step 3: Try to list files to check listing permissions
      console.log('Testing list permissions...');
      const { data: fileList, error: listError } = await supabase.storage
        .from(bucketName)
        .list();
      
      if (listError) {
        console.error('Error listing files:', listError);
        toast.error(`Cannot list files in bucket: ${listError.message}`);
        console.log('This suggests there might be permission issues with SELECT policies');
        
        // Offer to fix permissions
        if (confirm('Permission issue detected. Would you like to try to fix the bucket permissions?')) {
          await forceCreateBucket();
        }
        
        return;
      }
      
      console.log('File listing successful. Found', fileList?.length || 0, 'files');
      
      // Step 4: Try to write a test file
      const testContent = 'test-content';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testPath = `test-${Date.now()}.txt`;
      
      console.log(`Attempting to upload test file to ${bucketName}/${testPath}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(testPath, testBlob, {
          upsert: true,
          contentType: 'text/plain',
        });
      
      if (uploadError) {
        console.error('Test upload failed:', uploadError);
        
        // Check for common error types and provide solutions
        if (uploadError.message.includes('bucket') && uploadError.message.includes('exists')) {
          toast.error(`Bucket issue: ${uploadError.message}. Please create the bucket first.`);
          
          if (confirm('Would you like to create the bucket now?')) {
            await forceCreateBucket();
          }
        } else if (uploadError.message.includes('permission')) {
          toast.error(`Permission denied: ${uploadError.message}. Let's try to fix bucket policies.`);
          
          if (confirm('Would you like to try to fix the bucket permissions?')) {
            await forceCreateBucket();
          }
        } else if (uploadError.message.includes('auth') || uploadError.message.includes('JWT')) {
          toast.error(`Authentication error: ${uploadError.message}. Please try logging in again.`);
        } else {
          toast.error(`Upload test failed: ${uploadError.message}`);
          
          // Generic fix offer
          if (confirm('Would you like to try to fix the bucket configuration?')) {
            await forceCreateBucket();
          }
        }
        
        return;
      }
      
      console.log('Test upload successful:', uploadData);
      
      // Step 5: Try to get a URL for the test file
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(testPath);
      
      console.log('Generated test file URL:', urlData?.publicUrl);
      
      // Step 6: Try to fetch the URL to confirm it's publicly accessible
      try {
        console.log('Testing URL accessibility...');
        
        // Create a promise that will test URL access
        const testUrlAccess = () => {
          return new Promise((resolve, reject) => {
            const testImage = document.createElement('img');
            
            // Set timeout to fail if image doesn't load within 5 seconds
            const timeout = setTimeout(() => {
              reject(new Error('URL access timeout after 5 seconds'));
            }, 5000);
            
            testImage.onload = () => {
              clearTimeout(timeout);
              resolve(true);
            };
            
            testImage.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Failed to load image URL'));
            };
            
            // Add timestamp to prevent caching
            testImage.src = urlData?.publicUrl + '?t=' + new Date().getTime();
          });
        };
        
        await testUrlAccess();
        console.log('URL is publicly accessible');
      } catch (err) {
        console.warn('Warning: URL might not be publicly accessible:', err);
        toast.warning('Generated URL might not be publicly accessible. Check CORS settings.');
      }
      
      // Step 7: Clean up (remove the test file)
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([testPath]);
      
      if (deleteError) {
        console.warn('Could not delete test file:', deleteError);
        toast.warning('Note: Could not delete test file. This suggests delete permissions might be restricted.');
      } else {
        console.log('Test file deleted successfully');
      }
      
      toast.success(`Bucket "${bucketName}" is working correctly! You can now upload images.`);
      
    } catch (err) {
      console.error('Unexpected error during bucket test:', err);
      toast.error('Bucket test failed with an unexpected error. Check console for details.');
      
      // Offer to recreate the bucket
      if (confirm('An unexpected error occurred. Would you like to try recreating the bucket?')) {
        await forceCreateBucket();
      }
    }
  };

  // Validate image URL
  const isValidImageUrl = (url: string): boolean => {
    return url.trim() !== '' && 
      (url.startsWith('http://') || url.startsWith('https://'));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (!formData.unit?.trim()) {
      newErrors.unit = 'Unit is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof Product, value: any) => {
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

  const handleAddImage = () => {
    if (!imageUrl.trim()) {
      setImageError('Image URL cannot be empty');
      return;
    }
    
    if (!isValidImageUrl(imageUrl)) {
      setImageError('Please enter a valid URL (starting with http:// or https://)');
      return;
    }
    
    if (imageEditIndex !== null) {
      // Update existing image
      setFormData(prev => {
        const updatedImages = [...(prev.image_urls || [])];
        updatedImages[imageEditIndex] = imageUrl;
        return {
          ...prev,
          image_urls: updatedImages
        };
      });
      setImageEditIndex(null);
    } else {
      // Add new image
    setFormData(prev => ({
      ...prev,
      image_urls: [...(prev.image_urls || []), imageUrl]
    }));
    }
    
    setImageUrl('');
    setImageError('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: (prev.image_urls || []).filter((_, i) => i !== index)
    }));
    
    // If removing the image being edited, reset edit state
    if (imageEditIndex === index) {
      setImageEditIndex(null);
      setImageUrl('');
    }
  };

  const handleEditImage = (index: number) => {
    const currentUrl = formData.image_urls?.[index] || '';
    setImageUrl(currentUrl);
    setImageEditIndex(index);
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
      handleAddImage();
    }
  };

  // Handle file upload using Base64 encoding (no storage bucket needed)
  const handleBase64Upload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Update form data with new Base64 image
      if (imageEditIndex !== null) {
        // Update existing image
        setFormData(prev => {
          const updatedImages = [...(prev.image_urls || [])];
          updatedImages[imageEditIndex] = base64Image;
          return {
            ...prev,
            image_urls: updatedImages
          };
        });
        setImageEditIndex(null);
      } else {
        // Add new image
        setFormData(prev => ({
          ...prev,
          image_urls: [...(prev.image_urls || []), base64Image]
        }));
      }
      
      setUploadProgress(100);
      toast.success('Image encoded and added successfully');
      
    } catch (error) {
      console.error('Error processing image:', error);
      let errorMessage = 'Failed to process image.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setImageError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      event.target.value = '';
    }
  }, [imageEditIndex]);

  // Original file upload function (kept for reference)
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Invalid file type. Please upload JPEG, PNG, WebP, or GIF images only.');
      return;
    }
    
    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setImageError('File too large. Maximum size is 5MB.');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Display what we're trying to do
      console.log('------ Starting Image Upload ------');
      console.log('Active bucket name:', bucketName);
      console.log('File type:', file.type);
      console.log('File size:', Math.round(file.size / 1024), 'KB');
      console.log('File name:', file.name);
      
      // Check auth status first
      const { data: { session } } = await supabase.auth.getSession();
      console.log('User authenticated:', !!session);
      
      // Ensure we have a product ID for the file path
      const prodId = productId || uuidv4();
      if (!prodId) {
        throw new Error('Failed to generate product ID for image path');
      }
      
      // Generate image index - either use edit index or get new index for the image
      const imageIndex = imageEditIndex !== null 
        ? imageEditIndex 
        : (formData.image_urls?.length || 0);
      
      // Create file path: product_id/index.extension
      // Use simple file naming convention to avoid issues
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const sanitizedExt = fileExt.replace(/[^a-z0-9]/g, ''); // Keep only alphanumeric chars
      const fileName = `${imageIndex}.${sanitizedExt}`;
      const filePath = `${prodId}/${fileName}`;

      console.log('Uploading file to path:', filePath);
      
      // First check if bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        throw new Error(`Cannot access storage buckets: ${bucketError.message}`);
      }
      
      const bucketExists = buckets?.some(b => b.name === bucketName);
      console.log('All available buckets:', buckets?.map(b => b.name).join(', '));
      console.log('Does the bucket exist?', bucketExists ? 'YES' : 'NO');
      
      if (!bucketExists) {
        throw new Error(`Bucket "${bucketName}" does not exist. Available buckets: ${buckets?.map(b => b.name).join(', ')}`);
      }
      
      // Set upload progress to show activity
      setUploadProgress(20);
      
      // Upload to Supabase Storage
      console.log('Starting upload to bucket:', bucketName);
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type, // Set correct content type
          cacheControl: '3600', // Cache for 1 hour
        });
        
      // Log upload progress
      setUploadProgress(80);
      console.log('Upload completed');
      
      if (error) {
        console.error('Storage upload error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Provide more specific error messages based on error type
        if (error.message.includes('JWT')) {
          throw new Error('Authentication error. Please try logging in again.');
        }
        
        if (error.message.includes('permission')) {
          throw new Error('Permission denied. You may not have rights to upload images. Check your bucket policies.');
        }
        
        if (error.message.toLowerCase().includes('not found')) {
          throw new Error(`Storage bucket "${bucketName}" not found. Please check your Supabase configuration.`);
        }
        
        throw error;
      }
      
      if (!data || !data.path) {
        throw new Error('Upload successful but path information is missing');
      }
      
      console.log('Upload successful:', data);
      setUploadProgress(90);
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to generate public URL for uploaded image');
      }
      
      console.log('Generated public URL:', urlData.publicUrl);
      setUploadProgress(100);
      
      // Verify URL is accessible
      try {
        // Create an image element to test loading
        const testImage = document.createElement('img');
        testImage.onload = () => console.log('Image URL is accessible');
        testImage.onerror = () => console.warn('Image URL could not be loaded directly');
        testImage.src = urlData.publicUrl + '?t=' + new Date().getTime(); // Add timestamp to avoid caching
        console.log('Testing image URL access with:', testImage.src);
      } catch (err) {
        // Just log, don't throw since this is just a test
        console.warn('Could not test image URL:', err);
      }
      
      // Update form data with new image URL
      if (imageEditIndex !== null) {
        // Update existing image
        setFormData(prev => {
          const updatedImages = [...(prev.image_urls || [])];
          updatedImages[imageEditIndex] = urlData.publicUrl;
          return {
            ...prev,
            image_urls: updatedImages
          };
        });
        setImageEditIndex(null);
      } else {
        // Add new image
        setFormData(prev => ({
          ...prev,
          image_urls: [...(prev.image_urls || []), urlData.publicUrl]
        }));
      }
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', errorMessage);
      }
      
      setImageError(errorMessage);
      toast.error(errorMessage);
      
      // If the error seems to be bucket-related, automatically show bucket config
      if (errorMessage.toLowerCase().includes('bucket')) {
        setShowBucketConfig(true);
        
        // Try to list buckets again to ensure we have the latest data
        try {
          const { data } = await supabase.storage.listBuckets();
          if (data) {
            setAvailableBuckets(data.map(b => b.name));
          }
        } catch (err) {
          console.error('Error refreshing bucket list:', err);
        }
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      event.target.value = '';
    }
  }, [productId, formData.image_urls, imageEditIndex, bucketName]);

  // Update file upload to use the appropriate method based on user selection
  const handleFileUploadSwitch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (useBase64) {
      handleBase64Upload(event);
    } else {
      handleFileUpload(event);
    }
  }, [useBase64, handleBase64Upload, handleFileUpload]);

  // Function to create a storage bucket
  const createStorageBucket = async () => {
    try {
      toast.info(`Attempting to create storage bucket: "${bucketName}"...`);
      
      // Check if the user has admin privileges
      const { data, error } = await supabase.storage.createBucket(
        bucketName, 
        { public: true } // Make the bucket public so images are accessible
      );
      
      if (error) {
        console.error('Error creating bucket:', error);
        
        if (error.message.includes('permission') || error.message.includes('not allowed')) {
          toast.error('Permission denied. You need admin privileges to create buckets.');
          return;
        }
        
        if (error.message.includes('already exists')) {
          toast.success(`Bucket "${bucketName}" already exists!`);
          return;
        }
        
        toast.error(`Failed to create bucket: ${error.message}`);
        return;
      }
      
      console.log('Bucket created successfully:', data);
      toast.success(`Storage bucket "${bucketName}" created successfully!`);
      
      // Refresh the bucket list
      const { data: bucketsList } = await supabase.storage.listBuckets();
      if (bucketsList) {
        setAvailableBuckets(bucketsList.map(b => b.name));
      }
      
    } catch (err) {
      console.error('Error in createStorageBucket:', err);
      toast.error('Failed to create bucket. Check console for details.');
    }
  };

  // Function to force-create the product_images bucket with all necessary policies
  const forceCreateBucket = async () => {
    try {
      toast.info(`Attempting to fully configure bucket "${bucketName}"...`);
      
      // Step 1: Create the bucket
      const { error: createError } = await supabase.storage.createBucket(
        bucketName, 
        { public: true }
      );
      
      if (createError) {
        // If it already exists, we can continue
        if (!createError.message.includes('already exists')) {
          console.error('Error creating bucket:', createError);
          toast.error(`Failed to create bucket: ${createError.message}`);
          // Continue anyway to try to set policies
        } else {
          console.log('Bucket already exists, continuing to set policies');
          toast.info('Bucket already exists, updating policies...');
        }
      } else {
        toast.success(`Bucket "${bucketName}" created successfully!`);
      }
      
      // Step 2: Try setting policies programmatically using SQL
      console.log('Setting storage bucket policies...');
      
      // Create policies using raw SQL through RPC
      // We'll create a set of universal policies that allow anyone to perform operations
      const { error: policyError } = await supabase.rpc('create_universal_bucket_policies', {
        bucket_name: bucketName
      });
      
      if (policyError) {
        console.error('Error setting policies:', policyError);
        toast.warning('Could not set policies using RPC. Creating special SQL function...');
        
        // If the RPC fails, try to create a function that will set the policies
        const createFunctionSQL = `
          -- Create a function to set universal policies
          CREATE OR REPLACE FUNCTION create_universal_bucket_policies(bucket_name text)
          RETURNS text AS $$
          BEGIN
            -- Drop existing policies for this bucket
            EXECUTE 'DROP POLICY IF EXISTS "Allow public read for ' || bucket_name || '" ON storage.objects';
            EXECUTE 'DROP POLICY IF EXISTS "Allow public insert for ' || bucket_name || '" ON storage.objects';
            EXECUTE 'DROP POLICY IF EXISTS "Allow public update for ' || bucket_name || '" ON storage.objects';
            EXECUTE 'DROP POLICY IF EXISTS "Allow public delete for ' || bucket_name || '" ON storage.objects';
            
            -- Create new permissive policies
            EXECUTE 'CREATE POLICY "Allow public read for ' || bucket_name || '" ON storage.objects 
                    FOR SELECT TO public USING (bucket_id = ''' || bucket_name || ''')';
                    
            EXECUTE 'CREATE POLICY "Allow public insert for ' || bucket_name || '" ON storage.objects 
                    FOR INSERT TO public WITH CHECK (bucket_id = ''' || bucket_name || ''')';
                    
            EXECUTE 'CREATE POLICY "Allow public update for ' || bucket_name || '" ON storage.objects 
                    FOR UPDATE TO public USING (bucket_id = ''' || bucket_name || ''') 
                    WITH CHECK (bucket_id = ''' || bucket_name || ''')';
                    
            EXECUTE 'CREATE POLICY "Allow public delete for ' || bucket_name || '" ON storage.objects 
                    FOR DELETE TO public USING (bucket_id = ''' || bucket_name || ''')';
                    
            RETURN 'Policies created successfully for bucket: ' || bucket_name;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;
        
        // Try to create the function
        const { error: createFnError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
        
        if (createFnError) {
          console.error('Error creating policy function:', createFnError);
          toast.error('Could not create policy function. You may need admin rights.');
        } else {
          // Try to execute the newly created function
          const { data: fnResult, error: fnError } = await supabase.rpc('create_universal_bucket_policies', {
            bucket_name: bucketName
          });
          
          if (fnError) {
            console.error('Error executing policy function:', fnError);
            toast.error('Failed to set bucket policies.');
          } else {
            console.log('Policy function executed:', fnResult);
            toast.success('Bucket policies created successfully!');
          }
        }
      } else {
        toast.success('Bucket policies updated successfully!');
      }
      
      // Step 3: Run a direct test to verify everything works
      await directBucketTest();
      
    } catch (err) {
      console.error('Error in forceCreateBucket:', err);
      toast.error('Failed to fully configure bucket. See console for details.');
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Validate image URLs to ensure they can be saved to the database
      let validatedImageUrls = formData.image_urls || [];
      
      // Filter and validate URLs (including Base64 data)
      const originalLength = validatedImageUrls.length;
      validatedImageUrls = validatedImageUrls.filter(url => {
        // Accept both regular URLs and Base64 data URLs
        return url && (
          url.startsWith('http://') || 
          url.startsWith('https://') ||
          url.startsWith('data:image/')
        );
      });
      
      if (originalLength !== validatedImageUrls.length) {
        toast.warning(`Removed ${originalLength - validatedImageUrls.length} invalid image URLs`);
      }

      // Check if any Base64 images are too large for the database
      // Increase the threshold to 2MB (from 1MB) and only warn if it's extremely large
      const largeBase64Images = validatedImageUrls.filter(url => 
        url.startsWith('data:image/') && url.length > 2000000 // Roughly 2MB in Base64
      );

      if (largeBase64Images.length > 0) {
        // Don't show warning for large images, we've already limited upload size
        console.log(`${largeBase64Images.length} large images detected but within limits`);
      }
      
      const productData: ProductInsert = {
        id: productId || undefined,
        name: formData.name || '',
        description: formData.description,
        price: formData.price || 0,
        category_id: formData.category_id,
        image_urls: validatedImageUrls,
        in_stock: formData.in_stock !== undefined ? formData.in_stock : true,
        unit: formData.unit || '',
        discount: formData.discount,
      };
      
      if (product?.id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
          
        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        // Create new product with the generated UUID
        const { error } = await supabase
          .from('products')
          .insert([productData]);
          
        if (error) throw error;
        toast.success('Product added successfully');
      }
      
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving product:', error);
      let errorMessage = 'Failed to save product';
      
      // Check for specific database errors
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for payload too large error (common with Base64 images)
        if (errorMessage.toLowerCase().includes('payload') && errorMessage.toLowerCase().includes('large')) {
          errorMessage = 'Images are too large for the database. Try using smaller or fewer images.';
        }
        // Look for specific Supabase/Postgres error patterns
        else if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          errorMessage = 'Permission error. You may not have rights to save products.';
        } else if (errorMessage.toLowerCase().includes('network')) {
          errorMessage = 'Network error. Check your internet connection.';
        }
      }
      
      toast.error(errorMessage, {
        description: 'Check browser console for more details'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {product ? `Edit Product: ${product.name}` : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic" className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              <span>Basic Info</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-1.5">
              <CircleDollarSign className="h-4 w-4" />
              <span>Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-1.5">
              <Image className="h-4 w-4" />
              <span>Images</span>
              {formData.image_urls?.length ? (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1">
                  {formData.image_urls.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Product Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <div className="text-xs text-destructive">{errors.name}</div>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Product Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter product description"
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id || ''}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="in-stock"
                      checked={formData.in_stock}
                      onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                    />
                    <Label htmlFor="in-stock" className="cursor-pointer">
                      {formData.in_stock ? "In Stock" : "Out of Stock"}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Price <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">np</span>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        placeholder="0.00"
                        className={`pl-8 ${errors.price ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.price && <div className="text-xs text-destructive">{errors.price}</div>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="unit">
                      Unit <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="unit"
                      value={formData.unit || ''}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g. kg, piece, dozen"
                      className={errors.unit ? "border-destructive" : ""}
                    />
                    {errors.unit && <div className="text-xs text-destructive">{errors.unit}</div>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount || ''}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {formData.price && formData.discount && formData.discount > 0 && (
                  <div className="rounded-md bg-muted p-3 mt-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Original price: </span>
                      <span className="font-medium">np{formData.price.toFixed(2)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">After {formData.discount}% discount: </span>
                      <span className="font-medium text-green-600">
                        np{(formData.price * (1 - formData.discount / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Keep existing image upload functionality */}
                <div className="space-y-4">
                  {/* Add image section - current file input or direct URL input */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Add Image</Label>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <span>Using {useBase64 ? 'Base64 Encoding' : 'External URL'}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                          onClick={() => setUseBase64(!useBase64)}
                        >
                          Switch
                        </Button>
                      </div>
                    </div>
                    
                    {useBase64 ? (
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleBase64Upload}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          disabled={uploading}
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
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddImageUrl}
                          disabled={!imageUrl.trim()}
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Add URL
                        </Button>
                      </div>
                    )}
                    
                    {imageError && (
                      <div className="text-xs text-destructive">{imageError}</div>
                    )}
                  </div>
                  
                  {/* Display existing images */}
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span>Product Images ({formData.image_urls?.length || 0})</span>
                      {formData.image_urls?.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={() => setFormData({ ...formData, image_urls: [] })}
                        >
                          Clear all
                        </Button>
                      )}
                    </Label>
                    
                    {formData.image_urls && formData.image_urls.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {formData.image_urls.map((url, index) => (
                          <div key={index} className="group relative aspect-square rounded-md overflow-hidden border border-border bg-muted">
                            <img
                              src={url}
                              alt={`Product image ${index + 1}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Error";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white text-black hover:bg-white/90"
                                onClick={() => handleEditImage(index)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white text-destructive hover:bg-white/90"
                                onClick={() => handleRemoveImage(index)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                        
                        {/* Add image placeholder */}
                        <button
                          type="button"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                        >
                          <Image className="h-8 w-8" />
                          <span className="text-xs">Add image</span>
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-md border-2 border-dashed p-8 flex flex-col items-center justify-center text-muted-foreground">
                        <Image className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm text-center">No product images added yet</p>
                        <p className="text-xs text-center mt-1">Upload images or add image URLs</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Storage bucket config - keep existing functionality */}
                {showBucketConfig && (
                  <div className="mt-6 space-y-4 border-t pt-4">
                    {/* ... existing bucket configuration ... */}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={() => setShowBucketConfig(!showBucketConfig)}
            type="button"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Storage Settings
          </Button>
          
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={loading}
              onClick={handleSave}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {product ? 'Update' : 'Create'} Product
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog; 