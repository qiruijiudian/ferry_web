<template>
  <div class="outbound-management">
    <div class="page-header">
      <h1><i class="el-icon-upload2" /> 出库管理</h1>
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新建出库单</el-button>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="单据编号">
          <el-input v-model="searchForm.order_no" placeholder="请输入单据编号" clearable />
        </el-form-item>
        <el-form-item label="出库类型">
          <el-select v-model="searchForm.outbound_type" placeholder="请选择类型" clearable>
            <el-option label="领用出库" value="requisition" />
            <el-option label="销售出库" value="sale" />
            <el-option label="报废出库" value="scrap" />
            <el-option label="其他出库" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="outboundList" border stripe>
        <el-table-column prop="order_no" label="单据编号" width="150" />
        <el-table-column prop="outbound_type" label="出库类型" width="100">
          <template slot-scope="scope">
            <el-tag size="small">{{ getTypeName(scope.row.outbound_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" label="总数量" width="100" align="center" />
        <el-table-column prop="receiver" label="领用人" width="100" align="center" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="operator" label="操作人" width="100" align="center" />
        <el-table-column prop="create_time" label="创建时间" width="160" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'completed' ? 'success' : 'warning'" size="small">
              {{ scope.row.status === 'completed' ? '已完成' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" icon="el-icon-view" @click="handleView(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination background layout="total, sizes, prev, pager, next" :total="pagination.total" :page-size="pagination.pageSize" :current-page="pagination.page" @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <el-dialog title="新建出库单" :visible.sync="dialogVisible" width="800px">
      <el-form ref="outboundForm" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出库类型" prop="outbound_type">
              <el-select v-model="formData.outbound_type" placeholder="请选择类型" style="width: 100%">
                <el-option label="领用出库" value="requisition" />
                <el-option label="销售出库" value="sale" />
                <el-option label="报废出库" value="scrap" />
                <el-option label="其他出库" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="领用人">
              <el-input v-model="formData.receiver" placeholder="请输入领用人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门">
              <el-input v-model="formData.department" placeholder="请输入部门" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="出库商品">
          <el-table :data="formData.items" border size="small">
            <el-table-column prop="goods_name" label="商品名称" min-width="150" />
            <el-table-column prop="stock" label="可用库存" width="90" />
            <el-table-column label="数量" width="120">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.quantity" :min="1" :max="scope.row.stock" size="mini" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template slot-scope="scope">
                <el-button type="text" size="mini" class="danger" @click="removeItem(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" size="small" icon="el-icon-plus" style="margin-top: 10px" @click="addItem">添加商品</el-button>
        </el-form-item>
        <el-form-item label="用途">
          <el-input v-model="formData.purpose" type="textarea" :rows="2" placeholder="请输入用途" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import wmsApi from '@/api/wms'

export default {
  name: 'OutboundManagement',
  data() {
    return {
      loading: false,
      submitLoading: false,
      searchForm: { order_no: '', outbound_type: '' },
      outboundList: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
      dialogVisible: false,
      formData: this.getEmptyForm(),
      formRules: { outbound_type: [{ required: true, message: '请选择出库类型', trigger: 'change' }] }
    }
  },
  mounted() { this.loadOutboundList() },
  methods: {
    getEmptyForm() { return { outbound_type: '', receiver: '', department: '', items: [], purpose: '' } },
    getTypeName(type) {
      const map = { requisition: '领用出库', sale: '销售出库', scrap: '报废出库', other: '其他出库' }
      return map[type] || type
    },
    loadOutboundList() {
      this.loading = true
      wmsApi.getOutboundList({ page: this.pagination.page, page_size: this.pagination.pageSize, ...this.searchForm }).then(res => {
        if (res.code === 200) {
          this.outboundList = res.data.list || []
          this.pagination.total = res.data.total || 0
        }
      }).catch(() => {
        this.outboundList = [
          { id: 1, order_no: 'CK202401150001', outbound_type: 'requisition', total_quantity: 100, receiver: '李四', department: '生产部', operator: '张三', create_time: '2024-01-15 14:30', status: 'completed' }
        ]
        this.pagination.total = 1
      }).finally(() => { this.loading = false })
    },
    handleSearch() { this.pagination.page = 1; this.loadOutboundList() },
    handleReset() { this.searchForm = { order_no: '', outbound_type: '' }; this.handleSearch() },
    handleSizeChange(size) { this.pagination.pageSize = size; this.loadOutboundList() },
    handlePageChange(page) { this.pagination.page = page; this.loadOutboundList() },
    handleAdd() { this.formData = this.getEmptyForm(); this.dialogVisible = true },
    handleView(row) { this.$message.info('查看详情: ' + row.order_no) },
    addItem() { this.formData.items.push({ goods_id: null, goods_name: '新商品', stock: 100, quantity: 1 }) },
    removeItem(index) { this.formData.items.splice(index, 1) },
    handleSubmit() {
      this.$refs.outboundForm.validate(valid => {
        if (!valid) return
        if (this.formData.items.length === 0) { this.$message.warning('请添加出库商品'); return }
        this.submitLoading = true
        wmsApi.createOutbound(this.formData).then(() => {
          this.$message.success('出库成功')
          this.dialogVisible = false
          this.loadOutboundList()
        }).finally(() => { this.submitLoading = false })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.outbound-management { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  h1 { margin: 0; font-size: 22px; color: #303133; i { margin-right: 10px; color: #E6A23C; } }
}
.search-card { margin-bottom: 20px; }
.table-card .danger { color: #F56C6C; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
