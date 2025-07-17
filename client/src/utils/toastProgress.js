export function showProgressToast(toast, groupId, summary, detail, type = 'info', life = 60000) {
  toast.removeGroup(groupId)
  toast.add({
    group: groupId,
    severity: type,
    summary,
    detail,
    life,
    closable: false
  })
}