import { useState, useEffect } from 'react';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const registerPush = async () => {
      // Request permissions
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission denied');
        return;
      }

      // Register with Apple / Google to receive token
      await PushNotifications.register();
    };

    registerPush();

    // Listeners for registration and token retrieval
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      setDeviceToken(token.value);
      
      // If user is logged in, sync token to backend via Supabase
      if (user) {
        try {
          const { error } = await supabase
            .from('user_devices')
            .upsert(
              { user_id: user.id, fcm_token: token.value, platform: Capacitor.getPlatform() },
              { onConflict: 'fcm_token' }
            );
            
          if (error && error.code !== '42P01') {
            console.error('Error syncing push token:', error);
          }
        } catch (e) {
          console.error('Push token sync exception', e);
        }
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on push registration:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received:', notification);
      toast.info(notification.title || 'New Alert', {
        description: notification.body
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push action performed:', action);
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user]);

  return { deviceToken };
}
