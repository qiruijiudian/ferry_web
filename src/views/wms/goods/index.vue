<template>
  <div class="goods-management">
    <div class="page-header">
      <h1><i class="el-icon-goods" /> 商品管理</h1>
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增商品</el-button>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.goods_name" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item label="商品编码">
          <el-input v-model="searchForm.goods_code" placeholder="请输入商品编码" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="请选择分类" clearable>
            <el-option label="电子元件" value="electronics" />
            <el-option label="机械配件" value="mechanical" />
            <el-option label="办公用品" value="office" />
            <el-option label="工具设备" value="tools" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="goodsList" border stripe>
        <el-table-column prop="goods_code" label="商品编码" width="120" />
        <el-table-column prop="goods_name" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100">
          <template slot-scope="scope">
            <el-tag size="small">{{ getCategoryName(scope.row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="spec" label="规格型号" width="100" />
        <el-table-column prop="unit" label="单位" width="70" align="center" />
        <el-table-column prop="stock" label="库存" width="80" align="center">
          <template slot-scope="scope">
            <span :class="{ 'low-stock': scope.row.stock <= scope.row.min_stock }">{{ scope.row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="min_stock" label="预警值" width="80" align="center" />
        <el-table-column prop="location" label="存放位置" width="100" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="mini" icon="el-icon-delete" class="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :current-page="pagination.page"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px">
      <el-form ref="goodsForm" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品编码" prop="goods_code">
              <el-input v-model="formData.goods_code" placeholder="请输入商品编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品名称" prop="goods_name">
              <el-input v-model="formData.goods_name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
                <el-option label="电子元件" value="electronics" />
                <el-option label="机械配件" value="mechanical" />
                <el-option label="办公用品" value="office" />
                <el-option label="工具设备" value="tools" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="formData.unit" placeholder="请输入单位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规格型号">
              <el-input v-model="formData.spec" placeholder="请输入规格型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放位置">
              <el-input v-model="formData.location" placeholder="请输入存放位置" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="库存预警值">
              <el-input-number v-model="formData.min_stock" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价">
              <el-input-number v-model="formData.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import wmsApi from '@/api/wms'

export default {
  name: 'GoodsManagement',
  data() {
    return {
      loading: false,
      submitLoading: false,
      searchForm: { goods_name: '', goods_code: '', category: '' },
      goodsList: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
      dialogVisible: false,
      dialogTitle: '新增商品',
      isEdit: false,
      formData: this.getEmptyForm(),
      formRules: {
        goods_code: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
        goods_name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
        category: [{ required: true, message: '请选择分类', trigger: 'change' }],
        unit: [{ required: true, message: '请输入单位', trigger: 'blur' }]
      }
    }
  },
  mounted() {
    this.loadGoodsList()
  },
  methods: {
    getEmptyForm() {
      return { id: null, goods_code: '', goods_name: '', category: '', spec: '', unit: '', stock: 0, min_stock: 10, price: 0, location: '', remark: '' }
    },
    getCategoryName(category) {
      const map = { electronics: '电子元件', mechanical: '机械配件', office: '办公用品', tools: '工具设备', other: '其他' }
      return map[category] || category
    },
    loadGoodsList() {
      this.loading = true
      wmsApi.getGoodsList({ page: this.pagination.page, page_size: this.pagination.pageSize, ...this.searchForm }).then(res => {
        if (res.code === 200) {
          this.goodsList = res.data.list || []
          this.pagination.total = res.data.total || 0
        }
      }).catch(() => {
        this.goodsList = [
          { id: 1, goods_code: 'G001', goods_name: '螺丝M8x20', category: 'mechanical', spec: 'M8x20', unit: '个', stock: 500, min_stock: 100, price: 0.5, location: 'A区-01' },
          { id: 2, goods_code: 'G002', goods_name: '电缆线10mm', category: 'electronics', spec: '10mm²', unit: '米', stock: 100, min_stock: 50, price: 15, location: 'B区-02' }
        ]
        this.pagination.total = 2
      }).finally(() => { this.loading = false })
    },
    handleSearch() { this.pagination.page = 1; this.loadGoodsList() },
    handleReset() { this.searchForm = { goods_name: '', goods_code: '', category: '' }; this.handleSearch() },
    handleSizeChange(size) { this.pagination.pageSize = size; this.loadGoodsList() },
    handlePageChange(page) { this.pagination.page = page; this.loadGoodsList() },
    handleAdd() {
      this.isEdit = false
      this.dialogTitle = '新增商品'
      this.formData = this.getEmptyForm()
      this.dialogVisible = true
      this.$nextTick(() => { this.$refs.goodsForm && this.$refs.goodsForm.clearValidate() })
    },
    handleEdit(row) {
      this.isEdit = true
      this.dialogTitle = '编辑商品'
      this.formData = { ...row }
      this.dialogVisible = true
    },
    handleDelete(row) {
      this.$confirm('确定要删除该商品吗？', '提示', { type: 'warning' }).then(() => {
        wmsApi.deleteGoods(row.id).then(() => {
          this.$message.success('删除成功')
          this.loadGoodsList()
        })
      }).catch(() => {})
    },
    handleSubmit() {
      this.$refs.goodsForm.validate(valid => {
        if (!valid) return
        this.submitLoading = true
        const api = this.isEdit ? wmsApi.updateGoods : wmsApi.createGoods
        api(this.formData).then(() => {
          this.$message.success(this.isEdit ? '编辑成功' : '新增成功')
          this.dialogVisible = false
          this.loadGoodsList()
        }).finally(() => { this.submitLoading = false })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.goods-management { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  h1 { margin: 0; font-size: 22px; color: #303133; i { margin-right: 10px; color: #409EFF; } }
}
.search-card { margin-bottom: 20px; }
.table-card { .low-stock { color: #F56C6C; font-weight: 600; } .danger { color: #F56C6C; } }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
