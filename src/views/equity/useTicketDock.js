import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useTicketDock(workspace) {
  const dock = ref('right'), collapsed = ref(false), dragging = ref(false)
  const floating = ref({ x: 40, y: 20, width: 602, height: 620 })
  let offset = { x: 0, y: 0 }
  let observer
  function constrain() {
    if (!workspace.value) return
    const r = workspace.value.getBoundingClientRect()
    floating.value.width = Math.min(floating.value.width, r.width)
    floating.value.height = Math.min(floating.value.height, r.height)
    floating.value.x = Math.max(0, Math.min(floating.value.x, r.width-floating.value.width))
    floating.value.y = Math.max(0, Math.min(floating.value.y, r.height-floating.value.height))
  }
  function stop() {
    dragging.value = false
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    window.removeEventListener('pointercancel', stop)
    constrain()
  }
  function move(event) {
    const r = workspace.value.getBoundingClientRect()
    floating.value.x = Math.max(0, Math.min(r.width - floating.value.width, event.clientX - r.left - offset.x))
    floating.value.y = Math.max(0, Math.min(r.height - floating.value.height, event.clientY - r.top - offset.y))
  }
  function end(event) {
    const r = workspace.value.getBoundingClientRect(), x = event.clientX - r.left, y = event.clientY - r.top
    if (x >= 0 && x <= r.width && y >= 0 && y <= r.height) {
      if (y > r.height - 76) dock.value = 'bottom'
      else if (x < 105) dock.value = 'left'
      else if (x > r.width - 105) dock.value = 'right'
    }
    stop()
  }
  function start(event) {
    if (event.button !== 0 || event.target.closest('button, .el-select')) return
    event.preventDefault()
    const pane = event.currentTarget.closest('.trade-dock').getBoundingClientRect(), r = workspace.value.getBoundingClientRect()
    floating.value = { x: Math.max(0, pane.x - r.x), y: Math.max(0, pane.y - r.y), width: Math.min(pane.width, r.width), height: Math.min(pane.height, r.height) }
    offset = { x: Math.min(event.clientX - pane.x, 220), y: event.clientY - pane.y }
    dock.value = 'floating'; dragging.value = true; move(event)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', stop)
  }
  onMounted(() => { observer = new ResizeObserver(constrain); observer.observe(workspace.value) })
  onBeforeUnmount(() => { stop(); observer?.disconnect() })
  return { dock, collapsed, dragging, floating, start }
}
