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
          placeholder="搜索耗材名称、型号..."
          prefix-icon="el-icon-search"
          style="width: 300px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="filterCategory" placeholder="耗材分类" clearable @change="handleFilter">
          <el-option label="电子元件" value="electronic" />
          <el-option label="管道配件" value="pipe" />
          <el-option label="电气设备" value="electrical" />
          <el-option label="工具器材" value="tool" />
          <el-option label="办公用品" value="office" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="库存状态" clearable @change="handleFilter">
          <el-option label="库存充足" value="sufficient" />
          <el-option label="库存预警" value="warning" />
          <el-option label="库存不足" value="insufficient" />
          <el-option label="缺货" value="outOfStock" />
        </el-select>
      </div>
      <div class="action-group">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">
          新增耗材
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
          <div class="kpi-icon cost">
            <i class="el-icon-money" />
          </div>
          <div class="kpi-info">
            <div class="kpi-value">¥ {{ totalValue }}</div>
            <div class="kpi-label">库存总价值</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 耗材列表 -->
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>耗材库存列表</span>
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
      >
        <el-table-column prop="id" label="耗材ID" width="100" fixed="left" />
        <el-table-column prop="name" label="耗材名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="model" label="型号规格" width="150" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120">
          <template slot-scope="scope">
            <el-tag :type="getCategoryTagType(scope.row.category)" size="small">
              {{ scope.row.category }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentStock" label="当前库存" width="110" align="center">
          <template slot-scope="scope">
            <span :class="getStockClass(scope.row)">
              {{ scope.row.currentStock }} {{ scope.row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="最低库存" width="110" align="center">
          <template slot-scope="scope">
            {{ scope.row.minStock }} {{ scope.row.unit }}
          </template>
        </el-table-column>
        <el-table-column label="库存状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStockStatusType(scope.row)" size="small">
              {{ getStockStatus(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="单价" width="100" align="right">
          <template slot-scope="scope">
            ¥ {{ scope.row.unitPrice }}
          </template>
        </el-table-column>
        <el-table-column label="库存价值" width="120" align="right">
          <template slot-scope="scope">
            ¥ {{ (scope.row.currentStock * scope.row.unitPrice).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" width="150" show-overflow-tooltip />
        <el-table-column prop="supplier" label="供应商" width="150" show-overflow-tooltip />
        <el-table-column prop="lastUpdate" label="最后更新" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button size="mini" type="success" @click="handleStockIn(scope.row)">
              入库
            </el-button>
            <el-button size="mini" type="warning" @click="handleStockOut(scope.row)">
              出库
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="filteredData.length === 0 && !loading" class="empty-state">
        <i class="el-icon-box" />
        <p>暂无耗材数据</p>
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">
          添加第一个耗材
        </el-button>
      </div>
    </el-card>

    <!-- 耗材使用统计 -->
    <div class="chart-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>耗材使用TOP10</span>
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

    <!-- 耗材操作对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form ref="consumableForm" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="耗材名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入耗材名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号规格" prop="model">
              <el-input v-model="formData.model" placeholder="请输入型号规格" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
                <el-option label="电子元件" value="电子元件" />
                <el-option label="管道配件" value="管道配件" />
                <el-option label="电气设备" value="电气设备" />
                <el-option label="工具器材" value="工具器材" />
                <el-option label="办公用品" value="办公用品" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="formData.unit" placeholder="如：个、米、卷" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="当前库存" prop="currentStock">
              <el-input-number
                v-model="formData.currentStock"
                :min="0"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低库存" prop="minStock">
              <el-input-number
                v-model="formData.minStock"
                :min="0"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单价" prop="unitPrice">
              <el-input-number
                v-model="formData.unitPrice"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier">
              <el-input v-model="formData.supplier" placeholder="请输入供应商" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="存放位置" prop="location">
          <el-input v-model="formData.location" placeholder="请输入存放位置" />
        </el-form-item>
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
    >
      <el-form ref="stockForm" :model="stockFormData" :rules="stockFormRules" label-width="80px">
        <el-form-item :label="stockOperation === 'in' ? '入库数量' : '出库数量'" prop="quantity">
          <el-input-number
            v-model="stockFormData.quantity"
            :min="1"
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
        <el-button type="primary" @click="handleStockSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>

export default {
  name: 'ConsumableManagement',
  data() {
    return {
      // 筛选条件
      searchKeyword: '',
      filterCategory: '',
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
      totalValue: 0,

      // 对话框控制
      dialogVisible: false,
      stockDialogVisible: false,
      dialogTitle: '新增耗材',
      stockDialogTitle: '入库操作',
      formLoading: false,

      // 表单数据
      formData: {
        id: '',
        name: '',
        model: '',
        category: '',
        unit: '个',
        currentStock: 0,
        minStock: 0,
        unitPrice: 0,
        supplier: '',
        location: '',
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
        name: [
          { required: true, message: '请输入耗材名称', trigger: 'blur' }
        ],
        model: [
          { required: true, message: '请输入型号规格', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '请选择分类', trigger: 'change' }
        ],
        unit: [
          { required: true, message: '请输入单位', trigger: 'blur' }
        ],
        currentStock: [
          { required: true, message: '请输入当前库存', trigger: 'blur' }
        ],
        minStock: [
          { required: true, message: '请输入最低库存', trigger: 'blur' }
        ]
      },

      stockFormRules: {
        quantity: [
          { required: true, message: '请输入数量', trigger: 'blur' },
          { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' }
        ]
      },

      // 图表实例
      charts: {}
    }
  },
  computed: {
    filteredData() {
      let data = this.consumableData

      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        data = data.filter(item =>
          item.name.toLowerCase().includes(keyword) ||
          item.model.toLowerCase().includes(keyword) ||
          (item.supplier && item.supplier.toLowerCase().includes(keyword))
        )
      }

      // 分类筛选
      if (this.filterCategory) {
        data = data.filter(item => item.category === this.filterCategory)
      }

      // 状态筛选
      if (this.filterStatus) {
        data = data.filter(item => this.getStockStatus(item) === this.filterStatus)
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
  methods: {
    // 加载耗材数据
    async loadConsumableData() {
      this.loading = true
      try {
        // 这里替换为实际的API调用
        // const response = await axios.get('/api/consumables')
        // this.consumableData = response.data

        // 模拟数据
        this.consumableData = this.getMockData()
        this.calculateKPIs()
      } catch (error) {
        console.error('加载耗材数据失败:', error)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },

    // 模拟数据
    getMockData() {
      return [
        {
          id: 'C001',
          name: '电源适配器',
          model: '12V 2A',
          category: '电子元件',
          unit: '个',
          currentStock: 45,
          minStock: 10,
          unitPrice: 25.5,
          supplier: '深圳电子',
          location: 'A区-1排-3层',
          lastUpdate: '2024-01-15 10:30:00'
        },
        {
          id: 'C002',
          name: '控制面板',
          model: 'CP-2000',
          category: '电气设备',
          unit: '个',
          currentStock: 8,
          minStock: 5,
          unitPrice: 120.0,
          supplier: '北京控制',
          location: 'B区-2排-1层',
          lastUpdate: '2024-01-14 16:20:00'
        },
        {
          id: 'C003',
          name: '风机金属波纹管',
          model: 'DN100',
          category: '管道配件',
          unit: '米',
          currentStock: 25,
          minStock: 15,
          unitPrice: 8.5,
          supplier: '上海管道',
          location: 'C区-3排-2层',
          lastUpdate: '2024-01-13 09:15:00'
        },
        {
          id: 'C004',
          name: '保险管',
          model: '5A 250V',
          category: '电子元件',
          unit: '个',
          currentStock: 2,
          minStock: 20,
          unitPrice: 1.5,
          supplier: '广州电气',
          location: 'A区-1排-1层',
          lastUpdate: '2024-01-12 14:45:00'
        },
        {
          id: 'C005',
          name: '扎带',
          model: '3x100mm',
          category: '工具器材',
          unit: '包',
          currentStock: 15,
          minStock: 10,
          unitPrice: 5.0,
          supplier: '东莞工具',
          location: 'B区-1排-2层',
          lastUpdate: '2024-01-15 11:20:00'
        }
      ]
    },

    // 计算KPI指标
    calculateKPIs() {
      this.totalInventory = this.consumableData.length
      this.warningItems = this.consumableData.filter(item =>
        item.currentStock < item.minStock && item.currentStock > 0
      ).length
      this.outOfStockItems = this.consumableData.filter(item =>
        item.currentStock === 0
      ).length
      this.totalValue = this.consumableData.reduce((sum, item) =>
        sum + (item.currentStock * item.unitPrice), 0
      ).toFixed(2)
    },

    // 搜索和筛选
    handleSearch() {
      // 搜索逻辑已在computed中实现
    },

    handleFilter() {
      // 筛选逻辑已在computed中实现
    },

    // 操作按钮
    handleAdd() {
      this.dialogTitle = '新增耗材'
      this.formData = {
        id: '',
        name: '',
        model: '',
        category: '',
        unit: '个',
        currentStock: 0,
        minStock: 0,
        unitPrice: 0,
        supplier: '',
        location: '',
        remark: ''
      }
      this.dialogVisible = true
    },

    handleEdit(row) {
      this.dialogTitle = '编辑耗材'
      this.formData = { ...row }
      this.dialogVisible = true
    },

    handleStockIn(row) {
      this.stockOperation = 'in'
      this.stockDialogTitle = '入库操作 - ' + row.name
      this.currentConsumable = row
      this.stockFormData = {
        quantity: 1,
        remark: ''
      }
      this.stockDialogVisible = true
    },

    handleStockOut(row) {
      this.stockOperation = 'out'
      this.stockDialogTitle = '出库操作 - ' + row.name
      this.currentConsumable = row
      this.stockFormData = {
        quantity: 1,
        remark: ''
      }
      this.stockDialogVisible = true
    },

    // 表单提交
    handleSubmit() {
      this.$refs.consumableForm.validate((valid) => {
        if (valid) {
          this.formLoading = true
          // 模拟API调用
          setTimeout(() => {
            if (this.formData.id) {
              // 更新操作
              const index = this.consumableData.findIndex(item => item.id === this.formData.id)
              if (index !== -1) {
                this.consumableData.splice(index, 1, {
                  ...this.formData,
                  lastUpdate: new Date().toLocaleString()
                })
              }
            } else {
              // 新增操作
              const newItem = {
                ...this.formData,
                id: 'C' + String(this.consumableData.length + 1).padStart(3, '0'),
                lastUpdate: new Date().toLocaleString()
              }
              this.consumableData.unshift(newItem)
            }

            this.formLoading = false
            this.dialogVisible = false
            this.calculateKPIs()
            this.updateCharts()
            this.$message.success(this.formData.id ? '更新成功' : '新增成功')
          }, 1000)
        }
      })
    },

    handleStockSubmit() {
      this.$refs.stockForm.validate((valid) => {
        if (valid) {
          const index = this.consumableData.findIndex(item => item.id === this.currentConsumable.id)
          if (index !== -1) {
            if (this.stockOperation === 'in') {
              // 入库
              this.consumableData[index].currentStock += this.stockFormData.quantity
            } else {
              // 出库
              if (this.consumableData[index].currentStock < this.stockFormData.quantity) {
                this.$message.error('库存不足')
                return
              }
              this.consumableData[index].currentStock -= this.stockFormData.quantity
            }

            this.consumableData[index].lastUpdate = new Date().toLocaleString()
            this.stockDialogVisible = false
            this.calculateKPIs()
            this.updateCharts()
            this.$message.success(`${this.stockOperation === 'in' ? '入库' : '出库'}成功`)
          }
        }
      })
    },

    // 对话框关闭
    handleDialogClose() {
      this.dialogVisible = false
      this.$refs.consumableForm.clearValidate()
    },

    // 导出数据
    handleExport() {
      // 实现导出逻辑
      this.$message.info('导出功能开发中...')
    },

    // 刷新数据
    refreshData() {
      this.loadConsumableData()
    },

    // 工具方法
    getCategoryTagType(category) {
      const typeMap = {
        '电子元件': 'primary',
        '管道配件': 'success',
        '电气设备': 'warning',
        '工具器材': 'info',
        '办公用品': 'danger'
      }
      return typeMap[category] || 'info'
    },

    getStockClass(item) {
      if (item.currentStock === 0) {
        return 'stock-out'
      } else if (item.currentStock < item.minStock) {
        return 'stock-warning'
      } else {
        return 'stock-normal'
      }
    },

    getStockStatus(item) {
      if (item.currentStock === 0) {
        return '缺货'
      } else if (item.currentStock < item.minStock) {
        return '库存预警'
      } else if (item.currentStock < item.minStock * 2) {
        return '库存充足'
      } else {
        return '库存充足'
      }
    },

    getStockStatusType(item) {
      const status = this.getStockStatus(item)
      const typeMap = {
        '缺货': 'danger',
        '库存预警': 'warning',
        '库存充足': 'success'
      }
      return typeMap[status] || 'info'
    },

    // 图表相关方法
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

    initCharts() {
      if (!window.Chart) return

      // 耗材使用TOP10图表
      const usageCtx = this.$refs.usageChart.getContext('2d')
      this.charts.usageChart = new window.Chart(usageCtx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: '使用数量',
            data: [],
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

      // 库存状态分布图表
      const stockCtx = this.$refs.stockChart.getContext('2d')
      this.charts.stockChart = new window.Chart(stockCtx, {
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
          maintainAspectRatio: false
        }
      })

      this.updateCharts()
    },

    updateCharts() {
      if (this.charts.usageChart) {
        // 更新使用TOP10图表（这里使用模拟数据）
        const top10 = [...this.consumableData]
          .sort((a, b) => (b.minStock - b.currentStock) - (a.minStock - a.currentStock))
          .slice(0, 10)

        this.charts.usageChart.data.labels = top10.map(item => item.name)
        this.charts.usageChart.data.datasets[0].data = top10.map(item =>
          Math.max(0, item.minStock - item.currentStock)
        )
        this.charts.usageChart.update()
      }

      if (this.charts.stockChart) {
        // 更新库存状态分布
        const sufficient = this.consumableData.filter(item =>
          this.getStockStatus(item) === '库存充足'
        ).length
        const warning = this.consumableData.filter(item =>
          this.getStockStatus(item) === '库存预警'
        ).length
        const outOfStock = this.consumableData.filter(item =>
          this.getStockStatus(item) === '缺货'
        ).length

        this.charts.stockChart.data.datasets[0].data = [sufficient, warning, outOfStock]
        this.charts.stockChart.update()
      }
    },

    getToken() {
      return localStorage.getItem('token') || ''
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

.kpi-icon.cost {
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
