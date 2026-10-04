import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { Platform } from 'react-native';

const CHANNEL_ID = 'smartshopping-reminders';
export const REMINDER_DELAY_SECONDS = 10;

// Installed once when this module loads, outside component renders.
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldSetBadge: false,
    // Android suppresses the heads-up alert when this is false.
    shouldPlaySound: true,
  }),
});

let prepared = false;

export async function prepareNotifications(): Promise<void> {
  if (prepared) return;
  if (Platform.OS === 'android') {
    try {
      await setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Recordatorios de compras',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        showBadge: false,
      });
    } catch (error) {
      console.log('[ShoppingReminder] No se pudo crear el canal Android; se continúa con permisos y programación:', error);
    }
  }
  prepared = true;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  // Android needs the channel before requesting notification permission.
  await prepareNotifications();
  let permission = await getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await requestPermissionsAsync();
  }
  return permission.granted;
}

export async function scheduleShoppingReminder(): Promise<string | null> {
  if (!(await ensureNotificationPermission())) return null;
  return scheduleNotificationAsync({
    content: {
      title: 'Lista de compras',
      body: 'Tenés productos pendientes en tu lista de compras.',
      sound: 'default',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: REMINDER_DELAY_SECONDS,
    },
  });
}
