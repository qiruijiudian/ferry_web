<template>
  <div class="consumable-management">
    <div class="header">
      <h1><i class="el-icon-box" /> 耗材与仓库管理系统</h1>
      <div class="subtitle">耗材库存、使用记录、采购管理一体化平台</div>
    </div>

    <!-- 筛选和操作区域 -->
    <div class="operation-bar">
      <div class="filter-group">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称、型号、代码..."
          prefix-icon="el-icon-search"
          style="width: 300px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="filterStatus" placeholder="库存状态" clearable @change="handleFilter">
          <el-option label="库存充足" value="sufficient" />
          <el-option label="库存预警" value="warning" />
          <el-option label="缺货" value="outOfStock" />
        </el-select>
      </div>
      <div class="action-group">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">
          新增商品
        </el-button>
        <el-button type="success" icon="el-icon-download" @click="handleExport">
          导出数据
        </el-button>
        <el-button icon="el-icon-refresh" @click="refreshData">
          刷新
        </el-button>
      </div>
    </div>

    <!-- KPI指标卡片 -->
    <div class="kpi-cards">
      <el-card class="kpi-card" shadow="hover">
        <div class="kpi-content">
          <div class="kpi-icon inventory">
            <i class="el-icon-box" />
          </div>
          <div class="kpi-info">
            <div class="kpi-value">{{ totalInventory }}</div>
            <div class="kpi-label">总库存种类</div>
          </div>
        </div>
      </el-card>
      <el-card class="kpi-card" shadow="hover">
        <div class="kpi-content">
          <div class="kpi-icon warning">
            <i class="el-icon-warning" />
          </div>
          <div class="kpi-info">
            <div class="kpi-value">{{ warningItems }}</div>
            <div class="kpi-label">库存预警</div>
          </div>
        </div>
      </el-card>
      <el-card class="kpi-card" shadow="hover">
        <div class="kpi-content">
          <div class="kpi-icon out-of-stock">
            <i class="el-icon-close" />
          </div>
          <div class="kpi-info">
            <div class="kpi-value">{{ outOfStockItems }}</div>
            <div class="kpi-label">缺货物品</div>
          </div>
        </div>
      </el-card>
      <el-card class="kpi-card" shadow="hover">
        <div class="kpi-content">
          <div class="kpi-icon total">
            <i class="el-icon-s-data" />
          </div>
          <div class="kpi-info">
            <div class="kpi-value">{{ totalStock }}</div>
            <div class="kpi-label">库存总量</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 耗材列表 -->
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>商品库存列表</span>
          <div class="header-actions">
            <el-button
              v-if="consumableData.length > 10 && !showAllItems"
              type="text"
              icon="el-icon-arrow-down"
              @click="showAllItems = true"
            >
              展开全部 {{ consumableData.length }} 条数据
            </el-button>
            <el-button
              v-if="consumableData.length > 10 && showAllItems"
              type="text"
              icon="el-icon-arrow-up"
              @click="showAllItems = false"
            >
              收起至前10条
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="showAllItems ? filteredData : filteredData.slice(0, 10)"
        style="width: 100%"
        :height="tableHeight"
        stripe
        border
      >
        <el-table-column prop="goods_code" label="商品代码" width="120" fixed="left" />
        <el-table-column prop="goods_desc" label="商品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="goods_specs" label="型号规格" width="150" show-overflow-tooltip />
        <el-table-column prop="onhand_stock" label="当前库存" width="110" align="center">
          <template slot-scope="scope">
            <span :class="getStockClass(scope.row)">
              {{ scope.row.onhand_stock }} {{ getUnitFromSpecs(scope.row.goods_specs) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="可订购库存" width="110" align="center">
          <template slot-scope="scope">
            {{ scope.row.can_order_stock || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="库存状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStockStatusType(scope.row)" size="small">
              {{ getStockStatus(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" width="150" show-overflow-tooltip />
        <el-table-column label="质检库存" width="110" align="center">
          <template slot-scope="scope">
            {{ scope.row.inspect_stock || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="损坏库存" width="110" align="center">
          <template slot-scope="scope">
            {{ scope.row.damage_stock || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="update_time" label="最后更新" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button size="mini" type="success" @click="handleStockIn(scope.row)">
              入库
            </el-button>
            <el-button
              size="mini"
              type="warning"
              :disabled="scope.row.onhand_stock <= 0"
              @click="handleStockOut(scope.row)"
            >
              出库
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <div v-if="pagination.total > pagination.pageSize" class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, sizes, total"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>

      <!-- 空状态 -->
      <div v-if="filteredData.length === 0 && !loading" class="empty-state">
        <i class="el-icon-box" />
        <p>暂无商品数据</p>
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">
          添加第一个商品
        </el-button>
      </div>
    </el-card>

    <!-- 耗材使用统计 -->
    <div class="chart-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>库存商品TOP10</span>
            </template>
            <div class="chart-container">
              <canvas ref="usageChart" />
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>库存状态分布</span>
            </template>
            <div class="chart-container">
              <canvas ref="stockChart" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 商品操作对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form ref="consumableForm" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品代码" prop="goods_code">
              <el-input v-model="formData.goods_code" placeholder="请输入商品代码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品名称" prop="goods_desc">
              <el-input v-model="formData.goods_desc" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="型号规格" prop="goods_specs">
              <el-input v-model="formData.goods_specs" placeholder="请输入型号规格" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="formData.unit" placeholder="如：个、米、卷、台" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="初始库存" prop="goods_qty">
              <el-input-number
                v-model="formData.goods_qty"
                :min="0"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警阈值" prop="min_stock">
              <el-input-number
                v-model="formData.min_stock"
                :min="0"
                :precision="0"
                style="width: 100%"
                placeholder="低于此值预警"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier">
              <el-input v-model="formData.supplier" placeholder="请输入供应商" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="条码">
              <el-input v-model="formData.bar_code" placeholder="可留空，系统自动生成" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 入库/出库对话框 -->
    <el-dialog
      :title="stockDialogTitle"
      :visible.sync="stockDialogVisible"
      width="400px"
      :before-close="handleStockDialogClose"
    >
      <el-form ref="stockForm" :model="stockFormData" :rules="stockFormRules" label-width="80px">
        <el-form-item :label="stockOperation === 'in' ? '入库数量' : '出库数量'" prop="quantity">
          <el-input-number
            v-model="stockFormData.quantity"
            :min="1"
            :max="stockOperation === 'out' && currentConsumable ? currentConsumable.onhand_stock : undefined"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="stockFormData.remark"
            type="textarea"
            :rows="3"
            :placeholder="stockOperation === 'in' ? '请输入入库备注' : '请输入出库用途'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="stockFormLoading" @click="handleStockSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { stockApi } from '@/api/consumable'

export default {
  name: 'ConsumableManagement',
  data() {
    return {
      // 筛选条件
      searchKeyword: '',
      filterStatus: '',

      // 数据
      consumableData: [],
      loading: false,
      showAllItems: false,
      tableHeight: '600px',

      // KPI数据
      totalInventory: 0,
      warningItems: 0,
      outOfStockItems: 0,
      totalStock: 0,

      // 分页相关
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        count: 0
      },

      // 对话框控制
      dialogVisible: false,
      stockDialogVisible: false,
      dialogTitle: '新增商品',
      stockDialogTitle: '入库操作',
      formLoading: false,
      stockFormLoading: false,

      // 表单数据
      formData: {
        id: null,
        goods_code: '',
        goods_desc: '',
        goods_specs: '',
        goods_qty: 0,
        min_stock: 10, // 默认预警阈值
        supplier: '',
        unit: '个',
        bar_code: '',
        remark: ''
      },

      // 库存操作数据
      stockFormData: {
        quantity: 1,
        remark: ''
      },
      stockOperation: 'in', // 'in' 或 'out'
      currentConsumable: null,

      // 表单验证规则
      formRules: {
        goods_code: [
          { required: true, message: '请输入商品代码', trigger: 'blur' }
        ],
        goods_desc: [
          { required: true, message: '请输入商品名称', trigger: 'blur' }
        ],
        goods_qty: [
          { required: true, message: '请输入初始库存', trigger: 'blur' },
          { type: 'number', min: 0, message: '库存不能为负数', trigger: 'blur' }
        ],
        min_stock: [
          { required: true, message: '请输入预警阈值', trigger: 'blur' },
          { type: 'number', min: 0, message: '预警阈值不能为负数', trigger: 'blur' }
        ]
      },

      stockFormRules: {
        quantity: [
          { required: true, message: '请输入数量', trigger: 'blur' },
          { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' }
        ]
      },

      // 图表实例
      usageChart: null,
      stockChart: null,

      // 最小库存阈值（用于预警判断）
      minStockThreshold: 10
    }
  },
  computed: {
    filteredData() {
      let data = this.consumableData

      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        data = data.filter(item => {
          return (
            (item.goods_desc && item.goods_desc.toLowerCase().includes(keyword)) ||
            (item.goods_specs && item.goods_specs.toLowerCase().includes(keyword)) ||
            (item.goods_code && item.goods_code.toLowerCase().includes(keyword)) ||
            (item.supplier && item.supplier.toLowerCase().includes(keyword))
          )
        })
      }

      // 状态筛选
      if (this.filterStatus) {
        data = data.filter(item => {
          const status = this.getStockStatus(item)
          return status === this.filterStatus
        })
      }

      return data
    }
  },
  mounted() {
    this.loadConsumableData()
    this.loadChartJS().then(() => {
      this.$nextTick(() => {
        this.initCharts()
      })
    })
  },
  beforeDestroy() {
    // 销毁图表实例
    if (this.usageChart) {
      this.usageChart.destroy()
    }
    if (this.stockChart) {
      this.stockChart.destroy()
    }
  },
  methods: {
    // 加载Chart.js
    loadChartJS() {
      return new Promise((resolve, reject) => {
        // 如果Chart.js已经加载
        if (window.Chart) {
          resolve()
          return
        }

        // 动态加载Chart.js
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
        script.onload = () => {
          // 确保Chart.js完全加载
          setTimeout(() => {
            if (window.Chart) {
              resolve()
            } else {
              reject(new Error('Chart.js failed to load'))
            }
          }, 100)
        }
        script.onerror = reject
        document.head.appendChild(script)
      })
    },

    // 初始化图表
    initCharts() {
      if (!window.Chart) {
        console.error('Chart.js is not loaded')
        return
      }

      // 库存商品TOP10图表
      const usageCtx = this.$refs.usageChart ? this.$refs.usageChart.getContext('2d') : null
      if (usageCtx && !this.usageChart) {
        this.usageChart = new window.Chart(usageCtx, {
          type: 'bar',
          data: {
            labels: [],
            datasets: [{
              label: '库存数量',
              data: [],
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return '库存数量: ' + context.raw
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: '库存数量'
                }
              },
              x: {
                title: {
                  display: true,
                  text: '商品名称'
                }
              }
            }
          }
        })
      }

      // 库存状态分布图表
      const stockCtx = this.$refs.stockChart ? this.$refs.stockChart.getContext('2d') : null
      if (stockCtx && !this.stockChart) {
        this.stockChart = new window.Chart(stockCtx, {
          type: 'doughnut',
          data: {
            labels: ['库存充足', '库存预警', '缺货'],
            datasets: [{
              data: [0, 0, 0],
              backgroundColor: [
                'rgba(34, 197, 94, 0.7)',
                'rgba(251, 191, 36, 0.7)',
                'rgba(239, 68, 68, 0.7)'
              ],
              borderColor: [
                'rgb(34, 197, 94)',
                'rgb(251, 191, 36)',
                'rgb(239, 68, 68)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || ''
                    const value = context.raw || 0
                    const total = context.dataset.data.reduce(function(a, b) { return a + b }, 0)
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
                    return label + ': ' + value + ' (' + percentage + '%)'
                  }
                }
              }
            }
          }
        })
      }
    },

    // 更新图表数据
    updateCharts() {
      if (this.usageChart && this.consumableData && this.consumableData.length > 0) {
        // 更新使用TOP10图表
        const top10 = this.consumableData.slice() // 复制数组
          .sort(function(a, b) { return (b.onhand_stock || 0) - (a.onhand_stock || 0) })
          .slice(0, 10)

        this.usageChart.data.labels = top10.map(function(item) {
          if (item.goods_desc && item.goods_desc.length > 10) {
            return item.goods_desc.substring(0, 10) + '...'
          }
          return item.goods_desc || ''
        })

        this.usageChart.data.datasets[0].data = top10.map(function(item) {
          return item.onhand_stock || 0
        })

        this.usageChart.update()
      }

      if (this.stockChart) {
        // 更新库存状态分布
        const sufficient = this.consumableData.filter(function(item) {
          return this.getStockStatus(item) === '库存充足'
        }.bind(this)).length

        const warning = this.consumableData.filter(function(item) {
          return this.getStockStatus(item) === '库存预警'
        }.bind(this)).length

        const outOfStock = this.consumableData.filter(function(item) {
          return this.getStockStatus(item) === '缺货'
        }.bind(this)).length

        this.stockChart.data.datasets[0].data = [sufficient, warning, outOfStock]
        this.stockChart.update()
      }
    },

    // 加载耗材数据
    loadConsumableData() {
      this.loading = true
      var vm = this

      // 构建请求参数
      var params = {
        ordering: '-update_time'
      }

      // 如果有搜索关键词
      if (this.searchKeyword) {
        params.goods_desc__icontains = this.searchKeyword
      }

      // 分页参数
      params.page = this.pagination.page
      params.page_size = this.pagination.pageSize

      // 调用API
      stockApi.getStockList(params)
        .then(function(response) {
          // 处理API返回的数据
          if (response.results) {
            vm.consumableData = response.results
            vm.pagination.total = response.count
            vm.pagination.count = response.count
          } else {
            // 如果API返回的不是分页格式
            vm.consumableData = response
            vm.pagination.total = response.length
            vm.pagination.count = response.length
          }

          vm.calculateKPIs()
          vm.updateCharts()
        })
        .catch(function(error) {
          console.error('加载商品数据失败:', error)
          vm.$message.error('加载数据失败: ' + (error.message || '未知错误'))
          // 降级方案：加载模拟数据
          vm.loadMockData()
        })
        .finally(function() {
          vm.loading = false
        })
    },

    // 备用：模拟数据（API失败时使用）
    loadMockData() {
      this.consumableData = [
        {
          id: 4527,
          goods_code: 'C001333',
          goods_desc: '组合式玻璃钢电缆支架托臂',
          goods_specs: 'Z-350',
          onhand_stock: 113,
          can_order_stock: 113,
          inspect_stock: 0,
          damage_stock: 0,
          supplier: '-',
          update_time: '2025-12-09 14:39:50'
        },
        {
          id: 4526,
          goods_code: 'C001332',
          goods_desc: '组合式玻璃钢电缆支架',
          goods_specs: '700*50',
          onhand_stock: 24,
          can_order_stock: 24,
          inspect_stock: 0,
          damage_stock: 0,
          supplier: '-',
          update_time: '2025-12-09 14:39:50'
        }
      ]
      this.pagination.total = this.consumableData.length
      this.pagination.count = this.consumableData.length
      this.calculateKPIs()
      this.updateCharts()
    },

    // 计算KPI指标
    calculateKPIs() {
      this.totalInventory = this.consumableData.length

      // 库存预警：库存小于阈值但大于0
      this.warningItems = this.consumableData.filter(function(item) {
        var minStock = item.min_stock || this.minStockThreshold
        return item.onhand_stock > 0 && item.onhand_stock < minStock
      }.bind(this)).length

      // 缺货：库存为0
      this.outOfStockItems = this.consumableData.filter(function(item) {
        return item.onhand_stock === 0
      }).length

      // 库存总量
      this.totalStock = this.consumableData.reduce(function(sum, item) {
        return sum + (item.onhand_stock || 0)
      }, 0)
    },

    // 从规格中提取单位
    getUnitFromSpecs(specs) {
      if (!specs) return '个'

      // 根据常见规格判断单位
      if (specs.includes('mm2') || specs.includes('mm')) return '米'
      if (specs.includes('*') && !specs.includes('mm')) return '米'
      if (specs.includes('KV')) return '个'
      if (specs.includes('个')) return '个'
      if (specs.includes('台')) return '台'
      if (specs.includes('套')) return '套'
      if (specs.includes('包')) return '包'
      if (specs.includes('卷')) return '卷'

      return '个'
    },

    // 搜索和筛选
    handleSearch() {
      this.pagination.page = 1
      this.loadConsumableData()
    },

    handleFilter() {
      this.pagination.page = 1
      this.loadConsumableData()
    },

    // 分页处理
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.page = 1
      this.loadConsumableData()
    },

    handlePageChange(page) {
      this.pagination.page = page
      this.loadConsumableData()
    },

    // 操作按钮
    handleAdd() {
      this.dialogTitle = '新增商品'
      this.formData = {
        id: null,
        goods_code: '',
        goods_desc: '',
        goods_specs: '',
        goods_qty: 0,
        min_stock: 10,
        supplier: '',
        unit: '个',
        bar_code: '',
        remark: ''
      }
      this.dialogVisible = true
      this.$nextTick(function() {
        if (this.$refs.consumableForm) {
          this.$refs.consumableForm.clearValidate()
        }
      }.bind(this))
    },

    handleEdit(row) {
      this.dialogTitle = '编辑商品'
      this.formData = {
        id: row.id,
        goods_code: row.goods_code,
        goods_desc: row.goods_desc,
        goods_specs: row.goods_specs || '',
        goods_qty: row.onhand_stock,
        min_stock: row.min_stock || 10,
        supplier: row.supplier || '',
        unit: this.getUnitFromSpecs(row.goods_specs),
        bar_code: row.bar_code || '',
        remark: ''
      }
      this.dialogVisible = true
      this.$nextTick(function() {
        if (this.$refs.consumableForm) {
          this.$refs.consumableForm.clearValidate()
        }
      }.bind(this))
    },

    handleStockIn(row) {
      this.stockOperation = 'in'
      this.stockDialogTitle = '入库操作 - ' + row.goods_desc
      this.currentConsumable = row
      this.stockFormData = {
        quantity: 1,
        remark: ''
      }
      this.stockDialogVisible = true
      this.$nextTick(function() {
        if (this.$refs.stockForm) {
          this.$refs.stockForm.clearValidate()
        }
      }.bind(this))
    },

    handleStockOut(row) {
      this.stockOperation = 'out'
      this.stockDialogTitle = '出库操作 - ' + row.goods_desc
      this.currentConsumable = row
      this.stockFormData = {
        quantity: 1,
        remark: ''
      }
      this.stockDialogVisible = true
      this.$nextTick(function() {
        if (this.$refs.stockForm) {
          this.$refs.stockForm.clearValidate()
        }
      }.bind(this))
    },

    // 表单提交
    handleSubmit() {
      var vm = this
      this.$refs.consumableForm.validate(function(valid) {
        if (valid) {
          vm.formLoading = true

          var formData = Object.assign({}, vm.formData)

          // 移除id字段，因为API可能不需要
          var id = formData.id
          delete formData.id

          var promise

          if (id) {
            // 更新操作
            promise = stockApi.updateGoods(id, formData)
          } else {
            // 新增操作
            // 确保必填字段都有值
            var createData = {
              goods_code: formData.goods_code,
              goods_desc: formData.goods_desc,
              goods_specs: formData.goods_specs,
              goods_qty: formData.goods_qty,
              onhand_stock: formData.goods_qty,
              can_order_stock: formData.goods_qty,
              supplier: formData.supplier || '-',
              bar_code: formData.bar_code || ''
            }

            promise = stockApi.createGoods(createData)
          }

          promise
            .then(function() {
              vm.$message.success(id ? '更新成功' : '新增成功')
              vm.dialogVisible = false
              vm.refreshData()
            })
            .catch(function(error) {
              console.error('保存失败:', error)
              vm.$message.error('保存失败: ' + (error.message || '未知错误'))
            })
            .finally(function() {
              vm.formLoading = false
            })
        }
      })
    },

    // 库存操作提交
    handleStockSubmit() {
      var vm = this
      this.$refs.stockForm.validate(function(valid) {
        if (valid) {
          vm.stockFormLoading = true

          // 检查库存是否充足
          if (vm.stockOperation === 'out') {
            if (vm.currentConsumable.onhand_stock < vm.stockFormData.quantity) {
              vm.$message.error('库存不足，无法出库')
              vm.stockFormLoading = false
              return
            }
          }

          var operationData = {
            goods_id: vm.currentConsumable.id,
            quantity: vm.stockFormData.quantity,
            remark: vm.stockFormData.remark || '',
            operation_type: vm.stockOperation
          }

          var promise = vm.stockOperation === 'in'
            ? stockApi.stockIn(operationData)
            : stockApi.stockOut(operationData)

          promise
            .then(function() {
              vm.$message.success(vm.stockOperation === 'in' ? '入库成功' : '出库成功')
              vm.stockDialogVisible = false
              vm.refreshData()
            })
            .catch(function(error) {
              console.error('库存操作失败:', error)
              vm.$message.error('操作失败: ' + (error.message || '未知错误'))
            })
            .finally(function() {
              vm.stockFormLoading = false
            })
        }
      })
    },

    // 对话框关闭
    handleDialogClose() {
      this.dialogVisible = false
      this.$nextTick(function() {
        if (this.$refs.consumableForm) {
          this.$refs.consumableForm.clearValidate()
        }
      }.bind(this))
    },

    handleStockDialogClose() {
      this.stockDialogVisible = false
      this.$nextTick(function() {
        if (this.$refs.stockForm) {
          this.$refs.stockForm.clearValidate()
        }
      }.bind(this))
    },

    // 导出数据
    handleExport() {
      try {
        // 创建CSV内容
        var headers = ['商品代码', '商品名称', '型号规格', '当前库存', '供应商', '最后更新']
        var rows = this.consumableData.map(function(item) {
          return [
            item.goods_code,
            item.goods_desc,
            item.goods_specs || '',
            item.onhand_stock,
            item.supplier || '-',
            item.update_time
          ]
        })

        var csvContent = [
          headers.join(','),
          rows.map(function(row) {
            return row.map(function(cell) {
              return '"' + String(cell).replace(/"/g, '""') + '"'
            }).join(',')
          }).join('\n')
        ].join('\n')

        // 创建下载链接
        var blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        var link = document.createElement('a')
        var url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', '库存数据_' + new Date().toLocaleDateString() + '.csv')
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        this.$message.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败')
      }
    },

    // 刷新数据
    refreshData() {
      this.loadConsumableData()
    },

    // 工具方法
    getStockClass(item) {
      var minStock = item.min_stock || this.minStockThreshold
      if (item.onhand_stock === 0) {
        return 'stock-out'
      } else if (item.onhand_stock < minStock) {
        return 'stock-warning'
      } else {
        return 'stock-normal'
      }
    },

    getStockStatus(item) {
      var minStock = item.min_stock || this.minStockThreshold
      if (item.onhand_stock === 0) {
        return '缺货'
      } else if (item.onhand_stock < minStock) {
        return '库存预警'
      } else {
        return '库存充足'
      }
    },

    getStockStatusType(item) {
      var status = this.getStockStatus(item)
      var typeMap = {
        '缺货': 'danger',
        '库存预警': 'warning',
        '库存充足': 'success'
      }
      return typeMap[status] || 'info'
    }
  }
}
</script>

<style scoped>
.consumable-management {
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

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  gap: 15px;
  align-items: center;
}

.action-group {
  display: flex;
  gap: 10px;
}

.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.kpi-card {
  border-radius: 12px;
  border: none;
  transition: transform 0.3s;
}

.kpi-card:hover {
  transform: translateY(-5px);
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

.kpi-icon.inventory {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.kpi-icon.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.kpi-icon.out-of-stock {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.kpi-icon.total {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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
}

.main-card {
  border-radius: 12px;
  margin-bottom: 20px;
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

.stock-normal {
  color: #67c23a;
  font-weight: 600;
}

.stock-warning {
  color: #e6a23c;
  font-weight: 600;
}

.stock-out {
  color: #f56c6c;
  font-weight: 600;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
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
  margin-top: 20px;
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

@media (max-width: 768px) {
  .operation-bar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .action-group {
    justify-content: center;
  }

  .kpi-cards {
    grid-template-columns: 1fr;
  }

  .chart-section .el-col {
    margin-bottom: 20px;
  }
}
</style>
