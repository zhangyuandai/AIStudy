<template>
  <div class="page-container">
    <!-- Tab 切换 -->
    <el-card shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="调账记录" name="adjust" />
        <el-tab-pane label="积分流水" name="history" />
      </el-tabs>

      <!-- 调账记录 -->
      <div v-show="activeTab === 'adjust'">
        <el-form :model="query" inline size="default" style="margin-bottom: 16px;">
          <el-form-item label="操作人">
            <el-input v-model="query.operator" placeholder="店员姓名" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item label="操作类型">
            <el-select v-model="query.type" placeholder="全部" clearable style="width: 130px">
              <el-option label="补录" value="add" />
              <el-option label="扣除" value="deduct" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="query.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 260px"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search">查询</el-button>
            <el-button icon="Refresh">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="adjustRecords" stripe size="default" v-loading="loading">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="time" label="操作时间" width="170" sortable />
          <el-table-column label="学员信息" min-width="180">
            <template #default="{ row }">
              {{ row.studentName }}（{{ row.phone }}）
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="操作人" width="100" />
          <el-table-column prop="type" label="类型" width="90">
            <template #default="{ row }">
              <el-tag :type="row.type === 'add' ? 'success' : 'danger'" size="small">
                {{ row.type === 'add' ? '补录' : '扣除' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="积分变动" width="110">
            <template #default="{ row }">
              <span :style="{ color: row.type === 'add' ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
                {{ row.type === 'add' ? '+' : '-' }}{{ row.amount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default>
              <el-button link type="primary" size="small">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 积分流水 -->
      <div v-show="activeTab === 'history'">
        <el-form :model="historyQuery" inline size="default" style="margin-bottom: 16px;">
          <el-form-item label="学员">
            <el-input v-model="historyQuery.studentName" placeholder="姓名或手机号" clearable style="width: 180px" />
          </el-form-item>
          <el-form-item label="来源">
            <el-select v-model="historyQuery.source" placeholder="全部" clearable style="width: 150px">
              <el-option label="签到上课" value="checkin_lesson" />
              <el-option label="连续签到奖励" value="streak_bonus" />
              <el-option label="月度奖励" value="monthly_bonus" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search">查询</el-button>
            <el-button icon="Download">导出</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="historyRecords" stripe size="default" v-loading="loading">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="time" label="时间" width="170" sortable />
          <el-table-column prop="studentName" label="学员" width="120" />
          <el-table-column prop="sourceLabel" label="来源" width="140" />
          <el-table-column prop="amount" label="积分变动" width="110">
            <template #default="{ row }">
              <span :style="{ color: row.amount > 0 ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
                {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balanceAfter" label="余额" width="120">
            <template #default="{ row }">
              <span style="color: #ff6b35; font-weight: 500;">{{ row.balanceAfter }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const activeTab = ref('adjust')
const loading = ref(false)

const query = reactive({ operator: '', type: '', dateRange: null })
const historyQuery = reactive({ studentName: '', source: '' })

const adjustRecords = ref([
  { id: 'A001', time: '2026-04-16 16:00', studentName: '周小龙', phone: '135****3333', operator: '管理员', type: 'deduct', amount: 10, reason: '重复签到，撤销多余积分' },
  { id: 'A002', time: '2026-04-15 18:30', studentName: '郑小强', phone: '159****1111', operator: '李教练', type: 'add', amount: 20, reason: '活动参与奖励补发' },
  { id: 'A003', time: '2026-04-14 17:00', studentName: '冯小雨', phone: '188****9999', operator: '王教练', type: 'add', amount: 30, reason: '新学员首月签到奖励' },
  { id: 'A004', time: '2026-04-13 12:20', studentName: '赵小刚', phone: '137****5555', operator: '李教练', type: 'deduct', amount: 100, reason: '违规使用积分，按规则扣减' },
  { id: 'A005', time: '2026-04-12 19:00', studentName: '孙小美', phone: '136****4444', operator: '管理员', type: 'add', amount: 50, reason: '投诉处理补偿' },
])

const historyRecords = ref([
  { id: 'H001', time: '2026-04-16 17:30', studentName: '张小明', sourceLabel: '签到上课', amount: 10, balanceAfter: 1290, remark: '' },
  { id: 'H002', time: '2026-04-16 17:15', studentName: '王小红', sourceLabel: '体验课签到', amount: 20, balanceAfter: 2580, remark: '' },
  { id: 'H003', time: '2026-04-16 16:45', studentName: '赵小刚', sourceLabel: '签到上课', amount: 10, balanceAfter: 330, remark: '' },
  { id: 'H004', time: '2026-04-16 15:00', studentName: '吴小丽', sourceLabel: '兑换消耗', amount: -500, balanceAfter: 4200, remark: '兑换限定樱花板面' },
  { id: 'H005', time: '2026-04-16 14:00', studentName: '张小明', sourceLabel: '连续签到7天', amount: 20, balanceAfter: 1280, remark: '连续签到奖励' },
  { id: 'H006', time: '2026-04-15 18:00', studentName: '郑小强', sourceLabel: '签到上课', amount: 10, balanceAfter: 750, remark: '' },
  { id: 'H007', time: '2026-04-15 17:30', studentName: '王小红', sourceLabel: '兑换消耗', amount: -200, balanceAfter: 2560, remark: '兑换定制T恤' },
  { id: 'H008', time: '2026-04-15 09:00', studentName: '周小龙', sourceLabel: '月度活跃奖', amount: 30, balanceAfter: 160, remark: '4月月度奖励发放' },
])

function handleTabChange() {
  // 切换 tab 时可重新加载数据
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
</style>
