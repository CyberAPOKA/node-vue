<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Modal from './components/Modal.vue';
import Dexie from 'dexie';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

const toast = useToast();

// configuração do indexDB para armazenamento local
const db = new Dexie('MyNotesDB');
db.version(1).stores({
  notes: '++id, description, potential, categorization, reminder'
});
// salva uma anotação no indexDB
const saveNoteToIndexDB = async (note) => {
  await db.notes.add(note);
};

// controle a modal de criação (abrir e fechar)
const showCreateNoteModal = ref(false);
const openCreateNoteModal = () => {
  showCreateNoteModal.value = true;
};
const closeCreateNoteModal = () => {
  showCreateNoteModal.value = false;
};

// define e inicia o form com os valores iniiciais
const form = ref({
  description: '',
  potential: 0,
  categorization: null,
  reminder: '',
});

// inicia as variáveis de erros
const formErrors = ref({
  descriptionError: '',
  potentialError: '',
  categorizationError: '',
  reminderError: ''
});

// reseta o formulário
const resetForm = () => {
  form.value = {
    description: '',
    potential: 0,
    categorization: null,
    reminder: '',
  };
};

// validação do campo descrição 
const validateDescription = () => {
  //remove os espaços em brancos
  const descriptionTrimmed = form.value.description.trim();
  // regras para não ser nulo e nem ter mais de 255 caracteres.
  if (!descriptionTrimmed) {
    formErrors.value.descriptionError = 'A descrição é obrigatória.';
  } else if (descriptionTrimmed.length > 255) {
    formErrors.value.descriptionError = 'A descrição não pode ter mais de 255 caracteres.';
  } else {
    formErrors.value.descriptionError = '';
  }
};

// validação do campo potencial do negócio
const validatePotential = () => {
  if (form.value.potential <= 0) {
    formErrors.value.potentialError = 'O potencial deve ser maior que zero.';
  } else {
    formErrors.value.potentialError = '';
  }
};

// validação do campo categorização
const validateCategorization = () => {
  if (!form.value.categorization) {
    formErrors.value.categorizationError = 'A categorização é obrigatória.';
  } else {
    formErrors.value.categorizationError = '';
  }
};

// validação do campo lembrete
const validateReminder = () => {
  if (!form.value.reminder) {
    formErrors.value.reminderError = 'A data do lembrete é obrigatória.';
  } else {
    formErrors.value.reminderError = '';
  }
};

// função que salva os dados
const submitForm = async () => {
  //chama todas as funções de validação abaixo
  validateDescription();
  validatePotential();
  validateCategorization();
  validateReminder();

  //se não tiver erros em nenhum campo ele continua o bloco if
  if (!formErrors.value.descriptionError && !formErrors.value.potentialError && !formErrors.value.categorizationError && !formErrors.value.reminderError) {
    const newNote = {
      description: form.value.description,
      potential: form.value.potential,
      categorization: form.value.categorization,
      reminder: form.value.reminder
    };
    try {
      await saveNoteToIndexDB(newNote);
      // se o checkbox de persistir os dados for marcado, vai salvar no banco de dados também.
      if (form.value.persist == 'yes') {
        await persistData();
        //exibe uma notificação no canto superior direto de sucesso.
        toast.success("Anotação salva no banco de dados!", {
          position: "top-right",
          duration: 5000,
        });

      } else {
        toast.success("Anotação salva localmente!", {
          position: "top-right",
          duration: 5000,
        });
      }
      // reseta o form, fecha a modal e carrega as novas anotações respectivamentes.
      resetForm();
      closeCreateNoteModal();
      loadNotes();
    } catch (error) {
      toast.error("Erro ao salvar anotação.", {
        position: "top-right",
        duration: 5000,
      });
    }
  }
};

const showClearAllNotesModal = ref(false);

const openClearAllNotesModal = () => {
  showClearAllNotesModal.value = true;
};
const closeClearAllNotesModal = () => {
  showClearAllNotesModal.value = false;
};

//recupera as anotações do indexDB
const fetchNotesFromIndexDB = async () => {
  try {
    return await db.notes.toArray();
  } catch (error) {
    console.error('Erro:', error);
    return [];
  }
};

