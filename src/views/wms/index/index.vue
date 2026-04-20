<template>
  <div class="wms-dashboard">
    <div class="dashboard-header">
      <h1><i class="el-icon-warehouse" /> 仓库管理概览</h1>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon goods">
              <i class="el-icon-goods" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalGoods }}</div>
              <div class="stat-label">商品总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon stock">
              <i class="el-icon-box" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalStock }}</div>
              <div class="stat-label">库存总量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon inbound">
              <i class="el-icon-download" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayInbound }}</div>
              <div class="stat-label">今日入库</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon outbound">
              <i class="el-icon-upload2" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayOutbound }}</div>
              <div class="stat-label">今日出库</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="chart-card">
          <div slot="header">
            <span>出入库趋势</span>
          </div>
          <canvas ref="trendChart" height="300" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <div slot="header">
            <span>商品分类占比</span>
          </div>
          <canvas ref="categoryChart" height="300" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="quick-actions">
      <div slot="header">
        <span>快捷操作</span>
      </div>
      <div class="action-buttons">
        <el-button type="primary" icon="el-icon-download" @click="$router.push('/wms/inbound')">入库登记</el-button>
        <el-button type="warning" icon="el-icon-upload2" @click="$router.push('/wms/outbound')">出库登记</el-button>
        <el-button type="info" icon="el-icon-camera" @click="$router.push('/wms/scanner')">扫码查询</el-button>
        <el-button type="success" icon="el-icon-upload" @click="$router.push('/wms/import')">批量导入</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import wmsApi from '@/api/wms'

export default {
  name: 'WmsDashboard',
  data() {
    return {
      stats: {
        totalGoods: 0,
        totalStock: 0,
        todayInbound: 0,
        todayOutbound: 0
      },
      trendChart: null,
      categoryChart: null
    }
  },
  mounted() {
    this.loadStats()
    this.initCharts()
  },
  methods: {
    loadStats() {
      wmsApi.getDashboardStats().then(res => {
        if (res.code === 200) {
          this.stats = res.data
        }
      }).catch(() => {
        this.stats = {
          totalGoods: 156,
          totalStock: 12580,
          todayInbound: 320,
          todayOutbound: 180
        }
      })
    },
    initCharts() {
      if (!window.Chart) return
      this.initTrendChart()
      this.initCategoryChart()
    },
    initTrendChart() {
      var ctx = this.$refs.trendChart && this.$refs.trendChart.getContext('2d')
      if (!ctx) return
      this.trendChart = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
          datasets: [{
            label: '入库',
            data: [120, 150, 180, 200, 160, 220, 320],
            borderColor: '#67C23A',
            backgroundColor: 'rgba(103, 194, 58, 0.1)',
            fill: true
          }, {
            label: '出库',
            data: [100, 130, 160, 180, 140, 200, 280],
            borderColor: '#E6A23C',
            backgroundColor: 'rgba(230, 162, 60, 0.1)',
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      })
    },
    initCategoryChart() {
      var ctx = this.$refs.categoryChart && this.$refs.categoryChart.getContext('2d')
      if (!ctx) return
      this.categoryChart = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['电子元件', '机械配件', '办公用品', '工具设备', '其他'],
          datasets: [{
            data: [35, 25, 20, 12, 8],
            backgroundColor: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.wms-dashboard {
  padding: 20px;
}
.dashboard-header {
  margin-bottom: 20px;
  h1 {
    margin: 0;
    font-size: 22px;
    color: #303133;
    i { margin-right: 10px; color: #409EFF; }
  }
}
.stats-row { margin-bottom: 20px; }
.stat-card {
  .stat-content { display: flex; align-items: center; padding: 10px; }
  .stat-icon {
    width: 60px; height: 60px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-right: 15px;
    i { font-size: 28px; color: #fff; }
    &.goods { background: linear-gradient(135deg, #409EFF, #66b1ff); }
    &.stock { background: linear-gradient(135deg, #67C23A, #85ce61); }
    &.inbound { background: linear-gradient(135deg, #36CEC9, #5ef0ea); }
    &.outbound { background: linear-gradient(135deg, #E6A23C, #ebb563); }
  }
  .stat-info {
    .stat-value { font-size: 28px; font-weight: 600; color: #303133; }
    .stat-label { font-size: 14px; color: #909399; margin-top: 5px; }
  }
}
.chart-card { margin-bottom: 20px; }
.quick-actions {
  .action-buttons { display: flex; gap: 15px; flex-wrap: wrap; }
}
</style>
