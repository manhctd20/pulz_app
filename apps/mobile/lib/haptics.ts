import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Web không có haptic. Native chỉ trả Promise — fire-and-forget.

export function hapticTap() {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticSuccess() {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticWarning() {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function hapticSelection() {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync();
}
