export function showProgressToast(toast, groupId, summary, detail, type = 'info', life = 60000) {
  // Remove the previous toast in the same group to simulate an update
  toast.removeGroup(groupId);
  // Add the new/updated toast. It will appear in the 'br' container.
  toast.add({
    group: groupId, // Each progress bar has its own group
    severity: type,
    summary,
    detail,
    life,
    closable: true, // Add close button
  });
}

// This function is needed to ensure all dynamic toasts are rendered in the correct position.
export function useProgressToastContainer(toast) {
  // You might need to call this in the component's onMounted hook if toasts don't appear.
  // This is a conceptual function; its implementation depends on how you manage toast containers.
  // For now, we will rely on a global toast container.
}