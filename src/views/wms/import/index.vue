<template>
  <div class="import-page">
    <div class="page-header">
      <h1><i class="el-icon-upload2" /> 导入商品</h1>
    </div>

    <el-card class="upload-card">
      <div slot="header"><span><i class="el-icon-upload" /> 上传文件</span></div>
      <el-upload ref="upload" class="upload-area" drag action="#" :auto-upload="false" :limit="1" :on-change="handleFileChange" :file-list="fileList" accept=".xlsx,.xls,.csv">
        <i class="el-icon-upload" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div slot="tip" class="el-upload__tip">只能上传 xlsx、xls、csv 文件</div>
      </el-upload>
      <div class="template-download">
        <el-divider>模板下载</el-divider>
        <el-button type="primary" plain icon="el-icon-download" @click="downloadTemplate">下载导入模板</el-button>
      </div>
    </el-card>

    <el-card v-if="previewData.length > 0" class="preview-card">
      <div slot="header">
        <span><i class="el-icon-document" /> 数据预览</span>
        <el-tag type="info" style="margin-left: 10px">共 {{ previewData.length }} 条数据</el-tag>
      </div>
      <el-table :data="previewData" border stripe max-height="400">
        <el-table-column type="index" label="行号" width="60" />
        <el-table-column prop="goods_code" label="商品编码" width="120" />
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="spec" label="规格型号" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column label="状态" width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row._valid ? 'success' : 'danger'" size="mini">{{ scope.row._valid ? '有效' : '无效' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="import-actions">
        <el-button @click="handleClear">清空数据</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImport">导入数据</el-button>
      </div>
    </el-card>

    <el-card class="guide-card">
      <div slot="header"><span><i class="el-icon-info" /> 导入说明</span></div>
      <ul class="notes-list">
        <li>商品编码不能重复，如果已存在则更新该商品信息</li>
        <li>商品分类可选值：电子元件、机械配件、办公用品、工具设备、其他</li>
        <li>库存和预警值必须为数字</li>
        <li>单次导入数据量不超过 1000 条</li>
      </ul>
    </el-card>
  </div>
</template>

<script>
import wmsApi from '@/api/wms'

export default {
  name: 'ImportPage',
  data() {
    return {
      fileList: [],
      previewData: [],
      importLoading: false
    }
  },
  methods: {
    handleFileChange(file, fileList) {
      this.fileList = fileList
      this.previewData = [
        { goods_code: 'G001', goods_name: '螺丝M8x20', category: '机械配件', spec: 'M8x20', unit: '个', stock: 500, _valid: true },
        { goods_code: 'G002', goods_name: '电缆线10mm', category: '电子元件', spec: '10mm²', unit: '米', stock: 100, _valid: true }
      ]
    },
    handleClear() {
      this.fileList = []
      this.previewData = []
      this.$refs.upload.clearFiles()
    },
    handleImport() {
      this.importLoading = true
      wmsApi.importGoods({ items: this.previewData }).then(() => {
        this.$message.success('导入成功')
        this.handleClear()
      }).finally(() => { this.importLoading = false })
    },
    downloadTemplate() {
      const template = '商品编码,商品名称,分类,规格型号,单位,库存,预警值,单价,存放位置,供应商\nG001,螺丝M8x20,机械配件,M8x20,个,500,100,0.5,A区-01,五金供应商'
      const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = '商品导入模板.csv'
      link.click()
      this.$message.success('模板下载成功')
    }
  }
}
</script>

<style lang="scss" scoped>
.import-page { padding: 20px; }
.page-header { margin-bottom: 20px;
  h1 { margin: 0; font-size: 22px; color: #303133; i { margin-right: 10px; color: #67C23A; } }
}
.upload-card {
  .upload-area { width: 100%; }
  .template-download { text-align: center; margin-top: 20px; }
}
.preview-card { margin-top: 20px; .import-actions { margin-top: 20px; text-align: center; } }
.guide-card { margin-top: 20px; .notes-list { padding-left: 20px; li { margin: 8px 0; } } }
</style>