const notes = ref([]);

const loadNotes = async () => {
  const localNotes = await fetchNotesFromIndexDB();
  try {
    notes.value = [...localNotes];
  } catch (error) {
    console.error('Erro:', error);
  }
};

//inicia a página com o carregamento das anotações
onMounted(loadNotes);

// apaga todas as anotações
const clearAllNotes = async () => {
  try {
    await db.notes.clear();
    loadNotes();
    toast.success("Anotações removidas com Sucesso!", {
      position: "top-right",
      duration: 5000,
    });
    closeClearAllNotesModal();
  } catch (error) {
    toast.error("Erro ao excluir anotações!", {
      position: "top-right",
      duration: 5000,
    });
  }
};

const token = ref('');
const showTokenModal = ref(false);

const openTokenModal = () => {
  showTokenModal.value = true;
};
const closeTokenModal = () => {
  showTokenModal.value = false;
};

// faz salvar no banco de dados com o token
const persistData = async () => {
  try {
    const lastNote = await db.notes.orderBy('id').last();
    const response = await axios.post('http://127.0.0.1:3000/persistnotes', [lastNote]);
    token.value = response.data.token;
    openTokenModal();
  } catch (error) {
    throw new Error('Erro ao persistir anotação no servidor: ' + error.message);
  }
};

// categorias para usar no select
const categorizations = ref({
  Urgente: 'Muito alta',
  Importante: 'Alta',
  Média: 'Média',
  Baixa: 'Baixa',
  Rotina: 'Muito baixa'
});

//inicia o id da anotação como null e depois é recuperado através do click da modal para saber qual anotação será excluída
const noteId = ref(null);
const showDeleteNoteModal = ref(false);

const openDeleteNoteModal = (id) => {
  showDeleteNoteModal.value = true;
  noteId.value = id;
};
const closeDeleteNoteModal = () => {
  showDeleteNoteModal.value = false;
  noteId.value = null;
};

// deleta uma anotação em específica do indexDB.
const deleteNoteFromIndexDB = async (id) => {
  await db.notes.delete(id);
};

// deleta uma anotação em específica do banco de dados.
// const deleteNoteFromServer = async (id) => {
//   await axios.delete(`http://127.0.0.1:3000/deletenote/${id}`);
// };

//chama as funções de deletar a anotação
const deleteNote = async () => {
  try {

    if (noteId.value != null) {
      await deleteNoteFromIndexDB(noteId.value);
      await deleteNoteFromServer(noteId.value);
    }

    loadNotes();
    closeDeleteNoteModal();
    toast.success("Anotação excluída com sucesso!", {
      position: "top-right",
      duration: 5000,
    });
  } catch (error) {
    toast.error("Erro ao excluir anotação", {
      position: "top-right",
      duration: 5000,
    });
  }
};

// copia o token
const copyToken = () => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(token.value)
      .then(() => {
        toast.success("Token copiado para a área de transferência!", {
          position: "top-right",
          duration: 5000,
        });
      })
      .catch(err => {
        toast.success("Erro ao copiar o token. Tente novamente.", {
          position: "top-right",
          duration: 5000,
        });
      });
  } else {
    toast.success("A área de transferência não é suportada neste navegador.", {
      position: "top-right",
      duration: 5000,
    });
  }
};

const showRecoverNoteModal = ref(false);

const openRecoverNoteModal = () => {
  showRecoverNoteModal.value = true;
};
const closeRecoverNoteModal = () => {
  showRecoverNoteModal.value = false;
  recoveryToken.value = '';
};

const showRecoveredNoteModal = ref(false);

const openRecoveredNoteModal = () => {
  showRecoveredNoteModal.value = true;
};
const closeRecoveredNoteModal = () => {
  showRecoveredNoteModal.value = false;
};

const recoveredNote = ref(null);

