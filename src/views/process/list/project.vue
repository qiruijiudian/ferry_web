<template>
  <div class="app-container">
    <el-card class="box-card">
      <el-form ref="listQuery" :model="listQuery" :inline="true">
        <WorkOrderSearch :genre="'all'" @handleSearch="handleSearch" />
      </el-form>

      <el-table v-loading="loading" border :data="ticketList" @selection-change="handleSelectionChange">
        <!-- <el-table-column type="selection" width="55" align="center" /> -->
        <el-table-column label="项目编号" width="120">
          <template slot-scope="scope">
            {{ (scope.row.formData && scope.row.formData[FIELD_MAPPING.projectNo]) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="工作项目" :show-overflow-tooltip="true">
          <template slot-scope="scope">
            {{ (scope.row.formData && scope.row.formData[FIELD_MAPPING.projectName]) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="目前进度" :show-overflow-tooltip="true">
          <template slot-scope="scope">
            <div style="white-space: normal !important;  max-height: 150px; overflow-y: auto;"> {{ (scope.row.formData && scope.row.formData[FIELD_MAPPING.progress])
              || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="已取得成果" :show-overflow-tooltip="true">
          <template slot-scope="scope">
            <div style="white-space: normal !important;  max-height: 150px; overflow-y: auto;"> {{ (scope.row.formData && scope.row.formData[FIELD_MAPPING.achievements])
              || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="本周完成内容" :show-overflow-tooltip="true">
          <template slot-scope="scope">
            <div style="white-space: normal !important;  max-height: 150px; overflow-y: auto;"> {{ (scope.row.formData && scope.row.formData[FIELD_MAPPING.achievementsWeek])
              || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="本周在项目上的时间" :show-overflow-tooltip="true" width="80" align="center">
          <template slot-scope="scope">
            {{ (scope.row.formData && scope.row.formData[FIELD_MAPPING.timeSpendWeek]) || '-' }}h
          </template>
        </el-table-column>
        <el-table-column label="下周计划在项目上的时间" :show-overflow-tooltip="true" width="80" align="center">
          <template slot-scope="scope">
            {{ (scope.row.formData && scope.row.formData[FIELD_MAPPING.timePlanWeek]) || '-' }}h
          </template>
        </el-table-column>
        <el-table-column label="目标完成日期" align="center" prop="create_time" width="130">
          <template slot-scope="scope">
            {{ (scope.row.formData && scope.row.formData[FIELD_MAPPING.aimDownDate]) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="原计划完成日期" align="center" prop="create_time" width="130">
          <template slot-scope="scope">
            {{ (scope.row.formData && scope.row.formData[FIELD_MAPPING.planDownWeek]) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="优先级" align="center" prop="create_time" width="120">
          <template v-if="scope.row.formData" slot-scope="scope">
            <span v-if="scope.row.formData[FIELD_MAPPING.Priority] === 2">
              <el-tag type="warning">紧急</el-tag>
            </span>
            <span v-else-if="scope.row.formData[FIELD_MAPPING.Priority] === 3">
              <el-tag type="danger">非常紧急</el-tag>
            </span>
            <span v-else>
              <el-tag type="success">一般</el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="60">
          <template slot-scope="scope">
            <el-button
              v-permisaction="['process:list:all:select']"
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleView(scope.row)"
            >查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- <el-dialog
        title="转交工单"
        :visible.sync="dialogVisible"
        class="dialog_pc_m"
      >
        <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="60px" class="demo-ruleForm">
          <el-form-item label="节点" prop="node_id">
            <el-select v-model="ruleForm.node_id" placeholder="选择节点" size="small" style="width: 100%">
              <el-option v-for="(item, index) in nodeList" :key="index" :label="item.label" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户" prop="user_id">
            <el-select v-model="ruleForm.user_id" filterable placeholder="选择用户" size="small" style="width: 100%">
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
      </el-dialog> -->

      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageIndex"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script>
import { projectList, unityWorkOrder, inversionWorkOrder, deleteWorkOrder } from '@/api/process/work-order'
import { listUser } from '@/api/system/sysuser'

// 搜索
import WorkOrderSearch from './components/search/index'

export default {
  components: { WorkOrderSearch },
  data() {
    return {
      FIELD_MAPPING: {
        projectNo: 'input_1741574271000_27726',
        projectName: 'input_1741574273000_7321',
        progress: 'input_1741663002000_87338',
        achievements: 'textarea_1741663056000_10037',
        achievementsWeek: 'input_1741663025000_98001',
        timeSpendWeek: 'number_1741663631000_71419',
        timePlanWeek: 'number_1741663636000_45983',
        aimDownDate: 'date_1741663831000_13848',
        planDownWeek: 'date_1741663833000_27320',
        Priority: 'rate_1741574352000_36134',
        projectManager: ''
      },
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
      // this.loading = true
      this.listQuery.page = this.queryParams.pageIndex
      this.listQuery.per_page = this.queryParams.pageSize
      // this.listQuery.classify = 4
      projectList(this.listQuery).then(response => {
        this.ticketList = response.data.data
        this.queryParams.pageIndex = response.data.page
        this.queryParams.pageSize = response.data.per_page
        this.total = response.data.total_count
        this.total = 11
        // this.loading = false
        console.log('form: ', this.queryParams.pageIndex, this.queryParams.pageSize, this.total)
        console.log('ticketList: ', response.data)
      })
    },
    handleSearch(val) {
      for (var k in val) {
        this.listQuery[k] = val[k]
      }
      this.getList()
    },
    handleView(row) {
      this.$router.push({ name: 'ProcessListHandle', query: { workOrderId: row.workOrderId, processId: row.processId }})
    },
    handleDelete(row) {
      this.$confirm('此操作将删除该数据, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteWorkOrder(row.id).then(response => {
          this.$message({
            type: 'success',
            message: '删除成功!'
          })
          this.getList()
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消'
        })
      })
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
    handleSelectionChange() { },
    submitForm(formName) {
      console.log('this.ruleForm ', this.ruleForm)
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
.dialog_pc_m :deep(.el-dialog) {
  width: 30%;
}

.custom-table .cell {
  white-space: normal !important;
  line-height: 1.5;
  /* 控制行高 */
}

/* 针对窄屏设备（如手机） */
@media (max-width: 767px) {
  .dialog_pc_m :deep(.el-dialog) {
    width: 70%;
  }
}
</style>
