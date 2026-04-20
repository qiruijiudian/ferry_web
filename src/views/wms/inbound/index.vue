<template>
  <div class="inbound-management">
    <div class="page-header">
      <h1><i class="el-icon-download" /> 入库管理</h1>
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新建入库单</el-button>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="单据编号">
          <el-input v-model="searchForm.order_no" placeholder="请输入单据编号" clearable />
        </el-form-item>
        <el-form-item label="入库类型">
          <el-select v-model="searchForm.inbound_type" placeholder="请选择类型" clearable>
            <el-option label="采购入库" value="purchase" />
            <el-option label="退货入库" value="return" />
            <el-option label="其他入库" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="searchForm.date_range" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="inboundList" border stripe>
        <el-table-column prop="order_no" label="单据编号" width="150" />
        <el-table-column prop="inbound_type" label="入库类型" width="100">
          <template slot-scope="scope">
            <el-tag size="small">{{ getTypeName(scope.row.inbound_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" label="总数量" width="100" align="center" />
        <el-table-column prop="total_amount" label="总金额" width="120" align="right">
          <template slot-scope="scope">¥{{ scope.row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" width="150" />
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

    <el-dialog title="新建入库单" :visible.sync="dialogVisible" width="800px">
      <el-form ref="inboundForm" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库类型" prop="inbound_type">
              <el-select v-model="formData.inbound_type" placeholder="请选择类型" style="width: 100%">
                <el-option label="采购入库" value="purchase" />
                <el-option label="退货入库" value="return" />
                <el-option label="其他入库" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-input v-model="formData.supplier" placeholder="请输入供应商" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="入库商品">
          <el-table :data="formData.items" border size="small">
            <el-table-column prop="goods_name" label="商品名称" min-width="150" />
            <el-table-column prop="spec" label="规格" width="100" />
            <el-table-column prop="unit" label="单位" width="70" />
            <el-table-column label="数量" width="120">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.quantity" :min="1" size="mini" />
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.price" :min="0" :precision="2" size="mini" />
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
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
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
  name: 'InboundManagement',
  data() {
    return {
      loading: false,
      submitLoading: false,
      searchForm: { order_no: '', inbound_type: '', date_range: [] },
      inboundList: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
      dialogVisible: false,
      formData: this.getEmptyForm(),
      formRules: { inbound_type: [{ required: true, message: '请选择入库类型', trigger: 'change' }] }
    }
  },
  mounted() { this.loadInboundList() },
  methods: {
    getEmptyForm() { return { inbound_type: '', supplier: '', items: [], remark: '' } },
    getTypeName(type) {
      const map = { purchase: '采购入库', return: '退货入库', other: '其他入库' }
      return map[type] || type
    },
    loadInboundList() {
      this.loading = true
      wmsApi.getInboundList({ page: this.pagination.page, page_size: this.pagination.pageSize, ...this.searchForm }).then(res => {
        if (res.code === 200) {
          this.inboundList = res.data.list || []
          this.pagination.total = res.data.total || 0
        }
      }).catch(() => {
        this.inboundList = [
          { id: 1, order_no: 'RK202401150001', inbound_type: 'purchase', total_quantity: 500, total_amount: 250, supplier: '五金供应商', operator: '张三', create_time: '2024-01-15 10:30', status: 'completed' }
        ]
        this.pagination.total = 1
      }).finally(() => { this.loading = false })
    },
    handleSearch() { this.pagination.page = 1; this.loadInboundList() },
    handleReset() { this.searchForm = { order_no: '', inbound_type: '', date_range: [] }; this.handleSearch() },
    handleSizeChange(size) { this.pagination.pageSize = size; this.loadInboundList() },
    handlePageChange(page) { this.pagination.page = page; this.loadInboundList() },
    handleAdd() { this.formData = this.getEmptyForm(); this.dialogVisible = true },
    handleView(row) { this.$message.info('查看详情: ' + row.order_no) },
    addItem() { this.formData.items.push({ goods_id: null, goods_name: '新商品', spec: '', unit: '个', quantity: 1, price: 0 }) },
    removeItem(index) { this.formData.items.splice(index, 1) },
    handleSubmit() {
      this.$refs.inboundForm.validate(valid => {
        if (!valid) return
        if (this.formData.items.length === 0) { this.$message.warning('请添加入库商品'); return }
        this.submitLoading = true
        wmsApi.createInbound(this.formData).then(() => {
          this.$message.success('入库成功')
          this.dialogVisible = false
          this.loadInboundList()
        }).finally(() => { this.submitLoading = false })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.inbound-management { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  h1 { margin: 0; font-size: 22px; color: #303133; i { margin-right: 10px; color: #67C23A; } }
}
.search-card { margin-bottom: 20px; }
.table-card .danger { color: #F56C6C; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
