import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiCall } from '../api/client';

// Configure notification handler (show even when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications.
 * Returns the Expo push token, or null if unavailable.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '', // Will be set when EAS is configured
    });
    return tokenData.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Register push token with the backend.
 */
export async function registerTokenWithBackend(pushToken: string): Promise<void> {
  try {
    await apiCall('/api/notifications/register', {
      method: 'POST',
      body: {
        pushToken,
        platform: Platform.OS,
      },
    });
  } catch (error) {
    console.error('Failed to register push token with backend:', error);
  }
}

/**
 * Schedule a local notification (e.g. pick reminder).
 */
export async function schedulePickReminder(
  roundLabel: string,
  lockTime: string
): Promise<string | null> {
  const lockDate = new Date(lockTime);
  const reminderDate = new Date(lockDate.getTime() - 60 * 60 * 1000); // 1 hour before

  // Don't schedule if reminder time has passed
  if (reminderDate <= new Date()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Make your pick!',
        body: `${roundLabel} pick window closes in 1 hour. Don\u2019t forget to make your pick.`,
        sound: true,
        data: { type: 'pick_reminder', round: roundLabel },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
    return id;
  } catch (error) {
    console.error('Failed to schedule pick reminder:', error);
    return null;
  }
}

/**
 * Schedule a "last chance" reminder 15 minutes before lock.
 */
export async function scheduleLastChanceReminder(
  roundLabel: string,
  lockTime: string
): Promise<string | null> {
  const lockDate = new Date(lockTime);
  const reminderDate = new Date(lockDate.getTime() - 15 * 60 * 1000); // 15 min before

  if (reminderDate <= new Date()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Last chance!',
        body: `${roundLabel} picks lock in 15 minutes. Make your pick now or you\u2019ll be eliminated.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'last_chance', round: roundLabel },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
    return id;
  } catch (error) {
    console.error('Failed to schedule last chance reminder:', error);
    return null;
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get the number of scheduled notifications.
 */
export async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}

/**
 * Add notification response listener (when user taps a notification).
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add notification received listener (foreground).
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}
