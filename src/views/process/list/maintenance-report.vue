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
          v-loading="!workerData.length"
          :data="showAllWorkers ? workerData : workerData.slice(0, 10)"
          style="width: 100%"
          :height="tableHeight"
        >
          <el-table-column prop="rank" label="排名" width="60" />
          <el-table-column prop="name" label="维修人员" width="120" />
          <el-table-column prop="completed" label="完成工单数量" width="130" />
          <el-table-column label="工单完成率" width="150">
            <template slot-scope="scope">
              <div class="completion-rate">
                <div class="completion-bar" :style="{ width: scope.row.completionRate + '%' }" />
              </div>
              <span>{{ scope.row.completionRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="avgTime" label="平均完成时长(小时)" width="160" />
          <el-table-column prop="reworkRate" label="返修率" width="100" />
        </el-table>
      </div>
    </div>

    <!-- 第二行：耗材使用TOP榜（占整行） -->
    <div class="full-width-section">
      <div class="section-header">
        <h3 class="section-title">耗材使用TOP榜</h3>
        <div class="section-actions">
          <el-button v-if="materialData.length > 10 && !showAllMaterials" type="text" icon="el-icon-arrow-down" @click="showAllMaterials = true">
            展开全部 {{ materialData.length }} 条数据
          </el-button>
          <el-button v-if="materialData.length > 10 && showAllMaterials" type="text" icon="el-icon-arrow-up" @click="showAllMaterials = false">
            收起至前10条
          </el-button>
        </div>
      </div>
      <div class="table-container">
        <el-table
          v-loading="materialLoading"
          :data="showAllMaterials ? materialData : materialData.slice(0, 10)"
          style="width: 100%"
          :height="tableHeight"
        >
          <el-table-column prop="rank" label="排名" width="60" />
          <el-table-column prop="name" label="耗材名称" min-width="200" />
          <el-table-column prop="quantity" label="使用数量" width="100" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.quantity }}个</span>
            </template>
          </el-table-column>
          <el-table-column label="使用占比" width="120" align="center">
            <template slot-scope="scope">
              <div class="completion-rate">
                <div class="completion-bar" :style="{ width: scope.row.usageRatio + '%' }" />
              </div>
              <span>{{ scope.row.usageRatio }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="usage" label="主要使用场景" min-width="180" />
        </el-table>

        <div v-if="materialData.length === 0 && !materialLoading" class="empty-state">
          <i class="el-icon-box" />
          <p>暂无耗材使用数据</p>
        </div>
      </div>
    </div>

    <!-- 第三行：三个图表 -->
    <div class="chart-container">
      <div class="chart-box">
        <div class="chart-title">工单完成时长分布</div>
        <div class="chart-wrapper">
          <canvas ref="durationChart" />
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-title">各类型工单平均时长</div>
        <div class="chart-wrapper">
          <canvas ref="typeDurationChart" />
        </div>
      </div>
      <div class="chart-box">
        <!-- 修改：将"地区工单榜"改为"维修人员工单数量榜" -->
        <div class="chart-title">维修人员工单数量榜</div>
        <div class="chart-wrapper">
          <canvas ref="workerOrderChart" />
        </div>
      </div>
    </div>

    <!-- 第四行：工单状态分布 + 耗材使用分布 + 工单类型分布 -->
    <div class="chart-container">
      <div class="chart-box">
        <div class="chart-title">工单状态分布</div>
        <div class="chart-wrapper">
          <canvas ref="statusChart" />
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-title">耗材使用分布</div>
        <div class="chart-wrapper">
          <canvas ref="materialCostChart" />
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-title">工单类型分布</div>
        <div class="chart-wrapper">
          <canvas ref="workTypeChart" />
        </div>
      </div>
    </div>

    <!-- 耗材成本分析总结 -->
    <div class="summary" style="margin-top: 20px;">
      <h3>{{ costAnalysisSummary.title }}</h3>
      <p v-for="(point, index) in costAnalysisSummary.points" :key="index">{{ index + 1 }}. {{ point }}</p>
    </div>

    <!-- 整体总结与建议 -->
    <div class="summary">
      <h3>整体总结与建议</h3>
      <p>1. 业务量稳步提升，团队效率保持高位，一次性修复率表现优异。</p>
      <p>2. 主机类和自控类工单平均时长偏高，建议重点分析原因并优化流程。</p>
      <p>3. 电源适配器耗材成本占总成本42.9%，建议寻找替代供应商或优化采购策略。</p>
      <p>4. 网络故障类工单占比最高，建议加强相关技能培训。</p>
      <p>5. 长时间未完成工单主要原因是配件短缺，建议优化库存管理。</p>
      <p>6. 维修人员表现差异明显，建议开展技能共享与培训，提升整体服务质量。</p>
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
// 导入项目已有的API方法，与其他页面保持一致
import { workOrderListAnalysis } from '@/api/process/work-order'
import axios from 'axios'

export default {
  name: 'MaintenanceReport',
  data() {
    return {
      filters: {
        duration: 'week', // 默认筛选一周数据
        area: 'all'
      },
      // 新增：自选时间段
      customDateRange: [],
      // 日期选择器配置
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
      // 删除：areaChartData，因为不再需要地区图表
      // 工单详情相关数据 - 修复：添加分页和搜索功能
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
      // 时间段映射
      timeRangeMap: {
        0: { label: '<2小时', min: 0, max: 2 },
        1: { label: '2-4小时', min: 2, max: 4 },
        2: { label: '4-8小时', min: 4, max: 8 },
        3: { label: '8-24小时', min: 8, max: 24 },
        4: { label: '>24小时', min: 24, max: Infinity }
      },
      // 缓存两个请求的数据
      cachedWorkOrders: null,
      cachedProcesses: null,
      // 新增：表格展开状态
      showAllWorkers: false,
      showAllMaterials: false,
      tableHeight: '400px',

      // 新增：饼图颜色配置
      chartColors: {
        material: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#7BCFFE', '#FFA3A3',
          '#7ED321', '#BD10E0', '#50E3C2', '#B8E986', '#4A90E2',
          '#F5A623', '#D0021B', '#9013FE', '#417505', '#8B572A'
        ]
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
    // 新增：动态生成耗材分析总结
    costAnalysisSummary() {
      if (!this.materialData.length) {
        return {
          title: '耗材使用分析',
          points: ['暂无耗材使用数据可供分析']
        }
      }

      const topMaterial = this.materialData[0]
      const top3Materials = this.materialData.slice(0, 3)
      const top3TotalRatio = top3Materials.reduce((sum, item) => sum + item.usageRatio, 0)

      return {
        title: '耗材使用分析',
        points: [
          `${topMaterial.name}使用数量最多，共${topMaterial.quantity}个，占总使用量的${topMaterial.usageRatio}%`,
          `前3种耗材(${top3Materials.map(m => m.name).join('、')})占总使用量的${top3TotalRatio.toFixed(1)}%，建议重点关注库存管理`,
          `耗材种类共计${this.materialData.length}种，反映了维修工作的多样性`,
          this.materialData.length > 10 ? '耗材种类较多，建议优化库存结构，减少不常用耗材的库存积压' : '耗材种类相对集中，便于库存管理'
        ]
      }
    },
    // 新增：工单数据搜索和分页
    filteredWorkOrderData() {
      let data = this.workOrderDetailData

      // 搜索过滤
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

    // 分页后的数据
    paginatedWorkOrderData() {
      const start = (this.workOrderCurrentPage - 1) * this.workOrderPageSize
      const end = start + this.workOrderPageSize
      return this.filteredWorkOrderData.slice(start, end)
    }
  },
  mounted() {
    console.log('MaintenanceReport组件已挂载')
    // 页面加载时预请求并缓存两个接口数据
    this.preFetchAndCacheData()
    // 原有逻辑
    this.fetchReportData()
    this.loadChartJS().then(() => {
      console.log('Chart.js加载完成，开始初始化图表')
      this.initCharts()
    })
  },
  methods: {
    // 修改：时长选择变化处理
    handleDurationChange(value) {
      if (value !== 'custom') {
        // 清除自定义日期范围
        this.customDateRange = []
        // 立即执行筛选
        this.handleFilter()
      }
      // 如果是custom，显示日期选择器，但不立即筛选
    },

    // 新增：自定义日期范围变化处理
    handleCustomDateChange(dateRange) {
      if (dateRange && dateRange.length === 2) {
        // 自定义日期范围选择完成后自动执行筛选
        this.handleFilter()
      }
    },

    // 修改：筛选方法，支持自定义时间段
    handleFilter() {
      console.log('筛选条件:', this.filters)
      console.log('自定义日期范围:', this.customDateRange)

      const params = {}

      // 处理时间筛选
      if (this.filters.duration === 'custom') {
        // 自定义时间段
        if (this.customDateRange && this.customDateRange.length === 2) {
          params.startTime = this.customDateRange[0] + ' 00:00:00'
          params.endTime = this.customDateRange[1] + ' 23:59:59'
        } else {
          this.$message.warning('请选择完整的时间段')
          return
        }
      } else if (this.filters.duration !== 'all') {
        // 预设时间段
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
        // 全部时长
        const startTime = new Date(2006, 0, 1)
        const endTime = new Date()
        params.startTime = this.formatDate(startTime)
        params.endTime = this.formatDate(endTime)
      }

      // 处理片区筛选
      if (this.filters.area !== 'all') {
        const areaMap = {
          'gangba': 'kamba',
          'lasa': 'lhasa',
          'cuona': 'cona',
          'sajia': 'sayga'
        }
        params.belongs = areaMap[this.filters.area]
      }

      // 调用API获取数据
      this.fetchFilteredData(params)
    },

    // 提取的API调用方法
    fetchFilteredData(params) {
      axios({
        url: 'https://ferry.s7.tunnelfrp.com/api/v1/analysis',
        method: 'get',
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        },
        params: params
      }).then(response => {
        if (response.data.code === 200) {
          console.log('筛选后的数据:', response.data)
          this.reportData = response.data.data
          this.updateKpiData()
          this.updateDurationChart()
          this.updateStatusChart()
          this.updateWorkerData()
          this.updateWorkerTopChart()
          this.updateWorkerOrderChart() // 新增：更新维修人员工单数量榜
          this.updateTypeDurationChart()
          this.updateMaterialData()
          this.updateMaterialCharts()

          // 显示筛选成功消息
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
      }).catch(error => {
        console.error('获取筛选数据失败:', error)
        this.$message({
          message: '获取筛选数据失败，请检查网络连接或联系管理员',
          type: 'error'
        })
      })
    },

    // 修改：获取时长文本，支持自定义
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

    // 预请求并缓存两个接口数据
    preFetchAndCacheData() {
      // 1. 工单列表请求（仅classify=4）
      this.fetchWorkOrders().then(data => {
        this.cachedWorkOrders = data
        console.log('工单列表数据已缓存', data)
      }).catch(err => {
        console.error('工单列表预请求失败', err)
      })
    },

    // 请求一：获取工单列表（使用项目统一API）
    fetchWorkOrders() {
      return new Promise((resolve, reject) => {
        workOrderListAnalysis({
          classify: 4 // 只传classify=4，不带per_page参数
        }).then(response => {
          if (response.code === 200) {
            resolve(response.data) // 缓存工单数据
          } else {
            reject(new Error('工单列表请求失败: ' + response.msg))
          }
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 从缓存中获取工单列表数据
    getCachedWorkOrders() {
      return this.cachedWorkOrders
    },

    // 删除：updateAreaChartData和updateAreaChart方法，因为不再需要地区图表

    // 从缓存中获取流程名称
    getProcessName(processId) {
      if (!this.cachedProcesses || !this.cachedProcesses.data) return '未知流程'
      const process = this.cachedProcesses.data.find(p => p.id === processId)
      return process ? process.name : '未知流程'
    },

    // 从缓存中筛选工单数据
    filterCachedWorkOrders(condition = {}) {
      if (!this.cachedWorkOrders || !this.cachedWorkOrders.data) return []

      return this.cachedWorkOrders.data.filter(order => {
        // 片区筛选
        if (condition.area && condition.area !== 'all') {
          const areaMap = {
            'gangba': 'kamba',
            'lasa': 'lhasa',
            'cuona': 'cona',
            'sajia': 'sayga'
          }
          if (order.belongs !== areaMap[condition.area]) return false
        }

        // 状态筛选
        if (condition.status) {
          if (condition.status === 'ended' && order.is_end !== 1) return false
          if (condition.status === 'processing' && (order.is_end === 1 || order.is_denied === 1)) return false
        }

        // 维修人员筛选
        if (condition.worker) {
          if (order.principals !== condition.worker) return false
        }

        return true
      })
    },

    // 获取报表数据
    fetchReportData() {
      const now = new Date()
      const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const params = {
        startTime: this.formatDate(startTime),
        endTime: this.formatDate(now)
      }

      axios({
        url: 'https://ferry.s7.tunnelfrp.com/api/v1/analysis',
        method: 'get',
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        },
        params: params
      }).then(response => {
        if (response.data.code === 200) {
          console.log('API返回的原始数据:', response.data)
          this.reportData = response.data.data
          this.updateKpiData()
          this.updateDurationChart()
          this.updateStatusChart()
          this.updateWorkerData()
          this.updateWorkerTopChart()
          this.updateWorkerOrderChart() // 新增：更新维修人员工单数量榜
          this.updateTypeDurationChart()
          this.updateMaterialData()
          this.updateMaterialCharts()
          this.filters.duration = 'week'
        } else {
          console.error('获取报表数据失败:', response.data.message)
          this.$message({
            message: '获取报表数据失败: ' + response.data.message,
            type: 'error'
          })
        }
      }).catch(error => {
        console.error('获取报表数据失败:', error)
        this.$message({
          message: '获取报表数据失败，请检查网络连接或联系管理员',
          type: 'error'
        })
      })
    },

    // 获取Token（与工单列表页面保持一致）
    getToken() {
      return localStorage.getItem('token') || ''
    },

    // 更新KPI数据
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

    // 新增：更新耗材数据方法
    updateMaterialData() {
      this.materialLoading = true
      if (this.reportData.consumable_stats && this.reportData.consumable_stats.length > 0) {
        // 按使用数量排序
        const sortedMaterials = [...this.reportData.consumable_stats].sort((a, b) => b.total_count - a.total_count)

        this.materialData = sortedMaterials.map((material, index) => {
          // 计算占总耗材比例
          const totalConsumables = sortedMaterials.reduce((sum, item) => sum + item.total_count, 0)
          const usageRatio = totalConsumables > 0 ? ((material.total_count / totalConsumables) * 100).toFixed(1) : 0

          return {
            rank: index + 1,
            name: material.name,
            quantity: material.total_count,
            usageRatio: parseFloat(usageRatio),
            usage: this.getMaterialUsageDescription(material.name)
          }
        })
      } else {
        // 如果没有耗材数据，显示空状态
        this.materialData = []
      }
      this.materialLoading = false
    },

    // 新增：根据耗材名称推断使用场景
    getMaterialUsageDescription(materialName) {
      const usageMap = {
        '控制面板': '设备控制、维修',
        '开关控制面板': '电气控制、开关维修',
        '风机金属波纹管': '通风系统、风机连接',
        '胶垫': '密封、防水处理',
        '湿化瓶': '供氧系统、医疗设备',
        '保险管': '电路保护、电气维修',
        '扎带': '线缆固定、整理',
        '生胶带': '管道密封、螺纹连接',
        '活接': '管道连接、维修',
        '外丝直接': '管道连接件',
        '波纹管': '管道连接、柔性连接',
        '垫片': '密封、接口保护'
      }

      // 查找匹配的使用场景
      for (const [key, value] of Object.entries(usageMap)) {
        if (materialName.includes(key)) {
          return value
        }
      }

      return '通用维修'
    },

    // 新增：更新耗材图表
    updateMaterialCharts() {
      this.updateMaterialCostChart()
    },

    // 新增：更新耗材成本分布图表 - 修改：添加颜色区分
    updateMaterialCostChart() {
      if (this.charts.materialCostChart && this.materialData.length > 0) {
        // 取前8种耗材显示，其他归为"其他"
        const topMaterials = this.materialData.slice(0, 8)
        const othersCount = this.materialData.slice(8).reduce((sum, item) => sum + item.quantity, 0)

        const labels = topMaterials.map(item => item.name)
        const data = topMaterials.map(item => item.quantity)

        if (othersCount > 0) {
          labels.push('其他')
          data.push(othersCount)
        }

        // 获取对应数量的颜色
        const backgroundColors = this.getMaterialColors(labels.length)

        this.charts.materialCostChart.data.labels = labels
        this.charts.materialCostChart.data.datasets[0].data = data
        this.charts.materialCostChart.data.datasets[0].backgroundColor = backgroundColors
        this.charts.materialCostChart.data.datasets[0].borderColor = backgroundColors.map(color =>
          this.adjustBrightness(color, -20) // 边框颜色稍深一些
        )
        this.charts.materialCostChart.data.datasets[0].borderWidth = 2
        this.charts.materialCostChart.update()
      }
    },

    // 新增：获取耗材图表颜色
    getMaterialColors(count) {
      const colors = [...this.chartColors.material]
      // 如果需要的颜色数量超过预设，循环使用颜色
      if (count > colors.length) {
        const additionalColors = []
        for (let i = colors.length; i < count; i++) {
          additionalColors.push(this.generateRandomColor())
        }
        return [...colors, ...additionalColors]
      }
      return colors.slice(0, count)
    },

    // 新增：生成随机颜色（用于超出预设颜色数量的情况）
    generateRandomColor() {
      const letters = '0123456789ABCDEF'
      let color = '#'
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
      }
      return color
    },

    // 新增：调整颜色亮度
    adjustBrightness(color, percent) {
      const num = parseInt(color.replace('#', ''), 16)
      const amt = Math.round(2.55 * percent)
      const R = (num >> 16) + amt
      const G = (num >> 8 & 0x00FF) + amt
      const B = (num & 0x0000FF) + amt
      return '#' + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      ).toString(16).slice(1)
    },

    // 更新工单完成时长分布图表
    updateDurationChart() {
      if (this.charts.durationChart) {
        this.charts.durationChart.data.datasets[0].data = [
          this.reportData.completion_time_distribution.less_than_2h,
          this.reportData.completion_time_distribution.between_2h_4h,
          this.reportData.completion_time_distribution.between_4h_8h,
          this.reportData.completion_time_distribution.between_8h_24h,
          this.reportData.completion_time_distribution.more_than_24h
        ]
        this.charts.durationChart.update()
      }
    },

    // 更新工单状态分布图表
    updateStatusChart() {
      if (this.charts.statusChart) {
        this.charts.statusChart.data.datasets[0].data = [
          this.reportData.ended_count,
          this.reportData.processing_count,
          this.reportData.unassigned_count
        ]
        this.charts.statusChart.update()
      }
    },

    // 更新各类型工单平均时长图表
    updateTypeDurationChart() {
      if (this.charts.typeDurationChart) {
        if (this.reportData.repair_type_stats) {
          this.charts.typeDurationChart.data.labels = this.reportData.repair_type_stats.map(item => item.type)
          this.charts.typeDurationChart.data.datasets[0].data = this.reportData.repair_type_stats.map(item => item.count)
        }
        this.charts.typeDurationChart.update()
      }
    },

    // 修复：更新维修人员数据 - 修正工单完成率计算
    updateWorkerData() {
      const sortedWorkers = [...this.reportData.worker_completion].sort((a, b) => b.count - a.count)

      // 计算所有维修人员完成的总工单数（用于计算个人占比）
      const totalCompletedByAllWorkers = sortedWorkers.reduce((sum, worker) => sum + worker.count, 0)

      this.workerData = sortedWorkers.map((worker, index) => {
        // 修复：正确计算工单完成率 - 使用该维修人员完成的工单数占总完成工单数的比例
        const completionRate = totalCompletedByAllWorkers > 0
          ? Math.round((worker.count / totalCompletedByAllWorkers) * 100) : 0

        return {
          rank: index + 1,
          name: worker.nick_name,
          completed: worker.count,
          completionRate: completionRate,
          avgTime: parseFloat(worker.avg_time).toFixed(1),
          reworkRate: '0%'
        }
      })
    },

    // 更新维修人员TOP榜图表
    updateWorkerTopChart() {
      if (this.charts.workerTopChart) {
        const sortedWorkers = [...this.reportData.worker_completion].sort((a, b) => b.count - a.count)
        const topWorkers = sortedWorkers.slice(0, 10)

        this.charts.workerTopChart.data.labels = topWorkers.map(worker => worker.nick_name)
        this.charts.workerTopChart.data.datasets[0].data = topWorkers.map(worker => worker.count)

        // 计算所有维修人员完成的总工单数（用于计算个人占比）
        const totalCompletedByAllWorkers = sortedWorkers.reduce((sum, worker) => sum + worker.count, 0)
        this.charts.workerTopChart.data.datasets[1].data = topWorkers.map(worker => {
          return totalCompletedByAllWorkers > 0 ? Math.round((worker.count / totalCompletedByAllWorkers) * 100) : 0
        })
        this.charts.workerTopChart.update()
      }
    },

    // 新增：更新维修人员工单数量榜
    updateWorkerOrderChart() {
      if (this.charts.workerOrderChart && this.reportData.worker_completion) {
        // 按完成工单数量排序
        const sortedWorkers = [...this.reportData.worker_completion].sort((a, b) => b.count - a.count)

        // 取前10名显示
        const displayWorkers = sortedWorkers.slice(0, 10)

        this.charts.workerOrderChart.data.labels = displayWorkers.map(worker => worker.nick_name)
        this.charts.workerOrderChart.data.datasets[0].data = displayWorkers.map(worker => worker.count)
        this.charts.workerOrderChart.update()
      }
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

    // 格式化日期为 'YYYY-MM-DD HH:mm:ss'
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

      // 工单完成时长分布
      const durationCtx = this.$refs.durationChart.getContext('2d')
      this.charts.durationChart = new window.Chart(durationCtx, {
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
              const label = this.charts.durationChart.data.labels[index]
              this.workOrderDialogTitle = `工单详情 - ${label}完成`
              this.workOrderDialogVisible = true
              this.fetchWorkOrderDetails(index)
            }
          }
        }
      })

      // 各类型工单平均时长
      const typeDurationCtx = this.$refs.typeDurationChart.getContext('2d')
      this.charts.typeDurationChart = new window.Chart(typeDurationCtx, {
        type: 'bar',
        data: {
          labels: this.reportData.repair_type_stats
            ? this.reportData.repair_type_stats.map(item => item.type)
            : [
              '供暖', '供水', '供氧', '维保', '设备类',
              '管道类', '风机类', '自控类', '主机类',
              '电气类', '金属管道类', '插座类', '阀门类',
              '水表', '水龙头', '接头', '温控器', '伴热带'
            ],
          datasets: [{
            label: '平均时长(小时)',
            data: this.reportData.repair_type_stats
              ? this.reportData.repair_type_stats.map(item => item.count)
              : [
                4.8, 3.2, 5.5, 2.1, 6.2,
                4.5, 3.8, 7.1, 8.3,
                5.2, 4.9, 1.8, 2.5,
                1.5, 1.2, 0.8, 3.1, 2.8
              ],
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: '平均时长(小时)'
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `平均时长: ${context.raw} 小时`
                }
              }
            }
          }
        }
      })

      // 新增：维修人员工单数量榜 - 替换原来的地区工单榜
      const workerOrderCtx = this.$refs.workerOrderChart.getContext('2d')
      this.charts.workerOrderChart = new window.Chart(workerOrderCtx, {
        type: 'bar',
        data: {
          labels: this.reportData.worker_completion
            ? this.reportData.worker_completion
              .sort((a, b) => b.count - a.count)
              .slice(0, 10)
              .map(worker => worker.nick_name)
            : [],
          datasets: [{
            label: '完成工单数',
            data: this.reportData.worker_completion
              ? this.reportData.worker_completion
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map(worker => worker.count)
              : [],
            backgroundColor: 'rgba(139, 92, 246, 0.7)',
            borderColor: 'rgb(139, 92, 246)',
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
            },
            x: {
              title: {
                display: true,
                text: '维修人员'
              }
            }
          },
          // 新增：点击事件，查看具体工单
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const element = elements[0]
              const index = element._index
              const workerName = this.charts.workerOrderChart.data.labels[index]
              this.fetchWorkerOrderDetails(workerName)
            }
          }
        }
      })

      // 工单状态分布
      const statusCtx = this.$refs.statusChart.getContext('2d')
      this.charts.statusChart = new window.Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['已完成', '进行中', '待分配'],
          datasets: [{
            data: [
              this.reportData.ended_count,
              this.reportData.processing_count,
              this.reportData.unassigned_count
            ],
            backgroundColor: [
              'rgba(34, 197, 94, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(251, 191, 36, 0.7)'
            ],
            borderColor: [
              'rgb(34, 197, 94)',
              'rgb(59, 130, 246)',
              'rgb(251, 191, 36)'
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

      // 耗材使用分布 - 修改：使用动态颜色
      const materialCostCtx = this.$refs.materialCostChart.getContext('2d')
      this.charts.materialCostChart = new window.Chart(materialCostCtx, {
        type: 'doughnut',
        data: {
          labels: ['加载中...'],
          datasets: [{
            data: [100],
            backgroundColor: ['rgba(200, 200, 200, 0.7)'],
            borderColor: ['rgb(150, 150, 150)'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                padding: 15,
                font: {
                  size: 11
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || ''
                  const value = context.raw || 0
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = Math.round((value / total) * 100)
                  return `${label}: ${value}个 (${percentage}%)`
                }
              }
            }
          },
          // 添加点击事件
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const element = elements[0]
              const index = element._index
              const label = this.charts.materialCostChart.data.labels[index]
              this.$message.info(`点击了耗材: ${label}`)
            }
          }
        }
      })

      // 工单类型分布
      const workTypeCtx = this.$refs.workTypeChart.getContext('2d')
      this.charts.workTypeChart = new window.Chart(workTypeCtx, {
        type: 'pie',
        data: {
          labels: ['维修', '安装', '保养', '巡检', '升级'],
          datasets: [{
            data: [45, 25, 15, 10, 5],
            backgroundColor: [
              'rgba(239, 68, 68, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(34, 197, 94, 0.7)',
              'rgba(251, 191, 36, 0.7)',
              'rgba(139, 92, 246, 0.7)'
            ],
            borderColor: [
              'rgb(239, 68, 68)',
              'rgb(59, 130, 246)',
              'rgb(34, 197, 94)',
              'rgb(251, 191, 36)',
              'rgb(139, 92, 246)'
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

    // 删除：updateEfficiencyChart方法，因为不再需要

    // 新增：获取维修人员工单详情
    fetchWorkerOrderDetails(workerName) {
      this.workOrderLoading = true
      this.workOrderDialogTitle = `工单详情 - ${workerName}`
      this.workOrderDialogVisible = true

      // 重置分页和搜索
      this.workOrderCurrentPage = 1
      this.workOrderSearch = ''

      const filterParams = this.getFilterParams()

      // 优化请求参数，减少数据量
      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 100, // 减少每页数量，避免超时
        ...filterParams
      }

      console.log('请求参数:', apiParams)

      // 使用axios直接请求，设置更长的超时时间
      axios({
        url: 'https://ferry.s7.tunnelfrp.com/api/v1/analysis/list',
        method: 'get',
        params: apiParams,
        timeout: 30000, // 增加超时时间到30秒
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        }
      }).then(response => {
        this.workOrderLoading = false
        console.log('API响应:', response.data)

        if (response.data.code === 200) {
          if (response.data.data && response.data.data.data) {
            // 过滤出该维修人员的工单
            const allOrders = response.data.data.data.map(item => this.formatWorkOrderData(item))
            this.workOrderDetailData = allOrders.filter(order => order.worker === workerName)

            console.log(`成功加载 ${this.workOrderDetailData.length} 条${workerName}的工单记录`)

            // 更新是否有更多数据
            this.hasMoreData = false // 因为是过滤后的数据，不再有更多数据

            // 如果数据量很大，提示用户
            if (this.workOrderDetailData.length === 0) {
              this.$message.warning(`未找到${workerName}的工单记录`)
            }
          } else {
            this.workOrderDetailData = []
            console.warn('工单数据格式异常:', response.data)
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
          // 服务器返回错误状态码
          this.$message.error(`服务器错误: ${error.response.status} - ${(error.response.data && error.response.data.msg) || '未知错误'}`)
        } else if (error.request) {
          // 请求发出但没有收到响应
          this.$message.error('网络连接失败，请检查网络连接')
        } else {
          this.$message.error('请求配置错误: ' + error.message)
        }
        this.workOrderDetailData = []
      })
    },

    // 修复：获取时长区间工单详情 - 优化请求避免超时
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

      // 优化请求参数
      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 100, // 减少数据量
        min_time: timeRange.min,
        max_time: timeRange.max,
        ...filterParams
      }

      console.log('时间范围请求参数:', apiParams)

      // 使用axios直接请求
      axios({
        url: 'https://ferry.s7.tunnelfrp.com/api/v1/analysis/list',
        method: 'get',
        params: apiParams,
        timeout: 30000, // 增加超时时间
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        }
      }).then(response => {
        this.workOrderLoading = false
        if (response.data.code === 200) {
          if (response.data.data && response.data.data.data) {
            this.workOrderDetailData = response.data.data.data.map(item => this.formatWorkOrderData(item))
            console.log(`成功加载 ${this.workOrderDetailData.length} 条工单记录`)

            // 更新是否有更多数据
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

    // 修复：获取工单总数量详情 - 优化请求避免超时
    fetchWorkOrderTotalDetails() {
      this.workOrderLoading = true
      this.workOrderDialogTitle = '所有工单详情'
      this.workOrderDialogVisible = true

      // 重置分页和搜索
      this.workOrderCurrentPage = 1
      this.workOrderSearch = ''

      const filterParams = this.getFilterParams()

      // 优化请求参数，减少数据量
      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 100, // 减少每页数量，避免超时
        ...filterParams
      }

      console.log('请求参数:', apiParams)

      // 使用axios直接请求，设置更长的超时时间
      axios({
        url: 'https://ferry.s7.tunnelfrp.com/api/v1/analysis/list',
        method: 'get',
        params: apiParams,
        timeout: 30000, // 增加超时时间到30秒
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

            // 更新是否有更多数据
            this.hasMoreData = response.data.data.total_count > response.data.data.data.length

            // 如果数据量很大，提示用户
            if (response.data.data.total_count > 100) {
              this.$message.warning(`共有 ${response.data.data.total_count} 条记录，当前显示前100条。如需查看全部，请使用筛选功能。`)
            }
          } else {
            this.workOrderDetailData = []
            console.warn('工单数据格式异常:', response.data)
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
          // 服务器返回错误状态码
          this.$message.error(`服务器错误: ${error.response.status} - ${(error.response.data && error.response.data.msg) || '未知错误'}`)
        } else if (error.request) {
          // 请求发出但没有收到响应
          this.$message.error('网络连接失败，请检查网络连接')
        } else {
          this.$message.error('请求配置错误: ' + error.message)
        }
        this.workOrderDetailData = []
      })
    },

    // 格式化工单数据 - 修复：添加更多字段
    formatWorkOrderData(item) {
      return {
        id: item.id || '',
        title: item.title || '',
        worker: item.principals || '未分配', // 使用principals字段作为维修人员
        status: this.formatStatus(item),
        completion_time: this.calculateCompletionTime(item) || '未完成',
        create_time: item.create_time || '',
        finish_time: item.is_end ? item.update_time : '未完成',
        area: this.formatArea(item.belongs || item.area),
        description: item.description || item.title || '无描述'
      }
    },

    // 计算工单完成时长
    calculateCompletionTime(item) {
      if (!item.is_end || !item.create_time || !item.update_time) return null
      const createTime = new Date(item.create_time).getTime()
      const finishTime = new Date(item.update_time).getTime()
      const hours = Math.round((finishTime - createTime) / (1000 * 60 * 60))
      return `${hours}小时`
    },

    // 根据工单状态字段格式化状态文本
    formatStatus(item) {
      if (item.is_end === 1) return '已完成'
      if (item.is_denied === 1) return '已驳回'
      if (item.is_accept === 1) return '进行中'
      return '待分配'
    },

    // 处理API错误
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

    // 格式化片区名称
    formatArea(areaCode) {
      const areaMap = {
        'kamba': '岗巴',
        'sayga': '萨迦',
        'cona': '错那',
        'lhasa': '拉萨'
      }
      return areaMap[areaCode] || areaCode
    },

    // 获取筛选参数
    getFilterParams() {
      const params = {}

      if (this.filters.duration === 'custom') {
        // 自定义时间段
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

    // KPI点击事件处理
    handleKpiClick(index) {
      switch (index) {
        case 0: // 工单总数量
          this.fetchWorkOrderTotalDetails()
          break
        case 1: // 未完成工单数量
          // 使用缓存筛选未完成工单
          if (this.cachedWorkOrders) {
            this.workOrderDialogTitle = '未完成工单详情'
            this.workOrderDialogVisible = true
            this.workOrderDetailData = this.filterCachedWorkOrders({ status: 'processing' })
              .map(item => this.formatWorkOrderData(item))
          } else {
            this.$message.info('数据加载中，请稍后再试')
          }
          break
        case 2: // 超时工单数量
          this.$message.info('超时工单详情功能待实现')
          break
        case 3: // 返修工单数量
          this.$message.info('返修工单详情功能待实现')
          break
        case 4: // 平均完成时长
          this.fetchWorkOrderTotalDetails()
          break
        case 5: // 一次性修复率
          this.fetchWorkOrderTotalDetails()
          break
        case 6: // 维修人员排行
          this.scrollToWorkerTable()
          return
        default:
          return
      }
    },

    // 滚动到维修人员表格
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

    // 获取KPI卡片样式
    getKpiCardClass(index) {
      if ([0, 1, 2, 3, 4, 5].includes(index)) {
        return 'kpi-card-blue'
      } else if (index === 6) {
        return 'kpi-card-orange'
      }
      return ''
    },

    // 获取KPI值颜色
    getKpiValueClass(index) {
      if (index === 0) return 'kpi-value-green'
      if (index === 1) return 'kpi-value-red'
      if (index === 2) return 'kpi-value-yellow'
      if (index === 3) return 'kpi-value-red'
      if (index === 4) return 'kpi-value-green'
      if (index === 5) return 'kpi-value-green'
      return ''
    },

    // 新增：工单状态标签类型
    getStatusTagType(status) {
      const typeMap = {
        '已完成': 'success',
        '进行中': 'primary',
        '待分配': 'warning',
        '已驳回': 'danger'
      }
      return typeMap[status] || 'info'
    },

    // 新增：工单表格分页处理
    handleWorkOrderSizeChange(val) {
      this.workOrderPageSize = val
      this.workOrderCurrentPage = 1
    },

    handleWorkOrderCurrentChange(val) {
      this.workOrderCurrentPage = val
    },

    // 新增：导出工单数据
    exportWorkOrderData() {
      this.exportLoading = true
      try {
        // 创建CSV内容
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

        // 创建下载链接
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

    // 新增：加载更多数据
    loadMoreData() {
      this.loadingMore = true

      const filterParams = this.getFilterParams()
      const apiParams = {
        classify: 4,
        page: this.currentPage + 1, // 加载下一页
        per_page: 100,
        ...filterParams
      }

      axios({
        url: 'https://ferry.s7.tunnelfrp.com/api/v1/analysis/list',
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

            // 更新是否有更多数据
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
  align-items: flex-end; /* 修改为底部对齐 */
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

/* 新增：自定义时间段样式 */
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
  margin-bottom: 5px; /* 与输入框底部对齐 */
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

/* 新增：全宽区域样式 */
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

/* 图表容器样式 */
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
}

.chart-title {
  font-size: 16px;
  margin-bottom: 15px;
  color: #374151;
  font-weight: 600;
}

.chart-wrapper {
  height: 240px;
  position: relative;
}

.summary {
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 20px;
  margin-top: 20px;
  border-radius: 0 8px 8px 0;
}

.summary h3 {
  color: #1e40af;
  margin-bottom: 10px;
  font-size: 18px;
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

/* 新增：空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* 新增：图表悬停效果 */
.chart-wrapper canvas {
  transition: transform 0.2s;
}

.chart-wrapper canvas:hover {
  transform: scale(1.02);
}

/* 新增：工单详情对话框样式 */
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

/* 响应式设计 */
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
