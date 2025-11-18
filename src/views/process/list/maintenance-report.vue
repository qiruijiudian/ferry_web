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

    <div class="section">
      <h2 class="section-title"><i class="fas fa-chart-line" /> 效率与时效分析</h2>
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
      </div>
      <div class="chart-container">
        <div class="chart-box">
          <div class="chart-title">工单状态分布</div>
          <div class="chart-wrapper">
            <canvas ref="statusChart" />
          </div>
        </div>
        <div class="chart-box">
          <div class="chart-title">团队TOP榜</div>
          <div class="chart-wrapper">
            <canvas ref="efficiencyChart" />
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title"><i class="fas fa-clipboard-check" /> 服务质量分析</h2>

      <!-- 全部维修工人详细数据表格 -->
      <div class="chart-title" style="margin-top: 20px;">全部维修人员工单完成情况</div>
      <div class="worker-ranking-container">
        <el-table :data="workerData" style="width: 100%">
          <el-table-column prop="rank" label="排名" width="50" />
          <el-table-column prop="name" label="维修人员" width="100" />
          <el-table-column prop="completed" label="完成工单数量" width="120" />
          <el-table-column label="工单完成率" width="150">
            <template slot-scope="scope">
              <div class="completion-rate">
                <div class="completion-bar" :style="{ width: scope.row.completionRate + '%' }" />
              </div>
              <span>{{ scope.row.completionRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="avgTime" label="平均完成时长(小时)" width="150" />
          <el-table-column prop="reworkRate" label="返修率" width="100" />
        </el-table>
      </div>

      <!-- 维修人员TOP榜 - 图表展示前10名 -->
      <div class="chart-container">
        <div class="chart-box">
          <div class="chart-title">维修人员TOP榜（前10名）</div>
          <div class="chart-wrapper">
            <canvas ref="workerTopChart" />
          </div>
        </div>
        <div class="chart-box">
          <div class="chart-title">高频问题类型</div>
          <div class="chart-wrapper">
            <canvas ref="issueTypeChart" />
          </div>
        </div>
      </div>

      <!-- 返修工单明细 -->
      <div class="chart-title" style="margin-top: 20px;">返修工单明细</div>
      <el-table :data="reworkData" style="width: 100%">
        <el-table-column prop="reworkId" label="返修单ID" width="150" />
        <el-table-column prop="originalId" label="原工单ID" width="150" />
        <el-table-column prop="worker" label="负责工人" width="100" />
        <el-table-column prop="reason" label="返修原因" width="150" />
        <el-table-column prop="date" label="返修日期" width="120" />
      </el-table>
    </div>

    <div class="section">
      <h2 class="section-title"><i class="fas fa-chart-pie" /> 耗材与成本分析</h2>

      <!-- 图表区域：耗材成本分布和工单类型分布 -->
      <div class="chart-container">
        <div class="chart-box">
          <div class="chart-title">耗材成本分布</div>
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

      <!-- 耗材TOP榜表格 -->
      <div class="chart-title" style="margin-top: 20px;">耗材使用TOP榜</div>
      <div class="worker-ranking-container">
        <el-table :data="materialData" style="width: 100%">
          <el-table-column prop="rank" label="排名" width="50" />
          <el-table-column prop="name" label="耗材名称" width="120" />
          <el-table-column prop="quantity" label="使用数量" width="100" />
          <el-table-column prop="unitCost" label="单位成本" width="100" />
          <el-table-column prop="totalCost" label="总成本" width="100" />
          <el-table-column label="占总耗材成本比例" width="150">
            <template slot-scope="scope">
              <div class="completion-rate">
                <div class="completion-bar" :style="{ width: scope.row.costRatio + '%' }" />
              </div>
              <span>{{ scope.row.costRatio }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="usage" label="主要使用场景" width="150" />
        </el-table>
      </div>

      <!-- 耗材成本分析总结 -->
      <div class="summary" style="margin-top: 20px;">
        <h3>耗材成本分析</h3>
        <p>1. 电源适配器和硬盘占总耗材成本的76%，是成本控制的关键项。</p>
        <p>2. 高频率消耗品（如网络接头）单价低但总消耗量较大，建议批量采购降低成本。</p>
        <p>3. 工单类型中维修类占比45%，与高成本耗材使用量高度相关，可优化维修流程减少不必要的更换。</p>
        <p>4. 建议针对占比前3的耗材建立安全库存预警机制，避免因缺货导致工单延误。</p>
      </div>
    </div>

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
      materialData: [
        { rank: 1, name: '电源适配器', quantity: 42, unitCost: '¥25', totalCost: '¥1,050', costRatio: 42.9, usage: '设备更换、维修' },
        { rank: 2, name: '硬盘(1TB)', quantity: 18, unitCost: '¥45', totalCost: '¥810', costRatio: 33.1, usage: '存储升级、故障更换' },
        { rank: 3, name: '内存条(8GB)', quantity: 22, unitCost: '¥15', totalCost: '¥330', costRatio: 13.5, usage: '性能升级、故障更换' },
        { rank: 4, name: 'RJ45网络接头', quantity: 85, unitCost: '¥3.5', totalCost: '¥297.5', costRatio: 12.1, usage: '网络维修、布线' },
        { rank: 5, name: '网线(5米)', quantity: 32, unitCost: '¥4.2', totalCost: '¥134.4', costRatio: 5.5, usage: '网络布线、更换' }
      ],
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
        repair_type_stats: []
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
      }
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
    }
  },
  mounted() {
    console.log('MaintenanceReport组件已挂载')
    this.fetchReportData()
    this.loadChartJS().then(() => {
      console.log('Chart.js加载完成，开始初始化图表')
      this.initCharts()
    })
  },
  methods: {
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
      // 关键：使用系统中工单列表页面相同的Token存储键
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

    // 更新维修人员数据
    updateWorkerData() {
      const sortedWorkers = [...this.reportData.worker_completion].sort((a, b) => b.count - a.count)
      this.workerData = sortedWorkers.map((worker, index) => {
        const completionRate = this.reportData.total_count ? Math.round((worker.count / this.reportData.total_count) * 100) : 0
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
        this.charts.workerTopChart.data.datasets[1].data = topWorkers.map(worker => {
          return this.reportData.total_count ? Math.round((worker.count / this.reportData.total_count) * 100) : 0
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

      // 维修人员TOP榜图表
      const workerTopCtx = this.$refs.workerTopChart.getContext('2d')
      this.charts.workerTopChart = new window.Chart(workerTopCtx, {
        type: 'bar',
        data: {
          labels: this.reportData.worker_completion.map(worker => worker.nick_name),
          datasets: [
            {
              label: '完成工单数量',
              data: this.reportData.worker_completion.map(worker => worker.count),
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              label: '工单完成率(%)',
              data: this.reportData.worker_completion.map(worker => {
                return this.reportData.total_count ? Math.round((worker.count / this.reportData.total_count) * 100) : 0
              }),
              backgroundColor: 'rgba(34, 197, 94, 0.7)',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 1,
              type: 'line',
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              position: 'left',
              title: {
                display: true,
                text: '完成工单数量'
              },
              beginAtZero: true
            },
            y1: {
              type: 'linear',
              position: 'right',
              title: {
                display: true,
                text: '工单完成率(%)'
              },
              beginAtZero: true,
              max: 100,
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }
      })

      // 高频问题类型
      const issueTypeCtx = this.$refs.issueTypeChart.getContext('2d')
      this.charts.issueTypeChart = new window.Chart(issueTypeCtx, {
        type: 'pie',
        data: {
          labels: ['网络故障', '硬件损坏', '软件问题', '电源问题', '其他'],
          datasets: [{
            data: [25, 18, 15, 12, 30],
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

      // 耗材成本分布
      const materialCostCtx = this.$refs.materialCostChart.getContext('2d')
      this.charts.materialCostChart = new window.Chart(materialCostCtx, {
        type: 'doughnut',
        data: {
          labels: ['电源适配器', '硬盘', '内存条', '网络接头', '其他'],
          datasets: [{
            data: [42.9, 33.1, 13.5, 12.1, 5.5],
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

    // 获取时长区间工单详情
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
      const filterParams = this.getFilterParams()
      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 10,
        min_time: timeRange.min,
        max_time: timeRange.max,
        ...filterParams
      }

      axios({
        url: 'https://order.cdqrmi.com/api/v1/work-order/list',
        method: 'get',
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        },
        params: apiParams
      })
        .then(response => {
          this.workOrderLoading = false
          if (response.data.code === 200) {
            this.workOrderDetailData = response.data.data.map(item => this.formatWorkOrderData(item))
          } else {
            this.$message.error(`获取工单详情失败：${response.data.message || '未知错误'}`)
            this.workOrderDetailData = []
          }
        })
        .catch(error => {
          this.handleApiError(error)
        })
    },

    // 获取工单总数量详情
    fetchWorkOrderTotalDetails() {
      this.workOrderLoading = true
      this.workOrderDialogTitle = '所有工单详情'
      this.workOrderDialogVisible = true

      const filterParams = this.getFilterParams()
      const apiParams = {
        classify: 4,
        page: 1,
        per_page: 10,
        ...filterParams
      }

      axios({
        url: 'https://order.cdqrmi.com/api/v1/work-order/list',
        method: 'get',
        headers: {
          'Authorization': 'Bearer ' + this.getToken()
        },
        params: apiParams
      })
        .then(response => {
          this.workOrderLoading = false
          if (response.data.code === 200) {
            this.workOrderDetailData = response.data.data.map(item => this.formatWorkOrderData(item))
          } else {
            this.$message.error(`获取工单详情失败：${response.data.message || '未知错误'}`)
            this.workOrderDetailData = []
          }
        })
        .catch(error => {
          this.handleApiError(error)
        })
    },

    // 格式化工单数据
    formatWorkOrderData(item) {
      return {
        id: item.id || '',
        title: item.title || '',
        worker: item.worker_name || item.worker || '未分配',
        status: this.formatStatus(item.status),
        completion_time: item.completion_time
          ? `${item.completion_time}小时`
          : (item.status === 'ended' ? '0小时' : '未完成'),
        create_time: item.create_time || '',
        finish_time: item.finish_time || '未完成',
        area: this.formatArea(item.belongs || item.area)
      }
    },

    // 处理API错误
    handleApiError(error) {
      this.workOrderLoading = false
      if (error.response && error.response.status === 401) {
        this.$message.error('认证失败，请重新登录')
        // 可添加登录跳转逻辑：this.$router.push('/login');
      } else {
        this.$message.error('网络异常，无法获取工单详情，请检查网络连接')
      }
      console.error('工单详情API调用失败：', error)
      this.workOrderDetailData = []
    },

    // 格式化工单状态
    formatStatus(status) {
      const statusMap = {
        'unassigned': '待分配',
        'processing': '进行中',
        'ended': '已完成',
        'canceled': '已取消'
      }
      return statusMap[status] || status
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
          this.$message.info('未完成工单详情功能待实现')
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
        const element = document.querySelector('.worker-ranking-container')
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

.section {
  padding: 25px;
  border-bottom: 1px solid #eaeaea;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 20px;
  margin-bottom: 20px;
  color: #1e3a8a;
  display: flex;
  align-items: center;
}

.section-title i {
  margin-right: 10px;
  font-size: 22px;
}

.chart-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 25px;
  margin-top: 15px;
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

.worker-ranking-container {
  margin-top: 20px;
  overflow-x: auto;
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
