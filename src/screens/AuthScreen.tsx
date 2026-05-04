import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import {auth, firestore} from '../services/firebase';
import {AppNavigatorParams} from '../navigation/types';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import * as Keychain from 'react-native-keychain';

type AuthScreenNavProps = NativeStackNavigationProp<AppNavigatorParams, 'Auth'>;
type Props = {navigation?: AuthScreenNavProps};

export default function AuthScreen({navigation}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const buildSearchIndex = (text: string) => {
    const result = [];
    const cleaned = text.toLowerCase().trim();

    for (let i = 1; i <= cleaned.length; i++) {
      result.push(cleaned.substring(0, i));
    }

    return result;
  };

  // 🔥 Username generator
  const generateUsername = (email: string) => {
    const base = email.split('@')[0].toLowerCase();
    const random = Math.random().toString(36).substring(2, 6);
    return `${base}_${random}`;
  };

  const generateUniqueUsername = async (email: string) => {
    let attempts = 0;

    while (attempts < 5) {
      const username = generateUsername(email);

      const doc = await firestore().collection('usernames').doc(username).get();

      if (!doc.exists) return username;

      attempts++;
    }

    throw new Error('Failed to generate username');
  };

  // 🚀 Signup
  const handleSignup = async () => {
    if (!email || !password || !fullName || !confirmPassword) {
      Alert.alert('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const res = await auth().createUserWithEmailAndPassword(
        normalizedEmail,
        password,
      );

      const uid = res.user.uid;

      const username = await generateUniqueUsername(normalizedEmail);

      // 🔥 reserve username
      await firestore().collection('usernames').doc(username).set({
        uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // 🔥 create user
      await firestore()
        .collection('users')
        .doc(uid)
        .set({
          uid,
          email: normalizedEmail,
          fullName,
          username,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
          searchIndex: [
            ...buildSearchIndex(fullName.toLowerCase()),
            ...buildSearchIndex(username),
            ...buildSearchIndex(email),
          ],
        });

      // 🔐 store token
      const token = await res.user.getIdToken();

      await Keychain.setGenericPassword(
        'userToken',
        JSON.stringify({token, uid, email: normalizedEmail}),
      );

      navigation?.replace('Home');
    } catch (error: any) {
      console.log(error);
      Alert.alert(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const res = await auth().signInWithEmailAndPassword(
        normalizedEmail,
        password,
      );

      const token = await res.user.getIdToken();

      await Keychain.setGenericPassword(
        'userToken',
        JSON.stringify({
          token,
          uid: res.user.uid,
          email: res.user.email,
        }),
      );

      navigation?.replace('Home');
    } catch (error: any) {
      console.log(error);
      Alert.alert(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </Text>

        <Text style={styles.subtitle}>
          {isSignup ? 'Sign up to start chatting' : 'Login to continue'}
        </Text>

        {isSignup && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
            autoCorrect={false}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isSignup && (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={isSignup ? handleSignup : handleLogin}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
          <Text style={styles.toggle}>
            {isSignup
              ? 'Already have an account? Login'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
  },

  title: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },

  input: {
    backgroundColor: '#334155',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  button: {
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  toggle: {
    color: '#60A5FA',
    textAlign: 'center',
    marginTop: 15,
  },
});
