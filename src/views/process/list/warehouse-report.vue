<template>
  <div class="warehouse-report-container">
    <div class="header">
      <h1><i class="fas fa-boxes" /> 仓管系统报告</h1>
      <p class="subtitle">库存管理 · 报表生成 · 数据分析</p>
    </div>

    <div class="filter-section">
      <el-card shadow="hover" class="filter-card">
        <div slot="header" class="card-header">
          <span><i class="fas fa-filter" /> 报表配置</span>
        </div>

        <el-form ref="reportForm" :model="formData" :rules="formRules" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="选择仓库" prop="warehouse">
                <el-select v-model="formData.warehouse" placeholder="请选择仓库" style="width: 100%" :loading="warehouseLoading">
                  <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouse_name" :value="item.warehouse_name" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="10">
              <el-form-item label="日期范围" prop="dateRange">
                <el-date-picker
                  v-model="formData.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="yyyy-MM-dd"
                  format="yyyy-MM-dd"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="报表类型" prop="reportType">
                <el-select v-model="formData.reportType" placeholder="请选择报表类型" style="width: 100%">
                  <el-option label="完整报表" value="full" />
                  <el-option label="仅材料信息" value="materials" />
                  <el-option label="仅出入库统计" value="statistics" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-collapse v-model="exportOptionsVisible">
            <el-collapse-item title="自定义导出配置" name="1">
              <el-checkbox-group v-model="formData.exportOptionsList">
                <el-checkbox label="include_stock">包含库存信息</el-checkbox>
                <el-checkbox label="include_price">包含价格信息</el-checkbox>
                <el-checkbox label="include_details">包含详细信息</el-checkbox>
                <el-checkbox label="include_qrcode">包含二维码</el-checkbox>
                <el-checkbox label="include_serialized_items">包含序列号项目</el-checkbox>
                <el-checkbox label="include_flow_history">包含流转历史</el-checkbox>
              </el-checkbox-group>
            </el-collapse-item>
          </el-collapse>

          <div class="action-buttons">
            <el-button type="primary" icon="el-icon-document-add" :loading="generating" @click="handleGenerateReport">
              生成报表
            </el-button>
            <el-button type="success" icon="el-icon-download" :disabled="!downloadUrl" @click="handleDownloadReport">
              下载报表
            </el-button>
          </div>
        </el-form>
      </el-card>
    </div>

    <div v-if="showStats" class="stats-section">
      <el-card shadow="hover" class="stats-card">
        <div slot="header" class="card-header">
          <span><i class="fas fa-chart-bar" /> 统计数据概览</span>
        </div>

        <el-row :gutter="20">
          <el-col v-for="(stat, index) in statsData" :key="index" :span="4">
            <div
              class="stat-card clickable-stat"
              :style="{ borderTop: `3px solid ${stat.color}` }"
              :class="{ 'clickable': stat.clickable }"
              @click="handleStatClick(stat)"
            >
              <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
                <i :class="stat.icon" />
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
              <div v-if="stat.clickable" class="stat-hint">
                <i class="fas fa-search-plus" />
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 材料总数弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="90%"
      top="5vh"
      :before-close="handleDialogClose"
      custom-class="data-dialog"
    >
      <div class="dialog-toolbar">
        <div class="toolbar-left">
          <span class="selected-info">
            <i class="fas fa-table" style="color: #217346; margin-right: 5px;" />
            {{ dialogTitle }} - 完整数据（来自Excel原始文件）
          </span>
        </div>
        <div class="toolbar-right">
          <el-button
            type="success"
            size="small"
            icon="el-icon-download"
            :disabled="!downloadUrl"
            @click="handleDownloadReport"
          >
            下载完整Excel文件
          </el-button>
        </div>
      </div>

      <!-- 使用v-html直接渲染Excel HTML表格 - 与下方预览区域一致 -->
      <div v-loading="tableLoading" class="dialog-excel-container">
        <div
          v-if="dialogExcelHtml"
          class="dialog-excel-table"
          v-html="dialogExcelHtml"
        />
        <div v-else-if="!tableLoading" class="no-data-in-dialog">
          <i class="fas fa-exclamation-circle" />
          <p>暂无数据</p>
          <p class="tip">请确保已成功生成报表并等待Excel数据加载完成</p>
        </div>
      </div>
    </el-dialog>

    <!-- Excel在线预览区域 - 直接显示原始Excel内容 -->
    <div v-if="excelHtmlData && excelHtmlData.length > 0" class="excel-preview-section">
      <el-card shadow="hover" class="preview-card">
        <div slot="header" class="card-header preview-header">
          <span>
            <i class="fas fa-file-excel" style="color: #217346;" />
            Excel报表在线预览
            <el-tag size="mini" type="success" style="margin-left: 10px;">
              {{ excelHtmlData.length }} 个工作表
            </el-tag>
            <el-tag size="mini" type="info" style="margin-left: 5px;">
              点击下方工作表标签切换查看
            </el-tag>
          </span>
          <div class="preview-actions">
            <el-button size="small" icon="el-icon-download" type="primary" :disabled="!downloadUrl" @click="handleDownloadReport">
              下载Excel文件
            </el-button>
            <el-button size="small" icon="el-icon-refresh" :loading="excelLoading" @click="refreshExcelPreview">
              刷新
            </el-button>
            <el-button size="small" type="text" @click="togglePreviewCollapse">
              {{ previewCollapsed ? '展开' : '折叠' }}
              <i :class="previewCollapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'" />
            </el-button>
          </div>
        </div>

        <div v-show="!previewCollapsed" class="excel-viewer-container">
          <!-- 工作表标签栏 -->
          <div class="sheet-tabs">
            <div
              v-for="(sheet, index) in excelHtmlData"
              :key="index"
              class="sheet-tab"
              :class="{ active: currentSheetIndex === index }"
              @click="switchSheet(index)"
            >
              <i class="fas fa-table" />
              {{ sheet.name }}
              <span class="sheet-tab-count">{{ sheet.rowCount }}行</span>
            </div>
          </div>

          <!-- Excel内容显示区域 -->
          <div class="excel-content-wrapper">
            <div
              v-if="excelHtmlData[currentSheetIndex]"
              class="excel-table-container"
              v-html="excelHtmlData[currentSheetIndex].html"
            />
            <div v-else class="no-data">
              <i class="fas fa-exclamation-circle" />
              暂无数据
            </div>
          </div>

          <!-- 底部工具栏 -->
          <div class="preview-footer">
            <span class="footer-info">
              当前工作表: <b>{{ excelHtmlData[currentSheetIndex] ? excelHtmlData[currentSheetIndex].name : '' }}</b> |
              共 <b>{{ excelHtmlData[currentSheetIndex] ? excelHtmlData[currentSheetIndex].rowCount : 0 }}</b> 行数据 |
              数据来源: <b style="color: #67C23A;">WMS系统实时导出</b>
            </span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import XLSX from 'xlsx'

