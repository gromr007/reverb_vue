import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// ==================== АВТООЧИСТКА ПЕРЕД ЗАПУСКОМ ====================
const initializeApp = () => {
  console.log('🚀 Инициализация Vue приложения...')

  // 0. Очищаем ВСЁ хранилище этого приложения
  const appPrefix = 'vue_chat_'
  const keysToKeep = [] // Ключи которые НЕ нужно удалять

  Object.keys(localStorage).forEach(key => {
    // Удаляем все ключи связанные с приложением
    if (key.startsWith(appPrefix) ||
      key === 'vue_auth_token' ||
      key.includes('token') ||
      key.includes('auth') ||
      key.includes('chat')) {

      if (!keysToKeep.includes(key)) {
        console.log(`🗑️ Удаляю: ${key}`)
        localStorage.removeItem(key)
      }
    }
  })

  // 2. Очищаем sessionStorage
  sessionStorage.clear()

  // 3. Устанавливаем НОВЫЙ токен из .env
  const newToken = import.meta.env.VITE_TOKEN_CHAT_BACK
  if (newToken) {
    console.log('✅ Устанавливаю новый токен из .env')
    localStorage.setItem('vue_auth_token', newToken)
  } else {
    console.warn('⚠️ VITE_TOKEN_CHAT_BACK не найден в .env')
  }

  // 4. Добавляем метку времени
  localStorage.setItem('app_start_time', Date.now().toString())

  console.log('✅ Очистка завершена, запускаю Vue...')
}

// Вызываем очистку перед созданием приложения
initializeApp()


const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
