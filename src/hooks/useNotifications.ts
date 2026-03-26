import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  registerForPushNotifications,
  registerTokenWithBackend,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '../services/notifications';
import type * as Notifications from 'expo-notifications';

/**
 * Hook to set up push notifications on app launch.
 * - Requests permission
 * - Registers token with backend
 * - Listens for notification taps (for deep linking to picks)
 */
export function useNotifications(
  onNotificationTap?: (data: Record<string, unknown>) => void
) {
  const { user } = useAuth();
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!user) return;

    // Register for push on login
    const setup = async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await registerTokenWithBackend(token);
      }
    };

    setup();

    // Listen for notification taps (background/killed state)
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (onNotificationTap && data) {
        onNotificationTap(data as Record<string, unknown>);
      }
    });

    // Listen for foreground notifications (optional logging)
    notificationListener.current = addNotificationReceivedListener((_notification) => {
      // Could update badge count or show in-app toast
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, [user, onNotificationTap]);
}
