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
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');

  const user = auth().currentUser;

  // Fetch chats from Firestore
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', user?.email)
      .onSnapshot(snapshot => {
        const chatData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(chatData);
      });

    return unsubscribe;
  }, []);

  // Navigate to chat
  const openChat = chat => {
    navigation.navigate('Chat', {chatId: chat.id});
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.avatar}>{user?.email[0].toUpperCase()}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.search}
          placeholder="Search by email"
          value={search}
          onChangeText={setSearch}
        />
        <Button
          title="Add Friend"
          onPress={() => navigation.navigate('AddFriend')}
        />
      </View>

      {/* Chat list */}
      <FlatList
        data={chats.filter(chat =>
          chat.participants.some(p => p.includes(search)),
        )}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => openChat(item)}>
            <Text style={styles.chatText}>
              {item.participants.filter(p => p !== user?.email).join(', ')}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No chats yet</Text>}
      />

      {/* Create new chat */}
      <Button
        title="New Chat"
        onPress={() => navigation.navigate('AddFriend')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10},
  topBar: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  avatar: {fontSize: 24, marginRight: 10},
  search: {
    flex: 1,
    borderWidth: 1,
    padding: 5,
    borderRadius: 5,
    marginRight: 10,
  },
  chatItem: {padding: 10, borderBottomWidth: 1},
  chatText: {fontSize: 16},
});
