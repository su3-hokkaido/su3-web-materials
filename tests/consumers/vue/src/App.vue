<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <su3-button id="subject" variant="filled" type="button" @click="count++">
    Clicked {{ count }}
  </su3-button>
</template>
