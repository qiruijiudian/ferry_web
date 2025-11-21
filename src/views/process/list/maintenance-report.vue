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
        <el-select v-model="filters.duration" class="filter-select" placeholder="请选择时长" @change="handleFilter">
          <el-option label="全部时长" value="all" />
          <el-option label="一周" value="week" />
          <el-option label="一月" value="month" />
          <el-option label="一年" value="year" />
        </el-select>
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
          <el-button v-if="workerData.length > 10 && !showAllWorkers" type="text" icon="el-icon-arrow-down" @click="showAllWorkers = true">
            展开全部 {{ workerData.length }} 条数据
          </el-button>
          <el-button v-if="workerData.length > 10 && showAllWorkers" type="text" icon="el-icon-arrow-up" @click="showAllWorkers = false">
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

        <!-- 空状态提示 -->
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
        <div class="chart-title">团队TOP榜</div>
        <div class="chart-wrapper">
          <canvas ref="efficiencyChart" />
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
    <el-dialog :title="workOrderDialogTitle" :visible.sync="workOrderDialogVisible" width="80%">
      <el-table v-loading="workOrderLoading" :data="workOrderDetailData" style="width: 100%">
        <el-table-column prop="id" label="工单ID" width="100" />
        <el-table-column prop="title" label="工单标题" width="200" />
        <el-table-column prop="worker" label="维修人员" width="100" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="completion_time" label="完成时长(小时)" width="120" />
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column prop="finish_time" label="完成时间" width="180" />
        <el-table-column prop="area" label="片区" width="100" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="workOrderDialogVisible = false">关闭</el-button>
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
// import { processList } from '@/api/process/admin/process'
// import { listProcess } from '@/api/process/process' // 假设流程接口路径，根据实际项目调整
import axios from 'axios'

