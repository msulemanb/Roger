export type AppNavigatorParams = {
    Auth: undefined;
    Home: undefined;
    Profile: undefined;
    AddFriend: undefined;
    Chat: {
        chatId: string;
        otherUserId: string;
        otherUserFcmToken?: string; // optional (safe)
    };
};