// recupera a anotação
const recoverNote = async (token) => {
  try {
    const response = await axios.get(`http://127.0.0.1:3000/getnote/${token}`);
    const notesArray = response.data;

    if (notesArray && notesArray.length > 0) {
      const note = notesArray[0];
      note.reminder = formatDateTime(note.reminder);
      recoveredNote.value = note;
      openRecoveredNoteModal(recoveredNote);
    }
    else {
      toast.error("Token inválido, tente novamente.", {
        position: "top-right",
        duration: 5000,
      });
      recoveredNote.value = null;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      toast.error("Token inválido, tente novamente.", {
        position: "top-right",
        duration: 5000,
      });
    } else {
      toast.error("Erro interno.", {
        position: "top-right",
        duration: 5000,
      });
    }
    recoveredNote.value = null;
  }
};

const recoveryToken = ref('');

//faz a formatação da data
const formatDateTime = (dateTimeString) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
</script>

<template>
  <button data-drawer-target="sidebar-multi-level-sidebar" data-drawer-toggle="sidebar-multi-level-sidebar"
    aria-controls="sidebar-multi-level-sidebar" type="button"
    class="inline-flex items-center p-2 mt-2 ml-3 text-sm  rounded-lg sm:hidden justify-center hover:bg-[var(--surface-400)]">
    <span class="sr-only">Open sidebar</span>
    <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path clip-rule="evenodd" fill-rule="evenodd"
        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z">
      </path>
    </svg>
  </button>

  <aside id="sidebar-multi-level-sidebar"
    class="fixed top-0 left-0 z-40 w-64 lg:w-80 h-screen transition-transform -translate-x-full sm:translate-x-0"
    aria-label="Sidebar">
    <div
      class="flex flex-col justify-between h-full px-3 py-4 overflow-y-auto bg-[var(--surface-100)] text-[var(--text-color)] border-r border-[var(--surface-300)]">
      <ul>
        <li>
          <button
            class="bg-[var(--primary-color)] w-full p-4 rounded-lg text-[var(--primary-color-text)] text-xl font-semibold"
            @click="openRecoverNoteModal">
            Recuperar anotação
          </button>
        </li>
        <li v-for="note in notes" :key="note.id" class="my-4">
          <div class="flex items-center justify-between gap-2 shadow-all bg-[var(--surface-0)] p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
            <div class="flex flex-col w-full max-w-[70%]">
              <h1 class="text-xl text-[var(-surface-900)] font-semibold overflow-hidden whitespace-nowrap text-ellipsis">
                {{ note.description }}</h1>
              <h1 class="text-sm text-[var(-surface-700)] font-medium">{{ formatDateTime(note.reminder) }}</h1>
            </div>
            <button @click="openDeleteNoteModal(note.id)">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 h-6 stroke-[var(--red-500)]">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </li>
      </ul>
      <Modal :show="showRecoverNoteModal" @close="closeRecoverNoteModal" :maxWidth="'2xl'">
        <div class="bg-[var(--surface-100)]">
          <div class="flex justify-between p-6">
            <h1 class="text-[var(--surface-700)] font-semibold text-3xl">Recuperação de anotação</h1>
            <button type="button" @click="closeRecoverNoteModal"
              class="hover:text-[var(--red-500)] hover:scale-150 ease-out duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-10 h-10">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-6">
            <span class="p-float-label">
              <InputText id="token" v-model="recoveryToken" class="w-full" />
              <label for="token">Insira o Token</label>
            </span>
          </div>
          <div class="flex justify-between gap-4 p-4">
            <button type="submit" @click="closeRecoverNoteModal"
              class="bg-[var(--red-500)] rounded-full text-[var(--primary-color-text)] p-4 text-lg font-medium lg:w-52">
              Cancelar
            </button>
            <button type="button" @click="recoverNote(recoveryToken)"
              class="bg-[var(--primary-color)] rounded-full text-[var(--primary-color-text)] px-4 py-2 text-lg font-medium lg:w-52">
              Recuperar
            </button>
          </div>
        </div>
      </Modal>
      <Modal :show="showDeleteNoteModal" @close="closeDeleteNoteModal" :maxWidth="'2xl'">
        <div class="bg-[var(--surface-50)]">
          <form @submit.prevent="deleteNote">
            <div class="flex justify-between border-b border-b-[var(--surface-400)] p-6">
              <h1 class="text-[var(--surface-700)] font-semibold text-2xl">Deseja excluir esta anotação?</h1>
              <button type="button" @click="closeDeleteNoteModal"
                class="hover:text-[var(--red-500)] hover:scale-150 ease-out duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="w-10 h-10">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-6">
              <p class="text-[var(--text-color)]">Você está prestes a deletar uma anotação e esta ação não
                poderá ser desfeita. Tem certeza que deseja excluí-la?</p>
            </div>
            <div class="w-full flex gap-4 justify-end p-6">
              <button
                class="border border-[var(--surface-400)] py-3 px-4 rounded-full text-[var(--text-color)] bg-[var(--surface-0)]"
                type="button" @click="closeDeleteNoteModal">Cancelar</button>
              <button class="py-3 px-4 rounded-full text-[var(--primary-color-text)] bg-[var(--red-500)]"
                type="submit">Excluir</button>
            </div>
          </form>
        </div>
      </Modal>
      <button @click="openClearAllNotesModal"
        class="bg-[var(--red-500)] text-[var(--primary-color-text)] px-4 py-2 rounded">
        Limpar Todas as Notas
      </button>
      <Modal :show="showClearAllNotesModal" @close="closeClearAllNotesModal" :maxWidth="'2xl'">
        <div class="bg-[var(--surface-50)]">
          <form @submit.prevent="clearAllNotes">
            <div class="flex justify-between border-b border-b-[var(--surface-400)] p-6">
              <h1 class="text-[var(--surface-700)] font-semibold text-2xl">Deseja excluir todas as anotações?</h1>
              <button type="button" @click="closeClearAllNotesModal"
                class="hover:text-[var(--red-500)] hover:scale-150 ease-out duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="w-10 h-10">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-6">
              <p class="text-[var(--text-color)]">Você está prestes a deletar todas anotações e esta ação não
                poderá ser desfeita. Tem certeza que deseja excluir tudo?</p>
            </div>
            <div class="w-full flex gap-4 justify-end p-6">
              <button
                class="border border-[var(--surface-400)] py-3 px-4 rounded-full text-[var(--text-color)] bg-[var(--surface-0)]"
                type="button" @click="closeClearAllNotesModal">Cancelar</button>
              <button class="py-3 px-4 rounded-full text-[var(--primary-color-text)] bg-[var(--red-500)]"
                type="submit">Excluir</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  </aside>
  <div class="p-4 sm:ml-64 lg:ml-80 flex flex-col items-center justify-center h-screen bg-[var(--surface-50)]">
    <div class="flex flex-col justify-center items-center gap-4">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
        class="w-20 h-20 stroke-[var(--surface-400)] rotate-180">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
      </svg>
      <div class="flex flex-col items-center">
        <h1 class="text-xl lg:text-3xl text-[var(--primary-color)] font-bold">Anotações</h1>
        <span class="text-[var(--text-color)] text-center">by Speedio</span>
      </div>
      <button @click="openCreateNoteModal"
        class="bg-[var(--primary-color)] rounded-full text-[var(--primary-color-text)] px-6 py-3 text-lg font-medium flex justify-center items-center gap-2 mt-4"
        type="button">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>Criar anotação</span>
      </button>
    </div>

    <Modal :show="showCreateNoteModal" @close="closeCreateNoteModal" :maxWidth="'2xl'">
      <div class="p-4 bg-[var(--surface-100)]">
        <form @submit.prevent="submitForm">
          <div class="flex justify-between">
            <h1 class="text-[var(--surface-700)] font-semibold text-3xl">Anotações</h1>
            <button type="button" @click="closeCreateNoteModal"
              class="hover:text-[var(--red-500)] hover:scale-150 ease-out duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-10 h-10">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="grid gap-4 mt-6">
            <Textarea v-model="form.description" rows="5" cols="30" placeholder="Exp.: Ao ligar falar com Luiza"
              @blur="validateDescription" />
            <span class="text-[var(--red-500)]">{{ formErrors.descriptionError }}</span>
            <div>
              <label for="potential" class="font-bold block mb-2 text-[var(--surface-500)]">Potencial do
                negócio</label>
              <InputNumber v-model="form.potential" inputId="potential" mode="currency" currency="BRL" locale="pt-BR"
                :min="0" class="w-full custom-input" @onchange="validatePotential" @blur="validatePotential" />
              <span class="text-[var(--red-500)]">{{ formErrors.potentialError }}</span>
            </div>
            <div>
              <label for="categorization" class="font-bold block mb-2 text-[var(--surface-500)]">Categorização</label>
              <Dropdown v-model="form.categorization" :options="Object.keys(categorizations)"
                placeholder="Seleciona a categoria" inputId="categorization" class="w-full"
                @blur="validateCategorization" />
              <span class="text-[var(--red-500)]">{{ formErrors.categorizationError }}</span>
            </div>
            <div>
              <label for="reminder" class="font-bold block mb-2 text-[var(--surface-500)]">Lembrete</label>
              <Calendar v-model="form.reminder" showIcon iconDisplay="input" inputId="reminder" class="w-full"
                placeholder="Selecione uma data" showTime hourFormat="24" @blur="validateReminder"
                @onchange="validateReminder" />
              <span class="text-[var(--red-500)]">{{ formErrors.reminderError }}</span>
            </div>
            <div class="flex items-center">
              <Checkbox v-model="form.persist" inputId="persist" value="yes" />
              <label for="persist" class="ml-2 font-bold block text-[var(--surface-500)]">Persistir meus
                dados</label>
            </div>
          </div>
          <div class="flex justify-between mt-16 gap-4">
            <button type="submit" @click="closeCreateNoteModal"
              class="bg-[var(--red-500)] rounded-full text-[var(--primary-color-text)] p-4 text-lg font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
            <button type="submit"
              class="bg-[var(--primary-color)] rounded-full text-[var(--primary-color-text)] px-4 py-2 text-lg font-medium w-full">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </Modal>
    <Modal :show="showTokenModal" @close="closeTokenModal" :maxWidth="'xl'">
      <div class="bg-[var(--surface-100)]">
        <div class="flex justify-between p-4 border-b border-b-[var(--surface-400)]">
          <h1 class="text-[var(--surface-700)] font-semibold text-3xl">Token da anotação</h1>
          <button type="button" @click="closeTokenModal"
            class="hover:text-[var(--red-500)] hover:scale-150 ease-out duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-10 h-10">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4 gap-4 w-full flex flex-col justify-center items-center">
          <p class="font-medium text-lg mb-2">Guarde este token para recuperar essa anotação!</p>

          <p
            class="text-sm md:text-base font-bold bg-[var(--surface-900)] w-fit p-2 rounded-lg text-[var(--primary-color-text)] flex gap-2 md:gap-4">
            <span>{{ token }}</span>
            <button @click="copyToken">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            </button>
          </p>
        </div>

      </div>
    </Modal>
    <Modal :show="showRecoveredNoteModal" @close="closeRecoveredNoteModal" :maxWidth="'xl'">
      <div class="bg-[var(--surface-50)]">
        <div class="flex justify-between border-b border-b-[var(--surface-400)] p-4">
          <h1 class="text-[var(--surface-700)] font-semibold text-2xl">Anotação recuperada</h1>
          <button type="button" @click="closeRecoveredNoteModal"
            class="hover:text-[var(--red-500)] hover:scale-150 ease-out duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-10 h-10">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="grid gap-4 my-2 p-4">
          <Textarea v-model="recoveredNote.description" rows="5" cols="30" placeholder="Exp.: Ao ligar falar com Luiza"
            readonly />

          <div>
            <label for="potential" class="font-bold block mb-2 text-[var(--surface-500)]">Potencial do
              negócio</label>
            <InputNumber v-model="recoveredNote.potential" inputId="potential" mode="currency" currency="BRL" readonly
              locale="pt-BR" :min="0" class="w-full custom-input" />
          </div>
          <div>
            <label for="categorization" class="font-bold block mb-2 text-[var(--surface-500)]">Categorização</label>
            <InputText v-model="recoveredNote.categorization" readonly inputId="categorization" class="w-full" />

          </div>
          <div>
            <label for="reminder" class="font-bold block mb-2 text-[var(--surface-500)]">Lembrete</label>
            <Calendar v-model="recoveredNote.reminder" showIcon iconDisplay="input" inputId="reminder" class="w-full"
              placeholder="Selecione uma data" readonly="" />
          </div>
        </div>

      </div>
    </Modal>
  </div>
</template>