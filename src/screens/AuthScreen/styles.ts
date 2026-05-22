import {StyleSheet} from 'react-native';
import {useTheme} from '../../theme/useTheme';

export const authScreenStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      padding: 20,
    },

    card: {
      backgroundColor: theme.surface,
      padding: 20,
      borderRadius: 16,
    },

    title: {
      fontSize: 26,
      color: theme.textPrimary,
      fontWeight: 'bold',
      textAlign: 'center',
    },

    subtitle: {
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },

    input: {
      backgroundColor:
        theme.input === 'transparent' ? theme.border : theme.input,
      color: theme.textPrimary,
      padding: 12,
      borderRadius: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },

    button: {
      backgroundColor: theme.brand,
      padding: 14,
      borderRadius: 10,
      marginTop: 10,
    },

    buttonText: {
      color: theme.brandForeground,
      textAlign: 'center',
      fontWeight: 'bold',
    },

    toggle: {
      color: theme.ring,
      textAlign: 'center',
      marginTop: 15,
    },
  });
