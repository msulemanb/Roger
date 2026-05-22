import {StyleSheet} from 'react-native';
import {useTheme} from '../../theme/useTheme';

export const homeScreenStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 15,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    title: {
      fontSize: 28,
      color: theme.textPrimary,
      fontWeight: 'bold',
    },

    addBtn: {
      backgroundColor: theme.brand,
      width: 38,
      height: 38,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },

    addBtnText: {
      color: theme.brandForeground,
      fontSize: 22,
      fontWeight: 'bold',
    },

    search: {
      backgroundColor: theme.surface,
      color: theme.textPrimary,
      padding: 10,
      borderRadius: 10,
      marginTop: 15,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },

    chatCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      padding: 12,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },

    avatar: {
      width: 45,
      height: 45,
      borderRadius: 12,
      backgroundColor: theme.brand,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },

    avatarText: {
      color: theme.brandForeground,
      fontWeight: 'bold',
    },

    name: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },

    message: {
      color: theme.textSecondary,
      marginTop: 2,
    },

    empty: {
      color: theme.textSecondary,
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
      backgroundColor: theme.brand,
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
