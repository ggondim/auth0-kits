<template>
  <div>
    <div id="app">
      <router-view />
    </div>
  </div>
</template>

<script>

export default {

  async created() {
    await this.$auth0.loadingFlow(
      this.onAuthProgress,
      this.onAuthSuccess,
      this.onAuthError,
    );
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
