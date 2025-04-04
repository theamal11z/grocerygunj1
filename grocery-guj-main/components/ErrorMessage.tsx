import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginVertical: 8,
  },
  text: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
});