<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline size="default">
        <el-form-item label="学员姓名">
          <el-input v-model="query.name" placeholder="输入姓名搜索" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="query.phone" placeholder="输入手机号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="query.level" placeholder="全部" clearable style="width: 140px">
            <el-option label="青铜滑手" :value="1" />
            <el-option label="白银骑士" :value="2" />
            <el-option label="黄金大师" :value="3" />
            <el-option label="钻石传奇" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="活跃" value="active" />
            <el-option label=" dormant" value="dormant" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>学员列表</span>
          <span class="table-info">共 {{ total }} 名学员</span>
        </div>
      </template>

      <el-table :data="studentList" stripe v-loading="loading" size="default">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="学员信息" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="36" :src="row.avatar">{{ row.name[0] }}</el-avatar>
              <div class="user-info">
                <span class="user-name">{{ row.name }}</span>
                <span class="user-phone">{{ row.phone }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="levelName" label="等级" width="120">
          <template #default="{ row }">
            <el-tag :type="levelTagType(row.level)" size="small">{{ row.levelName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="可用积分" width="110" sortable>
          <template #default="{ row }">
            <span style="color: #ff6b35; font-weight: 600;">{{ row.points.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalEarned" label="累计获得" width="110" sortable />
        <el-table-column prop="checkinStreak" label="连续签到" width="100" sortable>
          <template #default="{ row }">
            <span v-if="row.checkinStreak >= 3" style="color: #e6a23c;">🔥 {{ row.checkinStreak }}天</span>
            <span v-else>{{ row.checkinStreak }}天</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="兑换次数" width="90" sortable />
        <el-table-column prop="lastActive" label="最近活跃" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
            <el-button link type="warning" @click="handleAdjust(row)">调账</el-button>
            <el-button link type="danger" @click="handlePointsLog(row)">流水</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 学员详情弹窗 -->
    <el-dialog v-model="detailVisible" title="学员详情" width="600px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentStudent">
        <el-descriptions-item label="姓名">{{ currentStudent.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentStudent.phone }}</el-descriptions-item>
        <el-descriptions-item label="等级">
          <el-tag :type="levelTagType(currentStudent.level)">{{ currentStudent.levelName }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ currentStudent.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="可用积分">
          <span style="color: #ff6b35; font-weight: 700; font-size: 18px;">
            {{ currentStudent.points.toLocaleString() }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="累计获得">{{ currentStudent.totalEarned }}</el-descriptions-item>
        <el-descriptions-item label="累计消耗">{{ currentStudent.totalSpent }}</el-descriptions-item>
        <el-descriptions-item label="兑换订单数">{{ currentStudent.orderCount }}</el-descriptions-item>
        <el-descriptions-item label="连续签到">{{ currentStudent.checkinStreak }} 天</el-descriptions-item>
        <el-descriptions-item label="最近活跃">{{ currentStudent.lastActive }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="warning" @click="handleAdjustFromDetail">手动调账</el-button>
        <el-button type="primary" @click="handlePointsLog(currentStudent)">查看积分流水</el-button>
      </template>
    </el-dialog>

    <!-- 调账弹窗 -->
    <el-dialog v-model="adjustVisible" title="积分调账" width="480px" destroy-on-close>
      <el-form :model="adjustForm" :rules="adjustRules" ref="adjustRef" label-width="80px">
        <el-form-item label="学员">
          <el-input :value="adjustForm.studentName" disabled />
        </el-form-item>
        <el-form-item label="当前积分">
          <el-input :value="adjustForm.currentPoints + ' 分'" disabled />
        </el-form-item>
        <el-form-item label="操作类型" prop="type">
          <el-radio-group v-model="adjustForm.type">
            <el-radio value="add">补录积分</el-radio>
            <el-radio value="deduct">扣除积分</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="积分数值" prop="amount">
          <el-input-number v-model="adjustForm.amount" :min="1" :max="99999" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="adjustForm.reason" type="textarea" placeholder="请填写调账原因（至少5个字）" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust" :loading="adjustLoading">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const total = ref(1286)
const detailVisible = ref(false)
const adjustVisible = ref(false)
const adjustLoading = ref(false)
const adjustRef = ref(null)

const query = reactive({
  name: '',
  phone: '',
  level: '',
  status: '',
  page: 1,
  pageSize: 10,
})

// Mock 学员数据
const studentList = ref([
  { id: 'U001', name: '张小明', phone: '138****8888', avatar: '', level: 2, levelName: '白银骑士', points: 1280, totalEarned: 3500, totalSpent: 2220, checkinStreak: 7, orderCount: 5, lastActive: '2026-04-16 17:30', createdAt: '2025-06-15' },
  { id: 'U002', name: '王小红', phone: '139****6666', avatar: '', level: 3, levelName: '黄金大师', points: 2560, totalEarned: 5200, totalSpent: 2640, checkinStreak: 14, orderCount: 12, lastActive: '2026-04-16 17:15', createdAt: '2025-03-20' },
  { id: 'U003', name: '赵小刚', phone: '137****5555', avatar: '', level: 1, levelName: '青铜滑手', points: 320, totalEarned: 820, totalSpent: 500, checkinStreak: 2, orderCount: 1, lastActive: '2026-04-16 16:45', createdAt: '2025-11-08' },
  { id: 'U004', name: '孙小美', phone: '136****4444', avatar: '', level: 2, levelName: '白银骑士', points: 980, totalEarned: 2100, totalSpent: 1120, checkinStreak: 5, orderCount: 3, lastActive: '2026-04-16 16:30', createdAt: '2025-07-22' },
  { id: 'U005', name: '周小龙', phone: '135****3333', avatar: '', level: 1, levelName: '青铜滑手', points: 150, totalEarned: 400, totalSpent: 250, checkinStreak: 0, orderCount: 0, lastActive: '2026-04-16 16:00', createdAt: '2026-01-10' },
  { id: 'U006', name: '吴小丽', phone: '158****2222', avatar: '', level: 4, levelName: '钻石传奇', points: 4200, totalEarned: 8800, totalSpent: 4600, checkinStreak: 21, orderCount: 18, lastActive: '2026-04-16 15:30', createdAt: '2024-09-01' },
  { id: 'U007', name: '郑小强', phone: '159****1111', avatar: '', level: 2, levelName: '白银骑士', points: 750, totalEarned: 1680, totalSpent: 930, checkinStreak: 3, orderCount: 2, lastActive: '2026-04-15 18:00', createdAt: '2025-08-14' },
  { id: 'U008', name: '冯小雨', phone: '188****9999', avatar: '', level: 1, levelName: '青铜滑手', points: 60, totalEarned: 120, totalSpent: 60, checkinStreak: 1, orderCount: 0, lastActive: '2026-04-14 17:20', createdAt: '2026-02-28' },
])

const currentStudent = ref(null)
const adjustForm = reactive({ studentId: '', studentName: '', currentPoints: 0, type: 'add', amount: 50, reason: '' })
const adjustRules = {
  type: [{ required: true }],
  amount: [{ required: true, message: '请输入数值' }],
  reason: [
    { required: true, message: '请填写原因' },
    { min: 5, message: '至少5个字', trigger: 'blur' },
  ],
}

function levelTagType(level) {
  return ['', '', '', 'warning', 'danger'][level] || 'info'
}

function handleSearch() { loadData() }
function handleReset() {
  query.name = ''; query.phone = ''; query.level = ''; query.status = ''
  loadData()
}

function loadData() {
  loading.value = true
  setTimeout(() => { loading.value = false }, 300)
}

function handleDetail(row) {
  currentStudent.value = row
  detailVisible.value = true
}

function handleAdjust(row) {
  adjustForm.studentId = row.id
  adjustForm.studentName = row.name
  adjustForm.currentPoints = row.points
  adjustForm.reason = ''
  adjustVisible.value = true
}

function handleAdjustFromDetail() {
  detailVisible.value = false
  if (currentStudent.value) handleAdjust(currentStudent.value)
}

async function submitAdjust() {
  const valid = await adjustRef.value.validate().catch(() => false)
  if (!valid) return

  ElMessageBox.confirm(
    `确认${adjustForm.type === 'add' ? '补录' : '扣除'} ${adjustForm.amount} 积分给 ${adjustForm.studentName}？`,
    '调账确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    adjustLoading.value = true
    setTimeout(() => {
      adjustLoading.value = false
      adjustVisible.value = false
      ElMessage.success('调账成功')
      loadData()
    }, 500)
  }).catch(() => {})
}

function handlePointsLog(row) {
  // 跳转到积分管理页面，带上筛选参数
  ElMessage.info(`查看 ${row.name} 的积分流水（可跳转至积分管理页面）`)
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.search-card { border-radius: 10px; }
.table-card { border-radius: 10px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.table-info { color: #999; font-size: 13px; }

.user-cell { display: flex; align-items: center; gap: 10px; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 14px; color: #333; }
.user-phone { font-size: 12px; color: #999; }

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
