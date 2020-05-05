<template>
  <div>
    <div id="app">
      <router-view />
    </div>
  </div>
</template>

<script>
import { initializeXAuth } from '@auth0-kits/vue-cross-storage-client';

export default {

  async created() {
    const xauth = await initializeXAuth({
      loginAppUrl: 'https://published-xauth-server.com',
      onAuthSuccess: this.onAuthSuccess,
      onAuthError: this.onAuthError,
      onAuthProgress: this.onAuthProgress,
    });

    // this makes cross storage accessible through this.$root.auth0
    this.$root.auth0 = xauth.storage;

    // but if you didn't set copyToStorage null, use localStorage instead
  },

  methods: {
    onAuthProgress() {
    },
    onAuthSuccess() {
    },
    onAuthError(error) {
    },
  },
};
</script>

<style lang="scss">
</style>
