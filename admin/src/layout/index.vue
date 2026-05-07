<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo-container">
        <span v-if="!isCollapse" class="logo-text">🛹 滑板公社</span>
        <span v-else class="logo-icon">🛹</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :router="true"
        background-color="#1a1a2e"
        text-color="#bfcbd9"
        active-text-color="#ff6b35"
        class="aside-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据大盘</template>
        </el-menu-item>

        <el-menu-item index="/students">
          <el-icon><User /></el-icon>
          <template #title>学员管理</template>
        </el-menu-item>

        <el-menu-item index="/points">
          <el-icon><Coin /></el-icon>
          <template #title>积分管理</template>
        </el-menu-item>

        <el-menu-item index="/goods">
          <el-icon><Gift /></el-icon>
          <template #title>礼品管理</template>
        </el-menu-item>

        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>

        <el-menu-item index="/staff">
          <el-icon><Avatar /></el-icon>
          <template #title>店员管理</template>
        </el-menu-item>

        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧主体 -->
    <el-container class="main-container">
      <!-- 顶栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon
            class="collapse-btn"
            @click="isCollapse = !isCollapse"
            :size="20"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="3" :max="99" class="notify-badge">
            <el-icon :size="18"><Bell /></el-icon>
          </el-badge>
          <el-dropdown trigger="click">
            <span class="user-dropdown">
              <el-avatar :size="32" src="" style="background: #ff6b35; color: #fff;">管</el-avatar>
              <span class="username">管理员</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>修改密码</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')

function handleLogout() {
  localStorage.removeItem('admin_token')
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

/* ====== 侧边栏 ====== */
.layout-aside {
  background-color: #1a1a2e;
  transition: width 0.3s;
  overflow-x: hidden;
}
.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}
.logo-icon {
  font-size: 24px;
}
.aside-menu {
  border-right: none !important;
}
.aside-menu:not(.el-menu--collapse) {
  width: 220px;
}

/* ====== 顶栏 ====== */
.layout-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  z-index: 10;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.collapse-btn {
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}
.collapse-btn:hover {
  color: #ff6b35;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}
.notify-badge {
  cursor: pointer;
  color: #666;
}
.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #333;
}
.username {
  font-size: 14px;
  font-weight: 500;
}

/* ====== 内容区 ====== */
.layout-main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
