import messaging from '@react-native-firebase/messaging';
import { firestore, auth } from './firebase';

// Request permission and get FCM token
export const saveFcmToken = async () => {
    const user = auth().currentUser;
    if (!user) return;

    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);

        // Save token in Firestore
        await firestore().collection('users').doc(user.uid).update({ fcmToken: token });
    }
};