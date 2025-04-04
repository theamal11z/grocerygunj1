import React, { useEffect, useState } from 'react';
import { Animated as RNAnimated, ViewStyle } from 'react-native';

interface SkeletonPlaceholderProps {
  style: ViewStyle;
}

const SkeletonPlaceholder = ({ style }: SkeletonPlaceholderProps) => {
  const opacityAnim = useState(new RNAnimated.Value(0.3))[0];
  
  useEffect(() => {
    const animation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    return () => animation.stop();
  }, []);
  
  return (
    <RNAnimated.View 
      style={[
        style, 
        { 
          backgroundColor: '#E0E0E0', 
          borderRadius: 8,
          opacity: opacityAnim
        }
      ]} 
    />
  );
};

export default SkeletonPlaceholder; 