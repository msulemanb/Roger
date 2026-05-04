import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import {auth, firestore} from '../services/firebase';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppNavigatorParams} from '../navigation/types';

type HomeScreenNavProps = NativeStackNavigationProp<AppNavigatorParams, 'Home'>;
type Props = {navigation: HomeScreenNavProps};

export default function HomeScreen({navigation}: Props) {
  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  const user = auth().currentUser;

  // 🔥 Load current user profile from Firestore (IMPORTANT FIX)
  useEffect(() => {
    const loadUser = async () => {
      if (!user?.uid) return;

      const doc = await firestore().collection('users').doc(user.uid).get();

      setUserProfile(doc.data());
    };

    loadUser();
  }, [user?.uid]);

  // 🔥 Fetch chats
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', user.uid)
      .onSnapshot(async snapshot => {
        const chatData = await Promise.all(
          snapshot.docs.map(async doc => {
            const data = doc.data();

            const otherUserId = data.participants.find(
              (id: string) => id !== user.uid,
            );

            // 🔥 FETCH OTHER USER FROM FIRESTORE (FIX)
            let otherUser = null;

            if (otherUserId) {
              const userSnap = await firestore()
                .collection('users')
                .doc(otherUserId)
                .get();

              otherUser = userSnap.data();
            }

            return {
              id: doc.id,
              ...data,
              otherUserId,
              otherUser,
            };
          }),
        );

        setChats(chatData);
        setLoading(false);
      });

    return unsubscribe;
  }, [user?.uid]);

  // 🔥 Open Chat
  const openChat = (chat: any) => {
    navigation.navigate('Chat', {
      chatId: chat.id,
      otherUserId: chat.otherUserId,
      otherUserFcmToken: chat?.otherUser?.fcmToken ?? '',
    });
  };

  // 🧠 initials helper
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // 🔍 search filter
  const filteredChats = chats.filter(chat => {
    const text = search.toLowerCase();

    return (
      chat?.otherUser?.fullName?.toLowerCase().includes(text) ||
      chat?.otherUser?.username?.toLowerCase().includes(text) ||
      chat?.lastMessage?.toLowerCase().includes(text)
    );
  });

  if (!user) return null;

  return (
    <View style={styles.container}>
      {/* 🔝 Header */}
      <View style={styles.header}>
        {/* 👤 Avatar → Profile */}
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate('Profile')}>
          {userProfile?.profileImage ? (
            <Image
              source={{uri: userProfile.profileImage}}
              style={styles.avatarImageSmall}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {getInitials(userProfile?.fullName || user?.email || 'U')}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Chats</Text>

        {/* Add Friend */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddFriend')}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 🔍 Search */}
      <TextInput
        style={styles.search}
        placeholder="Search chats..."
        placeholderTextColor="#94A3B8"
        value={search}
        onChangeText={setSearch}
      />

      {/* 💬 Chats */}
      {loading ? (
        <ActivityIndicator color="#60A5FA" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={item => item.id}
          contentContainerStyle={{paddingBottom: 20}}
          ListEmptyComponent={<Text style={styles.empty}>No chats yet</Text>}
          renderItem={({item}) => {
            const other = item.otherUser;

            return (
              <TouchableOpacity
                style={styles.chatCard}
                onPress={() => openChat(item)}>
                {/* Avatar */}
                {other?.profileImage ? (
                  <Image
                    source={{uri: other.profileImage}}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(other?.fullName || other?.username)}
                    </Text>
                  </View>
                )}

                {/* Info */}
                <View style={{flex: 1}}>
                  <Text style={styles.name}>
                    {other?.fullName || other?.username || 'Unknown'}
                  </Text>

                  <Text style={styles.message} numberOfLines={1}>
                    {item?.lastMessage || 'No messages yet'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 15,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },

  addBtn: {
    backgroundColor: '#3B82F6',
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },

  search: {
    backgroundColor: '#1E293B',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 10,
  },

  chatCard: {
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
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  message: {
    color: '#94A3B8',
    marginTop: 2,
  },

  empty: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 20,
  },
  avatarBtn: {
    marginRight: 10,
  },

  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarImageSmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  avatarImage: {
    width: 45,
    height: 45,
    borderRadius: 12,
    marginRight: 10,
  },
});
