<script setup>
import { computed, ref } from 'vue'
import { Setting } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Array, required: true },
  options: { type: Array, required: true },
  defaults: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])
const visible = ref(false)
const draft = ref([])
const draftOrder = ref([])
const draggingKey = ref(null)
const optionLabels = computed(() => new Map(props.options))

function orderedKeys(first) {
  const knownKeys = props.options.map(([key]) => key)
  return [...first, ...knownKeys.filter(key => !first.includes(key))]
}
function beginEdit() {
  draft.value = [...props.modelValue]
  draftOrder.value = orderedKeys(props.modelValue)
}
function restoreDefaults() {
  draft.value = [...props.defaults]
  draftOrder.value = orderedKeys(props.defaults)
}
function cancel() { visible.value = false }
function save() {
  emit('update:modelValue', draftOrder.value.filter(key => draft.value.includes(key)))
  visible.value = false
}
function dragStart(key, event) {
  draggingKey.value = key
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', key)
}
function dropBefore(targetKey) {
  const from = draftOrder.value.indexOf(draggingKey.value)
  const to = draftOrder.value.indexOf(targetKey)
  if (from < 0 || to < 0 || from === to) return
  const next = [...draftOrder.value]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  draftOrder.value = next
}
function dragEnd() { draggingKey.value = null }
</script>

<template>
  <el-popover v-model:visible="visible" placement="bottom-end" :width="266" trigger="click" popper-class="column-config-popper" @show="beginEdit">
    <template #reference><button class="column-config-trigger" aria-label="自定义列"><el-icon><Setting /></el-icon></button></template>
    <section class="column-config-dialog" aria-label="自定义列设置">
      <header><b>自定义列设置</b><button type="button" @click="restoreDefaults">恢复默认</button></header>
      <div class="column-config-list">
        <div v-for="key in draftOrder" :key="key" class="column-config-row" :class="{ 'is-dragging': draggingKey === key }" draggable="true" @dragstart="dragStart(key, $event)" @dragover.prevent @drop.prevent="dropBefore(key)" @dragend="dragEnd">
          <span class="column-sort-grip" aria-label="拖拽排序"><i v-for="dot in 6" :key="dot" /></span>
          <el-checkbox v-model="draft" :label="key"><span class="column-label">{{ optionLabels.get(key) }}</span></el-checkbox>
        </div>
      </div>
      <footer><el-button @click="cancel">取消</el-button><el-button type="primary" @click="save">保存</el-button></footer>
    </section>
  </el-popover>
</template>
