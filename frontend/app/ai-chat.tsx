import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from './theme';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const quickQuestions = [
    '🤒 Ateşim var, ne yapmalıyım?',
    '💊 İlaçlarımı unuttuysam ne olur?',
    '🍎 Hangi besinleri tüketmeliyim?',
    '🏃‍♂️ Egzersiz yapabilir miyim?',
    '😴 Uyku problemi yaşıyorum',
    '🧘‍♀️ Stresle nasıl başa çıkarım?'
  ];

  useEffect(() => {
    loadUserData();
    initializeChat();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name);
      }
    } catch (error) {
      console.error('User data load error:', error);
    }
  };

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      text: `Merhaba! Ben sizin kişisel sağlık asistanınızım. Kanser bakım sürecinizde size yardımcı olmak için buradayım. 

Şunları yapabilirim:
• Sağlık verilerinizi analiz edebilirim
• Semptomlarınız hakkında bilgi verebilirim  
• İlaç kullanımı konusunda rehberlik edebilirim
• Beslenme önerileri sunabilirim
• Egzersiz planı konusunda yardım edebilirim

Nasıl yardımcı olabilirim?`,
      isUser: false,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/ai/chat`,
        {
          message: messageText,
          context: 'Kanser hastası için sağlık danışmanlığı'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Üzgünüm, şu an yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.ai} barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AI Sağlık Asistanı</Text>
          <Text style={styles.headerSubtitle}>Size özel sağlık danışmanı</Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <MaterialIcons name="info-outline" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessageContainer : styles.aiMessageContainer
              ]}
            >
              {!message.isUser && (
                <View style={styles.aiAvatar}>
                  <MaterialIcons name="psychology" size={20} color={theme.colors.textInverse} />
                </View>
              )}
              
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessageBubble : styles.aiMessageBubble
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isUser ? styles.userMessageText : styles.aiMessageText
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    message.isUser ? styles.userMessageTime : styles.aiMessageTime
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
              
              {message.isUser && (
                <View style={styles.userAvatar}>
                  <MaterialIcons name="person" size={20} color={theme.colors.textInverse} />
                </View>
              )}
            </View>
          ))}
          
          {loading && (
            <View style={styles.loadingContainer}>
              <View style={styles.aiAvatar}>
                <MaterialIcons name="psychology" size={20} color={theme.colors.textInverse} />
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={theme.colors.ai} />
                <Text style={styles.loadingText}>AI düşünüyor...</Text>
              </View>
            </View>
          )}
          
          {/* Quick Questions */}
          {messages.length === 1 && (
            <View style={styles.quickQuestionsContainer}>
              <Text style={styles.quickQuestionsTitle}>Hızlı Sorular:</Text>
              {quickQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickQuestionButton}
                  onPress={() => sendMessage(question)}
                >
                  <Text style={styles.quickQuestionText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor={theme.colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || loading) && styles.sendButtonDisabled
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || loading}
            >
              <MaterialIcons 
                name="send" 
                size={20} 
                color={(!inputText.trim() || loading) ? theme.colors.textLight : theme.colors.textInverse}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    backgroundColor: theme.colors.ai,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing['4xl'],
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textInverse,
    opacity: 0.9,
  },
  infoButton: {
    padding: theme.spacing.sm,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.base,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.base,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.ai,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  userMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 6,
  },
  aiMessageBubble: {
    backgroundColor: theme.colors.cardBackground,
    borderBottomLeftRadius: 6,
    ...theme.shadows.sm,
  },
  messageText: {
    ...theme.typography.body,
    lineHeight: 20,
  },
  userMessageText: {
    color: theme.colors.textInverse,
  },
  aiMessageText: {
    color: theme.colors.text,
  },
  messageTime: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
  userMessageTime: {
    color: theme.colors.textInverse,
    opacity: 0.8,
    textAlign: 'right',
  },
  aiMessageTime: {
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.base,
  },
  loadingBubble: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: 6,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  loadingText: {
    ...theme.typography.bodySecondary,
    marginLeft: theme.spacing.sm,
  },
  quickQuestionsContainer: {
    marginTop: theme.spacing.xl,
    paddingLeft: 44, // Avatar width + margin
  },
  quickQuestionsTitle: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  quickQuestionButton: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickQuestionText: {
    ...theme.typography.body,
    color: theme.colors.ai,
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  textInput: {
    flex: 1,
    ...theme.typography.body,
    maxHeight: 100,
    paddingVertical: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.ai,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textLight,
  },
});