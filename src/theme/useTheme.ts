import {useColorScheme} from 'react-native';
import {colors} from './colors';

export function useTheme() {
  const scheme = useColorScheme();

  return scheme === 'dark' ? colors.dark : colors.light;
}
