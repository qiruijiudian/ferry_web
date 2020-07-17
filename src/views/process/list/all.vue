<template>
  <div class="app-container">
    <el-card class="box-card">
      <el-form ref="listQuery" :model="listQuery" :inline="true">
        <el-form-item label="工单标题">
          <el-input
            v-model="listQuery.title"
            placeholder="请输入工单标题"
            clearable
            size="small"
            style="width: 240px"
            @keyup.enter.native="getList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="getList">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" border :data="ticketList" @selection-change="handleSelectionChange">
        <!-- <el-table-column type="selection" width="55" align="center" /> -->
        <el-table-column label="ID" prop="id" width="120" />
        <el-table-column label="标题" prop="title" :show-overflow-tooltip="true" />
        <el-table-column label="当前状态" :show-overflow-tooltip="true">
          <template slot-scope="scope">
            <span>{{ scope.row.state[0].label }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当前处理人" prop="principals" :show-overflow-tooltip="true" />
        <el-table-column label="是否结束" :show-overflow-tooltip="true" width="80" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.is_end===0" size="mini" type="success">否</el-tag>
            <el-tag v-else size="mini" type="danger">是</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="create_time" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.create_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
          <template slot-scope="scope">
            <el-button
              v-permisaction="['process:admin:classify:edit']"
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleView(scope.row)"
            >查看</el-button>
            <el-button
              v-permisaction="['process:admin:classify:edit']"
              size="mini"
              type="text"
              icon="el-icon-position"
              @click="handleInversion(scope.row)"
            >转交</el-button>
            <el-button
              v-permisaction="['process:admin:classify:edit']"
              size="mini"
              type="text"
              icon="el-icon-switch-button"
              @click="handleUnity(scope.row)"
            >结单</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog
        title="转交工单"
        :visible.sync="dialogVisible"
        width="30%"
      >
        <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="60px" class="demo-ruleForm">
          <el-form-item label="节点" prop="node_id">
            <el-select v-model="ruleForm.node_id" placeholder="选择节点" size="small" style="width: 100%">
              <el-option v-for="(item, index) in nodeList" :key="index" :label="item.label" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户" prop="user_id">
            <el-select v-model="ruleForm.user_id" placeholder="选择用户" size="small" style="width: 100%">
              <el-option v-for="(item, index) in users" :key="index" :label="item.nickName" :value="item.userId" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="ruleForm.remarks" type="textarea" size="small" />
          </el-form-item>
          <el-form-item style="text-align: right">
            <el-button type="primary" @click="submitForm('ruleForm')">提交</el-button>
            <el-button @click="dialogVisible = false">关闭</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>

      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageIndex"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script>
import { workOrderList, unityWorkOrder, inversionWorkOrder } from '@/api/process/work-order'
import { listUser } from '@/api/system/sysuser'
export default {
  data() {
    return {
      users: [],
      nodeList: [],
      dialogVisible: false,
      queryParams: {},
      total: 0,
      loading: false,
      ticketList: [],
      listQuery: {
        page: 1,
        per_page: 10
      },
      ruleForm: {
        work_order_id: '',
        node_id: '',
        user_id: '',
        remarks: ''
      },
      rules: {
        node_id: [
          { required: true, message: '请选择节点', trigger: 'change' }
        ],
        user_id: [
          { required: true, message: '请选择用户', trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      this.listQuery.page = this.queryParams.pageIndex
      this.listQuery.per_page = this.queryParams.pageSize
      this.listQuery.classify = 4
      workOrderList(this.listQuery).then(response => {
        this.ticketList = response.data.data
        this.queryParams.pageIndex = response.data.page
        this.queryParams.pageSize = response.data.per_page
        this.total = response.data.total_count
        this.loading = false
      })
    },
    handleView(row) {
      this.$router.push({ name: 'ProcessListHandle', query: { workOrderId: row.id, processId: row.process }})
    },
    handleUnity(row) {
      this.$confirm('此操作将会结束该工单, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        unityWorkOrder({
          work_oroder_id: row.id
        }).then(response => {
          if (response.code === 200) {
            this.getList()
          }
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消'
        })
      })
    },
    handleInversion(row) {
      this.dialogVisible = true
      this.ruleForm.work_order_id = row.id
      this.nodeList = row.state
      if (this.nodeList.length === 1) {
        this.ruleForm.node_id = this.nodeList[0].id
      }
      listUser({
        pageSize: 999999
      }).then(response => {
        this.users = response.data.list
      })
    },
    handleSelectionChange() {},
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          inversionWorkOrder(this.ruleForm).then(response => {
            if (response.code === 200) {
              this.getList()
              this.dialogVisible = false
            }
          })
        }
      })
    }
  }
}
</script>

<style scoped>

</style>