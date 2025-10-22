<template>
  <div class="app-container">
    <div class="weekly-report-container">
      <div class="report-header">
        <h1><i class="el-icon-document" /> 维修工单系统分析报告</h1>
        <div class="report-date">报告周期: 2023年10月16日 - 2023年10月22日</div>
      </div>

      <!-- 筛选框区域 -->
      <div class="filter-container">
        <div class="filter-group">
          <label class="filter-label">时长筛选</label>
          <el-select v-model="filters.duration" placeholder="请选择时长" size="small">
            <el-option label="全部时长" value="all" />
            <el-option label="一周" value="week" />
            <el-option label="一月" value="month" />
            <el-option label="一年" value="year" />
          </el-select>
        </div>

        <div class="filter-group">
          <label class="filter-label">片区筛选</label>
          <el-select v-model="filters.area" placeholder="请选择片区" size="small">
            <el-option label="全部片区" value="all" />
            <el-option label="岗巴" value="gangba" />
            <el-option label="萨迦" value="sajia" />
            <el-option label="错那" value="cuona" />
            <el-option label="拉萨" value="lasa" />
          </el-select>
        </div>

        <el-button type="primary" icon="el-icon-search" size="small" @click="handleFilter">
          筛选
        </el-button>
      </div>

      <!-- KPI指标 -->
      <el-row :gutter="20" class="kpi-overview">
        <el-col v-for="(kpi, index) in kpiData" :key="index" :xs="24" :sm="12" :md="6" :lg="4">
          <div class="kpi-card">
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-value">{{ kpi.value }}</div>
            <div class="trend" :class="kpi.trend">
              <i :class="kpi.trendIcon" /> {{ kpi.trendText }}
            </div>
          </div>
        </el-col>
      </el-row>

      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="效率与时效分析" name="efficiency">
          <div class="chart-container">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="chart-box">
                  <div slot="header" class="chart-title">工单完成时长分布</div>
                  <div class="chart-wrapper">
                    <canvas ref="durationChart" />
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="chart-box">
                  <div slot="header" class="chart-title">各类型工单平均时长</div>
                  <div class="chart-wrapper">
                    <canvas ref="typeDurationChart" />
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="12">
                <el-card class="chart-box">
                  <div slot="header" class="chart-title">工单状态分布</div>
                  <div class="chart-wrapper">
                    <canvas ref="statusChart" />
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="chart-box">
                  <div slot="header" class="chart-title">团队TOP榜</div>
                  <div class="chart-wrapper">
                    <canvas ref="efficiencyChart" />
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="24">
                <el-card class="chart-box">
                  <div slot="header" class="chart-title">长时间未完成原因</div>
                  <div class="chart-wrapper">
                    <canvas ref="delayReasonChart" />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="服务质量分析" name="quality">
          <div class="chart-container">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="chart-box">
                  <div slot="header" class="chart-title">维修人员TOP榜（前10名）</div>
                  <div class="chart-wrapper">
                    <canvas ref="workerTopChart" />
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="chart-box">
                  <div slot="header" class="chart-title">高频问题类型</div>
                  <div class="chart-wrapper">
                    <canvas ref="issueTypeChart" />
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-card style="margin-top: 20px;">
              <div slot="header" class="chart-title">全部维修人员工单完成情况</div>
              <div class="worker-ranking-container">
                <el-table :data="workerData" style="width: 100%" size="small">
                  <el-table-column prop="rank" label="排名" width="50" />
                  <el-table-column prop="name" label="维修人员" width="80" />
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
                  <el-table-column prop="reworkRate" label="返修率" width="80" />
                </el-table>
              </div>
            </el-card>

            <el-card style="margin-top: 20px;">
              <div slot="header" class="chart-title">返修工单明细</div>
              <el-table :data="reworkData" style="width: 100%" size="small">
                <el-table-column prop="reworkId" label="返修单ID" width="150" />
                <el-table-column prop="originalId" label="原工单ID" width="150" />
                <el-table-column prop="worker" label="负责工人" width="80" />
                <el-table-column prop="reason" label="返修原因" />
                <el-table-column prop="date" label="返修日期" width="100" />
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="耗材与成本分析" name="material">
          <div class="chart-container">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="chart-box">
                  <div slot="header" class="chart-title">耗材成本分布</div>
                  <div class="chart-wrapper">
                    <canvas ref="materialCostChart" />
                  </div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="chart-box">
                  <div slot="header" class="chart-title">工单类型分布</div>
                  <div class="chart-wrapper">
                    <canvas ref="workTypeChart" />
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-card style="margin-top: 20px;">
              <div slot="header" class="chart-title">耗材使用TOP榜</div>
              <div class="worker-ranking-container">
                <el-table :data="materialData" style="width: 100%" size="small">
                  <el-table-column prop="rank" label="排名" width="50" />
                  <el-table-column prop="name" label="耗材名称" width="120" />
                  <el-table-column prop="quantity" label="使用数量" width="80" />
                  <el-table-column prop="unitCost" label="单位成本" width="80" />
                  <el-table-column prop="totalCost" label="总成本" width="80" />
                  <el-table-column label="占总耗材成本比例" width="150">
                    <template slot-scope="scope">
                      <div class="completion-rate">
                        <div class="completion-bar" :style="{ width: scope.row.costRatio + '%' }" />
                      </div>
                      <span>{{ scope.row.costRatio }}%</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="scenario" label="主要使用场景" />
                </el-table>
              </div>
            </el-card>

            <el-card class="summary-card" style="margin-top: 20px;">
              <div slot="header">耗材成本分析</div>
              <div class="summary-content">
                <p>1. 电源适配器和硬盘占总耗材成本的76%，是成本控制的关键项。</p>
                <p>2. 高频率消耗品（如网络接头）单价低但总消耗量较大，建议批量采购降低成本。</p>
                <p>3. 工单类型中维修类占比45%，与高成本耗材使用量高度相关，可优化维修流程减少不必要的更换。</p>
                <p>4. 建议针对占比前3的耗材建立安全库存预警机制，避免因缺货导致工单延误。</p>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>

      <el-card class="summary-card">
        <div slot="header">整体总结与建议</div>
        <div class="summary-content">
          <p>1. 业务量稳步提升，团队效率保持高位，一次性修复率表现优异。</p>
          <p>2. 主机类和自控类工单平均时长偏高，建议重点分析原因并优化流程。</p>
          <p>3. 电源适配器耗材成本占总成本42.9%，建议寻找替代供应商或优化采购策略。</p>
          <p>4. 网络故障类工单占比最高，建议加强相关技能培训。</p>
          <p>5. 长时间未完成工单主要原因是配件短缺，建议优化库存管理。</p>
          <p>6. 维修人员表现差异明显，建议开展技能共享与培训，提升整体服务质量。</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js'

