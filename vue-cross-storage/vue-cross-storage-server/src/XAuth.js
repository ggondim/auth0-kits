import { initializeServer } from 'cross-storage-plus';
import { Defaults } from '@auth0-kits/client';
const { Events } = Defaults;

import Auth0StorageServer from './Auth0StorageProvider';

export default {
  template: '<div></div>',
  async created() {
    const server = initializeServer();
    server.addProvider(Auth0StorageServer, this.$auth0.storageKeys);

    const loggedIn = await this.$auth0.loadingFlow(
      this.onAuthProgress,
      this.onAuthSuccess,
      this.onAuthError
    );

    if (!loggedIn) {
      this.onErroAuth('fluxo de carregamento não conseguiu se autenticar');
    }
  },

  methods: {
    notifyEvent(evnt, data) {
      window.parent.postMessage({ event: evnt, data }, '*');
    },
    onAuthProgress() {
      this.notifyEvent(Events.ACCESS_RENEWING);
    },
    onAuthSuccess() {
      this.notifyEvent(Events.ACCESS_RENEWED);
    },
    onAuthError(error) {
      this.notifyEvent(Events.ACCESS_DENIED, { error });
    },
  },
}