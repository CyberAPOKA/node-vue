<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Modal from './components/Modal.vue';

import Dexie from 'dexie';

// Criar uma nova instância do Dexie
const db = new Dexie('MyNotesDB');
db.version(1).stores({
  notes: '++id, description, potential, categorization, reminder'
});

// Função para salvar anotação no IndexDB
const saveNoteToIndexDB = async (note) => {
  await db.notes.add(note);
};

const showCreateNoteModal = ref(false);

const openCreateNoteModal = () => {
  showCreateNoteModal.value = true;
}
const closeCreateNoteModal = () => {
  showCreateNoteModal.value = false;
}

const form = ref({
  description: '',
  potential: '',
  categorization: '',
  reminder: '',
});

const submitForm = async () => {
  const newNote = {
    description: form.value.description,
    potential: form.value.potential,
    categorization: form.value.categorization,
    reminder: form.value.reminder
  };

  try {
    await saveNoteToIndexDB(newNote);
    if (form.value.persist) {
      await persistData();
      alert('Anotações persistidas no servidor com sucesso!');
    } else {
      alert('Anotação salva localmente!');
    }
    loadNotes(); // Atualizar a lista de notas após adicionar uma nova
  } catch (error) {
    console.error('Erro ao salvar anotação:', error);
    alert('Erro ao salvar anotação');
  }
};


const fetchNotesFromIndexDB = async () => {
  try {
    return await db.notes.toArray();
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    return [];
  }
};
const notes = ref([]);

const loadNotes = async () => {
  notes.value = await fetchNotesFromIndexDB();
};

onMounted(loadNotes);

const clearAllNotes = async () => {
  try {
    await db.notes.clear();
    loadNotes(); // Atualize a lista de notas após a limpeza
    alert('Todas as notas foram limpas!');
  } catch (error) {
    console.error('Erro ao limpar notas:', error);
    alert('Erro ao limpar notas');
  }
};

const persistData = async () => {
  try {
    const lastNote = await db.notes.orderBy('id').last();
    const response = await axios.post('http://127.0.0.1:3000/persistnotes', [lastNote]);
    return response.data; // Supondo que o servidor retorne algum dado relevante
  } catch (error) {
    throw new Error('Erro ao persistir anotação no servidor: ' + error.message);
  }
};


</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <button @click="openCreateNoteModal" class="bg-blue-600 rounded-full text-white px-4 py-2 text-lg font-medium"
      type="button">
      + Criar anotação
    </button>

    <Modal :show="showCreateNoteModal" @close="closeCreateNoteModal" :maxWidth="'3xl'">
      <div class="p-4 bg-gray-100">
        <div class="flex justify-between">
          <h1 class="text-gray-700 font-semibold text-3xl">Anotações</h1>
          <button type="button" @click="closeCreateNoteModal"
            class="hover:text-red-500 hover:scale-150 ease-out duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-10 h-10">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="grid lg:grid-cols-2 gap-4 mt-6">
          <textarea name="" id="" rows="7"
            class="col-span-2 bg-white rounded-xl shadow-all p-4 text-gray-800 placeholder:text-gray-700 placeholder:text-xl placeholder:font-normal"
            placeholder="Exp.: Ao ligar falar com Luiza"></textarea>

          <div>
            <label for="first_name" class="block mb-2 font-medium text-gray-500">Potencial do negócio</label>
            <input type="number" id="first_name"
              class="bg-white text-gray-900 text-sm rounded-3xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-all"
              placeholder="John" required>
          </div>

          <div>
            <label for="first_name" class="block mb-2 font-medium text-gray-500">Categorização</label>
            <input type="number" id="first_name"
              class="bg-white text-gray-900 text-sm rounded-3xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-all"
              placeholder="John" required>
          </div>

        </div>
      </div>
    </Modal>
    {{ notes }}
    <form @submit.prevent="submitForm">
      <input type="text" v-model="form.description" class="border border-red-600 rounded-xl text-center">
      <input type="number" v-model="form.potential" class="border border-red-600 rounded-xl text-center">
      <input type="text" v-model="form.categorization" class="border border-red-600 rounded-xl text-center">
      <input type="date" v-model="form.reminder" class="border border-red-600 rounded-xl text-center">
      <div class="flex justify-start items-start flex-col gap-2">
        <label for="persist">Persistir Meus Dados</label>
        <input type="checkbox" v-model="form.persist">
      </div>
      <button type="submit">Enviar</button>
    </form>

    <ul>
      <li v-for="note in notes" :key="note.id">
        {{ note.description }} - {{ note.potential }} - {{ note.categorization }} - {{ note.reminder }}
      </li>
    </ul>
    <button @click="clearAllNotes" class="bg-red-600 text-white px-4 py-2 rounded">
      Limpar Todas as Notas
    </button>

  </div>
</template>
