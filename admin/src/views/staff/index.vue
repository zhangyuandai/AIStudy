<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline size="default">
        <el-form-item label="店员姓名">
          <el-input v-model="query.name" placeholder="输入姓名" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="query.role" placeholder="全部" clearable style="width: 140px">
            <el-option label="管理员" value="admin" />
            <el-option label="教练" value="coach" />
            <el-option label="前台" value="receptionist" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="在职" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search">查询</el-button>
          <el-button icon="Refresh">重置</el-button>
          <el-button type="success" icon="Plus" @click="handleAdd">添加店员</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>店员列表</span>
          <span class="table-info">共 {{ staffList.length }} 人</span>
        </div>
      </template>

      <el-table :data="staffList" stripe size="default" v-loading="loading">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="店员信息" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="38">{{ row.name[0] }}</el-avatar>
              <div>
                <span class="user-name">{{ row.name }}</span><br/>
                <span class="user-phone">{{ row.phone }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="roleLabel" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'coach' ? '' : 'info'" size="small">
              {{ row.roleLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="checkinCount" label="本月签到核销" width="130" sortable>
          <template #default="{ row }">
            <span>{{ row.checkinCount }} 次</span>
          </template>
        </el-table-column>
        <el-table-column prop="adjustCount" label="本月调账" width="110" sortable>
          <template #default="{ row }">
            <span>{{ row.adjustCount }} 次</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" label="最近登录" width="170" sortable />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small" effect="plain">
              {{ row.status === 'active' ? '在职' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="handleResetPwd(row)">重置密码</el-button>
            <el-link
              :type="row.status === 'active' ? 'danger' : 'success'"
              :underline="false"
              style="margin-left: 8px;"
              @click="handleToggle(row)"
            >
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-link>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑店员' : '添加店员'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号（作为登录账号）" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="教练" value="coach" />
            <el-option label="前台" value="receptionist" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="初始密码" prop="password">
          <el-input v-model="formData.password" type="password" show-password placeholder="默认: 123456" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">{{ isEdit ? '保存' : '确认添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const formVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const query = reactive({ name: '', role: '', status: '' })

const staffList = ref([
  { id: 'S001', name: '李教练', phone: '138****0001', role: 'coach', roleLabel: '教练', checkinCount: 186, adjustCount: 12, lastLogin: '2026-04-16 17:35', status: 'active' },
  { id: 'S002', name: '王教练', phone: '139****0002', role: 'coach', roleLabel: '教练', checkinCount: 152, adjustCount: 5, lastLogin: '2026-04-16 16:50', status: 'active' },
  { id: 'S003', name: '陈前台', phone: '137****0003', role: 'receptionist', roleLabel: '前台', checkinCount: 98, adjustCount: 0, lastLogin: '2026-04-16 18:00', status: 'active' },
  { id: 'S004', name: '系统管理员', phone: 'admin', role: 'admin', roleLabel: '管理员', checkinCount: 45, adjustCount: 8, lastLogin: '2026-04-16 19:40', status: 'active' },
])

const formData = reactive({ name: '', phone: '', role: '', password: '', remark: '' })
const formRules = {
  name: [{ required: true, message: '请输入姓名' }],
  phone: [{ required: true, message: '请输入手机号' }],
  role: [{ required: true, message: '请选择角色' }],
}

function handleAdd() {
  isEdit.value = false
  Object.assign(formData, { name: '', phone: '', role: '', password: '123456', remark: '' })
  formVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(formData, { ...row })
  formVisible.value = true
}

function submitForm() {
  ElMessage.success(isEdit.value ? '保存成功' : '店员已添加')
  formVisible.value = false
}

function handleResetPwd(row) {
  ElMessageBox.confirm(`确认重置「${row.name}」的密码？`, '提示', {
    confirmButtonText: '确认重置',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    ElMessage.success('密码已重置为：123456')
  }).catch(() => {})
}

function handleToggle(row) {
  const action = row.status === 'active' ? '停用' : '启用'
  ElMessageBox.confirm(`确认${action}「${row.name}」？`, action, {
    confirmButtonText: `确认${action}`,
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    row.status = row.status === 'active' ? 'inactive' : 'active'
    ElMessage.success(`${action}成功`)
  }).catch(() => {})
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.search-card { border-radius: 10px; }
.table-card { border-radius: 10px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.table-info { color: #999; font-size: 13px; }

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-name { font-weight: 600; font-size: 14px; color: #333; }
.user-phone { font-size: 12px; color: #999; }
</style>
