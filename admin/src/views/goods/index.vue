<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline size="default">
        <el-form-item label="礼品名称">
          <el-input v-model="query.name" placeholder="搜索礼品" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.category" placeholder="全部分类" clearable style="width: 140px">
            <el-option label="装备配件" value="gear" />
            <el-option label="服饰周边" value="clothing" />
            <el-option label="课程体验" value="lesson" />
            <el-option label="优惠券" value="coupon" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="上架" value="on" />
            <el-option label="下架" value="off" />
            <el-option label="库存不足" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search">查询</el-button>
          <el-button icon="Refresh">重置</el-button>
          <el-button type="success" icon="Plus" @click="handleAdd">新增礼品</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 礼品列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="goodsList" stripe size="default" v-loading="loading">
        <el-table-column label="礼品信息" min-width="280">
          <template #default="{ row }">
            <div class="goods-cell">
              <el-image :src="row.image" :preview-src-list="[row.image]" fit="cover" class="goods-img" :preview-teleported="true">
                <template #error>
                  <div class="img-placeholder">🎁</div>
                </template>
              </el-image>
              <div class="goods-info">
                <span class="goods-name">{{ row.name }}</span>
                <el-tag size="small" type="info">{{ row.categoryLabel }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="pointsCost" label="所需积分" width="110" sortable>
          <template #default="{ row }">
            <span style="color: #ff6b35; font-weight: 600;">{{ row.pointsCost.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="90" sortable>
          <template #default="{ row }">
            <el-tag :type="row.stock > 10 ? 'success' : row.stock > 0 ? 'warning' : 'danger'" size="small">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="exchangeCount" label="已兑换" width="90" sortable />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.isOnline"
              active-text="上架"
              inactive-text="下架"
              inline-prompt
              @change="(val) => handleToggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" sortable />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="handleStock(row)">库存</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑礼品' : '新增礼品'"
      width="640px"
      destroy-on-close
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="90px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="礼品名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入礼品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="formData.category" placeholder="选择分类">
                <el-option label="装备配件" value="gear" />
                <el-option label="服饰周边" value="clothing" />
                <el-option label="课程体验" value="lesson" />
                <el-option label="优惠券" value="coupon" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所需积分" prop="pointsCost">
              <el-input-number v-model="formData.pointsCost" :min="1" :max="99999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="初始库存" prop="stock">
              <el-input-number v-model="formData.stock" :min="0" :max="999999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="商品类型" prop="goodsType">
          <el-radio-group v-model="formData.goodsType">
            <el-radio value="physical">实物（需发货）</el-radio>
            <el-radio value="virtual">虚拟（自动发放）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="礼品图片">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="5"
            accept=".jpg,.jpeg,.png"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>支持 jpg/png，最多5张，建议尺寸 800x800</template>
          </el-upload>
        </el-form-item>
        <el-form-item label="详细描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="4" placeholder="输入礼品详细描述" />
        </el-form-item>
        <el-form-item label="兑换须知" prop="notice">
          <el-input v-model="formData.notice" type="textarea" :rows="2" placeholder="兑换规则说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">{{ isEdit ? '保存修改' : '确认新增' }}</el-button>
      </template>
    </el-dialog>

    <!-- 库存调整弹窗 -->
    <el-dialog v-model="stockVisible" title="调整库存" width="400px">
      <el-form label-width="80px">
        <el-form-item label="当前库存">
          <span style="font-weight: 600; font-size: 18px;">{{ currentStock }}</span>
        </el-form-item>
        <el-form-item label="调整数量">
          <el-input-number v-model="stockAdjust" :step="10" :min="-9999" :max="9999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="stockReason" type="textarea" :rows="2" placeholder="如：补货50件 / 盘点损耗" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStock">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const formVisible = ref(false)
const stockVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const query = reactive({ name: '', category: '', status: '' })

const goodsList = ref([
  { id: 'G001', name: 'ABEC-9 轴承套装', category: 'gear', categoryLabel: '装备配件', pointsCost: 200, stock: 45, exchangeCount: 68, isOnline: true, image: '', createdAt: '2026-01-15', goodsType: 'physical' },
  { id: 'G002', name: '定制俱乐部 T 恤', category: 'clothing', categoryLabel: '服饰周边', pointsCost: 500, stock: 8, exchangeCount: 38, isOnline: true, image: '', createdAt: '2026-01-10', goodsType: 'physical' },
  { id: 'G003', name: '免费体验券', category: 'lesson', categoryLabel: '课程体验', pointsCost: 300, stock: 999, exchangeCount: 52, isOnline: true, image: '', createdAt: '2026-02-01', goodsType: 'virtual' },
  { id: 'G004', name: '8 折优惠券', category: 'coupon', categoryLabel: '优惠券', pointsCost: 150, stock: 999, exchangeCount: 95, isOnline: true, image: '', createdAt: '2026-02-05', goodsType: 'virtual' },
  { id: 'G005', name: '免费私教课 (1节)', category: 'lesson', categoryLabel: '课程体验', pointsCost: 800, stock: 30, exchangeCount: 41, isOnline: true, image: '', createdAt: '2026-01-20', goodsType: 'virtual' },
  { id: 'G006', name: '限定樱花板面', category: 'gear', categoryLabel: '装备配件', pointsCost: 2000, stock: 3, exchangeCount: 32, isOnline: true, image: '', createdAt: '2026-03-01', goodsType: 'physical' },
  { id: 'G007', name: '护具全套', category: 'gear', categoryLabel: '装备配件', pointsCost: 1200, stock: 2, exchangeCount: 18, isOnline: true, image: '', createdAt: '2026-03-10', goodsType: 'physical' },
  { id: 'G008', name: '运动袜套装(双)', category: 'clothing', categoryLabel: '服饰周边', pointsCost: 100, stock: 60, exchangeCount: 120, isOnline: false, image: '', createdAt: '2026-04-01', goodsType: 'physical' },
])

const formData = reactive({
  name: '', category: '', pointsCost: 100, stock: 50,
  goodsType: 'physical', description: '', notice: '',
})
const formRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  pointsCost: [{ required: true, message: '请输入积分', trigger: 'blur' }],
}

let currentStock = ref(0)
let stockAdjust = ref(0)
let stockReason = ref('')

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, { name: '', category: '', pointsCost: 100, stock: 50, goodsType: 'physical', description: '', notice: '' })
  formVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(formData, { ...row })
  formVisible.value = true
}

function submitForm() {
  ElMessage.success(isEdit.value ? '保存成功' : '新增成功')
  formVisible.value = false
}

function handleStock(row) {
  currentStock.value = row.stock
  stockAdjust.value = 0
  stockReason.value = ''
  stockVisible.value = true
}

function submitStock() {
  ElMessage.success(`库存已调整为 ${currentStock.value + stockAdjust.value}`)
  stockVisible.value = false
}

function handleToggleStatus(row, val) {
  ElMessage.success(val ? `${row.name} 已上架` : `${row.name} 已下架`)
}

function handleDelete(row) {
  ElMessageBox.confirm(`确认删除「${row.name}」？删除后不可恢复。`, '警告', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {})
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.search-card { border-radius: 10px; }
.table-card { border-radius: 10px; }

.goods-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.goods-img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 1px solid #eee;
}
.img-placeholder {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 24px;
}
.goods-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.goods-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}
</style>
