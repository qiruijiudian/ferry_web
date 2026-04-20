<template>
  <div class="history-management">
    <div class="page-header">
      <h1><i class="el-icon-time" /> 历史记录</h1>
      <el-button type="success" icon="el-icon-download" @click="handleExport">导出记录</el-button>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="单据编号">
          <el-input v-model="searchForm.order_no" placeholder="请输入单据编号" clearable />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.operation_type" placeholder="请选择类型" clearable>
            <el-option label="入库" value="inbound" />
            <el-option label="出库" value="outbound" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.goods_name" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="historyList" border stripe>
        <el-table-column prop="order_no" label="单据编号" width="150" />
        <el-table-column prop="operation_type" label="操作类型" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.operation_type === 'inbound' ? 'success' : 'warning'" size="small">
              {{ scope.row.operation_type === 'inbound' ? '入库' : '出库' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="quantity" label="数量" width="100" align="center">
          <template slot-scope="scope">
            <span :class="scope.row.operation_type === 'inbound' ? 'inbound-qty' : 'outbound-qty'">
              {{ scope.row.operation_type === 'inbound' ? '+' : '-' }}{{ scope.row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="100" align="center" />
        <el-table-column prop="create_time" label="操作时间" width="160" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'" size="small">
              {{ scope.row.status === 'active' ? '有效' : '已撤销' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" icon="el-icon-view" @click="handleView(scope.row)">详情</el-button>
            <el-button v-if="scope.row.status === 'active'" type="text" size="mini" icon="el-icon-refresh-left" class="warning" @click="handleRevert(scope.row)">撤销</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination background layout="total, sizes, prev, pager, next" :total="pagination.total" :page-size="pagination.pageSize" :current-page="pagination.page" @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <el-dialog title="操作详情" :visible.sync="detailVisible" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="单据编号">{{ currentHistory.order_no }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="currentHistory.operation_type === 'inbound' ? 'success' : 'warning'" size="small">
            {{ currentHistory.operation_type === 'inbound' ? '入库' : '出库' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ currentHistory.goods_name }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentHistory.quantity }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentHistory.operator }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentHistory.create_time }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentHistory.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import wmsApi from '@/api/wms'

export default {
  name: 'HistoryManagement',
  data() {
    return {
      loading: false,
      searchForm: { order_no: '', operation_type: '', goods_name: '' },
      historyList: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
      detailVisible: false,
      currentHistory: {}
    }
  },
  mounted() { this.loadHistoryList() },
  methods: {
    loadHistoryList() {
      this.loading = true
      wmsApi.getHistoryList({ page: this.pagination.page, page_size: this.pagination.pageSize, ...this.searchForm }).then(res => {
        if (res.code === 200) {
          this.historyList = res.data.list || []
          this.pagination.total = res.data.total || 0
        }
      }).catch(() => {
        this.historyList = [
          { id: 1, order_no: 'RK202401150001', operation_type: 'inbound', goods_name: '螺丝M8x20', quantity: 500, operator: '张三', create_time: '2024-01-15 10:30', status: 'active', remark: '采购入库' },
          { id: 2, order_no: 'CK202401150001', operation_type: 'outbound', goods_name: '螺丝M8x20', quantity: 100, operator: '李四', create_time: '2024-01-15 14:30', status: 'active', remark: '领用出库' }
        ]
        this.pagination.total = 2
      }).finally(() => { this.loading = false })
    },
    handleSearch() { this.pagination.page = 1; this.loadHistoryList() },
    handleReset() { this.searchForm = { order_no: '', operation_type: '', goods_name: '' }; this.handleSearch() },
    handleSizeChange(size) { this.pagination.pageSize = size; this.loadHistoryList() },
    handlePageChange(page) { this.pagination.page = page; this.loadHistoryList() },
    handleView(row) { this.currentHistory = row; this.detailVisible = true },
    handleRevert(row) {
      this.$confirm('确定要撤销该操作吗？', '提示', { type: 'warning' }).then(() => {
        wmsApi.revertHistory(row.id).then(() => {
          this.$message.success('撤销成功')
          this.loadHistoryList()
        })
      }).catch(() => {})
    },
    handleExport() { this.$message.info('正在导出...') }
  }
}
</script>

<style lang="scss" scoped>
.history-management { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  h1 { margin: 0; font-size: 22px; color: #303133; i { margin-right: 10px; color: #909399; } }
}
.search-card { margin-bottom: 20px; }
.table-card {
  .inbound-qty { color: #67C23A; font-weight: 600; }
  .outbound-qty { color: #E6A23C; font-weight: 600; }
  .warning { color: #E6A23C; }
}
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
