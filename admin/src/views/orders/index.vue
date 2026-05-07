<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline size="default">
        <el-form-item label="订单号">
          <el-input v-model="query.orderNo" placeholder="输入订单号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="学员">
          <el-input v-model="query.studentName" placeholder="学员姓名" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="待发货" value="pending_ship" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search">查询</el-button>
          <el-button icon="Refresh">重置</el-button>
          <el-button icon="Download">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 状态统计条 -->
    <el-row :gutter="16" class="status-bar">
      <el-col :span="4" v-for="(item, idx) in statusStats" :key="idx">
        <div
          class="status-item"
          :class="{ active: query.status === item.value }"
          @click="query.status = query.status === item.value ? '' : item.value"
        >
          <span class="status-count">{{ item.count }}</span>
          <span class="status-label">{{ item.label }}</span>
        </div>
      </el-col>
    </el-row>

    <!-- 订单列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="orderList" stripe size="default" v-loading="loading">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="orderNo" label="订单号" width="200">
          <template #default="{ row }">
            <span style="font-family: monospace; color: #409eff;">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="礼品信息" min-width="220">
          <template #default="{ row }">
            <div class="goods-cell">
              <el-image :src="row.giftImage" fit="cover" class="gift-img">
                <template #error><div class="img-placeholder">🎁</div></template>
              </el-image>
              <div>{{ row.giftName }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="studentName" label="学员" width="100" />
        <el-table-column prop="pointsCost" label="消耗积分" width="100">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600;">-{{ row.pointsCost }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="170" sortable />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending_ship'"
              link type="success"
              size="small"
              @click="handleShip(row)"
            >发货</el-button>
            <el-button
              v-if="row.status === 'shipped'"
              link type="warning"
              size="small"
              @click="handleComplete(row)"
            >确认完成</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="156"
          :page-sizes="[10, 20, 50]"
          :current-page="1"
          :page-size="10"
        />
      </div>
    </el-card>

    <!-- 发货弹窗 -->
    <el-dialog v-model="shipVisible" title="订单发货" width="500px" destroy-on-close>
      <el-descriptions :column="1" border size="small" style="margin-bottom: 20px;">
        <el-descriptions-item label="订单号">{{ shipForm.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="学员">{{ shipForm.studentName }}</el-descriptions-item>
        <el-descriptions-item label="礼品">{{ shipForm.giftName }}</el-descriptions-item>
        <el-descriptions-item label="收货地址">{{ shipForm.address || '待填写' }}</el-descriptions-item>
      </el-descriptions>

      <el-form :model="shipForm" :rules="shipRules" ref="shipRef" label-width="90px">
        <el-form-item label="快递公司" prop="expressCompany">
          <el-select v-model="shipForm.expressCompany" placeholder="选择快递公司" style="width: 100%">
            <el-option label="顺丰速运" value="sf" />
            <el-option label="中通快递" value="zto" />
            <el-option label="圆通速递" value="yto" />
            <el-option label="韵达快递" value="yunda" />
            <el-option label="邮政 EMS" value="ems" />
          </el-select>
        </el-form-item>
        <el-form-item label="运单号" prop="trackingNumber">
          <el-input v-model="shipForm.trackingNumber" placeholder="请输入运单号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="shipForm.remark" type="textarea" :rows="2" placeholder="可选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" @click="submitShip" :loading="shipLoading">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const shipVisible = ref(false)
const shipLoading = ref(false)
const shipRef = ref(null)

const query = reactive({ orderNo: '', studentName: '', status: '' })

// 状态统计数据
const statusStats = ref([
  { label: '全部', value: '', count: 156 },
  { label: '待发货', value: 'pending_ship', count: 7 },
  { label: '已发货', value: 'shipped', count: 12 },
  { label: '已完成', value: 'completed', count: 132 },
  { label: '已取消', value: 'cancelled', count: 5 },
])

const orderList = ref([
  { id: 'O001', orderNo: 'ORD20260416001', giftName: '限定樱花板面', giftImage: '', studentName: '吴小丽', pointsCost: 2000, status: 'pending_ship', address: '深圳市南山区科技园XX路XX号', createdAt: '2026-04-16 15:00' },
  { id: 'O002', orderNo: 'ORD20260415002', giftName: '护具全套', giftImage: '', studentName: '赵小刚', pointsCost: 1200, status: 'pending_ship', address: '广州市天河区XX大厦XX室', createdAt: '2026-04-15 19:30' },
  { id: 'O003', orderNo: 'ORD20260414003', giftName: '定制俱乐部 T 恤', giftImage: '', studentName: '王小红', pointsCost: 500, status: 'shipped', trackingNumber: 'SF1234567890', address: '深圳市福田区XX花园X栋', createdAt: '2026-04-14 17:20' },
  { id: 'O004', orderNo: 'ORD20260413004', giftName: 'ABEC-9 轴承套装', giftImage: '', studentName: '张小明', pointsCost: 200, status: 'completed', address: '-', createdAt: '2026-04-13 14:10' },
  { id: 'O005', orderNo: 'ORD20260412005', giftName: '免费私教课 (1节)', giftImage: '', studentName: '孙小美', pointsCost: 800, status: 'completed', address: '(虚拟商品)', createdAt: '2026-04-12 11:30' },
  { id: 'O006', orderNo: 'ORD20260411006', giftName: '8 折优惠券', giftImage: '', studentName: '郑小强', pointsCost: 150, status: 'completed', address: '(虚拟商品)', createdAt: '2026-04-11 09:45' },
])

const shipForm = reactive({ orderId: '', orderNo: '', studentName: '', giftName: '', address: '', expressCompany: '', trackingNumber: '', remark: '' })
const shipRules = {
  expressCompany: [{ required: true, message: '请选择快递公司' }],
  trackingNumber: [{ required: true, message: '请输入运单号' }],
}

function statusTagType(status) {
  const map = { pending_ship: 'warning', shipped: 'primary', completed: 'success', cancelled: 'info' }
  return map[status] || ''
}

function statusLabel(status) {
  const map = { pending_ship: '待发货', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

function handleDetail(row) {
  ElMessage.info(`查看订单 ${row.orderNo} 详情`)
}

function handleShip(row) {
  Object.assign(shipForm, {
    orderId: row.id,
    orderNo: row.orderNo,
    studentName: row.studentName,
    giftName: row.giftName,
    address: row.address,
    expressCompany: '',
    trackingNumber: '',
    remark: '',
  })
  shipVisible.value = true
}

async function submitShip() {
  const valid = await shipRef.value.validate().catch(() => false)
  if (!valid) return

  shipLoading.value = true
  setTimeout(() => {
    shipLoading.value = false
    shipVisible.value = false
    ElMessage.success('发货成功，运单号已通知学员')
  }, 600)
}

function handleComplete(row) {
  ElMessageBox.confirm(`确认订单 ${row.orderNo} 已完成？`, '确认完成', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info',
  }).then(() => {
    ElMessage.success('订单已标记为已完成')
  }).catch(() => {})
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.search-card { border-radius: 10px; }
.table-card { border-radius: 10px; }

.status-bar { margin-bottom: -8px; margin-top: 0; }
.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.status-item:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.status-item.active {
  border-color: #ff6b35;
  background: #fff5f0;
}
.status-count {
  font-size: 24px;
  font-weight: 700;
  color: #ff6b35;
}
.status-label { font-size: 13px; color: #666; }

.goods-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.gift-img {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  border: 1px solid #eee;
}
.img-placeholder {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 18px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
