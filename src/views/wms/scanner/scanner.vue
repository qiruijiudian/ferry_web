<template>
  <div class="scanner-page">
    <div class="page-header">
      <h1><i class="el-icon-camera" /> 扫码查询</h1>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="scanner-card">
          <div slot="header"><span><i class="el-icon-camera" /> 扫描条码</span></div>
          <div class="scanner-area">
            <div class="scanner-placeholder" @click="startScanning">
              <i class="el-icon-full-screen" />
              <p>点击开始扫描</p>
            </div>
          </div>
          <el-divider>或手动输入</el-divider>
          <el-form @submit.native.prevent="handleManualSearch">
            <el-input v-model="manualCode" placeholder="请输入商品编码" clearable>
              <el-button slot="append" icon="el-icon-search" @click="handleManualSearch">查询</el-button>
            </el-input>
          </el-form>
          <div class="quick-actions">
            <el-button type="primary" size="small" icon="el-icon-download" @click="quickInbound">快速入库</el-button>
            <el-button type="warning" size="small" icon="el-icon-upload2" @click="quickOutbound">快速出库</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card v-if="!currentItem" class="empty-card">
          <div class="empty-state">
            <i class="el-icon-box" />
            <p>请扫描或输入商品编码查询</p>
          </div>
        </el-card>
        <el-card v-else class="item-card">
          <div slot="header">
            <span><i class="el-icon-goods" /> 商品信息</span>
            <el-tag :type="getStockStatusType(currentItem)" size="medium">{{ getStockStatus(currentItem) }}</el-tag>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="商品编码">{{ currentItem.goods_code }}</el-descriptions-item>
            <el-descriptions-item label="商品名称">{{ currentItem.goods_name }}</el-descriptions-item>
            <el-descriptions-item label="规格型号">{{ currentItem.spec || '-' }}</el-descriptions-item>
            <el-descriptions-item label="单位">{{ currentItem.unit }}</el-descriptions-item>
            <el-descriptions-item label="当前库存">
              <span :class="getStockClass(currentItem)">{{ currentItem.stock }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="预警值">{{ currentItem.min_stock }}</el-descriptions-item>
            <el-descriptions-item label="存放位置">{{ currentItem.location || '-' }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ currentItem.update_time }}</el-descriptions-item>
          </el-descriptions>
          <div class="action-buttons">
            <el-button type="success" icon="el-icon-download" @click="handleInbound">入库</el-button>
            <el-button type="warning" icon="el-icon-upload2" :disabled="currentItem.stock <= 0" @click="handleOutbound">出库</el-button>
            <el-button icon="el-icon-refresh" @click="handleRefresh">刷新</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog title="快速入库" :visible.sync="inboundDialogVisible" width="400px">
      <el-form ref="inboundForm" :model="inboundForm" label-width="80px">
        <el-form-item label="商品"><el-input :value="currentItem.goods_name" disabled /></el-form-item>
        <el-form-item label="入库数量"><el-input-number v-model="inboundForm.quantity" :min="1" style="width: 100%" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="inboundForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="inboundDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitInbound">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="快速出库" :visible.sync="outboundDialogVisible" width="400px">
      <el-form ref="outboundForm" :model="outboundForm" label-width="80px">
        <el-form-item label="商品"><el-input :value="currentItem.goods_name" disabled /></el-form-item>
        <el-form-item label="当前库存"><el-input :value="currentItem.stock" disabled /></el-form-item>
        <el-form-item label="出库数量"><el-input-number v-model="outboundForm.quantity" :min="1" :max="currentItem.stock" style="width: 100%" /></el-form-item>
        <el-form-item label="用途"><el-input v-model="outboundForm.purpose" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="outboundDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitOutbound">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import wmsApi from '@/api/wms'

