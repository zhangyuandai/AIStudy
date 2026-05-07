<template>
  <div class="page-container">
    <!-- 积分规则配置 -->
    <el-card shadow="never" class="section-card">
      <template #header><span>⚡ 积分规则配置</span></template>

      <el-form :model="pointsConfig" label-width="160px" size="default">
        <el-divider content-position="left">签到积分</el-divider>
        <el-form-item label="单次上课签到">
          <el-input-number v-model="pointsConfig.checkinLesson" :min="0" :max="100" />
          <span class="form-suffix">分</span>
        </el-form-item>
        <el-form-item label="体验课签到">
          <el-input-number v-model="pointsConfig.checkinTrial" :min="0" :max="100" />
          <span class="form-suffix">分</span>
        </el-form-item>
        <el-form-item label="连续签到3天奖励">
          <el-input-number v-model="pointsConfig.streak3" :min="0" :max="200" />
          <span class="form-suffix">分（额外）</span>
        </el-form-item>
        <el-form-item label="连续签到7天奖励">
          <el-input-number v-model="pointsConfig.streak7" :min="0" :max="500" />
          <span class="form-suffix">分（额外）</span>
        </el-form-item>

        <el-divider content-position="left">等级体系</el-divider>
        <div style="margin-bottom: 16px;">
          <el-table :data="levelList" border size="small" style="width: 500px;">
            <el-table-column prop="name" label="等级名称" width="140" />
            <el-table-column prop="minPoints" label="所需累计积分" width="150">
              <template #default="{ row, $index }">
                <el-input-number v-model="row.minPoints" :min="$index > 0 ? levelList[$index - 1].minPoints + 1 : 0" size="small" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column prop="color" label="标识色" width="120">
              <template #default="{ row }">
                <el-color-picker v-model="row.color" size="small" />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-divider content-position="left">其他</el-divider>
        <el-form-item label="积分有效期">
          <el-radio-group v-model="pointsConfig.expiryType">
            <el-radio value="never">永不过期</el-radio>
            <el-radio value="yearly">每年清零</el-radio>
            <el-radio value="custom">自定义天数</el-radio>
          </el-radio-group>
          <el-input-number v-if="pointsConfig.expiryType === 'custom'" v-model="pointsConfig.expiryDays" :min="30" :max="1095" style="margin-left: 12px;" />
          <span v-if="pointsConfig.expiryType === 'custom'" class="form-suffix">天后过期</span>
        </el-form-item>
        <el-form-item label="每日签到时间范围">
          <el-time-picker
            v-model="pointsConfig.startTime"
            placeholder="开始"
            value-format="HH:mm"
            style="width: 130px;"
          />
          <span style="margin: 0 8px;">至</span>
          <el-time-picker
            v-model="pointsConfig.endTime"
            placeholder="结束"
            value-format="HH:mm"
            style="width: 130px;"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 商城设置 -->
    <el-card shadow="never" class="section-card">
      <template #header><span>🎁 商城设置</span></template>
      <el-form :model="mallConfig" label-width="160px" size="default">
        <el-form-item label="商城状态">
          <el-switch v-model="mallConfig.enabled" active-text="开启" inactive-text="关闭" inline-prompt />
        </el-form-item>
        <el-form-item label="每人每日兑换上限">
          <el-input-number v-model="mallConfig.dailyLimit" :min="0" :max="50" />
          <span class="form-suffix">次（0 = 不限）</span>
        </el-form-item>
        <el-form-item label="实物商品默认运费">
          <el-input-number v-model="mallConfig.defaultShipping" :min="0" :max="50" />
          <span class="form-suffix">元</span>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 系统信息 -->
    <el-card shadow="never" class="section-card">
      <template #header><span>ℹ️ 系统信息</span></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
        <el-descriptions-item label="部署环境">{{ envInfo.env }}</el-descriptions-item>
        <el-descriptions-item label="学员总数">{{ envInfo.studentCount }}</el-descriptions-item>
        <el-descriptions-item label="店员总数">{{ envInfo.staffCount }}</el-descriptions-item>
        <el-descriptions-item label="今日签到">{{ envInfo.todayCheckin }}</el-descriptions-item>
        <el-descriptions-item label="待处理订单">{{ envInfo.pendingOrders }}</el-descriptions-item>
        <el-descriptions-item label="数据库大小">{{ envInfo.dbSize }}</el-descriptions-item>
        <el-descriptions-item label="最后备份">{{ envInfo.lastBackup }}</el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 20px; display: flex; gap: 12px;">
        <el-button type="primary" @click="handleSave" :loading="saving">
          💾 保存所有配置
        </el-button>
        <el-button @click="handleBackup">📦 备份数据库</el-button>
        <el-button @click="handleExport">📤 导出数据</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const saving = ref(false)

// 积分规则
const pointsConfig = reactive({
  checkinLesson: 10,
  checkinTrial: 20,
  streak3: 10,
  streak7: 20,
  expiryType: 'never',
  expiryDays: 365,
  startTime: '09:00',
  endTime: '22:00',
})

const levelList = ref([
  { name: '青铜滑手', minPoints: 0, color: '#909399' },
  { name: '白银骑士', minPoints: 500, color: '#e6a23c' },
  { name: '黄金大师', minPoints: 2000, color: '#f56c6c' },
  { name: '钻石传奇', minPoints: 6000, color: '#ff6b35' },
])

// 商城设置
const mallConfig = reactive({
  enabled: true,
  dailyLimit: 3,
  defaultShipping: 0,
})

// 系统信息
const envInfo = reactive({
  env: '开发环境',
  studentCount: '1,286',
  staffCount: '4',
  todayCheckin: '42',
  pendingOrders: '7',
  dbSize: '12.8 MB',
  lastBackup: '2026-04-16 02:00',
})

function handleSave() {
  saving.value = true
  setTimeout(() => {
    saving.value = false
    ElMessage.success('配置保存成功')
  }, 800)
}

function handleBackup() {
  ElMessageBox.confirm('确认备份数据库？预计耗时约 2 分钟。', '数据库备份', {
    confirmButtonText: '立即备份',
    cancelButtonText: '取消',
    type: 'info',
  }).then(() => {
    ElMessage.success('数据库备份任务已启动，完成后将通知您')
  }).catch(() => {})
}

function handleExport() {
  ElMessage.info('数据导出功能开发中')
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; max-width: 900px; }
.section-card { border-radius: 10px; }
.form-suffix { margin-left: 8px; color: #999; font-size: 13px; }
</style>
