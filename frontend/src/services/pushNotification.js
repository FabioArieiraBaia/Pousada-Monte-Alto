import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushNotificationService = {
  isSupported() {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  getPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  },

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      await navigator.serviceWorker.ready;
      return registration;
    } catch (err) {
      console.warn('Falha ao registrar Service Worker:', err);
      return null;
    }
  },

  async isSubscribed() {
    if (!this.isSupported()) return false;
    try {
      const registration = await this.registerServiceWorker();
      if (!registration) return false;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (err) {
      console.warn('Erro ao verificar inscrição push:', err);
      return false;
    }
  },

  async subscribe() {
    if (!this.isSupported()) {
      throw new Error('Seu navegador não suporta notificações Web Push.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada no navegador/celular.');
    }

    const registration = await this.registerServiceWorker();
    if (!registration) {
      throw new Error('Não foi possível ativar o serviço em segundo plano.');
    }

    // Obter chave pública VAPID do backend
    const vapidRes = await api.getVapidPublicKey();
    if (!vapidRes.success || !vapidRes.publicKey) {
      throw new Error('Não foi possível obter a chave do servidor de notificações.');
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidRes.publicKey);

    // Assinar no PushManager
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // Salvar inscrição no backend
    await api.subscribePushDevice(subscription.toJSON());

    return subscription;
  },

  async unsubscribe() {
    if (!this.isSupported()) return false;
    try {
      const registration = await this.registerServiceWorker();
      if (!registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.unsubscribePushDevice(endpoint);
      }
      return true;
    } catch (err) {
      console.warn('Erro ao desinscrever de notificações:', err);
      return false;
    }
  }
};

export default pushNotificationService;