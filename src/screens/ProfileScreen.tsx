import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import * as Keychain from 'react-native-keychain';
import {AppNavigatorParams} from '../navigation/types';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {launchImageLibrary} from 'react-native-image-picker';
type ProfileScreenNavProps = NativeStackNavigationProp<
  AppNavigatorParams,
  'Profile'
>;
type Props = {navigation: ProfileScreenNavProps};

export default function ProfileScreen({navigation}: Props) {
  const user = auth().currentUser;

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // 🔥 LOAD PROFILE
  useEffect(() => {
    const loadUser = async () => {
      const doc = await firestore().collection('users').doc(user?.uid).get();

      if (doc.exists) {
        const data = doc.data();
        setName(data?.name || '');
        setPhoto(data?.photoURL || null);
      }
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    auth()
      .signOut()
      .then(async () => {
        navigation.replace('Auth'); // back to login/signup
        await Keychain.resetGenericPassword();
      });
  };

  // 🖼 PICK IMAGE
  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
    });

    if (result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri || null);
    }
  };

  // 💾 SAVE PROFILE
  const saveProfile = async () => {
    try {
      await firestore().collection('users').doc(user?.uid).set(
        {
          name,
          photoURL: photo,
          email: user?.email,
          uid: user?.uid,
        },
        {merge: true},
      );

      Alert.alert('Profile Updated');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Profile</Text>

      <Image
        source={
          photo
            ? {uri: photo}
            : {
                uri: 'https://images.freeimages.com/images/large-previews/2e0/digital-mind-concept-0410-5708791.jpg',
              }
        }
        style={styles.avatar}
      />

      <Button title="Change Photo" onPress={pickImage} />

      <TextInput
        placeholder="Enter name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Text style={styles.email}>{user?.email}</Text>

      <Button title="Save Profile" onPress={saveProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', padding: 20},
  title: {fontSize: 22, marginBottom: 20},
  avatar: {width: 100, height: 100, borderRadius: 50, marginBottom: 10},
  input: {
    width: '100%',
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
  },
  email: {marginBottom: 10},
  logoutButton: {
    position: 'absolute',
    height: 50,
    borderRadius: 40,
    paddingHorizontal: 10,
    right: 20,
    top: 20,
    backgroundColor: 'purple',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {color: 'white', fontSize: 14},
});