export default {
  name: 'MaintenanceReport',
  data() {
    return {
      filters: {
        duration: 'week', // 默认筛选一周数据
        area: 'all'
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
      materialData: [], // 修改：清空硬编码数据，改为空数组
      materialLoading: false, // 新增：耗材数据加载状态
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
        consumable_stats: [] // 新增：确保有这个字段
      },
      // 工单详情相关数据
      workOrderDialogVisible: false,
      workOrderDialogTitle: '',
      workOrderDetailData: [],
      workOrderLoading: false,
      // 时间段映射
      timeRangeMap: {
        0: { label: '<2小时', min: 0, max: 2 },
        1: { label: '2-4小时', min: 2, max: 4 },
        2: { label: '4-8小时', min: 4, max: 8 },
        3: { label: '8-24小时', min: 8, max: 24 },
        4: { label: '>24小时', min: 24, max: Infinity }
      },
      // 缓存两个请求的数据
      cachedWorkOrders: null, // 缓存请求一：工单列表数据
      cachedProcesses: null, // 缓存请求二：流程列表数据
      // 新增：表格展开状态
      showAllWorkers: false,
      showAllMaterials: false,
      tableHeight: '400px' // 表格默认高度
    }
  },
  computed: {
    getReportPeriodText() {
      if (this.filters.duration === 'all') {
        return '全部时长'
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
    // 预请求并缓存两个接口数据
    preFetchAndCacheData() {
      // 1. 工单列表请求（仅classify=4）
      this.fetchWorkOrders().then(data => {
        this.cachedWorkOrders = data
        console.log('工单列表数据已缓存', data)
      }).catch(err => {
        console.error('工单列表预请求失败', err)
      })

      // 2. 流程列表请求（仅per_page=999999）
      // this.fetchProcesses().then(data => {
      //   this.cachedProcesses = data
      //   console.log('流程列表数据已缓存', data)
      // }).catch(err => {
      //   console.error('流程列表预请求失败', err)
      // })
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
          this.updateEfficiencyChart()
          this.updateTypeDurationChart()
          this.updateMaterialData() // 新增：更新耗材数据
          this.updateMaterialCharts() // 新增：更新耗材图表
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

    // 新增：更新耗材成本分布图表
    updateMaterialCostChart() {
      if (this.charts.materialCostChart && this.materialData.length > 0) {
        // 取前5种耗材显示，其他归为"其他"
        const topMaterials = this.materialData.slice(0, 5)
        const othersCount = this.materialData.slice(5).reduce((sum, item) => sum + item.quantity, 0)

        const labels = topMaterials.map(item => item.name)
        const data = topMaterials.map(item => item.quantity)

        if (othersCount > 0) {
          labels.push('其他')
          data.push(othersCount)
        }

        this.charts.materialCostChart.data.labels = labels
        this.charts.materialCostChart.data.datasets[0].data = data
        this.charts.materialCostChart.update()
      }
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

    handleFilter() {
      console.log('筛选条件:', this.filters)
      const params = {}

      if (this.filters.duration !== 'all') {
        const now = new Date()
        let startTime; const endTime = now

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
          this.updateEfficiencyChart()
          this.updateTypeDurationChart()
          this.updateMaterialData() // 新增：更新耗材数据
          this.updateMaterialCharts() // 新增：更新耗材图表

          this.$message({
            message: `已应用筛选: 时长=${this.getDurationText(this.filters.duration)}, 片区=${this.getAreaText(this.filters.area)}`,
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

    getDurationText(value) {
      const map = {
        'all': '全部时长',
        'week': '一周',
        'month': '一月',
        'year': '一年'
      }
      return map[value] || value
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

      // 团队TOP榜
      const efficiencyCtx = this.$refs.efficiencyChart.getContext('2d')
      this.charts.efficiencyChart = new window.Chart(efficiencyCtx, {
        type: 'bar',
        data: {
          labels: this.reportData.worker_completion
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(worker => worker.nick_name),
          datasets: [{
            label: '完成工单数',
            data: this.reportData.worker_completion
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map(worker => worker.count),
            backgroundColor: 'rgba(139, 92, 246, 0.7)',
            borderColor: 'rgb(139, 92, 246)',
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: '完成工单数'
              }
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

      // 耗材使用分布 - 修改：使用动态数据
      const materialCostCtx = this.$refs.materialCostChart.getContext('2d')
      this.charts.materialCostChart = new window.Chart(materialCostCtx, {
        type: 'doughnut',
        data: {
          labels: ['加载中...'],
          datasets: [{
            data: [100],
            backgroundColor: ['rgba(200, 200, 200, 0.7)'],
            borderColor: ['rgb(200, 200, 200)'],
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

    // 更新团队TOP榜
    updateEfficiencyChart() {
      if (this.charts.efficiencyChart) {
        const topWorkers = [...this.reportData.worker_completion]
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        this.charts.efficiencyChart.data.labels = topWorkers.map(worker => worker.nick_name)
        this.charts.efficiencyChart.data.datasets[0].data = topWorkers.map(worker => worker.count)
        this.charts.efficiencyChart.update()
      }
    },

    // 获取时长区间工单详情（优先使用缓存）
    fetchWorkOrderDetails(timeRangeIndex) {
      const timeRange = this.timeRangeMap[timeRangeIndex]
      if (!timeRange) {
        this.$message({
          message: '无效的时间范围',
          type: 'error'
        })
        return
      }

      // 尝试从缓存获取数据
      if (this.cachedWorkOrders && this.cachedWorkOrders.data) {
        this.workOrderLoading = false
        // 格式化缓存中的数据
        this.workOrderDetailData = this.cachedWorkOrders.data.map(item => this.formatWorkOrderData(item))
        return
      }

      // 缓存未命中时才发起请求
      this.workOrderLoading = true
      const filterParams = this.getFilterParams()
      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 9999,
        min_time: timeRange.min,
        max_time: timeRange.max,
        ...filterParams
      }

      // 使用项目统一API请求工单详情
      workOrderListAnalysis(apiParams).then(response => {
        this.workOrderLoading = false
        if (response.code === 200) {
          this.workOrderDetailData = response.data.data.map(item => this.formatWorkOrderData(item))
        } else {
          this.$message.error(`获取工单详情失败：${response.msg || '未知错误'}`)
          this.workOrderDetailData = []
        }
      }).catch(error => {
        this.handleApiError(error)
      })
    },

    // 获取工单总数量详情（优先使用缓存）
    fetchWorkOrderTotalDetails() {
      // 尝试从缓存获取数据
      if (this.cachedWorkOrders && this.cachedWorkOrders.data) {
        this.workOrderLoading = false
        this.workOrderDialogTitle = '所有工单详情'
        this.workOrderDialogVisible = true
        // 格式化缓存中的数据
        this.workOrderDetailData = this.cachedWorkOrders.data.map(item => this.formatWorkOrderData(item))
        return
      }

      // 缓存未命中时才发起请求
      this.workOrderLoading = true
      this.workOrderDialogTitle = '所有工单详情'
      this.workOrderDialogVisible = true

      const filterParams = this.getFilterParams()
      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 9999,
        ...filterParams
      }

      // 使用项目统一API请求工单详情
      workOrderListAnalysis(apiParams).then(response => {
        this.workOrderLoading = false
        if (response.code === 200) {
          this.workOrderDetailData = response.data.data.map(item => this.formatWorkOrderData(item))
        } else {
          this.$message.error(`获取工单详情失败：${response.msg || '未知错误'}`)
          this.workOrderDetailData = []
        }
      }).catch(error => {
        this.handleApiError(error)
      })
    },

    // 格式化工单数据
    formatWorkOrderData(item) {
      return {
        id: item.id || '',
        title: item.title || '',
        worker: item.principals || '未分配', // 使用principals字段作为维修人员
        status: this.formatStatus(item),
        completion_time: this.calculateCompletionTime(item) || '未完成',
        create_time: item.create_time || '',
        finish_time: item.is_end ? item.update_time : '未完成',
        area: this.formatArea(item.belongs || item.area)
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
      if (error.response && error.response.status === 401) {
        this.$message.error('认证失败，请重新登录')
      } else {
        this.$message.error('网络异常，无法获取工单详情，请检查网络连接')
      }
      console.error('工单详情API调用失败：', error)
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

      if (this.filters.duration !== 'all') {
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
  align-items: center;
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

.filter-button {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
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

@media (max-width: 768px) {
  .chart-container {
    grid-template-columns: 1fr;
  }

  .kpi-overview {
    grid-template-columns: 1fr 1fr;
  }

  .filter-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-button {
    align-self: flex-start;
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
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
