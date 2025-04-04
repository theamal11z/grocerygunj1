import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface SuccessAnimationProps {
  visible: boolean;
}

const SuccessAnimation = ({ visible }: SuccessAnimationProps) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade">
      <View style={styles.container}>
        <Animated.View 
          entering={FadeInUp.duration(500)} 
          style={styles.content}>
          <View style={styles.iconContainer}>
            <CheckCircle size={60} color="#fff" />
          </View>
          <Text style={styles.title}>Order Placed!</Text>
          <Text style={styles.message}>Your order has been placed successfully and is being processed.</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#2ECC71',
    borderRadius: 30,
    padding: 10,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginTop: 12,
  },
  message: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default SuccessAnimation; 