import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { Database } from '@/lib/database.types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderStatusUpdateProps {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusUpdate?: (newStatus: OrderStatus) => void;
  className?: string;
}

export function OrderStatusUpdate({
  orderId,
  currentStatus,
  onStatusUpdate,
  className = '',
}: OrderStatusUpdateProps) {
  const [newStatus, setNewStatus] = React.useState<OrderStatus>(currentStatus);
  const { toast } = useToast();

  const {
    updateStatus,
    getStatusColor,
    getStatusIcon,
    getStatusOptions,
    loading: isUpdating,
  } = useOrderStatus({
    onSuccess: (status) => {
      toast({
        title: 'Status Updated',
        description: `Order status has been updated to ${status}.`,
        variant: 'default',
      });
      onStatusUpdate?.(status);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleStatusUpdate = async () => {
    if (newStatus === currentStatus) {
      toast({
        title: 'No Changes',
        description: 'The order status is already set to this value.',
        variant: 'default',
      });
      return;
    }

    try {
      await updateStatus(orderId, newStatus);
    } catch (error) {
      // Error is already handled by the hook
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Badge variant="outline" className={getStatusColor(currentStatus)}>
        <Icon name={getStatusIcon(currentStatus)} className="w-4 h-4 mr-2" />
        {currentStatus}
      </Badge>
      <div className="flex items-center gap-2">
        <Select
          value={newStatus}
          onValueChange={(value: OrderStatus) => setNewStatus(value)}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select new status" />
          </SelectTrigger>
          <SelectContent>
            {getStatusOptions().map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.value === currentStatus}
              >
                <div className="flex items-center gap-2">
                  <Icon name={getStatusIcon(option.value as OrderStatus)} className="w-4 h-4" />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleStatusUpdate}
          disabled={isUpdating || newStatus === currentStatus}
          variant="outline"
        >
          {isUpdating ? (
            <>
              <Icon name="loader-2" className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Icon name="check" className="w-4 h-4 mr-2" />
              Update
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 