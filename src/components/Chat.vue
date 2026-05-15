<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
      <div class="bg-white overflow-hidden shadow-lg sm:rounded-xl">
        <div class="p-6">
          <!-- Заголовок и статус -->
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-800">Чат комната #{{ chatRoomId }}</h2>
              <p class="text-gray-600 mt-1">
                Пользователь ID: {{ authUserId }}
              </p>
            </div>

            <div class="flex items-center space-x-3">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full animate-pulse" :class="isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
                <span class="text-sm font-medium" :class="isConnected ? 'text-green-600' : 'text-red-600'">
                                    {{ isConnected ? 'ONLINE' : 'OFFLINE' }}
                                </span>
              </div>

              <button
                @click="reconnect"
                class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Переподключить
              </button>
            </div>
          </div>

          <!-- Контейнер сообщений -->
          <div class="mb-6 p-4 border border-gray-200 rounded-xl h-[500px] overflow-y-auto bg-gradient-to-b from-gray-50 to-white flex flex-col">
            <div v-if="Object.keys(groupedMessages).length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div class="text-4xl mb-4">💬</div>
              <p class="text-lg">Нет сообщений</p>
              <p class="text-sm mt-2">Начните общение первым!</p>
            </div>

            <div v-for="[date, dateMessages] in Object.entries(groupedMessages)" :key="date" class="mb-6">
              <!-- Дата-разделитель -->
              <div class="flex items-center justify-center my-4">
                <div class="flex-1 h-px bg-gray-300"></div>
                <span class="mx-4 px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                                    {{ date }}
                                </span>
                <div class="flex-1 h-px bg-gray-300"></div>
              </div>

              <!-- Сообщения за эту дату -->
              <div v-for="message in dateMessages" :key="message.id" class="mb-4 flex"
                   :style="{ justifyContent: isMyMessage(message) ? 'flex-end' : 'flex-start' }">
                <div class="max-w-[75%] lg:max-w-[65%]">
                  <div class="flex flex-col"
                       :style="{ alignItems: isMyMessage(message) ? 'flex-end' : 'flex-start' }">
                    <!-- Имя пользователя и время -->
                    <div class="flex items-center space-x-2 mb-1">
                                            <span class="text-sm font-semibold text-gray-700">
                                                {{ message.from.name }}
                                            </span>
                      <span class="text-xs text-gray-500">
                                                {{ formatTime(message.created_at) }}
                                            </span>
                    </div>

                    <!-- Текст сообщения -->
                    <div class="p-4 border shadow-sm rounded-2xl"
                         :class="isMyMessage(message)
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 rounded-br-sm'
                                                : 'bg-gradient-to-r from-gray-100 to-white text-gray-800 border-gray-200 rounded-bl-sm'">
                      <p class="break-words">{{ message.text }}</p>
                    </div>

                    <!-- Статус отправки (только для своих сообщений) -->
                    <div v-if="isMyMessage(message)" class="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                      <span>✓</span>
                      <span>Доставлено</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div ref="messagesEndRef"></div>
          </div>

          <!-- Форма отправки сообщения -->
          <form @submit.prevent="sendMessage" class="flex space-x-3">
            <div class="flex-1 relative">
              <input
                type="text"
                v-model="messageInput"
                placeholder="Введите сообщение..."
                class="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200"
                required
                :disabled="isLoading"
                @keydown.enter.prevent="sendMessage"
              />
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                ↵ Enter для отправки
              </div>
            </div>
            <button
              type="submit"
              class="px-8 py-4 font-semibold rounded-xl whitespace-nowrap transition-all duration-200 flex items-center justify-center min-w-[120px]"
              :class="isLoading || !messageInput.trim()
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'"
              :disabled="isLoading || !messageInput.trim()"
            >
              <svg v-if="isLoading" class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'Отправка...' : 'Отправить' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import axios from 'axios'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

const env = computed(() => ({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_HOST: import.meta.env.VITE_WS_HOST,
  VITE_WS_PORT: import.meta.env.VITE_WS_PORT
}))

const props = defineProps({
  authUserId: {
    type: Number,
    required: true
  },
  chatRoomId: {
    type: Number,
    required: true
  },
  oldMessages: {
    type: Array,
    default: () => []
  },
  setTestToken: {
    type: Function,
    default: null
  }
})

const messageInput = ref('')
const messages = ref([...props.oldMessages])
const isConnected = ref(false)
const isLoading = ref(false)
const echo = ref(null)
const messagesEndRef = ref(null)

const token = localStorage.getItem('vue_auth_token')

// Группировка сообщений по дате
const groupedMessages = computed(() => {
  return messages.value.reduce((groups, message) => {
    const date = formatDate(message.created_at)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})
})

