<script setup>
defineProps({ type: { type: String, required: true } })
</script>

<template>
  <svg class="client-line-icon" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="type === 'inquiry'">
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
      <path d="m15 16 1.4 1.4L19.5 14" />
    </template>
    <template v-else-if="type === 'order'">
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
      <path d="m15 16 1.2 1.2L19 14.5" />
    </template>
    <template v-else-if="type === 'position'">
      <path d="M7 7V5.5A1.5 1.5 0 0 1 8.5 4h7A1.5 1.5 0 0 1 17 5.5V7" />
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M8 12h8M9.5 16h5" />
    </template>
    <template v-else-if="type === 'bell'">
      <path d="M18 10a6 6 0 1 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8" />
      <path d="M10 21h4" />
    </template>
    <template v-else-if="type === 'message'">
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v7A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4.3A2.5 2.5 0 0 1 5 12.5z" />
      <path d="M8.5 9h7M8.5 12h4" />
    </template>
    <template v-else-if="type === 'notification'">
      <path d="M6 8.5A6 6 0 0 1 18 8.5c0 6 2.2 6.7 2.2 7.5H3.8C3.8 15.2 6 14.5 6 8.5Z" />
      <path d="M9.5 19a2.8 2.8 0 0 0 5 0M12 4V2.5" />
      <circle cx="18" cy="5" r="1.5" fill="currentColor" stroke="none" />
    </template>
    <path v-else-if="type === 'minimize'" d="M5 12h14" />
    <rect v-else-if="type === 'maximize'" x="6" y="6" width="12" height="12" rx="1" />
    <path v-else-if="type === 'close'" d="m7 7 10 10M17 7 7 17" />
  </svg>
</template>
