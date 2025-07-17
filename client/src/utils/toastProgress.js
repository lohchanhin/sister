export function showProgressToast(toast, key, summary, detail, type = 'info', life = 60000) {
  toast.add({
    key: key,
    group: 'br', // Use a consistent group for all progress toasts
    severity: type,
    summary,
    detail,
    life,
    closable: false
  })
}