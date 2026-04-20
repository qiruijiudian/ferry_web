<template>
  <div class="item-management">
    <div class="page-header">
      <h1><i class="el-icon-suitcase" /> 物品管理</h1>
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增物品</el-button>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="物品名称">
          <el-input v-model="searchForm.item_name" placeholder="请输入物品名称" clearable />
        </el-form-item>
        <el-form-item label="物品类型">
          <el-select v-model="searchForm.item_type" placeholder="请选择类型" clearable>
            <el-option label="设备" value="equipment" />
            <el-option label="工具" value="tool" />
            <el-option label="配件" value="accessory" />
            <el-option label="耗材" value="consumable" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="itemList" border stripe>
        <el-table-column prop="item_code" label="物品编号" width="120" />
        <el-table-column prop="item_name" label="物品名称" min-width="150" />
        <el-table-column prop="item_type" label="类型" width="100">
          <template slot-scope="scope">
            <el-tag size="small">{{ getTypeName(scope.row.item_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="small">{{ getStatusName(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_user" label="使用人" width="100" />
        <el-table-column prop="location" label="存放位置" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="mini" icon="el-icon-delete" class="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination background layout="total, sizes, prev, pager, next" :total="pagination.total" :page-size="pagination.pageSize" :current-page="pagination.page" @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px">
      <el-form ref="itemForm" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物品编号" prop="item_code">
              <el-input v-model="formData.item_code" placeholder="请输入物品编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物品名称" prop="item_name">
              <el-input v-model="formData.item_name" placeholder="请输入物品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物品类型" prop="item_type">
              <el-select v-model="formData.item_type" placeholder="请选择类型" style="width: 100%">
                <el-option label="设备" value="equipment" />
                <el-option label="工具" value="tool" />
                <el-option label="配件" value="accessory" />
                <el-option label="耗材" value="consumable" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="使用中" value="in_use" />
                <el-option label="可用" value="available" />
                <el-option label="维护中" value="maintenance" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌"><el-input v-model="formData.brand" placeholder="请输入品牌" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号"><el-input v-model="formData.model" placeholder="请输入型号" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="使用人"><el-input v-model="formData.current_user" placeholder="请输入使用人" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放位置"><el-input v-model="formData.location" placeholder="请输入存放位置" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="formData.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import wmsApi from '@/api/wms'

export default {
  name: 'ItemManagement',
  data() {
    return {
      loading: false,
      submitLoading: false,
      searchForm: { item_name: '', item_type: '', status: '' },
      itemList: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
      dialogVisible: false,
      dialogTitle: '新增物品',
      isEdit: false,
      formData: this.getEmptyForm(),
      formRules: {
        item_code: [{ required: true, message: '请输入物品编号', trigger: 'blur' }],
        item_name: [{ required: true, message: '请输入物品名称', trigger: 'blur' }],
        item_type: [{ required: true, message: '请选择物品类型', trigger: 'change' }]
      }
    }
  },
  mounted() { this.loadItemList() },
  methods: {
    getEmptyForm() { return { id: null, item_code: '', item_name: '', item_type: '', brand: '', model: '', status: 'available', current_user: '', location: '', remark: '' } },
    getTypeName(type) { const map = { equipment: '设备', tool: '工具', accessory: '配件', consumable: '耗材' }; return map[type] || type },
    getStatusName(status) { const map = { in_use: '使用中', available: '可用', maintenance: '维护中' }; return map[status] || status },
    getStatusType(status) { const map = { in_use: 'success', available: 'info', maintenance: 'warning' }; return map[status] || '' },
    loadItemList() {
      this.loading = true
      wmsApi.getItemList({ page: this.pagination.page, page_size: this.pagination.pageSize, ...this.searchForm }).then(res => {
        if (res.code === 200) {
          this.itemList = res.data.list || []
          this.pagination.total = res.data.total || 0
        }
      }).catch(() => {
        this.itemList = [
          { id: 1, item_code: 'IT001', item_name: '笔记本电脑', item_type: 'equipment', brand: 'Dell', model: 'Latitude', status: 'in_use', current_user: '张三', location: '办公室' }
        ]
        this.pagination.total = 1
      }).finally(() => { this.loading = false })
    },
    handleSearch() { this.pagination.page = 1; this.loadItemList() },
    handleReset() { this.searchForm = { item_name: '', item_type: '', status: '' }; this.handleSearch() },
    handleSizeChange(size) { this.pagination.pageSize = size; this.loadItemList() },
    handlePageChange(page) { this.pagination.page = page; this.loadItemList() },
    handleAdd() { this.isEdit = false; this.dialogTitle = '新增物品'; this.formData = this.getEmptyForm(); this.dialogVisible = true },
    handleEdit(row) { this.isEdit = true; this.dialogTitle = '编辑物品'; this.formData = { ...row }; this.dialogVisible = true },
    handleDelete(row) {
      this.$confirm('确定要删除该物品吗？', '提示', { type: 'warning' }).then(() => {
        wmsApi.deleteGoods(row.id).then(() => { this.$message.success('删除成功'); this.loadItemList() })
      }).catch(() => {})
    },
    handleSubmit() {
      this.$refs.itemForm.validate(valid => {
        if (!valid) return
        this.submitLoading = true
        wmsApi.createGoods(this.formData).then(() => {
          this.$message.success(this.isEdit ? '编辑成功' : '新增成功')
          this.dialogVisible = false
          this.loadItemList()
        }).finally(() => { this.submitLoading = false })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.item-management { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  h1 { margin: 0; font-size: 22px; color: #303133; i { margin-right: 10px; color: #409EFF; } }
}
.search-card { margin-bottom: 20px; }
.table-card .danger { color: #F56C6C; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