export default {
  name: 'WeeklyReport',
  data() {
    return {
      activeTab: 'efficiency',
      filters: {
        duration: 'all',
        area: 'all'
      },
      kpiData: [
        { label: '工单总数量', value: '158', trend: 'up', trendIcon: 'el-icon-top', trendText: '比上周增加12%' },
        { label: '未完成工单数量', value: '7', trend: 'down', trendIcon: 'el-icon-bottom', trendText: '比上周减少3个' },
        { label: '超时工单数量', value: '4', trend: 'up', trendIcon: 'el-icon-top', trendText: '比上周增加1个' },
        { label: '平均完成时长', value: '4.2小时', trend: 'down', trendIcon: 'el-icon-bottom', trendText: '比上周减少0.3小时' },
        { label: '一次性修复率', value: '98.1%', trend: '', trendIcon: '', trendText: '与上周持平' }
      ],
      workerData: [
        { rank: 1, name: '张三', completed: 35, completionRate: 98, avgTime: 3.2, reworkRate: '1.2%' },
        { rank: 2, name: '李四', completed: 28, completionRate: 96, avgTime: 3.8, reworkRate: '1.5%' },
        { rank: 3, name: '王五', completed: 25, completionRate: 95, avgTime: 4.1, reworkRate: '2.0%' },
        { rank: 4, name: '赵六', completed: 22, completionRate: 92, avgTime: 4.5, reworkRate: '2.3%' },
        { rank: 5, name: '钱七', completed: 19, completionRate: 90, avgTime: 5.0, reworkRate: '2.1%' },
        { rank: 6, name: '孙八', completed: 15, completionRate: 88, avgTime: 5.2, reworkRate: '2.5%' },
        { rank: 7, name: '周九', completed: 12, completionRate: 85, avgTime: 5.8, reworkRate: '3.0%' },
        { rank: 8, name: '吴十', completed: 10, completionRate: 82, avgTime: 6.2, reworkRate: '3.5%' },
        { rank: 9, name: '郑十一', completed: 8, completionRate: 80, avgTime: 6.5, reworkRate: '4.0%' },
        { rank: 10, name: '王十二', completed: 6, completionRate: 78, avgTime: 7.0, reworkRate: '4.5%' }
      ],
      reworkData: [
        { reworkId: 'RW-20231020-001', originalId: 'WO-20231015-045', worker: '张三', reason: '配件安装不牢固', date: '2023-10-20' },
        { reworkId: 'RW-20231021-002', originalId: 'WO-20231016-078', worker: '李四', reason: '软件配置错误', date: '2023-10-21' },
        { reworkId: 'RW-20231022-003', originalId: 'WO-20231018-112', worker: '王五', reason: '线路连接问题', date: '2023-10-22' }
      ],
      materialData: [
        { rank: 1, name: '电源适配器', quantity: 42, unitCost: '¥25', totalCost: '¥1,050', costRatio: 42.9, scenario: '设备更换、维修' },
        { rank: 2, name: '硬盘(1TB)', quantity: 18, unitCost: '¥45', totalCost: '¥810', costRatio: 33.1, scenario: '存储升级、故障更换' },
        { rank: 3, name: '内存条(8GB)', quantity: 22, unitCost: '¥15', totalCost: '¥330', costRatio: 13.5, scenario: '性能升级、故障更换' },
        { rank: 4, name: 'RJ45网络接头', quantity: 85, unitCost: '¥3.5', totalCost: '¥297.5', costRatio: 12.1, scenario: '网络维修、布线' },
        { rank: 5, name: '网线(5米)', quantity: 32, unitCost: '¥4.2', totalCost: '¥134.4', costRatio: 5.5, scenario: '网络布线、更换' }
      ],
      charts: {}
    }
  },
  mounted() {
    this.initCharts()
  },
  methods: {
    handleFilter() {
      this.$message({
        message: `已应用筛选: 时长=${this.getDurationText(this.filters.duration)}, 片区=${this.getAreaText(this.filters.area)}`,
        type: 'success'
      })
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
      // 工单完成时长分布
      const durationCtx = this.$refs.durationChart.getContext('2d')
      this.charts.durationChart = new Chart(durationCtx, {
        type: 'bar',
        data: {
          labels: ['<2小时', '2-4小时', '4-8小时', '8-24小时', '>24小时'],
          datasets: [{
            label: '工单数量',
            data: [42, 68, 32, 12, 4],
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
          }
        }
      })

      // 各类型工单平均时长
      const typeDurationCtx = this.$refs.typeDurationChart.getContext('2d')
      this.charts.typeDurationChart = new Chart(typeDurationCtx, {
        type: 'bar',
        data: {
          labels: [
            '供暖', '供水', '供氧', '维保', '设备类',
            '管道类', '风机类', '自控类', '主机类',
            '电气类', '金属管道类', '插座类', '阀门类',
            '水表', '水龙头', '接头', '温控器', '伴热带'
          ],
          datasets: [{
            label: '平均时长(小时)',
            data: [
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
      this.charts.efficiencyChart = new Chart(efficiencyCtx, {
        type: 'bar',
        data: {
          labels: ['张三', '李四', '王五', '赵六', '钱七'],
          datasets: [{
            label: '完成工单数',
            data: [35, 28, 25, 22, 19],
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
      this.charts.statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['已完成', '进行中', '待分配', '已关闭'],
          datasets: [{
            data: [151, 5, 2, 0],
            backgroundColor: [
              'rgba(34, 197, 94, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(251, 191, 36, 0.7)',
              'rgba(107, 114, 128, 0.7)'
            ],
            borderColor: [
              'rgb(34, 197, 94)',
              'rgb(59, 130, 246)',
              'rgb(251, 191, 36)',
              'rgb(107, 114, 128)'
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

      // 长时间未完成原因
      const delayReasonCtx = this.$refs.delayReasonChart.getContext('2d')
      this.charts.delayReasonChart = new Chart(delayReasonCtx, {
        type: 'pie',
        data: {
          labels: ['配件短缺', '技术难度大', '人员不足', '客户原因', '其他'],
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

      // 维修人员TOP榜图表
      const workerTopCtx = this.$refs.workerTopChart.getContext('2d')
      this.charts.workerTopChart = new Chart(workerTopCtx, {
        type: 'bar',
        data: {
          labels: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'],
          datasets: [
            {
              label: '完成工单数量',
              data: [35, 28, 25, 22, 19, 15, 12, 10, 8, 6],
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              label: '工单完成率(%)',
              data: [98, 96, 95, 92, 90, 88, 85, 82, 80, 78],
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
      this.charts.issueTypeChart = new Chart(issueTypeCtx, {
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
      this.charts.materialCostChart = new Chart(materialCostCtx, {
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
      this.charts.workTypeChart = new Chart(workTypeCtx, {
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
    }
  }
}
</script>

<style scoped>
.weekly-report-container {
  background-color: #f5f7fa;
  padding: 20px;
}

.report-header {
  background: linear-gradient(135deg, #1a6bc4 0%, #0d4d9c 100%);
  color: white;
  padding: 25px 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.report-header h1 {
  font-size: 28px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.report-header h1 i {
  margin-right: 12px;
  font-size: 32px;
}

.report-date {
  font-size: 16px;
  opacity: 0.9;
}

.filter-container {
  padding: 20px 30px;
  background: #f1f5f9;
  border-radius: 8px;
  margin-bottom: 20px;
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

.kpi-overview {
  margin-bottom: 20px;
}

.kpi-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: transform 0.3s;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kpi-card:hover {
  transform: translateY(-5px);
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  margin: 10px 0;
}

.kpi-label {
  font-size: 14px;
  color: #666;
}

.trend {
  font-size: 14px;
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

.chart-container {
  margin-top: 15px;
}

.chart-box {
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.chart-title {
  font-size: 16px;
  color: #374151;
  font-weight: 600;
}

.chart-wrapper {
  height: 240px;
  position: relative;
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
  display: inline-block;
  width: 80%;
  margin-right: 10px;
  vertical-align: middle;
}

.completion-bar {
  position: absolute;
  height: 100%;
  background-color: #3b82f6;
  border-radius: 4px;
}

.summary-card {
  margin-top: 20px;
}

.summary-card .el-card__header {
  background-color: #f0f9ff;
  border-left: 4px solid #3b82f6;
  font-weight: bold;
}

.summary-content p {
  margin: 10px 0;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .filter-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .report-header h1 {
    font-size: 24px;
  }
}
</style>
