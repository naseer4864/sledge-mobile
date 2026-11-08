import type { ViewStyle } from 'react-native';

export const elevation = {
  surface: {
    shadowColor: '#003D32',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  } satisfies ViewStyle,
  raised: {
    shadowColor: '#003D32',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 7,
  } satisfies ViewStyle,
  floating: {
    shadowColor: '#003D32',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  } satisfies ViewStyle,
} as const;
