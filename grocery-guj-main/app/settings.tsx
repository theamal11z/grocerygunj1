import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Camera, User, Mail, Phone, Shield } from 'lucide-react-native';
import { useProfile } from '@/hooks/useProfile';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useStorage } from '@/hooks/useStorage';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

export default function SettingsScreen() {
  const { profile, loading, error, updateProfile } = useProfile();
  const { user } = useAuth();
  const { pickImage } = useImagePicker();
  const { uploadAvatar, loading: uploadLoading } = useStorage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    avatar_url: '',
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  if (loading || uploadLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load profile" />;
  }

  const handleAvatarPress = async () => {
    try {
      const result = await pickImage();
      if (result?.base64 && user) {
        // First upload the image
        const publicUrl = await uploadAvatar(result.base64, user.id);
        
        // Then update the profile with the new URL
        try {
          await updateProfile({
            avatar_url: publicUrl
          });
          
          // Update local state
          setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
          Alert.alert('Success', 'Profile picture updated successfully');
        } catch (updateError) {
          
          Alert.alert(
            'Error',
            'Image uploaded but failed to update profile. Please try again.'
          );
        }
      }
    } catch (err) {
      
      Alert.alert(
        'Error',
        'Failed to update profile picture. Please check your connection and try again.'
      );
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone_number: profile?.phone_number || '',
      avatar_url: profile?.avatar_url || '',
    });
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: formData.avatar_url ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
              }}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleAvatarPress}
            >
              <Camera size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
            <View style={styles.roleBadge}>
              <Shield size={16} color="#2ECC71" />
              <Text style={styles.roleText}>{profile?.role || 'Customer'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  value={formData.full_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, full_name: text })
                  }
                  editable={isEditing}
                  placeholder="Enter your full name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#666" />
                <TextInput
                  style={[styles.input, { color: '#666' }]}
                  value={formData.email}
                  editable={false}
                  placeholder="Enter your email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  value={formData.phone_number}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone_number: text })
                  }
                  editable={isEditing}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {isEditing ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  (!formData.full_name || !formData.phone_number) && styles.saveButtonDisabled
                ]}
                onPress={handleSave}
                disabled={!formData.full_name || !formData.phone_number}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/address')}>
            <Text style={styles.menuText}>Manage Addresses</Text>
            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/payment-methods')}>
            <Text style={styles.menuText}>Payment Methods</Text>
            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}>
            <Text style={styles.menuText}>Notifications</Text>
            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/privacy-security')}>
            <Text style={styles.menuText}>Privacy & Security</Text>
            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2ECC71',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#333',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  roleText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#2ECC71',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  editButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
  },
  editButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#333',
  },
}); 