const BASE_URL = 'https://wms.cdqrmi.com'
const TOKEN = '21d0a483f135421349481400ce9588b7'

export default {
  name: 'WarehouseReport',
  data() {
    return {
      formData: {
        warehouse: '',
        dateRange: [],
        reportType: 'full',
        exportOptionsList: ['include_stock', 'include_price', 'include_details', 'include_qrcode', 'include_serialized_items', 'include_flow_history']
      },
      formRules: {
        warehouse: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        dateRange: [{ required: true, message: '请选择日期范围', trigger: 'change' }],
        reportType: [{ required: true, message: '请选择报表类型', trigger: 'change' }]
      },
      warehouseList: [],
      warehouseLoading: false,
      generating: false,
      showStats: false,
      downloadUrl: '',
      reportData: null, // 缓存报表接口返回的完整数据
      excelData: null, // 存储解析后的Excel真实数据
      excelLoading: false, // Excel解析加载状态
      statsData: [
        { label: '材料总数', value: 0, icon: 'fas fa-cubes', color: '#409EFF', clickable: true, key: 'material' },
        { label: '入库次数', value: 0, icon: 'fas fa-arrow-down', color: '#67C23A', clickable: true, key: 'inCount' },
        { label: '出库次数', value: 0, icon: 'fas fa-arrow-up', color: '#E6A23C', clickable: true, key: 'outCount' },
        { label: '总入库数量', value: 0, icon: 'fas fa-sign-in-alt', color: '#F56C6C', clickable: true, key: 'inQty' },
        { label: '总出库数量', value: 0, icon: 'fas fa-sign-out-alt', color: '#909399', clickable: true, key: 'outQty' }
      ],
      exportOptionsVisible: ['1'],

      // 弹窗相关
      dialogVisible: false,
      dialogTitle: '',
      currentDialogType: '',
      dialogExcelHtml: '', // 弹窗中显示的Excel HTML内容
      tableData: [],
      filteredData: [],
      tableLoading: false,
      selectedRows: [],
      searchText: '',
      currentPage: 1,
      pageSize: 10,

      // Excel在线预览相关
      previewCollapsed: false,
      excelHtmlData: [], // 存储转换后的HTML数据
      currentSheetIndex: 0, // 当前显示的工作表索引

      // 列定义
      columnDefinitions: {
        material: [
          { prop: 'goods_code', label: '商品编码', width: 120 },
          { prop: 'goods_desc', label: '商品描述', minWidth: 150 },
          { prop: 'brand', label: '品牌', width: 100 },
          { prop: 'goods_spec', label: '商品规格', width: 120 },
          { prop: 'unit', label: '计量单位', width: 90 },
          { prop: 'supplier', label: '厂商/供应商', width: 130 },
          { prop: 'stock_qty', label: '库存数量', width: 100 },
          { prop: 'available_qty', label: '可用库存', width: 100 },
          { prop: 'damaged_qty', label: '损坏数量', width: 100 },
          { prop: 'qrcode', label: '二维码', width: 120 }
        ],
        inCount: [
          { prop: 'goods_code', label: '商品编码', width: 120 },
          { prop: 'goods_desc', label: '商品描述', minWidth: 150 },
          { prop: 'goods_spec', label: '商品规格', width: 120 },
          { prop: 'operation_type', label: '操作类型', width: 100 },
          { prop: 'quantity', label: '数量', width: 80 },
          { prop: 'operator', label: '操作人', width: 100 },
          { prop: 'receiver', label: '领取人', width: 100 },
          { prop: 'purpose', label: '用途', minWidth: 120 },
          { prop: 'project', label: '所用项目', width: 120 },
          { prop: 'address', label: '地址', minWidth: 150 },
          { prop: 'operation_time', label: '操作时间', width: 160 },
          { prop: 'remark', label: '备注', minWidth: 150 }
        ],
        outCount: [
          { prop: 'goods_code', label: '商品编码', width: 120 },
          { prop: 'goods_desc', label: '商品描述', minWidth: 150 },
          { prop: 'goods_spec', label: '商品规格', width: 120 },
          { prop: 'operation_type', label: '操作类型', width: 100 },
          { prop: 'quantity', label: '数量', width: 80 },
          { prop: 'operator', label: '操作人', width: 100 },
          { prop: 'receiver', label: '领取人', width: 100 },
          { prop: 'purpose', label: '用途', minWidth: 120 },
          { prop: 'project', label: '所用项目', width: 120 },
          { prop: 'address', label: '地址', minWidth: 150 },
          { prop: 'operation_time', label: '操作时间', width: 160 },
          { prop: 'remark', label: '备注', minWidth: 150 }
        ],
        inQty: [
          { prop: 'seq', label: '序号', width: 70 },
          { prop: 'goods_code', label: '商品编码', width: 120 },
          { prop: 'goods_desc', label: '商品描述', minWidth: 150 },
          { prop: 'quantity', label: '数量', width: 80 },
          { prop: 'batch_no', label: '批次号', width: 120 },
          { prop: 'in_time', label: '入库时间', width: 160 }
        ],
        outQty: [
          { prop: 'seq', label: '序号', width: 70 },
          { prop: 'goods_code', label: '商品编码', width: 120 },
          { prop: 'goods_desc', label: '商品描述', minWidth: 150 },
          { prop: 'quantity', label: '数量', width: 80 },
          { prop: 'batch_no', label: '批次号', width: 120 },
          { prop: 'out_time', label: '出库时间', width: 160 }
        ]
      }
    }
  },
  computed: {
    currentColumns() {
      if (this.tableData && this.tableData.length > 0) {
        const firstRow = this.tableData[0]
        const columns = Object.keys(firstRow).map(key => ({
          prop: key,
          label: key,
          minWidth: this.getColumnWidth(key)
        }))
        console.log('🔧 动态生成列定义（基于实际数据）:', columns.map(c => c.label))
        return columns
      }

      console.log('⚠️ 使用预设列定义（tableData为空）')
      return this.columnDefinitions[this.currentDialogType] || []
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredData.slice(start, end)
    }
  },
  mounted() {
    this.initDateRange()
    this.fetchWarehouseList()
  },
  methods: {
    initDateRange() {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      this.formData.dateRange = [this.formatDate(startDate), this.formatDate(endDate)]
    },

    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    async fetchWarehouseList() {
      this.warehouseLoading = true
      try {
        const response = await axios({
          url: `${BASE_URL}/warehouse/multiple/`,
          method: 'get',
          headers: { TOKEN }
        })

        if (response.data && response.data.results) {
          this.warehouseList = response.data.results
        }
      } catch (error) {
        console.error('获取仓库列表失败:', error)
        this.$message.error('网络请求失败，无法加载仓库列表')
      } finally {
        this.warehouseLoading = false
      }
    },

    handleGenerateReport() {
      this.$refs.reportForm.validate((valid) => {
        if (valid) {
          this.generateReport()
        } else {
          return false
        }
      })
    },

    async generateReport() {
      this.generating = true
      try {
        const exportOptions = {}
        this.formData.exportOptionsList.forEach(option => {
          exportOptions[option] = true
        })

        const requestData = {
          warehouse: this.formData.warehouse,
          start_date: this.formData.dateRange[0],
          end_date: this.formData.dateRange[1],
          report_type: this.formData.reportType,
          export_options: exportOptions
        }

        const response = await axios({
          url: `${BASE_URL}/stock/generate-report/`,
          method: 'post',
          data: requestData,
          headers: {
            'Content-Type': 'application/json',
            TOKEN
          }
        })

        if (response.data) {
          const data = response.data
          this.reportData = { ...data } // 缓存完整报表数据
          this.statsData[0].value = data.material_count || 0
          this.statsData[1].value = data.in_count || 0
          this.statsData[2].value = data.out_count || 0
          this.statsData[3].value = data.total_in_qty || 0
          this.statsData[4].value = data.total_out_qty || 0
          this.downloadUrl = data.download_url || ''
          this.showStats = true
          console.log('报表数据已缓存：', this.reportData)

          // 自动下载并解析Excel文件以获取真实详细数据
          if (this.downloadUrl) {
            await this.downloadAndParseExcel()
          }

          this.$message.success('报表生成成功！')
        }
      } catch (error) {
        if (error.response && error.response.data) {
          this.$message.error(error.response.data.message || error.response.data.detail || '生成报表失败')
        } else {
          this.$message.error('网络请求失败')
        }
      } finally {
        this.generating = false
      }
    },

    // 下载并转换Excel为HTML，直接在页面显示（类似打开真实Excel）
    async downloadAndParseExcel() {
      this.excelLoading = true
      console.log('🚀 开始下载Excel文件并转换为在线预览格式...')
      console.log('📥 Download URL:', `${BASE_URL}${this.downloadUrl}`)

      try {
        const fullUrl = `${BASE_URL}${this.downloadUrl}`
        console.log('📍 步骤1/3: 正在下载Excel文件...')
        console.log('   完整URL:', fullUrl)
        console.log('   TOKEN:', TOKEN.substring(0, 10) + '...')

        const response = await axios({
          url: fullUrl,
          method: 'get',
          headers: { TOKEN },
          responseType: 'arraybuffer',
          timeout: 30000
        })

        console.log('✅ 步骤1/3完成: Excel文件下载成功')
        console.log('   文件大小:', response.data.byteLength, '字节')
        console.log('   HTTP状态码:', response.status)

        if (response.data.byteLength === 0) {
          throw new Error('下载的文件为空（0字节）')
        }

        console.log('📍 步骤2/3: 正在解析Excel文件...')

        const workbook = XLSX.read(response.data, {
          type: 'array',
          cellDates: true,
          cellStyles: true
        })

        console.log('✅ 步骤2/3完成: Excel解析成功')
        console.log('   工作表数量:', workbook.SheetNames.length)
        console.log('   工作表名称列表:', workbook.SheetNames)

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Excel文件中没有找到任何工作表')
        }

        console.log('📍 步骤3/3: 正在转换为HTML格式用于在线预览...')

        const htmlSheets = []

        workbook.SheetNames.forEach((sheetName, index) => {
          try {
            const worksheet = workbook.Sheets[sheetName]

            console.log(`   📊 转换工作表[${index + 1}/${workbook.SheetNames.length}]: "${sheetName}"`)

            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            const rowCount = jsonData ? jsonData.length : 0

            console.log(`      行数: ${rowCount}`)

            const html = XLSX.utils.sheet_to_html(worksheet, {
              id: `excel-sheet-${index}`,
              editable: false
            })

            htmlSheets.push({
              name: sheetName,
              html: html,
              rowCount: rowCount - (rowCount > 0 ? 1 : 0),
              data: jsonData
            })

            console.log(`      ✅ HTML转换成功: ${rowCount} 行`)
          } catch (sheetError) {
            console.error(`      ❌ 转换工作表"${sheetName}"失败:`, sheetError)
          }
        })

        console.log('✅ 步骤3/3完成: 所有工作表HTML转换完毕')
        console.log('   成功转换的工作表数:', htmlSheets.length)

        this.excelHtmlData = htmlSheets
        this.currentSheetIndex = 0
        this.previewCollapsed = false

        this.excelData = {}
        htmlSheets.forEach(sheet => {
          if (sheet.data && sheet.data.length > 1) {
            const headers = sheet.data[0]
            const rows = sheet.data.slice(1).map(row => {
              const obj = {}
              headers.forEach((header, idx) => {
                obj[header] = row[idx] !== undefined ? row[idx] : ''
              })
              return obj
            })
            this.excelData[sheet.name] = {
              headers,
              data: rows,
              totalCount: rows.length
            }
          }
        })

        console.log('🎉 Excel在线预览数据准备完成:')
        console.table(htmlSheets.map(sheet => ({
          '工作表名称': sheet.name,
          '总行数': sheet.rowCount,
          '状态': '✅ 就绪'
        })))

        const totalRows = htmlSheets.reduce((sum, sheet) => sum + sheet.rowCount, 0)
        this.$message.success(`Excel报表加载完成！共${htmlSheets.length}个工作表，${totalRows}条数据记录`)
      } catch (error) {
        console.error('❌ Excel下载或转换失败！详细错误信息：')
        console.error('   错误类型:', error.name)
        console.error('   错误消息:', error.message)
        console.error('   错误堆栈:', error.stack)

        if (error.response) {
          console.error('   HTTP响应状态:', error.response.status)
          console.error('   响应数据:', error.response.data)
        }

        if (error.code === 'ECONNABORTED') {
          this.$message.error('下载超时（>30秒），请检查网络连接后重试')
        } else if (error.message.includes('网络') || error.message.includes('Network')) {
          this.$message.error('网络请求失败，请检查网络连接')
        } else if (error.message.includes('403') || error.message.includes('401')) {
          this.$message.error('认证失败（TOKEN无效或已过期）')
        } else if (error.message.includes('404')) {
          this.$message.error('Excel文件不存在（URL无效）')
        } else {
          this.$message.warning(
            `无法加载Excel预览：${error.message}<br/><br/>` +
            `但基本统计功能正常，您可以：<br/>` +
            `• 点击"下载Excel文件"按钮手动下载查看<br/>` +
            `• 检查控制台(F12)查看详细错误信息`,
            { duration: 5000, dangerouslyUseHTMLString: true }
          )
        }

        this.excelHtmlData = []
        this.excelData = null
      } finally {
        this.excelLoading = false
        console.log('🏁 downloadAndParseExcel() 执行结束')
        console.log('   excelHtmlData长度:', this.excelHtmlData.length)
      }
    },

    async handleDownloadReport() {
      if (!this.downloadUrl) {
        this.$message.warning('请先生成报表')
        return
      }

      try {
        const fullUrl = `${BASE_URL}${this.downloadUrl}`
        const response = await axios({
          url: fullUrl,
          method: 'get',
          headers: { TOKEN },
          responseType: 'blob'
        })

        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `库存报表_${this.formatDate(new Date())}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        this.$message.success('报表下载成功！')
      } catch (error) {
        this.$message.error('下载失败，请重试')
      }
    },

    // 统计卡片点击事件
    handleStatClick(stat) {
      if (!stat.clickable) return

      this.currentDialogType = stat.key
      this.dialogTitle = `${stat.label} - ${this.formData.warehouse}`
      this.dialogVisible = true
      this.selectedRows = []
      this.searchText = ''
      this.currentPage = 1

      this.fetchDialogData(stat.key)
    },

    // 获取弹窗数据（基于解析后的真实Excel数据）- 增强诊断版
    async fetchDialogData(type) {
      console.log(`🎯 用户点击了弹窗: ${type}`)
      this.tableLoading = true
      this.dialogExcelHtml = ''

      try {
        if (!this.reportData) {
          console.error('❌ 错误：reportData为空，用户未生成报表')
          this.$message.warning('请先生成报表')
          this.dialogVisible = false
          return
        }
        console.log('✅ reportData存在:', Object.keys(this.reportData))

        if (!this.excelHtmlData || this.excelHtmlData.length === 0) {
          console.error('❌ 错误：excelHtmlData为空，Excel未加载或加载失败')
          console.log('   当前downloadUrl:', this.downloadUrl)
          console.log('   当前excelLoading状态:', this.excelLoading)

          const diagnosticInfo = `
            <div style="text-align: left; line-height: 1.8;">
              <h3 style="color: #E6A23C; margin-bottom: 10px;">⚠️ Excel数据尚未加载</h3>
              <p><b>当前状态：</b></p>
              <ul style="margin-left: 20px; color: #666;">
                <li>报表统计数字：<span style="color: #67C23A;">✅ 已获取</span></li>
                <li>Excel数据：<span style="color: #F56C6C;">❌ 未加载</span></li>
              </ul>
              <p style="margin-top: 15px;"><b>解决方案：</b></p>
              <ol style="margin-left: 20px; color: #409EFF;">
                <li><b>等待2-3秒：</b>Excel正在后台下载和解析中...</li>
                <li><b>刷新数据：</b>点击预览区域的"刷新"按钮</li>
                <li><b>重新生成：</b>再次点击"生成报表"按钮</li>
                <li><b>手动下载：</b>点击"下载Excel文件"按钮查看完整数据</li>
              </ol>
            </div>
          `

          this.$alert(diagnosticInfo, '提示', {
            confirmButtonText: '我知道了',
            dangerouslyUseHTMLString: true,
            type: 'warning'
          })

          this.tableLoading = false
          return
        }

        console.log('✅ excelHtmlData存在，包含', this.excelHtmlData.length, '个工作表')
        console.log(`🔍 正在查找"${type}"类型对应的Excel工作表...`)

        const targetSheet = this.findSheetForDialog(type)

        if (targetSheet) {
          this.dialogExcelHtml = targetSheet.html
          console.log(`✅ "${type}"弹窗数据准备完成！`)
          console.log('   工作表名称:', targetSheet.name)
          console.log('   数据行数:', targetSheet.rowCount)
          console.log('   HTML长度:', targetSheet.html.length, '字符')
        } else {
          console.warn(`⚠️ 未找到"${type}"对应的工作表`)
          console.log('   可用的工作表:', this.excelHtmlData.map(s => s.name))

          this.$message.info({
            message: `"${this.getDialogTypeName(type)}"在当前Excel中未找到匹配的工作表`,
            duration: 4000
          })
        }
      } catch (error) {
        console.error(`❌ 处理"${type}"弹窗时发生异常:`, error)
        this.$message.error(`加载数据失败: ${error.message}`)
        this.dialogExcelHtml = ''
      } finally {
        this.tableLoading = false
      }
    },

    findSheetForDialog(type) {
      const keywordsMap = {
        material: ['材料', 'Material', '库存', 'Stock', '物料', '商品', '材料清单'],
        inCount: ['入库', 'Inbound', '入库记录', 'Inbound Records', '入库明细'],
        outCount: ['出库', 'Outbound', '出库记录', 'Outbound Records', '出库明细'],
        inQty: ['入库数量', 'Inbound Qty', '入库项', '总入库'],
        outQty: ['出库数量', 'Outbound Qty', '出库项', '总出库']
      }

      const keywords = keywordsMap[type]
      if (!keywords) return null

      for (const sheet of this.excelHtmlData) {
        for (const keyword of keywords) {
          if (sheet.name.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`📑 找到匹配工作表: "${sheet.name}"（关键词: "${keyword}"）`)
            return sheet
          }
        }
      }

      console.warn(`⚠️ 未找到包含 [${keywords.join(' / ')}] 的工作表，使用第一个可用工作表`)
      return this.excelHtmlData[0] || null
    },

    getDialogTypeName(type) {
      const typeNames = {
        material: '材料总数',
        inCount: '入库次数',
        outCount: '出库次数',
        inQty: '总入库数量',
        outQty: '总出库数量'
      }
      return typeNames[type] || type
    },

    // ========== Excel在线预览相关方法 ==========

    getColumnWidth(header) {
      const widthMap = {
        '商品编码': 120,
        '商品描述': 180,
        '品牌': 100,
        '商品规格': 130,
        '计量单位': 90,
        '厂商/供应商': 140,
        '库存数量': 100,
        '可用库存': 100,
        '损坏数量': 100,
        '二维码': 120,
        '操作类型': 100,
        '数量': 80,
        '操作人': 90,
        '领取人': 90,
        '用途': 120,
        '所用项目': 120,
        '地址': 150,
        '操作时间': 160,
        '备注': 150,
        '序号': 60
      }
      return widthMap[header] || 120
    },

    switchSheet(index) {
      if (index >= 0 && index < this.excelHtmlData.length) {
        this.currentSheetIndex = index
        console.log(`📑 切换到工作表: ${this.excelHtmlData[index].name}`)
      }
    },

    togglePreviewCollapse() {
      this.previewCollapsed = !this.previewCollapsed
    },

    refreshExcelPreview() {
      if (this.downloadUrl) {
        this.downloadAndParseExcel()
      }
    },

    // 从解析后的Excel数据中提取对应类型的数据
    extractDataFromExcel(type) {
      if (!this.excelData || Object.keys(this.excelData).length === 0) {
        return []
      }

      const sheetNames = Object.keys(this.excelData)
      console.log(`📊 Excel中可用的工作表：`, sheetNames)

      let targetData = null

      switch (type) {
        case 'material':
          targetData = this.findSheetData(sheetNames, ['材料', 'Material', '库存', 'Stock', '物料', '商品', '材料清单'])
          break
        case 'inCount':
          targetData = this.findSheetData(sheetNames, ['入库', 'Inbound', '入库记录', 'Inbound Records', '入库明细'])
          break
        case 'outCount':
          targetData = this.findSheetData(sheetNames, ['出库', 'Outbound', '出库记录', 'Outbound Records', '出库明细'])
          break
        case 'inQty':
          targetData = this.findSheetData(sheetNames, ['入库数量', 'Inbound Qty', '入库项', '总入库'])
          break
        case 'outQty':
          targetData = this.findSheetData(sheetNames, ['出库数量', 'Outbound Qty', '出库项', '总出库'])
          break
        default:
          console.warn(`❓ 未知的数据类型：${type}`)
          return []
      }

      return targetData ? targetData.data : []
    },

    // 根据关键词智能匹配工作表
    findSheetData(sheetNames, keywords) {
      for (const sheetName of sheetNames) {
        for (const keyword of keywords) {
          if (sheetName.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`✅ 找到匹配工作表："${sheetName}"（关键词："${keyword}"）`)
            return this.excelData[sheetName]
          }
        }
      }

      console.warn(`⚠️ 未找到包含 [${keywords.join(' / ')}] 的工作表`)

      if (sheetNames.length > 0) {
        console.log(`🔄 使用第一个可用工作表："${sheetNames[0]}"`)
        return this.excelData[sheetNames[0]]
      }

      return null
    },

    // 搜索过滤
    handleSearch() {
      if (!this.searchText.trim()) {
        this.filteredData = [...this.tableData]
        this.currentPage = 1
        return
      }

      const keyword = this.searchText.toLowerCase()
      this.filteredData = this.tableData.filter(item => {
        return Object.values(item).some(val =>
          String(val).toLowerCase().includes(keyword)
        )
      })
      this.currentPage = 1
    },

    // 选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    // 行点击
    handleRowClick(row) {
      this.$refs.dataTable.toggleRowSelection(row)
    },

    // 分页
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
    },

    handleCurrentChange(val) {
      this.currentPage = val
    },

    // 关闭弹窗
    handleDialogClose(done) {
      this.selectedRows = []
      this.searchText = ''
      this.tableData = []
      this.filteredData = []
      done()
    },

    // 显示详情
    showDetail(row) {
      this.$alert(JSON.stringify(row, null, 2), '详细信息', {
        confirmButtonText: '确定',
        customClass: 'detail-dialog',
        dangerouslyUseHTMLString: false
      })
    },

    // 导出选中项
    handleExportSelected() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择要导出的数据')
        return
      }
      this.exportToExcel(this.selectedRows, `选中数据_${this.currentDialogType}`)
    },

    // 导出全部
    handleExportAll() {
      this.exportToExcel(this.filteredData, `全部数据_${this.currentDialogType}`)
    },

    // 导出到Excel
    exportToExcel(data, filename) {
      try {
        const columns = this.currentColumns
        const header = columns.map(col => col.label)
        const rows = data.map(row =>
          columns.map(col => row[col.prop] || '')
        )

        let csvContent = '\uFEFF' + header.join(',') + '\n'
        rows.forEach(row => {
          csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
        })

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}_${this.formatDate(new Date())}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        this.$message.success(`成功导出 ${data.length} 条数据`)
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败，请重试')
      }
    }
  }
}
</script>

<style scoped>
.warehouse-report-container {
  padding: 30px;
  min-height: calc(100vh - 84px);
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.header h1 {
  font-size: 32px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.header .subtitle {
  font-size: 16px;
  opacity: 0.9;
}

.filter-section {
  margin-bottom: 30px;
}

.filter-card {
  border-radius: 12px;
}

.card-header {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.action-buttons {
  text-align: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.action-buttons .el-button {
  min-width: 150px;
  margin: 0 10px;
}

.stats-section {
  animation: fadeInUp 0.5s ease;
}

.stats-card {
  border-radius: 12px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  height: 120px;
  position: relative;
}

.stat-card.clickable-stat {
  cursor: pointer;
}

.stat-card.clickable-stat:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card.clickable-stat.clickable::after {
  content: '';
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-right: 18px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 6px;
}

.stat-hint {
  position: absolute;
  top: 15px;
  right: 15px;
  color: #409EFF;
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card.clickable:hover .stat-hint {
  opacity: 1;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.selected-info {
  color: #409EFF;
  font-weight: bold;
  margin-right: 15px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

/* 弹窗中的Excel HTML表格样式 - 与下方预览区域一致 */
.dialog-excel-container {
  min-height: 300px;
  max-height: 600px;
  overflow: auto;
  background: #fafafa;
  border-radius: 4px;
  padding: 15px;
}

.dialog-excel-table {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.dialog-excel-table table {
  width: 100% !important;
  border-collapse: collapse !important;
  font-size: 13px !important;
}

.dialog-excel-table table th,
.dialog-excel-table table td {
  border: 1px solid #ebeef5 !important;
  padding: 8px 12px !important;
  text-align: left !important;
}

.dialog-excel-table table th {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%) !important;
  font-weight: 600 !important;
  color: #303133 !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
}

.dialog-excel-table table tr:hover td {
  background-color: #ecf5ff !important;
}

.dialog-excel-table table tr:nth-child(even) td {
  background-color: #fafafa !important;
}

.no-data-in-dialog {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
  font-size: 14px;
}

.no-data-in-dialog i {
  font-size: 48px;
  color: #E6A23C;
  margin-bottom: 15px;
  display: block;
}

.no-data-in-dialog p {
  margin: 10px 0;
  font-size: 16px;
  font-weight: 500;
}

.no-data-in-dialog .tip {
  font-size: 13px;
  color: #C0C4CC;
  margin-top: 20px;
}

@media (max-width: 992px) {
  .warehouse-report-container {
    padding: 20px;
  }

  .header h1 {
    font-size: 26px;
  }

  .el-col {
    margin-bottom: 15px;
  }

  .stat-card {
    margin-bottom: 15px;
  }
}
</style>

<style>
.data-dialog .el-dialog__body {
  padding: 20px;
}

.detail-dialog {
  max-width: 600px;
}

.detail-dialog .el-message-box__message {
  max-height: 400px;
  overflow-y: auto;
}

.diagnostic-dialog {
  max-width: 600px;
}

.diagnostic-dialog .el-message-box__message {
  padding: 10px 20px;
  font-size: 14px;
}

.diagnostic-dialog code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

/* Excel在线预览区域样式 */
.excel-preview-section {
  margin-top: 20px;
  animation: fadeInUp 0.5s ease;
}

.preview-card {
  border: 2px solid #217346;
}

.preview-card .el-card__header {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border-bottom: 2px solid #217346;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.excel-viewer-container {
  background: #fff;
}

.sheet-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 10px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  overflow-x: auto;
}

.sheet-tab {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.3s ease;
  margin-bottom: -1px;
}

.sheet-tab:hover {
  color: #409EFF;
  border-color: #409EFF;
}

.sheet-tab.active {
  background: #fff;
  color: #217346;
  border-color: #217346;
  border-bottom-color: #fff;
  font-weight: 600;
  box-shadow: 0 -2px 8px rgba(33, 115, 70, 0.1);
}

.sheet-tab i {
  margin-right: 6px;
  font-size: 12px;
}

.sheet-tab-count {
  margin-left: 8px;
  font-size: 11px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.sheet-tab.active .sheet-tab-count {
  background: #e1f3d8;
  color: #217346;
}

.excel-content-wrapper {
  padding: 15px;
  max-height: 600px;
  overflow: auto;
  background: #fafafa;
}

.excel-table-container {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.excel-table-container table {
  width: 100% !important;
  border-collapse: collapse !important;
  font-size: 13px !important;
}

.excel-table-container table th,
.excel-table-container table td {
  border: 1px solid #ebeef5 !important;
  padding: 8px 12px !important;
  text-align: left !important;
}

.excel-table-container table th {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%) !important;
  font-weight: 600 !important;
  color: #303133 !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
}

.excel-table-container table tr:hover td {
  background-color: #ecf5ff !important;
}

.excel-table-container table tr:nth-child(even) td {
  background-color: #fafafa !important;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.no-data i {
  font-size: 48px;
  margin-bottom: 15px;
  display: block;
  color: #c0c4cc;
}

.preview-footer {
  padding: 10px 15px;
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  text-align: center;
}

.footer-info {
  font-size: 13px;
  color: #606266;
}
</style>
