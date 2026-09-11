<script setup>
defineProps({ name: { type: String, required: true } })
</script>

<template>
  <svg class="settings-menu-icon" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="name === 'account'">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.6-3.4 3.1-5 7-5s6.4 1.6 7 5" />
    </template>
    <template v-else-if="name === 'language'">
      <circle cx="12" cy="12" r="8.5" /><path d="M3.8 12h16.4M12 3.5c2.2 2.3 3.4 5.2 3.4 8.5S14.2 18.2 12 20.5C9.8 18.2 8.6 15.3 8.6 12S9.8 5.8 12 3.5" /><path d="M6.5 7.2h5.2M6.5 16.8h5.2" />
    </template>
    <template v-else-if="name === 'trading'">
      <path d="M4 17l5-5 3 3 7-8M15 7h4v4" />
    </template>
    <template v-else>
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
    </template>
  </svg>
</template>
