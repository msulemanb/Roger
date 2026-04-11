import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {auth, firestore} from '../services/firebase';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppNavigatorParams} from '../navigation/types';

type HomeScreenNavProps = NativeStackNavigationProp<AppNavigatorParams, 'Home'>;
type Props = {navigation: HomeScreenNavProps};

export default function HomeScreen({navigation}: Props) {
  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const user = auth().currentUser;

  // 🔥 Fetch chats (UID based)
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', user.uid)
      .onSnapshot(snapshot => {
        const chatData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(chatData);
      });

    return unsubscribe;
  }, [user?.uid]);

  // 🚀 Open Chat (FETCH USER DATA PROPERLY)
  const openChat = async (chat: any) => {
    try {
      const otherUserId = chat.participants.find(
        (p: string) => p !== user?.uid,
      );

      if (!otherUserId) return;

      const userDoc = await firestore()
        .collection('users')
        .doc(otherUserId)
        .get();

      const otherUser = userDoc.data();

      navigation.navigate('Chat', {
        chatId: chat.id,
        otherUserId,
        otherUserFcmToken: otherUser?.fcmToken ?? '',
      });
    } catch (error) {
      console.log('openChat error:', error);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      {/* 🔝 Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.profileAvatar}
          onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.avatar}>{user?.email?.[0]?.toUpperCase()}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.search}
          placeholder="Search (coming soon)"
          value={search}
          onChangeText={setSearch}
        />

        <Button
          title="Add Friend"
          onPress={() => navigation.navigate('AddFriend')}
        />
      </View>

      {/* 💬 Chat list */}
      <FlatList
        data={chats} // 🔥 removed broken search filter
        keyExtractor={item => item.id}
        renderItem={({item}) => {
          const otherUserId = item.participants.find(
            (p: string) => p !== user?.uid,
          );

          return (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => openChat(item)}>
              <Text style={styles.chatText}>
                {otherUserId || 'Unknown User'}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text>No chats yet</Text>}
      />

      {/* ➕ New Chat */}
      <Button
        title="New Chat"
        onPress={() => navigation.navigate('AddFriend')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10},

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {fontSize: 24},

  search: {
    flex: 1,
    borderWidth: 1,
    padding: 5,
    borderRadius: 5,
    marginRight: 10,
  },

  chatItem: {
    padding: 10,
    borderBottomWidth: 1,
  },

  chatText: {
    fontSize: 16,
  },

  profileAvatar: {
    borderWidth: 1,
    borderRadius: 30,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginRight: 5,
    paddingBottom: 5,
  },
});
