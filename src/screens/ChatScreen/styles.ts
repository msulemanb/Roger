import {StyleSheet} from 'react-native';
import {useTheme} from '../../theme/useTheme';

export const chatScreenStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 10,
    },

    msgRow: {
      marginVertical: 4,
      flexDirection: 'row',
    },

    left: {
      justifyContent: 'flex-start',
    },

    right: {
      justifyContent: 'flex-end',
    },

    bubble: {
      padding: 10,
      borderRadius: 12,
      maxWidth: '75%',
    },

    myMsg: {
      backgroundColor: theme.brand,
    },

    otherMsg: {
      backgroundColor: theme.surface === '#FFFFFF' ? '#E2E8F0' : '#334155',
    },

    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 10,
    },

    input: {
      flex: 1,
      backgroundColor: theme.surface,
      padding: 10,
      borderRadius: 10,
      color: theme.textPrimary,
      marginRight: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },

    btn: {
      backgroundColor: theme.brand,
      padding: 10,
      borderRadius: 10,
    },

    typing: {
      color: theme.textSecondary,
      marginBottom: 5,
      marginLeft: 5,
    },
  });
