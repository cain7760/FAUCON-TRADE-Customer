<script setup>
defineProps({
  label: { type: String, required: true },
  direction: { type: String, default: null },
  numeric: { type: Boolean, default: false },
})
defineEmits(['sort'])
</script>

<template>
  <button type="button" class="sort-heading" :class="{ 'is-numeric': numeric, 'is-active': direction }" @click.stop="$emit('sort')">
    <span>{{ label }}</span>
    <svg class="sort-heading-marker" width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
      <path d="M4 1 7.5 5h-7z" :class="{ active: direction === 'ascending' }"/>
      <path d="M.5 9h7l-3.5 4z" :class="{ active: direction === 'descending' }"/>
    </svg>
  </button>
</template>

<style scoped>
.sort-heading{display:inline-flex;align-items:center;gap:4px;margin:0;padding:0;border:0;background:transparent;color:inherit;font:inherit;line-height:17px;white-space:nowrap;cursor:pointer}.sort-heading:hover{color:#c7cdd6}.sort-heading-marker{display:block;flex:0 0 8px;overflow:visible}.sort-heading-marker path{fill:#9ba4b0}.sort-heading-marker path.active{fill:#bb984a}.sort-heading.is-numeric{position:relative;z-index:4}
</style>