const initEcho = () => {
  console.log('Инициализация Laravel Echo...')

  window.Pusher = Pusher

  const echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'llocall',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'mt1',
    wsPort: import.meta.env.VITE_REVERB_PORT || 6001,
    wssPort: import.meta.env.VITE_REVERB_PORT || 6001,
    forceTLS: false,  // ИЗМЕНИТЕ НА false
    encrypted: true,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_URL}/api/broadcasting/auth`,
    auth: {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
      },
    },
    logToConsole: true,
	  withCredentials: false,
	  credentials: 'omit'
  })

  echo.value = echoInstance
  return echoInstance
}

const subscribeToChannel = (echoInstance) => {
  if (!echoInstance || !props.chatRoomId) return

  console.log(`Подписка на канал: chat.${props.chatRoomId}`)

  try {
    const channel = echoInstance.join(`chat.${props.chatRoomId}`)

    channel
      .here((users) => {
        console.log('✅ Пользователи онлайн:', users)
        isConnected.value = true
      })
      .joining((user) => {
        console.log('👤 Пользователь присоединился:', user)
      })
      .leaving((user) => {
        console.log('👋 Пользователь вышел:', user)
      })
      .listen('NewMessage', (event) => {
        console.log('📩 Новое сообщение:', event)
        messages.value.push({
          id: event.id || Date.now(),
          text: event.message,
          from: event.user,
          created_at: event.created_at || new Date().toISOString()
        })
      })
      .listen('MessageSent', (event) => {
        console.log('✉️ Сообщение отправлено:', event)
      })
      .error((error) => {
        console.error('❌ Ошибка канала:', error)
        isConnected.value = false
      })

    echoInstance.connector.pusher.connection.bind('connected', () => {
      console.log('✅ WebSocket подключен')
      isConnected.value = true
    })

    echoInstance.connector.pusher.connection.bind('disconnected', () => {
      console.log('⚠️ WebSocket отключен')
      isConnected.value = false
    })

    echoInstance.connector.pusher.connection.bind('error', (error) => {
      console.error('❌ Ошибка соединения:', error)
      isConnected.value = false
    })

  } catch (error) {
    console.error('❌ Ошибка подписки на канал:', error)
  }
}

const reconnect = () => {
  if (echo.value) {
    echo.value.disconnect()
    setTimeout(() => {
      const newEcho = initEcho()
      subscribeToChannel(newEcho)
    }, 1000)
  }
}

const sendMessage = async () => {
  if (!messageInput.value.trim() || isLoading.value) return

  isLoading.value = true

  // Вызываем функцию перезагрузки если она передана
  if (props.setTestToken) {
    await props.setTestToken()
    console.log('yes');
  }

  // ОЧИСТКА КУК ПЕРЕД ОТПРАВКОЙ
  clearCookiesBeforeRequest()

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/send_message`,
      {
        chat_room_id: props.chatRoomId,
        message: messageInput.value,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: false,
      }
    )

    console.log('Сообщение отправлено:', response.data)
    messageInput.value = ''

  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error)

    // Если API недоступно, добавляем сообщение локально для демо
    if (error.response?.status === 0 || error.code === 'ERR_NETWORK') {
      console.warn('API недоступно, добавляем сообщение локально')
      const newMessage = {
        id: Date.now(),
        text: messageInput.value,
        from: {
          id: props.authUserId,
          name: 'Вы'
        },
        created_at: new Date().toISOString()
      }
      messages.value.push(newMessage)
      messageInput.value = ''
    }
  } finally {
    isLoading.value = false
  }
}

// Функция очистки кук перед запросом
const clearCookiesBeforeRequest = () => {
  const forbiddenCookies = ['laravel-session', 'laravel_session', 'XSRF-TOKEN']

  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim()
    if (forbiddenCookies.includes(name)) {
      console.log(`🚫 Удаляю куку перед запросом: ${name}`)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${import.meta.env.REVERB_HOST}`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${import.meta.env.REVERB_HOST}`
    }
  })
}

const formatTime = (dateString) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch {
    return new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Вчера'
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
}

const isMyMessage = (message) => {
  return Number(message.from.id) === Number(props.authUserId)
}

// Автоскролл к новым сообщениям
watch(() => messages.value.length, async () => {
  await nextTick()
  messagesEndRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  })
})

onMounted(() => {
  if (!props.chatRoomId || !props.authUserId) {
    console.warn('Не указаны chatRoomId или authUserId')
    return
  }

  const echoInstance = initEcho()
  subscribeToChannel(echoInstance)
})

onUnmounted(() => {
  if (echo.value) {
    console.log('Очистка Echo соединения')
    echo.value.leave(`chat.${props.chatRoomId}`)
    echo.value.disconnect()
  }
})
</script>

<style scoped>
/* Кастомный скроллбар */
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
</style>
