<script setup>
import { ref } from 'vue'

defineOptions({ inheritAttrs: false })
const table = ref(null)
defineExpose({
  clearFilter: (...args) => table.value?.clearFilter?.(...args),
  doLayout: () => table.value?.doLayout?.(),
  setScrollTop: value => table.value?.setScrollTop?.(value),
})
</script>

<template>
  <el-table ref="table" class="trading-table" v-bind="$attrs"><slot /></el-table>
</template>
