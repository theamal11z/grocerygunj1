import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ticket, X, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useOffers } from '@/hooks/useOffers';
import { useCart } from '@/hooks/useCart';

const { width } = Dimensions.get('window');

interface OfferBannerProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function OfferBanner({ onClose, showCloseButton = true }: OfferBannerProps) {
  const { offers, loading } = useOffers();
  const { appliedCoupon } = useCart();
  const [isClosed, setIsClosed] = useState(false);
  
  // Don't show if already closed, loading, or no offers
  if (isClosed || loading || !offers || offers.length === 0) {
    return null;
  }
  
  // Get the first valid offer to display
  const offerToShow = offers[0];
  
  // Don't show if a coupon is already applied
  if (appliedCoupon) {
    return null;
  }
  
  const handleClose = () => {
    setIsClosed(true);
    if (onClose) {
      onClose();
    }
  };
  
  const handlePress = () => {
    router.push('/offers');
  };
  
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#FF3B30', '#FF9500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        <View style={styles.content}>
          <Ticket size={18} color="#fff" />
          <Text style={styles.text}>
            <Text style={styles.bold}>{offerToShow.code}</Text>: {offerToShow.title}
          </Text>
          <ChevronRight size={18} color="#fff" style={styles.chevron} />
        </View>
        
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <X size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  bold: {
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
  },
}); 