<template>
  <div class="dashboard">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6" v-for="item in statCards" :key="item.title">
        <el-card shadow="hover" class="stat-card" :class="'stat-' + item.type">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-value">{{ item.value }}</p>
              <p class="stat-title">{{ item.title }}</p>
            </div>
            <div class="stat-icon" :style="{ background: item.bg }">
              <el-icon :size="28" :color="item.color"><component :is="item.icon" /></el-icon>
            </div>
          </div>
          <div class="stat-footer">
            <span :class="item.trend > 0 ? 'trend-up' : 'trend-down'">
              {{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend) }}%
            </span>
            较上周
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 积分趋势图 -->
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>积分发放趋势（近7天）</span>
              <el-radio-group size="small" v-model="chartRange">
                <el-radio-button label="week">近7天</el-radio-button>
                <el-radio-button label="month">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="lineChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 礼品兑换排行 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header><span>热门礼品 TOP5</span></template>
          <div ref="barChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部区域 -->
    <el-row :gutter="20" class="bottom-row">
      <!-- 最近签到记录 -->
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近签到记录</span>
              <el-link type="primary" @click="$router.push('/students')">查看全部 →</el-link>
            </div>
          </template>
          <el-table :data="recentCheckins" stripe size="small">
            <el-table-column prop="time" label="时间" width="160" />
            <el-table-column prop="name" label="学员姓名" width="120" />
            <el-table-column prop="type" label="签到类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.type === '上课' ? '' : 'success'" size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="获得积分" width="100">
              <template #default="{ row }">
                <span style="color: #67c23a; font-weight: 600;">+{{ row.points }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作店员" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 待处理事项 -->
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header><span>待处理事项</span></template>
          <div class="todo-list">
            <div
              v-for="(todo, idx) in todoList"
              :key="idx"
              class="todo-item"
              @click="$router.push(todo.path)"
            >
              <el-icon :size="18" :color="todo.color"><component :is="todo.icon" /></el-icon>
              <div class="todo-info">
                <span class="todo-text">{{ todo.text }}</span>
                <span class="todo-count">{{ todo.count }} 条</span>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'

const lineChartRef = ref(null)
const barChartRef = ref(null)
const chartRange = ref('week')
let lineChart = null
let barChart = null

// 统计卡片
const statCards = ref([
  { title: '总学员数', value: '1,286', icon: 'User', color: '#409eff', bg: '#ecf5ff', type: 'blue', trend: 8.2 },
  { title: '今日签到', value: '42', icon: 'Calendar', color: '#67c23a', bg: '#f0f9eb', type: 'green', trend: 15.3 },
  { title: '今日发放积分', value: '+520', icon: 'Coin', color: '#e6a23c', bg: '#fdf6ec', type: 'orange', trend: -3.1 },
  { title: '待发货订单', value: '7', icon: 'Van', color: '#f56c6c', bg: '#fef0f0', type: 'red', trend: 0 },
])

// 最近签到
const recentCheckins = ref([
  { time: '2026-04-16 17:30', name: '张小明', type: '上课', points: 10, operator: '李教练' },
  { time: '2026-04-16 17:15', name: '王小红', type: '体验课', points: 20, operator: '李教练' },
  { time: '2026-04-16 16:45', name: '赵小刚', type: '上课', points: 10, operator: '王教练' },
  { time: '2026-04-16 16:30', name: '孙小美', type: '上课', points: 10, operator: '李教练' },
  { time: '2026-04-16 16:00', name: '周小龙', type: '补签', points: 5, operator: '管理员' },
])

// 待办事项
const todoList = ref([
  { text: '待发货订单', count: 7, icon: 'Van', color: '#f56c6c', path: '/orders' },
  { text: '待审核调账申请', count: 2, icon: 'EditPen', color: '#e6a23c', path: '/points' },
  { text: '库存不足的礼品', count: 3, icon: 'Warning', color: '#f56c6c', path: '/goods' },
  { text: '本周未签到学员', count: 28, icon: 'WarningFilled', color: '#e6a23c', path: '/students' },
])

function initLineChart() {
  if (!lineChartRef.value) return
  lineChart = echarts.init(lineChartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['4/10', '4/11', '4/12', '4/13', '4/14', '4/15', '4/16'],
      axisLine: { lineStyle: { color: '#ddd' } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        name: '发放积分',
        type: 'line',
        smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255,107,53,0.3)' },
          { offset: 1, color: 'rgba(255,107,53,0.02)' },
        ])},
        lineStyle: { color: '#ff6b35', width: 3 },
        itemStyle: { color: '#ff6b35' },
        data: [420, 380, 550, 480, 620, 510, 520],
      },
      {
        name: '消耗积分',
        type: 'line',
        smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64,158,255,0.3)' },
          { offset: 1, color: 'rgba(64,158,255,0.02)' },
        ])},
        lineStyle: { color: '#409eff', width: 3 },
        itemStyle: { color: '#409eff' },
        data: [180, 220, 310, 260, 380, 290, 340],
      },
    ],
  }
  lineChart.setOption(option)
}

function initBarChart() {
  if (!barChartRef.value) return
  barChart = echarts.init(barChartRef.value)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '12%', bottom: '3%', top: '6%', containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0' } } },
    yAxis: {
      type: 'category',
      data: ['运动袜套装', '免费私教课', '限定樱花板面', '定制T恤', '护具套装'],
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      barWidth: 20,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#ff6b35' },
          { offset: 1, color: '#f7931e' },
        ]),
      },
      data: [68, 52, 41, 38, 32],
    }],
  }
  barChart.setOption(option)
}

onMounted(() => {
  nextTick(() => {
    initLineChart()
    initBarChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  barChart?.dispose()
})

function handleResize() {
  lineChart?.resize()
  barChart?.resize()
}
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
}
.stat-cards { margin-bottom: 20px; }
.stat-card {
  border-radius: 10px;
  border: none;
  transition: transform 0.3s;
}
.stat-card:hover {
  transform: translateY(-4px);
}
.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}
.stat-title {
  font-size: 13px;
  color: #999;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #999;
}
.trend-up { color: #67c23a; font-weight: 600; }
.trend-down { color: #f56c6c; font-weight: 600; }

.chart-row { margin-bottom: 20px; }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chart-container {
  height: 320px;
}

.bottom-row .el-card { border-radius: 10px; }

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.todo-item:hover {
  background: #f5f7fa;
}
.todo-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
}
.todo-text {
  font-size: 14px;
  color: #333;
}
.todo-count {
  font-size: 14px;
  font-weight: 600;
  color: #ff6b35;
}
</style>
