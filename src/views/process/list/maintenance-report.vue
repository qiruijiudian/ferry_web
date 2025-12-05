<template>
  <div class="container">
    <div class="header">
      <h1><i class="fas fa-tools" /> 维修工单系统分析报告</h1>
      <div class="date">报告周期: {{ getReportPeriodText }}</div>
    </div>

    <!-- 筛选框区域 -->
    <div class="filter-container">
      <div class="filter-group">
        <label class="filter-label">时长筛选</label>
        <el-select v-model="filters.duration" class="filter-select" placeholder="请选择时长" @change="handleDurationChange">
          <el-option label="全部时长" value="all" />
          <el-option label="一周" value="week" />
          <el-option label="一月" value="month" />
          <el-option label="一年" value="year" />
          <el-option label="自选时间段" value="custom" />
        </el-select>
      </div>

      <!-- 自选时间段选择器 -->
      <div v-if="filters.duration === 'custom'" class="filter-group custom-date-range">
        <label class="filter-label">自选时间段</label>
        <el-date-picker
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          format="yyyy-MM-dd"
          :picker-options="pickerOptions"
          class="date-range-picker"
          @change="handleCustomDateChange"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">片区筛选</label>
        <el-select v-model="filters.area" class="filter-select" placeholder="请选择片区" @change="handleFilter">
          <el-option label="全部片区" value="all" />
          <el-option label="岗巴" value="gangba" />
          <el-option label="萨迦" value="sajia" />
          <el-option label="错那" value="cuona" />
          <el-option label="拉萨" value="lasa" />
        </el-select>
      </div>

      <el-button type="primary" icon="el-icon-search" class="filter-button" @click="handleFilter">
        筛选
      </el-button>
    </div>

    <!-- KPI指标 -->
    <div class="kpi-overview">
      <div
        v-for="(kpi, index) in kpiData"
        :key="index"
        :class="['kpi-card', getKpiCardClass(index)]"
        @click="handleKpiClick(index)"
      >
        <div class="kpi-label">{{ kpi.label }}</div>
        <div v-if="index !== 6" :class="['kpi-value', getKpiValueClass(index)]">{{ kpi.value }}</div>
        <div v-else class="kpi-worker-value">
          <div class="worker-name">{{ kpi.worker }}</div>
          <div class="worker-count">{{ kpi.count }}个工单</div>
        </div>
        <div :class="['trend', kpi.trend]">
          <i :class="kpi.icon" /> {{ kpi.description }}
        </div>
      </div>
    </div>

    <!-- 第一行：全部维修人员工单完成情况（占整行） -->
    <div class="full-width-section">
      <div class="section-header">
        <h3 class="section-title">全部维修人员工单完成情况</h3>
        <div class="section-actions">
          <el-button
            v-if="workerData.length > 10 && !showAllWorkers"
            type="text"
            icon="el-icon-arrow-down"
            @click="showAllWorkers = true"
          >
            展开全部 {{ workerData.length }} 条数据
          </el-button>
          <el-button
            v-if="workerData.length > 10 && showAllWorkers"
            type="text"
            icon="el-icon-arrow-up"
            @click="showAllWorkers = false"
          >
            收起至前10条
          </el-button>
        </div>
      </div>
      <div class="table-container">
        <el-table
          v-loading="workerLoading"
          :data="showAllWorkers ? workerData : workerData.slice(0, 10)"
          style="width: 100%"
          :height="tableHeight"
        >
          <el-table-column prop="rank" label="排名" width="60" />
          <el-table-column prop="name" label="维修人员" width="120" />
          <el-table-column prop="completed" label="完成工单数" width="130" />
          <el-table-column prop="total_orders" label="总工单数" width="130" />
          <el-table-column label="工单完成率" width="150">
            <template slot-scope="scope">
              <div class="completion-rate">
                <div class="completion-bar" :style="{ width: Math.min(scope.row.completionRate, 100) + '%' }" />
              </div>
              <span>{{ scope.row.completionRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="avgTime" label="平均完成时长(小时)" width="160" />
          <el-table-column prop="reworkRate" label="返修率" width="100" />
        </el-table>
      </div>
    </div>

    <!-- 第二行：三个图表 -->
    <div class="chart-container">
      <div class="chart-box">
        <div class="chart-title">工单完成时长分布</div>
        <div class="chart-wrapper">
          <canvas ref="durationChart" />
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-title">各类型工单完成时长分布（箱线图）</div>
        <div class="chart-wrapper">
          <div ref="typeDurationChart" style="width: 100%; height: 100%;" />
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-title">工单类型分布</div>
        <div class="chart-wrapper">
          <canvas ref="workTypeChart" />
        </div>
      </div>
    </div>

    <!-- 工单详情对话框 -->
    <el-dialog
      :title="workOrderDialogTitle"
      :visible.sync="workOrderDialogVisible"
      width="90%"
      top="5vh"
      class="work-order-dialog"
    >
      <div class="dialog-toolbar">
        <span class="total-count">共 {{ workOrderDetailData.length }} 条工单记录</span>
        <div class="toolbar-actions">
          <el-input
            v-model="workOrderSearch"
            placeholder="搜索工单..."
            prefix-icon="el-icon-search"
            style="width: 200px; margin-right: 10px;"
            clearable
          />
          <el-button v-if="hasMoreData" type="primary" size="small" :loading="loadingMore" @click="loadMoreData">
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </el-button>
        </div>
      </div>
      <el-table v-loading="workOrderLoading" :data="paginatedWorkOrderData" style="width: 100%" max-height="500" stripe>
        <el-table-column prop="id" label="工单ID" width="100" fixed="left" />
        <el-table-column prop="title" label="工单标题" width="200" show-overflow-tooltip />
        <el-table-column prop="worker" label="维修人员" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)" size="small">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="completion_time" label="完成时长(小时)" width="120" />
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column prop="finish_time" label="完成时间" width="180" />
        <el-table-column prop="area" label="片区" width="100" />
        <el-table-column prop="description" label="工单描述" min-width="200" show-overflow-tooltip />
      </el-table>
      <div v-if="workOrderDetailData.length > 0" class="dialog-pagination">
        <el-pagination
          :current-page="workOrderCurrentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="workOrderPageSize"
          :total="filteredWorkOrderData.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleWorkOrderSizeChange"
          @current-change="handleWorkOrderCurrentChange"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="workOrderDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="exportLoading" @click="exportWorkOrderData">
          导出数据
        </el-button>
      </span>
    </el-dialog>

    <div class="footer">
      本报告由维修工单系统自动生成 | 生成时间: {{ currentTime }}
    </div>
  </div>
</template>

<script>
import { workOrderListAnalysis } from '@/api/process/work-order'
import axios from 'axios'
// 引入ECharts
import * as echarts from 'echarts'

export default {
  name: 'MaintenanceReport',
  data() {
    return {
      filters: {
        duration: 'week',
        area: 'all'
      },
      customDateRange: [],
      pickerOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now()
        },
        shortcuts: [{
          text: '最近一周',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近三个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }]
      },
      reportPeriod: {
        start: '',
        end: ''
      },
      kpiData: [
        { label: '工单总数量', value: '0', trend: '', icon: '', description: '' },
        { label: '未完成工单数量', value: '0', trend: '', icon: '', description: '' },
        { label: '超时工单数量', value: '0', trend: '', icon: '', description: '' },
        { label: '返修工单数量', value: '0', trend: '', icon: '', description: '' },
        { label: '平均完成时长', value: '0小时', trend: '', icon: '', description: '' },
        { label: '一次性修复率', value: '0%', trend: '', icon: '', description: '' },
        { label: '维修人员排行', value: '', worker: '', count: 0, trend: '', icon: '', description: '' }
      ],
      workerData: [],
      workerLoading: false,
      reworkData: [
        { reworkId: 'RW-20231020-001', originalId: 'WO-20231015-045', worker: '张三', reason: '配件安装不牢固', date: '2023-10-20' },
        { reworkId: 'RW-20231021-002', originalId: 'WO-20231016-078', worker: '李四', reason: '软件配置错误', date: '2023-10-21' },
        { reworkId: 'RW-20231022-003', originalId: 'WO-20231018-112', worker: '王五', reason: '线路连接问题', date: '2023-10-22' }
      ],
      materialData: [],
      materialLoading: false,
      charts: {},
      reportData: {
        total_count: 0,
        unfinished_count: 0,
        timeout_count: 0,
        rework_count: 0,
        avg_completion_time: 0,
        completion_rate: 0,
        completion_time_distribution: {
          less_than_2h: 0,
          between_2h_4h: 0,
          between_4h_8h: 0,
          between_8h_24h: 0,
          more_than_24h: 0
        },
        ended_count: 0,
        processing_count: 0,
        unassigned_count: 0,
        worker_completion: [],
        repair_type_stats: [],
        consumable_stats: []
      },
      workOrderDialogVisible: false,
      workOrderDialogTitle: '',
      workOrderDetailData: [],
      workOrderLoading: false,
      workOrderSearch: '',
      workOrderCurrentPage: 1,
      workOrderPageSize: 10,
      exportLoading: false,
      hasMoreData: false,
      loadingMore: false,
      currentPage: 1,
      totalPages: 1,
      timeRangeMap: {
        0: { label: '<2小时', min: 0, max: 2 },
        1: { label: '2-4小时', min: 2, max: 4 },
        2: { label: '4-8小时', min: 4, max: 8 },
        3: { label: '8-24小时', min: 8, max: 24 },
        4: { label: '>24小时', min: 24, max: Infinity }
      },
      cachedWorkOrders: null,
      cachedProcesses: null,
      showAllWorkers: false,
      showAllMaterials: false,
      tableHeight: '400px',
      workerTotalOrdersCache: {},
      // 新增：用于存储箱线图的数据
      typeBoxplotData: {
        categories: [],
        boxData: [],
        scatterData: []
      },
      typeOrderDetails: {},
      // 新增：用于存储Chart.js的图表实例
      chartJsInstances: {
        durationChart: null,
        workTypeChart: null
      }
    }
  },
  computed: {
    getReportPeriodText() {
      if (this.filters.duration === 'all') {
        return '全部时长'
      }

      if (this.filters.duration === 'custom' && this.customDateRange && this.customDateRange.length === 2) {
        return `${this.customDateRange[0]} 至 ${this.customDateRange[1]}`
      }

      const now = new Date()
      let startTime

      switch (this.filters.duration) {
        case 'week':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          return '报告周期'
      }

      const formatDate = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}年${month}月${day}日`
      }

      return `${formatDate(startTime)} - ${formatDate(now)}`
    },
    currentTime() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    filteredWorkOrderData() {
      let data = this.workOrderDetailData

      if (this.workOrderSearch) {
        const search = this.workOrderSearch.toLowerCase()
        data = data.filter(item =>
          (item.id && item.id.toString().toLowerCase().includes(search)) ||
          (item.title && item.title.toLowerCase().includes(search)) ||
          (item.worker && item.worker.toLowerCase().includes(search)) ||
          (item.status && item.status.toLowerCase().includes(search)) ||
          (item.area && item.area.toLowerCase().includes(search))
        )
      }

      return data
    },
    paginatedWorkOrderData() {
      const start = (this.workOrderCurrentPage - 1) * this.workOrderPageSize
      const end = start + this.workOrderPageSize
      return this.filteredWorkOrderData.slice(start, end)
    }
  },
  mounted() {
    console.log('MaintenanceReport组件已挂载')
    this.preFetchAndCacheData()
    this.fetchReportData()
    this.loadChartJS().then(() => {
      console.log('Chart.js加载完成，开始初始化图表')
      this.initCharts()
    })
  },
  beforeDestroy() {
    // 销毁ECharts实例避免内存泄漏
    if (this.charts.typeDurationChart) {
      this.charts.typeDurationChart.dispose()
    }

    // 销毁Chart.js实例
    Object.values(this.chartJsInstances).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy()
      }
    })
  },
  methods: {
    handleDurationChange(value) {
      if (value !== 'custom') {
        this.customDateRange = []
        this.handleFilter()
      }
    },
    handleCustomDateChange(dateRange) {
      if (dateRange && dateRange.length === 2) {
        this.handleFilter()
      }
    },
    async handleFilter() {
      console.log('筛选条件:', this.filters)
      console.log('自定义日期范围:', this.customDateRange)

      this.workerTotalOrdersCache = {}

      const params = {}

      if (this.filters.duration === 'custom') {
        if (this.customDateRange && this.customDateRange.length === 2) {
          params.startTime = this.customDateRange[0] + ' 00:00:00'
          params.endTime = this.customDateRange[1] + ' 23:59:59'
        } else {
          this.$message.warning('请选择完整的时间段')
          return
        }
      } else if (this.filters.duration !== 'all') {
        const now = new Date()
        let startTime

        switch (this.filters.duration) {
          case 'week':
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case 'year':
            startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          default:
            startTime = now
        }

        params.startTime = this.formatDate(startTime)
        params.endTime = this.formatDate(now)
      } else {
        const startTime = new Date(2006, 0, 1)
        const endTime = new Date()
        params.startTime = this.formatDate(startTime)
        params.endTime = this.formatDate(endTime)
      }

      if (this.filters.area !== 'all') {
        const areaMap = {
          'gangba': 'kamba',
          'lasa': 'lhasa',
          'cuona': 'cona',
          'sajia': 'sayga'
        }
        params.belongs = areaMap[this.filters.area]
      }

      await this.fetchFilteredData(params)
    },
    async fetchFilteredData(params) {
      try {
        const response = await axios({
          url: 'https://order.cdqrmi.com/api/v1/analysis',
          method: 'get',
          headers: {
            'Authorization': 'Bearer ' + this.getToken()
          },
          params: params
        })

        if (response.data.code === 200) {
          console.log('筛选后的数据:', response.data)
          this.reportData = response.data.data
          this.updateKpiData()
          this.updateDurationChart()
          await this.updateWorkerData(params)
          // 获取箱线图数据
          this.fetchTypeDurationData()
          this.updateWorkTypeChart()

          let message = `已应用筛选: 时长=${this.getDurationText(this.filters.duration)}`
          if (this.filters.duration === 'custom' && this.customDateRange.length === 2) {
            message += ` (${this.customDateRange[0]} 至 ${this.customDateRange[1]})`
          }
          message += `, 片区=${this.getAreaText(this.filters.area)}`

          this.$message({
            message: message,
            type: 'success'
          })
        } else {
          console.error('获取筛选数据失败:', response.data.message)
          this.$message({
            message: '获取筛选数据失败: ' + response.data.message,
            type: 'error'
          })
        }
      } catch (error) {
        console.error('获取筛选数据失败:', error)
        this.$message({
          message: '获取筛选数据失败，请检查网络连接或联系管理员',
          type: 'error'
        })
      }
    },
    getDurationText(value) {
      const map = {
        'all': '全部时长',
        'week': '一周',
        'month': '一月',
        'year': '一年',
        'custom': '自选时间段'
      }
      return map[value] || value
    },
    preFetchAndCacheData() {
      this.fetchWorkOrders().then(data => {
        this.cachedWorkOrders = data
        console.log('工单列表数据已缓存', data)
      }).catch(err => {
        console.error('工单列表预请求失败', err)
      })
    },
    fetchWorkOrders() {
      return new Promise((resolve, reject) => {
        workOrderListAnalysis({
          classify: 4
        }).then(response => {
          if (response.code === 200) {
            resolve(response.data)
          } else {
            reject(new Error('工单列表请求失败: ' + response.msg))
          }
        }).catch(error => {
          reject(error)
        })
      })
    },
    getCachedWorkOrders() {
      return this.cachedWorkOrders
    },
    filterCachedWorkOrders(condition = {}) {
      if (!this.cachedWorkOrders || !this.cachedWorkOrders.data) return []

      return this.cachedWorkOrders.data.filter(order => {
        if (condition.area && condition.area !== 'all') {
          const areaMap = {
            'gangba': 'kamba',
            'lasa': 'lhasa',
            'cuona': 'cona',
            'sajia': 'sayga'
          }
          if (order.belongs !== areaMap[condition.area]) return false
        }

        if (condition.status) {
          if (condition.status === 'ended' && order.is_end !== 1) return false
          if (condition.status === 'processing' && (order.is_end === 1 || order.is_denied === 1)) return false
        }

        if (condition.worker) {
          if (order.principals !== condition.worker) return false
        }

        return true
      })
    },
    async fetchReportData() {
      const now = new Date()
      const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const params = {
        startTime: this.formatDate(startTime),
        endTime: this.formatDate(now)
      }

      try {
        const response = await axios({
          url: 'https://order.cdqrmi.com/api/v1/analysis',
          method: 'get',
          headers: {
            'Authorization': 'Bearer ' + this.getToken()
          },
          params: params
        })

        if (response.data.code === 200) {
          console.log('API返回的原始数据:', response.data)
          this.reportData = response.data.data
          this.updateKpiData()
          this.updateDurationChart()
          await this.updateWorkerData(params)
          // 获取箱线图数据
          this.fetchTypeDurationData()
          this.updateWorkTypeChart()
          this.filters.duration = 'week'
        } else {
          console.error('获取报表数据失败:', response.data.message)
          this.$message({
            message: '获取报表数据失败: ' + response.data.message,
            type: 'error'
          })
        }
      } catch (error) {
        console.error('获取报表数据失败:', error)
        this.$message({
          message: '获取报表数据失败，请检查网络连接或联系管理员',
          type: 'error'
        })
      }
    },
    getToken() {
      return localStorage.getItem('token') || ''
    },
    updateKpiData() {
      this.kpiData[0].value = this.reportData.total_count
      this.kpiData[1].value = this.reportData.unfinished_count
      this.kpiData[2].value = this.reportData.timeout_count
      this.kpiData[3].value = this.reportData.rework_count || 0
      this.kpiData[4].value = parseFloat(this.reportData.avg_completion_time).toFixed(2) + '小时'
      this.kpiData[5].value = parseFloat(this.reportData.completion_rate).toFixed(2) + '%'

      if (this.reportData.worker_completion && this.reportData.worker_completion.length > 0) {
        const topWorker = [...this.reportData.worker_completion].sort((a, b) => b.count - a.count)[0]
        if (topWorker) {
          this.kpiData[6].worker = topWorker.nick_name
          this.kpiData[6].count = topWorker.count
        }
      }
    },
    updateDurationChart() {
      if (this.chartJsInstances.durationChart) {
        this.chartJsInstances.durationChart.data.datasets[0].data = [
          this.reportData.completion_time_distribution.less_than_2h,
          this.reportData.completion_time_distribution.between_2h_4h,
          this.reportData.completion_time_distribution.between_4h_8h,
          this.reportData.completion_time_distribution.between_8h_24h,
          this.reportData.completion_time_distribution.more_than_24h
        ]
        this.chartJsInstances.durationChart.update()
      }
    },
    updateWorkTypeChart() {
      console.log('更新工单类型分布图表')
      console.log('repair_type_stats数据:', this.reportData.repair_type_stats)

      if (this.chartJsInstances.workTypeChart && this.reportData.repair_type_stats) {
        const labels = this.reportData.repair_type_stats.map(item => item.type)
        const data = this.reportData.repair_type_stats.map(item => item.count)

        console.log('工单类型分布 - 标签:', labels)
        console.log('工单类型分布 - 数据:', data)

        this.chartJsInstances.workTypeChart.data.labels = labels
        this.chartJsInstances.workTypeChart.data.datasets[0].data = data
        this.chartJsInstances.workTypeChart.update()
      }
    },
    // 修改：更新维修人员数据 - 使用正确的工单完成率计算方法
    async updateWorkerData(filterParams = {}) {
      this.workerLoading = true

      try {
        const sortedWorkers = [...this.reportData.worker_completion].sort((a, b) => b.count - a.count)

        // 为每个维修人员获取个人总工单数
        const workerPromises = sortedWorkers.map(async(worker, index) => {
          try {
            // 获取该维修人员的个人总工单数（包含已完成和未完成）
            const totalOrders = await this.fetchWorkerTotalOrders(worker.nick_name, filterParams)

            console.log(`维修人员 ${worker.nick_name}：完成工单数=${worker.count}, 总工单数=${totalOrders}`)

            // 计算工单完成率：个人完成工单数 ÷ 个人总工单数 × 100%
            let completionRate = 0
            if (totalOrders > 0) {
              completionRate = Math.round((worker.count / totalOrders) * 100)
            }

            // 确保完成率不超过100%
            completionRate = Math.min(completionRate, 100)

            return {
              rank: index + 1,
              name: worker.nick_name,
              completed: worker.count, // 分子：个人完成工单数
              total_orders: totalOrders, // 分母：个人总工单数
              completionRate: completionRate, // 工单完成率 = 个人完成工单数 ÷ 个人总工单数 × 100%
              avgTime: parseFloat(worker.avg_time).toFixed(1),
              reworkRate: '0%'
            }
          } catch (error) {
            console.error(`获取维修人员 ${worker.nick_name} 总工单数失败:`, error)
            // 如果获取失败，暂时用完成工单数作为总工单数（完成率100%）
            return {
              rank: index + 1,
              name: worker.nick_name,
              completed: worker.count,
              total_orders: worker.count,
              completionRate: 100,
              avgTime: parseFloat(worker.avg_time).toFixed(1),
              reworkRate: '0%'
            }
          }
        })

        // 等待所有维修人员数据获取完成
        this.workerData = await Promise.all(workerPromises)

        console.log('维修人员数据更新完成:', this.workerData)
      } catch (error) {
        console.error('更新维修人员数据失败:', error)
        // 如果整体失败，使用备选方案
        this.updateWorkerDataFallback()
      } finally {
        this.workerLoading = false
      }
    },
    // 新增：获取维修人员个人总工单数（包含已完成和未完成）
    async fetchWorkerTotalOrders(workerName, filterParams = {}) {
      // 使用缓存，避免重复请求
      const cacheKey = `${workerName}_${JSON.stringify(filterParams)}`
      if (this.workerTotalOrdersCache[cacheKey] !== undefined) {
        console.log(`从缓存获取 ${workerName} 的总工单数:`, this.workerTotalOrdersCache[cacheKey])
        return this.workerTotalOrdersCache[cacheKey]
      }

      try {
        // 构建请求参数，按维修人员名称筛选
        const apiParams = {
          classify: 4,
          page: 1,
          per_page: 1, // 只需要总数，不需要具体数据
          principals: workerName, // 按维修人员筛选
          ...filterParams
        }

        // 移除不必要的参数
        delete apiParams.min_time
        delete apiParams.max_time

        console.log(`请求 ${workerName} 的总工单数，参数:`, apiParams)

        const response = await axios({
          url: 'https://order.cdqrmi.com/api/v1/analysis/list',
          method: 'get',
          params: apiParams,
          timeout: 15000,
          headers: {
            'Authorization': 'Bearer ' + this.getToken()
          }
        })

        if (response.data.code === 200) {
          let totalCount = 0

          if (response.data.data && response.data.data.total_count !== undefined) {
            totalCount = response.data.data.total_count
          } else if (response.data.data && response.data.data.data) {
            totalCount = response.data.data.data.length
          }

          console.log(`维修人员 ${workerName} 的个人总工单数:`, totalCount)

          // 缓存结果
          this.workerTotalOrdersCache[cacheKey] = totalCount

          return totalCount
        } else {
          console.error(`获取维修人员 ${workerName} 总工单数失败:`, response.data.message)
          throw new Error(response.data.message || '获取总工单数失败')
        }
      } catch (error) {
        console.error(`请求维修人员 ${workerName} 总工单数异常:`, error)
        throw error
      }
    },
    // 备选方案：如果获取总工单数失败，使用原有逻辑
    updateWorkerDataFallback() {
      const sortedWorkers = [...this.reportData.worker_completion].sort((a, b) => b.count - a.count)

      this.workerData = sortedWorkers.map((worker, index) => {
        // 备选方案：用完成工单数作为总工单数
        return {
          rank: index + 1,
          name: worker.nick_name,
          completed: worker.count,
          total_orders: worker.count,
          completionRate: 100, // 备选方案中完成率设为100%
          avgTime: parseFloat(worker.avg_time).toFixed(1),
          reworkRate: '0%'
        }
      })
    },
    loadChartJS() {
      return new Promise((resolve, reject) => {
        if (window.Chart) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@2.9.4/dist/Chart.min.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    },
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    getAreaText(value) {
      const map = {
        'all': '全部片区',
        'gangba': '岗巴',
        'sajia': '萨迦',
        'cuona': '错那',
        'lasa': '拉萨'
      }
      return map[value] || value
    },
    initCharts() {
      if (!window.Chart) {
        console.error('Chart.js未加载')
        return
      }

      // 初始化工单完成时长分布图（Chart.js）
      const durationCtx = this.$refs.durationChart.getContext('2d')
      this.chartJsInstances.durationChart = new window.Chart(durationCtx, {
        type: 'bar',
        data: {
          labels: ['<2小时', '2-4小时', '4-8小时', '8-24小时', '>24小时'],
          datasets: [{
            label: '工单数量',
            data: [
              this.reportData.completion_time_distribution.less_than_2h,
              this.reportData.completion_time_distribution.between_2h_4h,
              this.reportData.completion_time_distribution.between_4h_8h,
              this.reportData.completion_time_distribution.between_8h_24h,
              this.reportData.completion_time_distribution.more_than_24h
            ],
            backgroundColor: [
              'rgba(34, 197, 94, 0.7)',
              'rgba(34, 197, 94, 0.7)',
              'rgba(251, 191, 36, 0.7)',
              'rgba(251, 146, 60, 0.7)',
              'rgba(239, 68, 68, 0.7)'
            ],
            borderColor: [
              'rgb(34, 197, 94)',
              'rgb(34, 197, 94)',
              'rgb(251, 191, 36)',
              'rgb(251, 146, 60)',
              'rgb(239, 68, 68)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '工单数量'
              }
            }
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const element = elements[0]
              const index = element._index
              const label = this.chartJsInstances.durationChart.data.labels[index]
              this.workOrderDialogTitle = `工单详情 - ${label}完成`
              this.workOrderDialogVisible = true
              this.fetchWorkOrderDetails(index)
            }
          }
        }
      })

      // 初始化工单类型分布图（Chart.js）
      const workTypeCtx = this.$refs.workTypeChart.getContext('2d')
      this.chartJsInstances.workTypeChart = new window.Chart(workTypeCtx, {
        type: 'pie',
        data: {
          labels: this.reportData.repair_type_stats
            ? this.reportData.repair_type_stats.map(item => item.type)
            : [],
          datasets: [{
            data: this.reportData.repair_type_stats
              ? this.reportData.repair_type_stats.map(item => item.count)
              : [],
            backgroundColor: [
              'rgba(239, 68, 68, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(34, 197, 94, 0.7)',
              'rgba(251, 191, 36, 0.7)',
              'rgba(139, 92, 246, 0.7)',
              'rgba(236, 72, 153, 0.7)',
              'rgba(20, 184, 166, 0.7)',
              'rgba(245, 158, 11, 0.7)'
            ],
            borderColor: [
              'rgb(239, 68, 68)',
              'rgb(59, 130, 246)',
              'rgb(34, 197, 94)',
              'rgb(251, 191, 36)',
              'rgb(139, 92, 246)',
              'rgb(236, 72, 153)',
              'rgb(20, 184, 166)',
              'rgb(245, 158, 11)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      })
    },

    // 新增：获取各类型工单完成时长数据（用于箱线图）
    async fetchTypeDurationData() {
      try {
        const filterParams = this.getFilterParams()

        // 获取所有工单数据
        const apiParams = {
          classify: 4,
          page: 1,
          per_page: 500, // 获取足够多的数据用于分析
          ...filterParams
        }

        const response = await axios({
          url: 'https://order.cdqrmi.com/api/v1/analysis/list',
          method: 'get',
          params: apiParams,
          timeout: 30000,
          headers: {
            'Authorization': 'Bearer ' + this.getToken()
          }
        })

        if (response.data.code === 200 && response.data.data && response.data.data.data) {
          const orders = response.data.data.data

          // 按工单类型分组
          const typeGroups = {}
          this.typeOrderDetails = {} // 用于存储每个类型的工单详情

          orders.forEach(order => {
            // 获取工单类型
            const type = order.repair_type || '未知类型'

            // 计算完成时长（只统计已完成的工单）
            if (order.is_end === 1 && order.create_time && order.update_time) {
              const createTime = new Date(order.create_time)
              const finishTime = new Date(order.update_time)
              const durationHours = (finishTime - createTime) / (1000 * 60 * 60)

              if (!isNaN(durationHours) && durationHours >= 0) {
                if (!typeGroups[type]) {
                  typeGroups[type] = []
                  this.typeOrderDetails[type] = []
                }
                typeGroups[type].push(durationHours)

                // 存储工单详情
                this.typeOrderDetails[type].push({
                  id: order.id,
                  title: order.title,
                  duration: durationHours,
                  worker: order.principals,
                  createTime: order.create_time,
                  finishTime: order.update_time
                })
              }
            }
          })

          // 将数据转换为箱线图需要的格式
          this.convertToBoxplotData(typeGroups)

          // 初始化或更新箱线图
          this.initOrUpdateBoxplotChart()
        }
      } catch (error) {
        console.error('获取类型工单时长数据失败:', error)
        // 如果获取失败，使用模拟数据
        this.generateMockBoxplotData()
      }
    },

    // 转换数据为箱线图格式
    convertToBoxplotData(typeGroups) {
      this.typeBoxplotData = {
        categories: [],
        boxData: [],
        scatterData: []
      }

      Object.entries(typeGroups).forEach(([type, durations]) => {
        if (durations.length >= 5) { // 至少有5个数据点才显示箱线图
          this.typeBoxplotData.categories.push(type)

          // 排序数据
          const sorted = durations.slice().sort((a, b) => a - b)

          // 计算四分位数
          const q1 = this.calculateQuantile(sorted, 0.25)
          const median = this.calculateQuantile(sorted, 0.5)
          const q3 = this.calculateQuantile(sorted, 0.75)

          // 计算上下边界（1.5倍IQR规则）
          const iqr = q3 - q1
          const min = Math.max(sorted[0], q1 - 1.5 * iqr)
          const max = Math.min(sorted[sorted.length - 1], q3 + 1.5 * iqr)

          // 箱线图数据：[min, q1, median, q3, max]
          this.typeBoxplotData.boxData.push([min, q1, median, q3, max])

          // 散点数据（显示异常值）
          const outliers = durations.filter(d => d < min || d > max)
          outliers.forEach(outlier => {
            this.typeBoxplotData.scatterData.push([type, outlier])
          })
        }
      })

      return this.typeBoxplotData
    },

    // 计算分位数
    calculateQuantile(sortedArray, p) {
      const index = (sortedArray.length - 1) * p
      const lower = Math.floor(index)
      const upper = lower + 1
      const weight = index - lower

      if (upper >= sortedArray.length) {
        return sortedArray[lower]
      }

      return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight
    },

    // 初始化或更新箱线图
    initOrUpdateBoxplotChart() {
      const chartDom = this.$refs.typeDurationChart
      if (!chartDom) return

      // 如果图表已存在，则更新数据
      if (this.charts.typeDurationChart) {
        this.updateBoxplotChart()
      } else {
        // 否则初始化新图表
        this.initBoxplotChart()
      }
    },

    // 初始化箱线图
    initBoxplotChart() {
      const chartDom = this.$refs.typeDurationChart
      if (!chartDom || !this.typeBoxplotData.categories.length) {
        console.warn('箱线图容器或数据未准备好')
        return
      }

      this.charts.typeDurationChart = echarts.init(chartDom)

      const option = {
        title: {
          text: '各类型工单完成时长分布',
          left: 'center',
          textStyle: {
            color: '#333',
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'item',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            if (params.seriesType === 'boxplot') {
              const data = params.value
              return `
                <div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>
                <div>最小值: ${data[0].toFixed(2)}小时</div>
                <div>下四分位(Q1): ${data[1].toFixed(2)}小时</div>
                <div>中位数: ${data[2].toFixed(2)}小时</div>
                <div>上四分位(Q3): ${data[3].toFixed(2)}小时</div>
                <div>最大值: ${data[4].toFixed(2)}小时</div>
              `
            } else if (params.seriesType === 'scatter') {
              return `${params.name}<br/>异常值: ${params.value[1].toFixed(2)}小时`
            }
          }
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '10%',
          top: '20%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.typeBoxplotData.categories,
          axisLabel: {
            rotate: 45,
            fontSize: 10
          },
          name: '工单类型',
          nameLocation: 'middle',
          nameGap: 30
        },
        yAxis: {
          type: 'value',
          name: '完成时长（小时）',
          nameLocation: 'middle',
          nameGap: 40,
          min: 0,
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        series: [
          {
            name: 'boxplot',
            type: 'boxplot',
            data: this.typeBoxplotData.boxData,
            itemStyle: {
              color: '#5470c6',
              borderColor: '#31456d'
            },
            tooltip: {
              formatter: function(param) {
                return [
                  '类型: ' + param.name,
                  '上边缘: ' + param.data[4].toFixed(2) + '小时',
                  '上四分位: ' + param.data[3].toFixed(2) + '小时',
                  '中位数: ' + param.data[2].toFixed(2) + '小时',
                  '下四分位: ' + param.data[1].toFixed(2) + '小时',
                  '下边缘: ' + param.data[0].toFixed(2) + '小时'
                ].join('<br/>')
              }
            }
          },
          {
            name: 'outlier',
            type: 'scatter',
            data: this.typeBoxplotData.scatterData,
            symbolSize: 6,
            itemStyle: {
              color: '#ee6666'
            },
            tooltip: {
              formatter: function(param) {
                return '异常值: ' + param.value[1].toFixed(2) + '小时'
              }
            }
          }
        ],
        toolbox: {
          feature: {
            saveAsImage: {
              title: '保存为图片',
              pixelRatio: 2
            },
            dataView: {
              title: '数据视图',
              readOnly: true,
              lang: ['数据视图', '关闭', '刷新']
            }
          },
          right: 10,
          top: 10
        }
      }

      this.charts.typeDurationChart.setOption(option)

      // 添加图表点击事件
      this.charts.typeDurationChart.on('click', (params) => {
        if (params.seriesType === 'boxplot') {
          this.handleBoxplotClick(params.name)
        }
      })

      // 添加窗口大小变化监听
      window.addEventListener('resize', () => {
        if (this.charts.typeDurationChart) {
          this.charts.typeDurationChart.resize()
        }
      })
    },

    // 更新箱线图数据
    updateBoxplotChart() {
      if (!this.charts.typeDurationChart) return

      const option = {
        xAxis: {
          data: this.typeBoxplotData.categories
        },
        series: [
          {
            data: this.typeBoxplotData.boxData
          },
          {
            data: this.typeBoxplotData.scatterData
          }
        ]
      }

      this.charts.typeDurationChart.setOption(option)
    },

    // 处理箱线图点击事件
    handleBoxplotClick(typeName) {
      this.workOrderDialogTitle = `${typeName} - 工单详情`
      this.workOrderDialogVisible = true
      this.workOrderLoading = true

      // 从缓存中获取该类型的工单详情
      if (this.typeOrderDetails[typeName]) {
        this.workOrderDetailData = this.typeOrderDetails[typeName].map(item => ({
          id: item.id,
          title: item.title,
          worker: item.worker || '未分配',
          status: '已完成',
          completion_time: `${item.duration.toFixed(2)}小时`,
          create_time: item.createTime,
          finish_time: item.finishTime,
          area: '待补充',
          description: item.title || '无描述'
        }))

        this.workOrderLoading = false
        this.hasMoreData = false
      } else {
        // 如果没有缓存，从API获取
        this.fetchTypeWorkOrderDetails(typeName)
      }
    },

    // 获取特定类型的工单详情
    async fetchTypeWorkOrderDetails(typeName) {
      const filterParams = this.getFilterParams()

      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 100,
        repair_type: typeName, // 假设API支持按类型筛选
        ...filterParams
      }

      try {
        const response = await axios({
          url: 'https://order.cdqrmi.com/api/v1/analysis/list',
          method: 'get',
          params: apiParams,
          timeout: 30000,
          headers: {
            'Authorization': 'Bearer ' + this.getToken()
          }
        })

        this.workOrderLoading = false

        if (response.data.code === 200 && response.data.data && response.data.data.data) {
          this.workOrderDetailData = response.data.data.data.map(item => this.formatWorkOrderData(item))
          console.log(`成功加载 ${this.workOrderDetailData.length} 条${typeName}的工单记录`)
          this.hasMoreData = false
        } else {
          this.$message.error(`获取${typeName}工单详情失败`)
          this.workOrderDetailData = []
        }
      } catch (error) {
        this.workOrderLoading = false
        console.error('请求失败:', error)
        this.$message.error('获取工单详情失败')
        this.workOrderDetailData = []
      }
    },

    // 生成模拟数据（备用）
    generateMockBoxplotData() {
      const types = ['网络故障', '硬件维修', '软件问题', '系统升级', '其他']
      const mockData = {
        categories: types,
        boxData: [],
        scatterData: []
      }

      types.forEach(type => {
        // 生成模拟的箱线图数据
        const min = Math.random() * 2
        const q1 = 2 + Math.random() * 3
        const median = 5 + Math.random() * 5
        const q3 = 8 + Math.random() * 4
        const max = 12 + Math.random() * 10

        mockData.boxData.push([min, q1, median, q3, max])

        // 生成一些异常值
        for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
          const outlier = max + 5 + Math.random() * 20
          mockData.scatterData.push([type, outlier])
        }
      })

      this.typeBoxplotData = mockData
      this.initOrUpdateBoxplotChart()
    },

    fetchWorkerOrderDetails(workerName) {
      this.workOrderLoading = true
      this.workOrderDialogTitle = `工单详情 - ${workerName}`
      this.workOrderDialogVisible = true

      this.workOrderCurrentPage = 1
      this.workOrderSearch = ''

      const filterParams = this.getFilterParams()

      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 100,
        ...filterParams
      }

      console.log('请求参数:', apiParams)

      axios({
        url: 'https://order.cdqrmi.com/api/v1/analysis/list',
        method: 'get',
        params: apiParams,
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        }
      }).then(response => {
        this.workOrderLoading = false
        console.log('API响应:', response.data)

        if (response.data.code === 200) {
          if (response.data.data && response.data.data.data) {
            const allOrders = response.data.data.data.map(item => this.formatWorkOrderData(item))
            this.workOrderDetailData = allOrders.filter(order => order.worker === workerName)

            console.log(`成功加载 ${this.workOrderDetailData.length} 条${workerName}的工单记录`)
            this.hasMoreData = false

            if (this.workOrderDetailData.length === 0) {
              this.$message.warning(`未找到${workerName}的工单记录`)
            }
          } else {
            this.workOrderDetailData = []
          }
        } else {
          this.$message.error(`获取工单详情失败：${response.data.msg || '未知错误'}`)
          this.workOrderDetailData = []
        }
      }).catch(error => {
        this.workOrderLoading = false
        console.error('请求失败:', error)

        if (error.code === 'ECONNABORTED') {
          this.$message.error('请求超时，请尝试缩小筛选范围或联系管理员')
        } else if (error.response) {
          this.$message.error(`服务器错误: ${error.response.status} - ${(error.response.data && error.response.data.msg) || '未知错误'}`)
        } else if (error.request) {
          this.$message.error('网络连接失败，请检查网络连接')
        } else {
          this.$message.error('请求配置错误: ' + error.message)
        }
        this.workOrderDetailData = []
      })
    },
    fetchWorkOrderDetails(timeRangeIndex) {
      const timeRange = this.timeRangeMap[timeRangeIndex]
      if (!timeRange) {
        this.$message({
          message: '无效的时间范围',
          type: 'error'
        })
        return
      }

      this.workOrderLoading = true
      this.workOrderDialogTitle = `工单详情 - ${timeRange.label}完成`
      this.workOrderDialogVisible = true

      const filterParams = this.getFilterParams()

      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 100,
        min_time: timeRange.min,
        max_time: timeRange.max,
        ...filterParams
      }

      console.log('时间范围请求参数:', apiParams)

      axios({
        url: 'https://order.cdqrmi.com/api/v1/analysis/list',
        method: 'get',
        params: apiParams,
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        }
      }).then(response => {
        this.workOrderLoading = false
        if (response.data.code === 200) {
          if (response.data.data && response.data.data.data) {
            this.workOrderDetailData = response.data.data.data.map(item => this.formatWorkOrderData(item))
            console.log(`成功加载 ${this.workOrderDetailData.length} 条工单记录`)

            this.hasMoreData = response.data.data.total_count > response.data.data.data.length
          } else {
            this.workOrderDetailData = []
          }
        } else {
          this.$message.error(`获取工单详情失败：${response.data.msg || '未知错误'}`)
          this.workOrderDetailData = []
        }
      }).catch(error => {
        this.workOrderLoading = false
        this.handleApiError(error)
      })
    },
    fetchWorkOrderTotalDetails() {
      this.workOrderLoading = true
      this.workOrderDialogTitle = '所有工单详情'
      this.workOrderDialogVisible = true

      this.workOrderCurrentPage = 1
      this.workOrderSearch = ''

      const filterParams = this.getFilterParams()

      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 100,
        ...filterParams
      }

      console.log('请求参数:', apiParams)

      axios({
        url: 'https://order.cdqrmi.com/api/v1/analysis/list',
        method: 'get',
        params: apiParams,
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        }
      }).then(response => {
        this.workOrderLoading = false
        console.log('API响应:', response.data)

        if (response.data.code === 200) {
          if (response.data.data && response.data.data.data) {
            this.workOrderDetailData = response.data.data.data.map(item => this.formatWorkOrderData(item))
            console.log(`成功加载 ${this.workOrderDetailData.length} 条工单记录`)

            this.hasMoreData = response.data.data.total_count > response.data.data.data.length

            if (response.data.data.total_count > 100) {
              this.$message.warning(`共有 ${response.data.data.total_count} 条记录，当前显示前100条。如需查看全部，请使用筛选功能。`)
            }
          } else {
            this.workOrderDetailData = []
          }
        } else {
          this.$message.error(`获取工单详情失败：${response.data.msg || '未知错误'}`)
          this.workOrderDetailData = []
        }
      }).catch(error => {
        this.workOrderLoading = false
        console.error('请求失败:', error)

        if (error.code === 'ECONNABORTED') {
          this.$message.error('请求超时，请尝试缩小筛选范围或联系管理员')
        } else if (error.response) {
          this.$message.error(`服务器错误: ${error.response.status} - ${(error.response.data && error.response.data.msg) || '未知错误'}`)
        } else if (error.request) {
          this.$message.error('网络连接失败，请检查网络连接')
        } else {
          this.$message.error('请求配置错误: ' + error.message)
        }
        this.workOrderDetailData = []
      })
    },
    formatWorkOrderData(item) {
      return {
        id: item.id || '',
        title: item.title || '',
        worker: item.principals || '未分配',
        status: this.formatStatus(item),
        completion_time: this.calculateCompletionTime(item) || '未完成',
        create_time: item.create_time || '',
        finish_time: item.is_end ? item.update_time : '未完成',
        area: this.formatArea(item.belongs || item.area),
        description: item.description || item.title || '无描述'
      }
    },
    calculateCompletionTime(item) {
      if (this.isWorkOrderDenied(item)) {
        return '未计算（已驳回）'
      }

      if (!item.is_end || !item.create_time || !item.update_time) {
        return '未完成'
      }

      const createTime = new Date(item.create_time).getTime()
      const finishTime = new Date(item.update_time).getTime()

      if (isNaN(createTime) || isNaN(finishTime)) {
        console.error(`工单 ${item.id} 时间格式错误`)
        return '时间数据错误'
      }

      if (finishTime < createTime) {
        console.warn(`工单 ${item.id} 完成时间早于创建时间`)
        return '时间顺序异常'
      }

      const diffMs = finishTime - createTime

      if (diffMs === 0) {
        return '0小时'
      }

      const hours = diffMs / (1000 * 60 * 60)

      if (hours < 0.1) {
        const minutes = diffMs / (1000 * 60)
        return `${minutes.toFixed(1)}分钟`
      }

      return `${hours.toFixed(1)}小时`
    },
    formatStatus(item) {
      if (this.isWorkOrderDenied(item)) {
        return '已驳回'
      }
      if (item.is_end === 1) {
        return '已完成'
      }
      if (item.is_accept === 1) {
        return '进行中'
      }
      return '待分配'
    },
    isWorkOrderDenied(item) {
      const hasDeniedReason = item.denied_reason &&
                              item.denied_reason.trim().length > 0 &&
                              item.denied_reason !== 'null' &&
                              item.denied_reason !== 'undefined'

      const isNotAccepted = item.is_accept === 0 || item.is_accept === false

      return hasDeniedReason && isNotAccepted
    },
    handleApiError(error) {
      this.workOrderLoading = false
      console.error('API错误详情:', error)

      if (error.code === 'ECONNABORTED') {
        this.$message.error('请求超时，建议：1. 缩小时间范围 2. 选择特定片区 3. 联系管理员检查服务器性能')
      } else if (error.response) {
        switch (error.response.status) {
          case 401:
            this.$message.error('认证失败，请重新登录')
            break
          case 403:
            this.$message.error('权限不足，无法访问该资源')
            break
          case 500:
            this.$message.error('服务器内部错误，请稍后重试')
            break
          case 502:
          case 503:
            this.$message.error('服务器暂时不可用，请稍后重试')
            break
          default:
            this.$message.error(`服务器错误: ${error.response.status}`)
        }
      } else if (error.request) {
        this.$message.error('网络请求失败，请检查网络连接或VPN设置')
      } else {
        this.$message.error('请求配置错误: ' + error.message)
      }
      this.workOrderDetailData = []
    },
    formatArea(areaCode) {
      const areaMap = {
        'kamba': '岗巴',
        'sayga': '萨迦',
        'cona': '错那',
        'lhasa': '拉萨'
      }
      return areaMap[areaCode] || areaCode
    },
    getFilterParams() {
      const params = {}

      if (this.filters.duration === 'custom') {
        if (this.customDateRange && this.customDateRange.length === 2) {
          params.startTime = this.customDateRange[0] + ' 00:00:00'
          params.endTime = this.customDateRange[1] + ' 23:59:59'
        }
      } else if (this.filters.duration !== 'all') {
        const now = new Date()
        let startTime
        const endTime = now

        switch (this.filters.duration) {
          case 'week':
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case 'year':
            startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          default:
            startTime = now
        }

        params.startTime = this.formatDate(startTime)
        params.endTime = this.formatDate(endTime)
      } else {
        const startTime = new Date(2006, 0, 1)
        const endTime = new Date()
        params.startTime = this.formatDate(startTime)
        params.endTime = this.formatDate(endTime)
      }

      if (this.filters.area !== 'all') {
        const areaMap = {
          'gangba': 'kamba',
          'lasa': 'lhasa',
          'cuona': 'cona',
          'sajia': 'sayga'
        }
        params.belongs = areaMap[this.filters.area]
      }

      return params
    },
    handleKpiClick(index) {
      switch (index) {
        case 0:
          this.fetchWorkOrderTotalDetails()
          break
        case 1:
          if (this.cachedWorkOrders) {
            this.workOrderDialogTitle = '未完成工单详情'
            this.workOrderDialogVisible = true
            this.workOrderDetailData = this.filterCachedWorkOrders({ status: 'processing' })
              .map(item => this.formatWorkOrderData(item))
          } else {
            this.$message.info('数据加载中，请稍后再试')
          }
          break
        case 2:
          this.fetchTimeoutWorkOrderDetails()
          break
        case 3:
          this.$message.info('返修工单详情功能待实现')
          break
        case 4:
          this.fetchWorkOrderTotalDetails()
          break
        case 5:
          this.fetchWorkOrderTotalDetails()
          break
        case 6:
          this.scrollToWorkerTable()
          return
        default:
          return
      }
    },
    fetchTimeoutWorkOrderDetails() {
      this.workOrderLoading = true
      this.workOrderDialogTitle = '超时工单详情（完成时间>24小时）'
      this.workOrderDialogVisible = true

      this.workOrderCurrentPage = 1
      this.workOrderSearch = ''

      const filterParams = this.getFilterParams()

      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 100,
        min_time: 24,
        max_time: 9999,
        ...filterParams
      }

      console.log('超时工单请求参数:', apiParams)

      axios({
        url: 'https://order.cdqrmi.com/api/v1/analysis/list',
        method: 'get',
        params: apiParams,
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        }
      }).then(response => {
        this.workOrderLoading = false
        console.log('超时工单API响应:', response.data)

        if (response.data.code === 200) {
          if (response.data.data && response.data.data.data) {
            this.workOrderDetailData = response.data.data.data.map(item => this.formatWorkOrderData(item))
            console.log(`成功加载 ${this.workOrderDetailData.length} 条超时工单记录`)

            this.hasMoreData = response.data.data.total_count > response.data.data.data.length

            if (response.data.data.total_count > 100) {
              this.$message.warning(`共有 ${response.data.data.total_count} 条超时工单记录，当前显示前100条。如需查看全部，请使用筛选功能。`)
            }

            if (this.workOrderDetailData.length === 0) {
              this.$message.info('当前筛选条件下没有超时工单（完成时间>24小时）')
            }
          } else {
            this.workOrderDetailData = []
          }
        } else {
          this.$message.error(`获取超时工单详情失败：${response.data.msg || '未知错误'}`)
          this.workOrderDetailData = []
        }
      }).catch(error => {
        this.workOrderLoading = false
        console.error('请求超时工单失败:', error)

        if (error.code === 'ECONNABORTED') {
          this.$message.error('请求超时，请尝试缩小筛选范围或联系管理员')
        } else if (error.response) {
          this.$message.error(`服务器错误: ${error.response.status} - ${(error.response.data && error.response.data.msg) || '未知错误'}`)
        } else if (error.request) {
          this.$message.error('网络连接失败，请检查网络连接')
        } else {
          this.$message.error('请求配置错误: ' + error.message)
        }
        this.workOrderDetailData = []
      })
    },
    scrollToWorkerTable() {
      this.$nextTick(() => {
        const element = document.querySelector('.full-width-section')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          element.style.transition = 'background-color 0.5s'
          element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
          setTimeout(() => {
            element.style.backgroundColor = ''
          }, 2000)
        }
      })
    },
    getKpiCardClass(index) {
      if ([0, 1, 2, 3, 4, 5].includes(index)) {
        return 'kpi-card-blue'
      } else if (index === 6) {
        return 'kpi-card-orange'
      }
      return ''
    },
    getKpiValueClass(index) {
      if (index === 0) return 'kpi-value-green'
      if (index === 1) return 'kpi-value-red'
      if (index === 2) return 'kpi-value-yellow'
      if (index === 3) return 'kpi-value-red'
      if (index === 4) return 'kpi-value-green'
      if (index === 5) return 'kpi-value-green'
      return ''
    },
    getStatusTagType(status) {
      const typeMap = {
        '已完成': 'success',
        '进行中': 'primary',
        '待分配': 'warning',
        '已驳回': 'danger'
      }
      return typeMap[status] || 'info'
    },
    handleWorkOrderSizeChange(val) {
      this.workOrderPageSize = val
      this.workOrderCurrentPage = 1
    },
    handleWorkOrderCurrentChange(val) {
      this.workOrderCurrentPage = val
    },
    exportWorkOrderData() {
      this.exportLoading = true
      try {
        const headers = ['工单ID', '工单标题', '维修人员', '状态', '完成时长', '创建时间', '完成时间', '片区', '描述']
        const csvData = this.workOrderDetailData.map(item => [
          item.id,
          item.title,
          item.worker,
          item.status,
          item.completion_time,
          item.create_time,
          item.finish_time,
          item.area,
          item.description
        ])

        const csvContent = [headers, ...csvData]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n')

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `工单详情_${this.currentTime}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        this.$message.success('数据导出成功')
      } catch (error) {
        console.error('导出数据失败:', error)
        this.$message.error('数据导出失败')
      } finally {
        this.exportLoading = false
      }
    },
    loadMoreData() {
      this.loadingMore = true

      const filterParams = this.getFilterParams()
      const apiParams = {
        classify: 4,
        page: this.currentPage + 1,
        per_page: 100,
        ...filterParams
      }

      axios({
        url: 'https://order.cdqrmi.com/api/v1/analysis/list',
        method: 'get',
        params: apiParams,
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        }
      }).then(response => {
        this.loadingMore = false
        if (response.data.code === 200) {
          if (response.data.data && response.data.data.data) {
            const newData = response.data.data.data.map(item => this.formatWorkOrderData(item))
            this.workOrderDetailData = [...this.workOrderDetailData, ...newData]
            this.currentPage += 1

            this.hasMoreData = response.data.data.total_count > this.workOrderDetailData.length

            this.$message.success(`成功加载 ${newData.length} 条记录`)
          }
        } else {
          this.$message.error('加载更多数据失败')
        }
      }).catch(error => {
        this.loadingMore = false
        this.handleApiError(error)
      })
    }
  }
}
</script>

