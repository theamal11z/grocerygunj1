import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Mail, ChevronLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Define colors directly since we don't have access to the Colors constant
const COLORS = {
  primary: '#10b981', // emerald-500
  lightGreen: '#d1fae5', // emerald-100
};

export default function VerifyEmailScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ 
        title: 'Verify Email',
        headerShown: false 
      }} />
      
      <Link href="/auth" asChild>
        <TouchableOpacity style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </Link>
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={80} color={COLORS.primary} />
        </View>
        
        <Text style={styles.title}>Verify Your Email</Text>
        
        <Text style={styles.description}>
          We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
        </Text>
        
        <Text style={styles.note}>
          If you don't see the email, check your spam folder or try again.
        </Text>
        
        <View style={styles.buttonsContainer}>
          <Link href="/auth" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Return to Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    backgroundColor: COLORS.lightGreen,
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 