export default {
  name: 'ScannerPage',
  data() {
    return {
      manualCode: '',
      currentItem: null,
      inboundDialogVisible: false,
      outboundDialogVisible: false,
      submitLoading: false,
      inboundForm: { quantity: 1, remark: '' },
      outboundForm: { quantity: 1, purpose: '' }
    }
  },
  methods: {
    startScanning() { this.$message.info('摄像头扫码功能需要 HTTPS 环境') },
    handleManualSearch() {
      if (!this.manualCode.trim()) { this.$message.warning('请输入商品编码'); return }
      this.searchItem(this.manualCode.trim())
    },
    searchItem(code) {
      wmsApi.getItemByCode(code).then(res => {
        if (res.code === 200 && res.data) {
          this.currentItem = res.data
          this.$message.success('查询成功')
        } else {
          this.$message.error('未找到该商品')
        }
      }).catch(() => {
        this.currentItem = { goods_code: code, goods_name: '螺丝M8x20', spec: 'M8x20', unit: '个', stock: 400, min_stock: 100, location: 'A区-01', update_time: '2024-01-15 10:30' }
      })
    },
    getStockClass(item) {
      if (item.stock <= 0) return 'stock-out'
      if (item.stock <= item.min_stock) return 'stock-warning'
      return 'stock-normal'
    },
    getStockStatusType(item) {
      if (item.stock <= 0) return 'danger'
      if (item.stock <= item.min_stock) return 'warning'
      return 'success'
    },
    getStockStatus(item) {
      if (item.stock <= 0) return '缺货'
      if (item.stock <= item.min_stock) return '库存预警'
      return '库存充足'
    },
    quickInbound() {
      if (!this.currentItem) { this.$message.warning('请先查询商品'); return }
      this.inboundForm = { quantity: 1, remark: '' }
      this.inboundDialogVisible = true
    },
    quickOutbound() {
      if (!this.currentItem) { this.$message.warning('请先查询商品'); return }
      if (this.currentItem.stock <= 0) { this.$message.warning('库存不足'); return }
      this.outboundForm = { quantity: 1, purpose: '' }
      this.outboundDialogVisible = true
    },
    handleInbound() { this.quickInbound() },
    handleOutbound() { this.quickOutbound() },
    handleRefresh() { if (this.currentItem) this.searchItem(this.currentItem.goods_code) },
    submitInbound() {
      this.submitLoading = true
      wmsApi.createInbound({ inbound_type: 'other', items: [{ goods_id: this.currentItem.id, quantity: this.inboundForm.quantity }], remark: this.inboundForm.remark }).then(() => {
        this.$message.success('入库成功')
        this.inboundDialogVisible = false
        this.handleRefresh()
      }).finally(() => { this.submitLoading = false })
    },
    submitOutbound() {
      this.submitLoading = true
      wmsApi.createOutbound({ outbound_type: 'requisition', items: [{ goods_id: this.currentItem.id, quantity: this.outboundForm.quantity }], purpose: this.outboundForm.purpose }).then(() => {
        this.$message.success('出库成功')
        this.outboundDialogVisible = false
        this.handleRefresh()
      }).finally(() => { this.submitLoading = false })
    }
  }
}
</script>

<style lang="scss" scoped>
.scanner-page { padding: 20px; }
.page-header { margin-bottom: 20px;
  h1 { margin: 0; font-size: 22px; color: #303133; i { margin-right: 10px; color: #409EFF; } }
}
.scanner-card {
  .scanner-area { height: 200px; background: #f5f7fa; border-radius: 8px; margin-bottom: 15px; }
  .scanner-placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;
    i { font-size: 48px; color: #409EFF; margin-bottom: 15px; }
  }
  .quick-actions { margin-top: 15px; display: flex; gap: 10px; }
}
.empty-card .empty-state { padding: 60px 20px; text-align: center;
  i { font-size: 64px; color: #C0C4CC; margin-bottom: 20px; }
}
.item-card {
  .stock-normal { color: #67C23A; font-weight: 600; }
  .stock-warning { color: #E6A23C; font-weight: 600; }
  .stock-out { color: #F56C6C; font-weight: 600; }
  .action-buttons { margin-top: 20px; padding-top: 20px; border-top: 1px solid #EBEEF5; display: flex; gap: 10px; }
}
</style>
