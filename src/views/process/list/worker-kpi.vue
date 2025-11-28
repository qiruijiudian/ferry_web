<template>
  <div class="worker-kpi">
    <div class="header">
      <h1><i class="el-icon-user-solid" /> 维修人员KPI考核系统</h1>
      <div class="subtitle">个人绩效指标查询与分析</div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-card class="search-card">
        <div class="search-form">
          <el-form :model="searchForm" :inline="true" label-width="100px">
            <el-form-item label="维修人员">
              <el-select
                v-model="searchForm.workerName"
                filterable
                clearable
                placeholder="请选择或输入维修人员姓名"
                style="width: 300px;"
                @change="handleWorkerChange"
              >
                <el-option
                  v-for="worker in workerList"
                  :key="worker.value"
                  :label="worker.label"
                  :value="worker.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="考核周期">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                format="yyyy-MM-dd"
                :picker-options="pickerOptions"
                style="width: 300px;"
                @change="handleDateChange"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" :loading="searchLoading" @click="handleSearch">
                查询
              </el-button>
              <el-button icon="el-icon-refresh" @click="handleReset">
                重置
              </el-button>
              <el-button type="success" icon="el-icon-download" @click="handleExport">
                导出报告
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>

    <!-- KPI指标概览 -->
    <div v-if="showKPI" class="kpi-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="kpi-card total-orders" shadow="hover">
            <div class="kpi-content">
              <div class="kpi-icon">
                <i class="el-icon-document" />
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ kpiData.totalOrders }}</div>
                <div class="kpi-label">工单总数</div>
                <div class="kpi-trend">
                  <i class="el-icon-trend" /> 同比上月 {{ kpiData.monthCompare }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="kpi-card completion-rate" shadow="hover">
            <div class="kpi-content">
              <div class="kpi-icon">
                <i class="el-icon-success" />
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ kpiData.completionRate }}%</div>
                <div class="kpi-label">工单完成率</div>
                <div class="kpi-trend" :class="kpiData.rateTrend">
                  <i :class="kpiData.rateIcon" /> {{ kpiData.rateText }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="kpi-card standard-orders" shadow="hover">
            <div class="kpi-content">
              <div class="kpi-icon">
                <i class="el-icon-check" />
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ kpiData.standardOrders }}</div>
                <div class="kpi-label">标准工单</div>
                <div class="kpi-subtext">
                  占比 {{ kpiData.standardRate }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="kpi-card timeout-orders" shadow="hover">
            <div class="kpi-content">
              <div class="kpi-icon">
                <i class="el-icon-time" />
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ kpiData.timeoutOrders }}</div>
                <div class="kpi-label">超时工单</div>
                <div class="kpi-subtext">
                  占比 {{ kpiData.timeoutRate }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 第二行KPI指标 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="6">
          <el-card class="kpi-card rework-orders" shadow="hover">
            <div class="kpi-content">
              <div class="kpi-icon">
                <i class="el-icon-refresh" />
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ kpiData.reworkOrders }}</div>
                <div class="kpi-label">返修工单</div>
                <div class="kpi-subtext">
                  返修率 {{ kpiData.reworkRate }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="kpi-card avg-time" shadow="hover">
            <div class="kpi-content">
              <div class="kpi-icon">
                <i class="el-icon-timer" />
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ kpiData.avgCompletionTime }}h</div>
                <div class="kpi-label">平均完成时长</div>
                <div class="kpi-trend" :class="kpiData.timeTrend">
                  <i :class="kpiData.timeIcon" /> {{ kpiData.timeText }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="kpi-card satisfaction" shadow="hover">
            <div class="kpi-content">
              <div class="kpi-icon">
                <i class="el-icon-star-on" />
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ kpiData.satisfactionRate }}%</div>
                <div class="kpi-label">客户满意度</div>
                <div class="kpi-subtext">
                  基于 {{ kpiData.feedbackCount }} 条评价
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="kpi-card score" shadow="hover">
            <div class="kpi-content">
              <div class="kpi-icon">
                <i class="el-icon-medal" />
              </div>
              <div class="kpi-info">
                <div class="kpi-value">{{ kpiData.kpiScore }}</div>
                <div class="kpi-label">KPI综合得分</div>
                <div class="kpi-trend" :class="kpiData.scoreTrend">
                  <i :class="kpiData.scoreIcon" /> {{ kpiData.scoreText }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 详细数据表格 -->
    <div v-if="showKPI" class="detail-section">
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <span>工单明细 - {{ currentWorker }}</span>
            <div class="header-actions">
              <el-button
                v-if="orderData.length > 10 && !showAllOrders"
                type="text"
                icon="el-icon-arrow-down"
                @click="showAllOrders = true"
              >
                展开全部 {{ orderData.length }} 条记录
              </el-button>
              <el-button
                v-if="orderData.length > 10 && showAllOrders"
                type="text"
                icon="el-icon-arrow-up"
                @click="showAllOrders = false"
              >
                收起至前10条
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          v-loading="tableLoading"
          :data="showAllOrders ? orderData : orderData.slice(0, 10)"
          style="width: 100%"
          stripe
          :height="tableHeight"
        >
          <el-table-column prop="id" label="工单ID" width="100" fixed="left" />
          <el-table-column prop="title" label="工单标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="工单类型" width="120">
            <template slot-scope="scope">
              <el-tag :type="getOrderTypeTag(scope.row.type)" size="small">
                {{ scope.row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="completionTime" label="完成时长" width="110" align="center">
            <template slot-scope="scope">
              <span :class="getTimeClass(scope.row.completionTime)">
                {{ scope.row.completionTime }}h
              </span>
            </template>
          </el-table-column>
          <el-table-column label="是否超时" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.isTimeout ? 'danger' : 'success'" size="small">
                {{ scope.row.isTimeout ? '超时' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否返修" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.isRework ? 'warning' : 'info'" size="small">
                {{ scope.row.isRework ? '返修' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="finishTime" label="完成时间" width="180" />
          <el-table-column prop="area" label="片区" width="100" />
          <el-table-column prop="description" label="工单描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="客户评价" width="120" align="center">
            <template slot-scope="scope">
              <el-rate
                v-model="scope.row.rating"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
              />
            </template>
          </el-table-column>
        </el-table>

        <!-- 空状态 -->
        <div v-if="orderData.length === 0 && !tableLoading" class="empty-state">
          <i class="el-icon-document" />
          <p>暂无工单数据</p>
        </div>
      </el-card>
    </div>

    <!-- 图表分析 -->
    <div v-if="showKPI" class="chart-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>工单类型分布</span>
            </template>
            <div class="chart-container">
              <canvas ref="typeChart" />
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>完成时长分布</span>
            </template>
            <div class="chart-container">
              <canvas ref="timeChart" />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>月度工单趋势</span>
            </template>
            <div class="chart-container">
              <canvas ref="trendChart" />
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>片区工单分布</span>
            </template>
            <div class="chart-container">
              <canvas ref="areaChart" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 绩效分析报告 -->
    <div v-if="showKPI" class="analysis-section">
      <el-card class="analysis-card">
        <template #header>
          <span>绩效分析报告 - {{ currentWorker }}</span>
        </template>

        <div class="analysis-content">
          <div class="report-period">
            <strong>报告周期：</strong>{{ reportPeriod }}
          </div>

          <div class="performance-summary">
            <h4>绩效总结</h4>
            <p>{{ performanceSummary }}</p>
          </div>

          <div class="strengths-weaknesses">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="strengths">
                  <h4><i class="el-icon-success" style="color: #67C23A;" /> 优势表现</h4>
                  <ul>
                    <li v-for="(strength, index) in strengths" :key="index">{{ strength }}</li>
                  </ul>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="weaknesses">
                  <h4><i class="el-icon-warning" style="color: #E6A23C;" /> 改进建议</h4>
                  <ul>
                    <li v-for="(weakness, index) in weaknesses" :key="index">{{ weakness }}</li>
                  </ul>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="recommendations">
            <h4><i class="el-icon-lightbulb" style="color: #409EFF;" /> 发展建议</h4>
            <p>{{ developmentRecommendations }}</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 无数据提示 -->
    <div v-if="!showKPI && !searchLoading" class="no-data">
      <el-card class="no-data-card">
        <div class="no-data-content">
          <i class="el-icon-search" />
          <h3>请选择维修人员查看KPI考核数据</h3>
          <p>选择维修人员姓名并设置查询时间范围，系统将显示详细的绩效指标和分析报告</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkerKPI',
  data() {
    return {
      searchForm: {
        workerName: '',
        dateRange: []
      },
      searchLoading: false,
      tableLoading: false,
      showKPI: false,
      showAllOrders: false,
      tableHeight: '500px',

      // 维修人员列表
      workerList: [],

      // 当前选中的维修人员
      currentWorker: '',

      // KPI数据
      kpiData: {
        totalOrders: 0,
        completionRate: 0,
        standardOrders: 0,
        timeoutOrders: 0,
        reworkOrders: 0,
        avgCompletionTime: 0,
        satisfactionRate: 0,
        kpiScore: 0,
        monthCompare: 0,
        standardRate: 0,
        timeoutRate: 0,
        reworkRate: 0,
        feedbackCount: 0,
        rateTrend: '',
        rateIcon: '',
        rateText: '',
        timeTrend: '',
        timeIcon: '',
        timeText: '',
        scoreTrend: '',
        scoreIcon: '',
        scoreText: ''
      },

      // 工单数据
      orderData: [],

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

      // 图表实例
      charts: {},

      // 报告周期
      reportPeriod: '',

      // 绩效分析内容
      performanceSummary: '',
      strengths: [],
      weaknesses: [],
      developmentRecommendations: ''
    }
  },
  mounted() {
    this.loadWorkerList()
    this.setDefaultDateRange()
    this.loadChartJS()
  },
  methods: {
    // 加载维修人员列表
    async loadWorkerList() {
      try {
        // 这里应该调用API获取维修人员列表
        // 暂时使用模拟数据
        this.workerList = [
          { label: '张三', value: '张三' },
          { label: '李四', value: '李四' },
          { label: '王五', value: '王五' },
          { label: '赵六', value: '赵六' },
          { label: '钱七', value: '钱七' },
          { label: '孙八', value: '孙八' }
        ]
      } catch (error) {
        console.error('加载维修人员列表失败:', error)
      }
    },

    // 设置默认日期范围（最近一个月）
    setDefaultDateRange() {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      this.searchForm.dateRange = [start, end]
    },

    // 维修人员选择变化
    handleWorkerChange(value) {
      this.currentWorker = value
    },

    // 日期范围变化
    handleDateChange(value) {
      // 可以添加日期验证逻辑
    },

    // 搜索查询
    async handleSearch() {
      if (!this.searchForm.workerName) {
        this.$message.warning('请选择维修人员')
        return
      }

      if (!this.searchForm.dateRange || this.searchForm.dateRange.length !== 2) {
        this.$message.warning('请选择完整的时间范围')
        return
      }

      this.searchLoading = true
      this.tableLoading = true

      try {
        // 调用API获取数据
        await this.fetchWorkerKPIData()
        this.showKPI = true

        // 更新报告周期
        this.reportPeriod = `${this.searchForm.dateRange[0]} 至 ${this.searchForm.dateRange[1]}`

        // 生成绩效分析
        this.generatePerformanceAnalysis()

        // 初始化图表
        this.$nextTick(() => {
          this.initCharts()
        })

        this.$message.success(`已加载 ${this.currentWorker} 的绩效数据`)
      } catch (error) {
        console.error('查询失败:', error)
        this.$message.error('查询失败，请稍后重试')
      } finally {
        this.searchLoading = false
        this.tableLoading = false
      }
    },

    // 重置搜索条件
    handleReset() {
      this.searchForm.workerName = ''
      this.setDefaultDateRange()
      this.showKPI = false
      this.currentWorker = ''
    },

    // 导出报告
    handleExport() {
      if (!this.showKPI) {
        this.$message.warning('请先查询数据')
        return
      }

      this.$message.info('导出功能开发中...')
      // 这里可以实现导出PDF或Excel的功能
    },

    // 获取维修人员KPI数据
    async fetchWorkerKPIData() {
      // 模拟API调用
      return new Promise((resolve) => {
        setTimeout(() => {
          // 模拟数据 - 实际应该调用API
          const mockData = this.generateMockData()
          this.kpiData = mockData.kpiData
          this.orderData = mockData.orderData
          resolve()
        }, 1500)
      })
    },

    // 生成模拟数据
    generateMockData() {
      const workerName = this.searchForm.workerName

      // 生成KPI数据
      const kpiData = {
        totalOrders: Math.floor(Math.random() * 50) + 30,
        completionRate: Math.floor(Math.random() * 20) + 80,
        standardOrders: 0,
        timeoutOrders: Math.floor(Math.random() * 10),
        reworkOrders: Math.floor(Math.random() * 5),
        avgCompletionTime: (Math.random() * 10 + 2).toFixed(1),
        satisfactionRate: Math.floor(Math.random() * 20) + 75,
        kpiScore: Math.floor(Math.random() * 20) + 75,
        monthCompare: (Math.random() * 20 - 5).toFixed(1),
        standardRate: 0,
        timeoutRate: 0,
        reworkRate: 0,
        feedbackCount: Math.floor(Math.random() * 20) + 10
      }

      // 计算衍生数据
      kpiData.standardOrders = kpiData.totalOrders - kpiData.timeoutOrders - kpiData.reworkOrders
      kpiData.standardRate = ((kpiData.standardOrders / kpiData.totalOrders) * 100).toFixed(1)
      kpiData.timeoutRate = ((kpiData.timeoutOrders / kpiData.totalOrders) * 100).toFixed(1)
      kpiData.reworkRate = ((kpiData.reworkOrders / kpiData.totalOrders) * 100).toFixed(1)

      // 设置趋势数据
      kpiData.rateTrend = kpiData.completionRate >= 90 ? 'up' : 'down'
      kpiData.rateIcon = kpiData.completionRate >= 90 ? 'el-icon-top' : 'el-icon-bottom'
      kpiData.rateText = kpiData.completionRate >= 90 ? '表现优异' : '有待提升'

      kpiData.timeTrend = kpiData.avgCompletionTime <= 5 ? 'up' : 'down'
      kpiData.timeIcon = kpiData.avgCompletionTime <= 5 ? 'el-icon-top' : 'el-icon-bottom'
      kpiData.timeText = kpiData.avgCompletionTime <= 5 ? '效率很高' : '效率待提升'

      kpiData.scoreTrend = kpiData.kpiScore >= 85 ? 'up' : 'down'
      kpiData.scoreIcon = kpiData.kpiScore >= 85 ? 'el-icon-top' : 'el-icon-bottom'
      kpiData.scoreText = kpiData.kpiScore >= 85 ? '优秀' : '良好'

      // 生成工单数据
      const orderTypes = ['维修', '安装', '保养', '巡检', '升级']
      const areas = ['岗巴', '萨迦', '错那', '拉萨']
      const orderData = []

      for (let i = 0; i < kpiData.totalOrders; i++) {
        const completionTime = (Math.random() * 15 + 1).toFixed(1)
        const isTimeout = completionTime > 8
        const isRework = Math.random() > 0.9

        orderData.push({
          id: `WO-${new Date().getFullYear()}${String(i + 1).padStart(4, '0')}`,
          title: `${orderTypes[Math.floor(Math.random() * orderTypes.length)]}工单 - ${areas[Math.floor(Math.random() * areas.length)]}片区`,
          type: orderTypes[Math.floor(Math.random() * orderTypes.length)],
          status: Math.random() > 0.2 ? '已完成' : '进行中',
          completionTime: completionTime,
          isTimeout: isTimeout,
          isRework: isRework,
          createTime: this.randomDate(this.searchForm.dateRange[0], this.searchForm.dateRange[1]),
          finishTime: this.randomDate(this.searchForm.dateRange[0], this.searchForm.dateRange[1]),
          area: areas[Math.floor(Math.random() * areas.length)],
          description: `这是${workerName}处理的${orderTypes[Math.floor(Math.random() * orderTypes.length)]}工单描述`,
          rating: Math.floor(Math.random() * 3) + 3 // 3-5星
        })
      }

      return { kpiData, orderData }
    },

    // 生成随机日期
    randomDate(start, end) {
      const startDate = new Date(start).getTime()
      const endDate = new Date(end).getTime()
      const randomTime = startDate + Math.random() * (endDate - startDate)
      return new Date(randomTime).toLocaleString()
    },

    // 生成绩效分析
    generatePerformanceAnalysis() {
      const kpi = this.kpiData

      // 绩效总结
      this.performanceSummary = `${this.currentWorker}在考核周期内共处理${kpi.totalOrders}个工单，` +
        `完成率达到${kpi.completionRate}%，平均完成时长${kpi.avgCompletionTime}小时，` +
        `KPI综合得分${kpi.kpiScore}分。${kpi.completionRate >= 90 ? '整体表现优秀，' : '整体表现良好，'}` +
        `在团队中属于${kpi.kpiScore >= 85 ? '优秀水平' : '中等偏上水平'}。`

      // 优势表现
      this.strengths = []
      if (kpi.completionRate >= 90) {
        this.strengths.push(`工单完成率高达${kpi.completionRate}%，表现优异`)
      }
      if (kpi.avgCompletionTime <= 5) {
        this.strengths.push(`平均完成时长${kpi.avgCompletionTime}小时，工作效率很高`)
      }
      if (kpi.satisfactionRate >= 85) {
        this.strengths.push(`客户满意度${kpi.satisfactionRate}%，服务质量优秀`)
      }
      if (kpi.reworkRate <= 5) {
        this.strengths.push(`返修率仅${kpi.reworkRate}%，工作质量稳定`)
      }
      if (this.strengths.length === 0) {
        this.strengths.push('工作态度认真，基础工作完成良好')
      }

      // 改进建议
      this.weaknesses = []
      if (kpi.timeoutRate > 15) {
        this.weaknesses.push(`超时工单占比${kpi.timeoutRate}%，需要提升工作效率`)
      }
      if (kpi.reworkRate > 10) {
        this.weaknesses.push(`返修率${kpi.reworkRate}%，需要加强工作质量控制`)
      }
      if (kpi.avgCompletionTime > 8) {
        this.weaknesses.push(`平均完成时长${kpi.avgCompletionTime}小时，建议优化工作流程`)
      }
      if (kpi.satisfactionRate < 80) {
        this.weaknesses.push(`客户满意度${kpi.satisfactionRate}%，建议提升服务质量`)
      }
      if (this.weaknesses.length === 0) {
        this.weaknesses.push('继续保持当前工作状态，争取更好表现')
      }

      // 发展建议
      this.developmentRecommendations = `建议${this.currentWorker}继续保持优势，` +
        (kpi.timeoutRate > 15 ? `重点提升工作效率，减少超时工单；` : '') +
        (kpi.reworkRate > 10 ? `加强工作质量控制，降低返修率；` : '') +
        `积极参与团队培训，不断提升专业技能，争取在下一个考核周期取得更好成绩。`
    },

    // 加载Chart.js
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

    // 初始化图表
    initCharts() {
      if (!window.Chart) return

      // 工单类型分布图表
      const typeCtx = this.$refs.typeChart?.getContext('2d')
      if (typeCtx) {
        const typeData = this.calculateTypeDistribution()
        this.charts.typeChart = new window.Chart(typeCtx, {
          type: 'pie',
          data: {
            labels: typeData.labels,
            datasets: [{
              data: typeData.data,
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)'
              ],
              borderColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 206, 86)',
                'rgb(75, 192, 192)',
                'rgb(153, 102, 255)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        })
      }

      // 完成时长分布图表
      const timeCtx = this.$refs.timeChart?.getContext('2d')
      if (timeCtx) {
        const timeData = this.calculateTimeDistribution()
        this.charts.timeChart = new window.Chart(timeCtx, {
          type: 'bar',
          data: {
            labels: timeData.labels,
            datasets: [{
              label: '工单数量',
              data: timeData.data,
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        })
      }

      // 月度趋势图表
      const trendCtx = this.$refs.trendChart?.getContext('2d')
      if (trendCtx) {
        this.charts.trendChart = new window.Chart(trendCtx, {
          type: 'line',
          data: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            datasets: [{
              label: '工单数量',
              data: [12, 19, 15, 17, 14, 16, 18, 20, 22, 19, 21, 23],
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        })
      }

      // 片区分布图表
      const areaCtx = this.$refs.areaChart?.getContext('2d')
      if (areaCtx) {
        const areaData = this.calculateAreaDistribution()
        this.charts.areaChart = new window.Chart(areaCtx, {
          type: 'doughnut',
          data: {
            labels: areaData.labels,
            datasets: [{
              data: areaData.data,
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)'
              ],
              borderColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 206, 86)',
                'rgb(75, 192, 192)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        })
      }
    },

    // 计算工单类型分布
    calculateTypeDistribution() {
      const typeCount = {}
      this.orderData.forEach(order => {
        typeCount[order.type] = (typeCount[order.type] || 0) + 1
      })

      return {
        labels: Object.keys(typeCount),
        data: Object.values(typeCount)
      }
    },

    // 计算完成时长分布
    calculateTimeDistribution() {
      const timeRanges = {
        '0-2h': 0,
        '2-4h': 0,
        '4-8h': 0,
        '8-12h': 0,
        '12h+': 0
      }

      this.orderData.forEach(order => {
        const time = parseFloat(order.completionTime)
        if (time <= 2) timeRanges['0-2h']++
        else if (time <= 4) timeRanges['2-4h']++
        else if (time <= 8) timeRanges['4-8h']++
        else if (time <= 12) timeRanges['8-12h']++
        else timeRanges['12h+']++
      })

      return {
        labels: Object.keys(timeRanges),
        data: Object.values(timeRanges)
      }
    },

    // 计算片区分布
    calculateAreaDistribution() {
      const areaCount = {}
      this.orderData.forEach(order => {
        areaCount[order.area] = (areaCount[order.area] || 0) + 1
      })

      return {
        labels: Object.keys(areaCount),
        data: Object.values(areaCount)
      }
    },

    // 工具方法
    getOrderTypeTag(type) {
      const typeMap = {
        '维修': 'danger',
        '安装': 'success',
        '保养': 'primary',
        '巡检': 'warning',
        '升级': 'info'
      }
      return typeMap[type] || 'info'
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

    getTimeClass(time) {
      const numTime = parseFloat(time)
      if (numTime <= 4) return 'time-fast'
      if (numTime <= 8) return 'time-normal'
      return 'time-slow'
    },

    getToken() {
      return localStorage.getItem('token') || ''
    }
  }
}
</script>

<style scoped>
.worker-kpi {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px 30px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.header h1 i {
  margin-right: 12px;
  font-size: 32px;
}

.header .subtitle {
  font-size: 16px;
  opacity: 0.9;
}

.search-section {
  margin-bottom: 20px;
}

.search-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-form {
  padding: 10px 0;
}

.kpi-overview {
  margin-bottom: 20px;
}

.kpi-card {
  border-radius: 12px;
  border: none;
  margin-bottom: 0;
}

.kpi-card .el-card__body {
  padding: 20px;
}

.kpi-content {
  display: flex;
  align-items: center;
}

.kpi-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.kpi-info {
  flex: 1;
}

.kpi-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.kpi-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.kpi-trend, .kpi-subtext {
  font-size: 12px;
  color: #999;
}

.kpi-trend.up {
  color: #67c23a;
}

.kpi-trend.down {
  color: #f56c6c;
}

/* KPI卡片颜色 */
.total-orders .kpi-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.completion-rate .kpi-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.standard-orders .kpi-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.timeout-orders .kpi-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.rework-orders .kpi-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.avg-time .kpi-icon {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

.satisfaction .kpi-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.score .kpi-icon {
  background: linear-gradient(135deg, #5ee7df 0%, #b490ca 100%);
}

.detail-section {
  margin-bottom: 20px;
}

.detail-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.time-fast {
  color: #67c23a;
  font-weight: 600;
}

.time-normal {
  color: #e6a23c;
  font-weight: 600;
}

.time-slow {
  color: #f56c6c;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 20px;
}

.chart-section {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-container {
  height: 300px;
  position: relative;
}

.analysis-section {
  margin-bottom: 20px;
}

.analysis-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.analysis-content {
  padding: 10px 0;
}

.report-period {
  margin-bottom: 20px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 4px solid #409EFF;
}

.performance-summary {
  margin-bottom: 20px;
}

.performance-summary h4 {
  color: #303133;
  margin-bottom: 10px;
}

.performance-summary p {
  line-height: 1.6;
  color: #606266;
}

.strengths-weaknesses {
  margin-bottom: 20px;
}

.strengths h4, .weaknesses h4 {
  color: #303133;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.strengths h4 i, .weaknesses h4 i {
  margin-right: 8px;
}

.strengths ul, .weaknesses ul {
  padding-left: 20px;
  color: #606266;
  line-height: 1.6;
}

.strengths li {
  color: #67C23A;
}

.weaknesses li {
  color: #E6A23C;
}

.recommendations h4 {
  color: #303133;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.recommendations h4 i {
  margin-right: 8px;
}

.recommendations p {
  line-height: 1.6;
  color: #606266;
}

.no-data {
  margin-top: 50px;
}

.no-data-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
}

.no-data-content {
  padding: 60px 20px;
  color: #909399;
}

.no-data-content i {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
  opacity: 0.5;
}

.no-data-content h3 {
  font-size: 20px;
  margin-bottom: 10px;
  color: #606266;
}

.no-data-content p {
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .search-form .el-form-item {
    margin-bottom: 15px;
  }

  .kpi-overview .el-col {
    margin-bottom: 15px;
  }

  .chart-section .el-col {
    margin-bottom: 20px;
  }

  .strengths-weaknesses .el-col {
    margin-bottom: 20px;
  }
}
</style>
