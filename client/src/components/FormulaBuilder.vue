<template>
  <div class="formula-builder flex align-items-center gap-2">
    <AutoComplete
      v-model="fieldQuery"
      :suggestions="filtered"
      @complete="search"
      dropdown
      @item-select="selectField"
      placeholder="欄位"
      class="w-12rem"
    />
    <div class="flex gap-1">
      <Button
        v-for="op in operators"
        :key="op"
        type="button"
        size="small"
        @click="insert(op)"
        :label="op"
      />
    </div>
    <InputText v-model="localValue" placeholder="公式" class="flex-1" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const props = defineProps({
  modelValue: { type: String, default: '' },
  fields: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])

const fieldQuery = ref('')
const filtered = ref([])
const localValue = ref(props.modelValue)

watch(() => props.modelValue, v => (localValue.value = v))
watch(localValue, v => emit('update:modelValue', v))

const operators = ['+', '-', '*', '/', '(', ')']

const search = e => {
  const q = e.query.toLowerCase()
  filtered.value = props.fields.filter(f => f.toLowerCase().includes(q))
}

const selectField = e => {
  insert(e.value)
  fieldQuery.value = ''
}

const insert = text => {
  localValue.value = (localValue.value || '') + text
}
</script>

<style scoped>
.formula-builder {
  width: 100%;
}
</style>

