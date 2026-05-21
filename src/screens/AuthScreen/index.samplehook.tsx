import React, {useState, useMemo} from 'react';
import {View, TextInput, TouchableOpacity, Text, Alert} from 'react-native';
import {auth, firestore} from '../../services/firebase';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppNavigatorParams} from '../../navigation/types';
import * as Keychain from 'react-native-keychain';
import {buildSearchIndex, checkUsernameAvailability} from './AuthScreen.utils';
import {getStyles} from './Authscreen.styles';

import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {useTheme} from '../../theme/useTheme';

type AuthScreenNavProps = NativeStackNavigationProp<AppNavigatorParams, 'Auth'>;

type Props = {navigation?: AuthScreenNavProps};

/* -------------------- ZOD SCHEMA -------------------- */
const schema = z.object({
  fullName: z.string().optional(),
  username: z.string().optional(),
  identifier: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
  confirmPassword: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AuthScreen({navigation}: Props) {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const styles = getStyles(theme);

  /* -------------------- REACT HOOK FORM -------------------- */
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: {errors},
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      username: '',
      identifier: '',
      password: '',
      confirmPassword: '',
    },
  });

  const form = watch();

  /* -------------------- SIGNUP -------------------- */
  const handleSignup = async (data: FormData) => {
    if (!data.fullName || !data.username || !data.confirmPassword) {
      Alert.alert('Please fill all fields');
      return;
    }

    if (data.password !== data.confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = data.identifier.trim().toLowerCase();

      const uniqueUsername = await checkUsernameAvailability(
        data.username,
        firestore,
      );

      const res = await auth().createUserWithEmailAndPassword(
        normalizedEmail,
        data.password,
      );

      const uid = res.user.uid;

      const searchIndex = buildSearchIndex(
        data.fullName,
        uniqueUsername,
        normalizedEmail,
      );

      await firestore().collection('usernames').doc(uniqueUsername).set({
        uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      await firestore().collection('users').doc(uid).set({
        uid,
        email: normalizedEmail,
        fullName: data.fullName,
        username: uniqueUsername,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        searchIndex,
      });

      const token = await res.user.getIdToken();

      await Keychain.setGenericPassword(
        'userToken',
        JSON.stringify({token, uid, email: normalizedEmail}),
      );

      navigation?.replace('Home');
    } catch (error: any) {
      Alert.alert(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- LOGIN -------------------- */
  const handleLogin = async (data: FormData) => {
    setLoading(true);

    try {
      const identifier = data.identifier.trim().toLowerCase();

      let loginEmail = identifier;

      if (!identifier.includes('@')) {
        const snapshot = await firestore()
          .collection('users')
          .where('username', '==', identifier)
          .limit(1)
          .get();

        if (snapshot.empty) {
          throw new Error('Username not found');
        }

        loginEmail = snapshot.docs[0].data().email;
      }

      const res = await auth().signInWithEmailAndPassword(
        loginEmail,
        data.password,
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
      Alert.alert(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: FormData) => {
    if (isSignup) handleSignup(data);
    else handleLogin(data);
  };

  /* -------------------- UI -------------------- */
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </Text>

        <Text style={styles.subtitle}>
          {isSignup ? 'Sign up to start chatting' : 'Login to continue'}
        </Text>

        {/* FULL NAME */}
        {isSignup && (
          <Controller
            control={control}
            name="fullName"
            render={({field: {onChange, value}}) => (
              <TextInput
                style={styles.input}
                placeholder="Enter Full Name (max 19 chars)"
                value={value}
                onChangeText={onChange}
                maxLength={19}
              />
            )}
          />
        )}

        {/* EMAIL / USERNAME INPUT */}
        <Controller
          control={control}
          name="identifier"
          render={({field: {onChange, value}}) => (
            <TextInput
              style={styles.input}
              placeholder={isSignup ? 'Email' : 'Email or Username'}
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              keyboardType={isSignup ? 'email-address' : 'default'}
            />
          )}
        />

        {/* USERNAME (SIGNUP ONLY) */}
        {isSignup && (
          <Controller
            control={control}
            name="username"
            render={({field: {onChange, value}}) => (
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            )}
          />
        )}

        {/* PASSWORD */}
        <Controller
          control={control}
          name="password"
          render={({field: {onChange, value}}) => (
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
            />
          )}
        />

        {/* CONFIRM PASSWORD */}
        {isSignup && (
          <Controller
            control={control}
            name="confirmPassword"
            render={({field: {onChange, value}}) => (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
              />
            )}
          />
        )}

        {/* SUBMIT */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
          </Text>
        </TouchableOpacity>

        {/* TOGGLE */}
        <TouchableOpacity
          onPress={() => {
            setIsSignup(!isSignup);
            reset();
          }}>
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
