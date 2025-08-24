<template>
  <div class="formula-builder">
    <div class="flex align-items-center gap-2">
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
    <div class="mt-2 text-xs">
      <div>轉換後公式: {{ localValue }}</div>
      <div v-if="Object.keys(fieldMappings).length">
        <div>欄位對應:</div>
        <div v-for="(orig, variable) in fieldMappings" :key="variable">
          {{ variable }} = {{ orig }}
        </div>
      </div>
    </div>
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
const fieldMappings = ref({})

watch(() => props.modelValue, v => (localValue.value = v))
watch(localValue, v => emit('update:modelValue', v))

const operators = ['+', '-', '*', '/', '(', ')']

const search = e => {
  const q = e.query.toLowerCase()
  filtered.value = props.fields.filter(f => f.toLowerCase().includes(q))
}

const selectField = e => {
  insert(sanitizeField(e.value))
  fieldQuery.value = ''
}

const insert = text => {
  const prefix = localValue.value && !localValue.value.endsWith(' ') ? ' ' : ''
  localValue.value = (localValue.value || '') + prefix + text + ' '
}

const sanitizeField = name => {
  let varName = name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '_')
  if (/^\d/.test(varName)) varName = '_' + varName
  let unique = varName
  let i = 1
  while (fieldMappings.value[unique] && fieldMappings.value[unique] !== name) {
    unique = `${varName}_${i++}`
  }
  fieldMappings.value[unique] = name
  return unique
}
</script>

<style scoped>
.formula-builder {
  width: 100%;
}
</style>

