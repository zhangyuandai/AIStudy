<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <span class="login-logo">🛹</span>
        <h2 class="login-title">滑板公社</h2>
        <p class="login-subtitle">后台管理系统</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入管理员账号"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住登录</el-checkbox>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <p class="login-tip">演示账号: admin / admin123</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const rememberMe = ref(true)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true

  // 模拟登录（实际对接后端 API）
  setTimeout(() => {
    if (form.username === 'admin' && form.password === 'admin123') {
      localStorage.setItem('admin_token', 'mock_token_' + Date.now())
      localStorage.setItem('admin_user', JSON.stringify({
        username: 'admin',
        name: '系统管理员',
        role: 'super_admin',
      }))
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error('账号或密码错误')
    }
    loading.value = false
  }, 800)
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
.login-card {
  width: 420px;
  padding: 48px 40px 36px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.login-header {
  text-align: center;
  margin-bottom: 36px;
}
.login-logo {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}
.login-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}
.login-subtitle {
  color: #999;
  font-size: 14px;
}
.login-options {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  border: none;
}
.login-btn:hover {
  opacity: 0.9;
}
.login-tip {
  text-align: center;
  color: #bbb;
  font-size: 12px;
  margin-top: 20px;
}
</style>
