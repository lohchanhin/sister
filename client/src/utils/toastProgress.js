import { useToast } from 'primevue/usetoast'

const toast = useToast()

export function showProgressToast(groupId, summary, detail, type = 'info', life = 60000) {
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
