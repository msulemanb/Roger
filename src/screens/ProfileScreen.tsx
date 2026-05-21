import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import * as Keychain from 'react-native-keychain';
import {launchImageLibrary} from 'react-native-image-picker';

export default function ProfileScreen({navigation}: any) {
  const user = auth().currentUser;

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔥 Load profile
  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;

      const doc = await firestore().collection('users').doc(user.uid).get();

      const data = doc.data();

      setFullName(data?.fullName || '');
      setUsername(data?.username || '');
      setPhoto(data?.profileImage || null);

      setLoading(false);
    };

    load();
  }, []);

  // 🖼 Pick image
  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
    });

    if (result.assets?.length) {
      setPhoto(result.assets[0].uri || null);
    }
  };

  // 🔍 check username uniqueness
  const isUsernameTaken = async (newUsername: string) => {
    const snap = await firestore()
      .collection('usernames')
      .doc(newUsername)
      .get();

    return snap.exists;
  };

  // 💾 Save profile
  const saveProfile = async () => {
    try {
      if (!user?.uid) return;

      setSaving(true);

      const newUsername = username.toLowerCase().trim();

      const doc = await firestore().collection('users').doc(user.uid).get();

      const oldUsername = doc.data()?.username;

      // 🔥 if username changed → validate
      if (newUsername !== oldUsername) {
        const taken = await isUsernameTaken(newUsername);

        if (taken) {
          Alert.alert('Username already taken');
          setSaving(false);
          return;
        }

        // delete old mapping
        if (oldUsername) {
          await firestore().collection('usernames').doc(oldUsername).delete();
        }

        // create new mapping
        await firestore().collection('usernames').doc(newUsername).set({
          uid: user.uid,
        });
      }

      // 💾 update user profile
      await firestore().collection('users').doc(user.uid).set(
        {
          fullName,
          username: newUsername,
          profileImage: photo,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        {merge: true},
      );

      Alert.alert('Profile updated');
      setSaving(false);
    } catch (e) {
      console.log(e);
      setSaving(false);
    }
  };

  // 🚪 logout
  const logout = async () => {
    await auth().signOut();
    await Keychain.resetGenericPassword();
    navigation.replace('Auth');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>

        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={{
            uri: photo || 'https://i.pravatar.cc/150?img=12',
          }}
          style={styles.avatar}
        />
        <Text style={styles.changePhoto}>Change Photo</Text>
      </TouchableOpacity>

      {/* Inputs */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#94A3B8"
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#94A3B8"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <Text style={styles.email}>{user?.email}</Text>

      {/* Save */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={saveProfile}
        disabled={saving}>
        <Text style={styles.saveText}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
  },

  logout: {
    color: '#F87171',
    fontWeight: '600',
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 30,
    alignSelf: 'center',
    marginTop: 20,
  },

  changePhoto: {
    color: '#60A5FA',
    textAlign: 'center',
    marginTop: 5,
  },

  input: {
    backgroundColor: '#1E293B',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },

  email: {
    color: '#94A3B8',
    marginTop: 10,
    textAlign: 'center',
  },

  saveBtn: {
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },

  saveText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
