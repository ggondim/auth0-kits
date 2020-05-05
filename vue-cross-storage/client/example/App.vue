<template>
  <div>
    <div id="app">
      <router-view />
    </div>
  </div>
</template>

<script>
import { initializeXAuth } from '@auth0-kits/vue-xauth-client';

export default {

  async created() {
    const xauth = await initializeXAuth({
      loginAppUrl: 'https://published-xauth-server.com',
      onAcessoRenovado: this.onAcessoRenovado,
      onAcessoNegado: this.onAcessoNegado,
      onRenovandoAcesso: this.onRenovandoAcesso,
    });

    this.$root.auth0 = xauth.storage;
    // this makes storage accessible through this.$root.auth0;
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
