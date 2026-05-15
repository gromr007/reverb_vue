<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="container mx-auto px-4 py-8">
      <!-- Шапка -->
      <header class="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div class="flex items-center space-x-4">
            <a href="https://vite.dev" target="_blank" rel="noreferrer">
              <img src="https://vite.dev/logo.svg" class="logo h-10 w-auto hover:scale-110 transition-transform" alt="Vite logo" />
            </a>
            <a href="https://vuejs.org" target="_blank" rel="noreferrer">
              <img src="https://vuejs.org/logo.svg" class="logo react h-10 w-auto hover:scale-110 transition-transform" alt="Vue logo" />
            </a>
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Vue Chat + Laravel Echo
              </h1>
              <p class="text-gray-600">Реальное время с WebSocket соединением</p>
            </div>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <!-- Правая колонка - статус -->
        <div class="space-y-8">
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">📊 Статистика</h2>
            <div class="space-y-4">
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span class="text-gray-600">ID пользователя:</span>
                <span class="font-bold text-blue-600">{{ chatData.authUserId || '—' }}</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span class="text-gray-600">ID комнаты:</span>
                <span class="font-bold text-purple-600">{{ chatData.chatRoomId || '—' }}</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span class="text-gray-600">Сообщений:</span>
                <span class="font-bold text-green-600">{{ chatData.oldMessages.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Левая колонка - настройки окружения -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">🔧 Настройки окружения</h2>
            <div class="space-y-3 text-sm font-mono bg-gray-50 p-4 rounded-lg">
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-600">VITE_API_URL:</span>
                <span class="font-bold">{{ env.VITE_API_URL || 'Не задано' }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-600">VITE_WS_HOST:</span>
                <span class="font-bold">{{ env.VITE_WS_HOST || 'localhost' }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-600">VITE_WS_PORT:</span>
                <span class="font-bold">{{ env.VITE_WS_PORT || '6001' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Токен:</span>
                <span :class="`font-bold ${hasToken ? 'text-green-600' : 'text-red-600'}`">
                                    {{ hasToken ? 'Установлен' : 'Отсутствует' }}
                                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Чат -->
      <div v-if="showChat" class="animate-fadeIn">
        <div v-if="isLoading" class="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Загрузка чата...</p>
        </div>

        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div class="flex items-center space-x-3 text-red-700">
            <span class="text-2xl">⚠️</span>
            <div>
              <p class="font-bold">{{ error }}</p>
              <p class="text-sm mt-1">Используются демо-данные</p>
            </div>
          </div>
          <Chat
            :authUserId="chatData.authUserId"
            :chatRoomId="chatData.chatRoomId"
            :oldMessages="chatData.oldMessages"
            :setTestToken="setTestToken"
          />
        </div>

        <div v-else>
          <Chat
            :authUserId="chatData.authUserId"
            :chatRoomId="chatData.chatRoomId"
            :oldMessages="chatData.oldMessages"
          />
        </div>
      </div>

      <!-- Футер -->
      <footer class="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>Vue Chat + Laravel Echo Demo • Реальное время с WebSocket</p>
        <p class="mt-2">
          <a
            href="https://laravel.com/docs/broadcasting"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline"
          >
            Laravel Broadcasting Docs
          </a>
          {{ ' • ' }}
          <a
            href="https://github.com/laravel/echo"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline"
          >
            Laravel Echo GitHub
          </a>
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import Chat from '../components/Chat.vue'

const count = ref(0)
const showChat = ref(true)
const isLoading = ref(true)
const error = ref(null)
const hasToken = ref(false)

const chatData = ref({
  authUserId: null,
  chatRoomId: null,
  oldMessages: []
})

// Создаем computed свойство для доступа к переменным окружения
const env = computed(() => ({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_HOST: import.meta.env.VITE_WS_HOST,
  VITE_WS_PORT: import.meta.env.VITE_WS_PORT,
  VITE_WSS_PORT: import.meta.env.VITE_WSS_PORT,
  VITE_PUSHER_APP_KEY: import.meta.env.VITE_PUSHER_APP_KEY,
  VITE_TOKEN_CHAT_BACK: import.meta.env.VITE_TOKEN_CHAT_BACK
}))

const authToken = import.meta.env.VITE_TOKEN_CHAT_BACK

const checkToken = () => {
  try {
    hasToken.value = !!localStorage.getItem('vue_auth_token')
  } catch (e) {
    hasToken.value = false
  }
}

const loadChatData = async () => {
  try {
    isLoading.value = true
    error.value = null
    let token = null

    try {
      token = localStorage.getItem('vue_auth_token')
    } catch (e) {
      console.warn('LocalStorage недоступен:', e)
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/chat/1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        withCredentials: false,
      }
    )

    chatData.value = {
      authUserId: response.data.user_id || 1,
      chatRoomId: response.data.chat_room_id || 1,
      oldMessages: response.data.messages || []
    }
  } catch (err) {
    console.error('Ошибка загрузки данных чата:', err)
    error.value = 'Не удалось загрузить данные чата'

    // Демо данные на случай ошибки
    chatData.value = {
      authUserId: 1,
      chatRoomId: 1,
      oldMessages: [
        {
          id: 1,
          text: "Добро пожаловать в чат!",
          from: { id: 1, name: "Система" },
          created_at: new Date().toISOString()
        }
      ]
    }
  } finally {
    isLoading.value = false
  }
}

const setTestToken = () => {
  if (authToken) {
    try {
      localStorage.setItem('vue_auth_token', authToken)
      hasToken.value = true
      alert('Токен установлен!')
      window.location.reload()
    } catch (e) {
      alert('Ошибка при установке токена: ' + e.message)
    }
  } else {
    alert('Токен не найден в окружении')
  }
}

const debugConnection = () => {
  console.log('Connection debug:', window.Echo)
}

onMounted(() => {
  checkToken()
  loadChatData()
})
</script>

<style scoped>
.logo {
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

/* Кастомный скроллбар для окна чата */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Кнопка чата */
button {
  transition: all 0.2s ease;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Улучшенные стили для инпутов */
input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
