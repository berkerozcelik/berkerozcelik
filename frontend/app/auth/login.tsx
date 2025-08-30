import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: email.toLowerCase().trim(),
        password
      });

      const { access_token, user } = response.data;
      
      // Store authentication data
      await AsyncStorage.multiSet([
        ['auth_token', access_token],
        ['user_data', JSON.stringify(user)]
      ]);

      Alert.alert(
        'Başarılı',
        `Hoş geldiniz, ${user.name}!`,
        [
          {
            text: 'Tamam',
            onPress: () => router.replace('/')
          }
        ]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Giriş yapılırken bir hata oluştu';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.textInverse} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Giriş Yap</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.logoSection}>
              <MaterialIcons name="health-and-safety" size={80} color={theme.colors.primary} />
              <Text style={styles.appName}>Kanser Bakım</Text>
              <Text style={styles.welcomeText}>Hesabınıza giriş yapın</Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="E-posta adresi"
                  placeholderTextColor={theme.colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Şifre"
                  placeholderTextColor={theme.colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.textInverse} />
                ) : (
                  <>
                    <MaterialIcons name="login" size={20} color={theme.colors.textInverse} />
                    <Text style={styles.loginButtonText}>Giriş Yap</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Şifremi unuttum</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.registerSection}>
              <Text style={styles.registerPrompt}>Hesabınız yok mu?</Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/register')}
                style={styles.registerButton}
              >
                <Text style={styles.registerButtonText}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>

            {/* Demo Accounts */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Demo Hesaplar</Text>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => {
                  setEmail('hasta@demo.com');
                  setPassword('demo123');
                }}
              >
                <MaterialIcons name="person" size={16} color={theme.colors.primary} />
                <Text style={styles.demoButtonText}>Hasta Hesabı</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => {
                  setEmail('doktor@demo.com');
                  setPassword('demo123');
                }}
              >
                <MaterialIcons name="medical-services" size={16} color={theme.colors.secondary} />
                <Text style={styles.demoButtonText}>Doktor Hesabı</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => {
                  setEmail('bakici@demo.com');
                  setPassword('demo123');
                }}
              >
                <MaterialIcons name="elderly" size={16} color={theme.colors.accent} />
                <Text style={styles.demoButtonText}>Bakıcı Hesabı</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing['4xl'],
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
    marginTop: theme.spacing.xl,
  },
  appName: {
    ...theme.typography.h1,
    marginTop: theme.spacing.base,
  },
  welcomeText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  formSection: {
    marginBottom: theme.spacing['2xl'],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.base,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  inputIcon: {
    marginRight: theme.spacing.md,
  },
  textInput: {
    flex: 1,
    ...theme.typography.body,
    paddingVertical: theme.spacing.xs,
  },
  eyeButton: {
    padding: theme.spacing.xs,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.sm,
    ...theme.shadows.base,
  },
  disabledButton: {
    backgroundColor: theme.colors.textLight,
  },
  loginButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    marginLeft: theme.spacing.sm,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: theme.spacing.base,
  },
  linkText: {
    ...theme.typography.bodySecondary,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  registerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  registerPrompt: {
    ...theme.typography.bodySecondary,
    marginBottom: theme.spacing.sm,
  },
  registerButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  registerButtonText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  demoSection: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  demoTitle: {
    ...theme.typography.bodySecondary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundAccent,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  demoButtonText: {
    ...theme.typography.caption,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
});