<style scoped>
/* 样式保持不变 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

body {
  background-color: #f5f7fa;
  color: #333;
  line-height: 1.6;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #1a6bc4 0%, #0d4d9c 100%);
  color: white;
  padding: 25px 30px;
  border-bottom: 1px solid #eaeaea;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.header h1 i {
  margin-right: 12px;
  font-size: 32px;
}

.header .date {
  font-size: 16px;
  opacity: 0.9;
}

.filter-container {
  padding: 20px 30px;
  background: #f1f5f9;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  margin-bottom: 5px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 200px;
  background-color: white;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.custom-date-range {
  min-width: 300px;
}

.date-range-picker {
  width: 300px;
}

.filter-button {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
}

.kpi-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  padding: 25px;
  background: #f8fafc;
}

.kpi-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: transform 0.3s;
  cursor: pointer;
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.kpi-card-blue {
  background: #e3f2fd;
}

.kpi-card-blue .kpi-label,
.kpi-card-blue .kpi-value,
.kpi-card-blue .trend {
  color: #0d47a1;
}

.kpi-card-blue .kpi-value {
  font-size: 32px;
  font-weight: 700;
  margin: 10px 0;
}

.kpi-card-blue .kpi-value-green {
  color: #4ade80 !important;
}

.kpi-card-blue .kpi-value-red {
  color: #f87171 !important;
}

.kpi-card-blue .kpi-value-yellow {
  color: #fbbf24 !important;
}

.kpi-card-orange {
  background: #fff3e0;
}

.kpi-card-orange .kpi-label,
.kpi-card-orange .worker-name,
.kpi-card-orange .worker-count {
  color: #e65100;
}

.kpi-card-orange .worker-name {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
}

.kpi-card-orange .worker-count {
  font-size: 18px;
  font-weight: 600;
}

.kpi-label {
  font-size: 14px;
  color: #666;
}

.trend {
  font-size: 14px;
  margin-top: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trend.up {
  color: #10b981;
}

.trend.down {
  color: #ef4444;
}

.trend i {
  margin-right: 5px;
}

.full-width-section {
  padding: 25px;
  border-bottom: 1px solid #eaeaea;
  background: white;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 18px;
  color: #1e3a8a;
  margin: 0;
}

.section-actions {
  display: flex;
  align-items: center;
}

.table-container {
  position: relative;
  min-height: 400px;
}

.chart-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
  padding: 25px;
  border-bottom: 1px solid #eaeaea;
}

.chart-container:last-child {
  border-bottom: none;
}

.chart-box {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  height: 320px;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 16px;
  margin-bottom: 15px;
  color: #374151;
  font-weight: 600;
  flex-shrink: 0;
}

.chart-wrapper {
  height: 240px;
  position: relative;
  flex-grow: 1;
}

.footer {
  text-align: center;
  padding: 20px;
  color: #6b7280;
  font-size: 14px;
  border-top: 1px solid #eaeaea;
  background: #f8fafc;
}

.completion-rate {
  position: relative;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.completion-bar {
  position: absolute;
  height: 100%;
  background-color: #3b82f6;
  border-radius: 4px;
}

.chart-wrapper canvas {
  transition: transform 0.2s;
}

.chart-wrapper canvas:hover {
  transform: scale(1.02);
}

.work-order-dialog .el-dialog__body {
  padding: 20px;
}

.dialog-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eaeaea;
}

.toolbar-actions {
  display: flex;
  align-items: center;
}

.total-count {
  font-weight: 600;
  color: #409EFF;
}

.dialog-pagination {
  margin-top: 15px;
  text-align: right;
  padding: 10px 0;
  border-top: 1px solid #eaeaea;
}

@media (max-width: 768px) {
  .chart-container {
    grid-template-columns: 1fr;
  }

  .kpi-overview {
    grid-template-columns: 1fr 1fr;
  }

  .filter-container {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-button {
    align-self: flex-start;
    width: 100%;
  }

  .filter-select,
  .date-range-picker {
    width: 100%;
  }

  .custom-date-range {
    min-width: auto;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .dialog-toolbar {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .kpi-overview {
    grid-template-columns: 1fr;
  }

  .header h1 {
    font-size: 24px;
  }
}
</style>
