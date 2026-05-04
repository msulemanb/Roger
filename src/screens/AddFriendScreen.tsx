import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/* ---------------- TYPES ---------------- */

type User = {
  uid: string;
  email: string;
  fullName?: string;
  username?: string;
  profileImage?: string | null;
  fcmToken?: string;
};

type Chat = {
  id: string;
  participants: string[];
};

/* ---------------- SCREEN ---------------- */

export default function AddFriendScreen({navigation}: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const currentUser = auth().currentUser;

  /* ---------------- SEARCH USERS ---------------- */

  const searchUsers = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      const q = query.toLowerCase().trim();

      const snap = await firestore()
        .collection('users')
        .where('searchIndex', 'array-contains', q)
        .get();

      const users: User[] = snap.docs
        .map(doc => {
          const data = doc.data() as User;
          return data; // uid already inside document
        })
        .filter(user => user.uid !== currentUser?.uid);

      setResults(users);
    } catch (err) {
      console.log(err);
      Alert.alert('Error searching users');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- OPEN OR CREATE CHAT ---------------- */

  const openChat = async (user: User) => {
    if (!currentUser?.uid) return;

    try {
      // check existing chat
      const snap = await firestore()
        .collection('chats')
        .where('participants', 'array-contains', currentUser.uid)
        .get();

      const existing = snap.docs.find(doc =>
        (doc.data().participants || []).includes(user.uid),
      );

      if (existing) {
        return navigation.navigate('Chat', {
          chatId: existing.id,
          otherUserId: user.uid,
          otherUserFcmToken: user.fcmToken ?? '',
        });
      }

      // create new chat
      const chatRef = await firestore()
        .collection('chats')
        .add({
          participants: [currentUser.uid, user.uid],
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastMessage: '',
          users: {
            [currentUser.uid]: {
              uid: currentUser.uid,
              email: currentUser.email,
            },
            [user.uid]: {
              uid: user.uid,
              email: user.email,
              fullName: user.fullName,
              username: user.username,
              profileImage: user.profileImage || null,
            },
          },
        });

      navigation.navigate('Chat', {
        chatId: chatRef.id,
        otherUserId: user.uid,
        otherUserFcmToken: user.fcmToken ?? '',
      });
    } catch (err) {
      console.log(err);
      Alert.alert('Failed to create chat');
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Friend</Text>

      {/* SEARCH INPUT */}
      <TextInput
        style={styles.input}
        placeholder="Search by name, username or email"
        placeholderTextColor="#94A3B8"
        value={query}
        onChangeText={setQuery}
      />

      <TouchableOpacity style={styles.btn} onPress={searchUsers}>
        <Text style={styles.btnText}>Search</Text>
      </TouchableOpacity>

      {/* LOADING */}
      {loading && <ActivityIndicator color="#3B82F6" />}

      {/* RESULTS */}
      <FlatList
        data={results}
        keyExtractor={item => item.uid}
        contentContainerStyle={{paddingTop: 20}}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No users found</Text> : null
        }
        renderItem={({item}) => (
          <TouchableOpacity style={styles.card} onPress={() => openChat(item)}>
            {/* AVATAR */}
            {item.profileImage ? (
              <Image source={{uri: item.profileImage}} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {item.fullName?.[0] ||
                    item.username?.[0] ||
                    item.email?.[0] ||
                    '?'}
                </Text>
              </View>
            )}

            {/* INFO */}
            <View style={{marginLeft: 10}}>
              <Text style={styles.name}>{item.fullName || item.username}</Text>

              <Text style={styles.sub}>
                @{item.username} • {item.email}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 15,
  },

  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },

  input: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
    color: '#fff',
  },

  btn: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 12,
  },

  avatarFallback: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  name: {
    color: '#fff',
    fontWeight: '600',
  },

  sub: {
    color: '#94A3B8',
    fontSize: 12,
  },

  empty: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 20,
  },
});
