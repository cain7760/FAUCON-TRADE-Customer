<script setup>
import { ref } from 'vue'
import { Setting } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Array, required: true },
  options: { type: Array, required: true },
  defaults: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])
const visible = ref(false)
const draft = ref([])

function beginEdit() { draft.value = [...props.modelValue] }
function restoreDefaults() { draft.value = [...props.defaults] }
function cancel() { visible.value = false }
function save() { emit('update:modelValue', [...draft.value]); visible.value = false }
</script>

<template>
  <el-popover v-model:visible="visible" placement="bottom-end" :width="266" trigger="click" popper-class="column-config-popper" @show="beginEdit">
    <template #reference><button class="column-config-trigger" aria-label="自定义列"><el-icon><Setting /></el-icon></button></template>
    <section class="column-config-dialog" aria-label="自定义列设置">
      <header><b>自定义列设置</b><button type="button" @click="restoreDefaults">恢复默认</button></header>
      <el-checkbox-group v-model="draft">
        <el-checkbox v-for="option in options" :key="option[0]" :label="option[0]">
          <span class="column-sort-grip" aria-hidden="true"><i v-for="dot in 6" :key="dot" /></span><span class="column-label">{{ option[1] }}</span>
        </el-checkbox>
      </el-checkbox-group>
      <footer><el-button @click="cancel">取消</el-button><el-button type="primary" @click="save">保存</el-button></footer>
    </section>
  </el-popover>
</template>
