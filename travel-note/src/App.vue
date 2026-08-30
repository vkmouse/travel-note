<script setup lang="ts">
import AccessGate from './components/AccessGate.vue'
import AppShell from './components/AppShell.vue'
import { useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

function handleAuthenticated() {
  queryClient.invalidateQueries()
}
</script>

<template>
  <AccessGate @authenticated="handleAuthenticated">
    <AppShell />
  </AccessGate>
</template>
