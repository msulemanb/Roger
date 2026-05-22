import {StyleSheet} from 'react-native';
import {useTheme} from '../../theme/useTheme';

export const profileScreenStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 20,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    title: {
      fontSize: 26,
      color: theme.textPrimary,
      fontWeight: 'bold',
    },

    logout: {
      color: '#F87171', // keep semantic red (or move to theme if needed)
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
      color: theme.brand, // can also be moved to theme if needed
      textAlign: 'center',
      marginTop: 5,
    },

    input: {
      backgroundColor: theme.surface,
      color: theme.textPrimary,
      padding: 12,
      borderRadius: 10,
      marginTop: 15,
      borderWidth: 1,
      borderColor: theme.border,
    },

    email: {
      color: theme.textSecondary,
      marginTop: 10,
      textAlign: 'center',
    },

    saveBtn: {
      backgroundColor: theme.brand,
      padding: 14,
      borderRadius: 12,
      marginTop: 20,
    },

    saveText: {
      color: theme.brandForeground,
      textAlign: 'center',
      fontWeight: '600',
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
