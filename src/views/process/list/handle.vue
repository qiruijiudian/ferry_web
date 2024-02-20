<template>
  <div class="app-container">
    <div v-if="isLoadingStatus" />
    <div v-else>
      <el-card class="box-card">
        <div class="text item">
          <el-steps v-if="currentNode.clazz !== undefined && currentNode.clazz !== null && currentNode.clazz !== ''" :active="activeIndex" finish-status="success">
            <template v-for="(item, index) in nodeStepList">
              <el-step
                v-if="item.isHideNode === false ||
                  item.isHideNode === undefined ||
                  item.isHideNode == null ||
                  item.id === processStructureValue.workOrder.current_state"
                :key="index"
                :title="item.label"
              />
            </template>
          </el-steps>
          <div v-else>
            <el-alert
              show-icon
              title="未找到当前工单流程信息，请确认当前工单绑定的流程是否存在。"
              type="warning"
            />
          </div>
        </div>
      </el-card>

      <el-alert
        v-if="activeIndex !== nodeStepList.length && processStructureValue.workOrder.is_end===1"
        style="margin-top: 15px"
        :title="alertMessage"
        type="error"
        :closable="false"
      />

      <el-card class="box-card" style="margin-top: 15px">
        <div slot="header" class="clearfix">
          <span>公共信息</span>
        </div>
        <div class="text item">
          <el-form label-width="100px">
            <el-row>
              <el-col :span="12">
                <el-form-item label="标题:" style="margin-bottom: 5px">
                  <span>{{ processStructureValue.workOrder.title }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级:" style="margin-bottom: 0">
                  <span v-if="processStructureValue.workOrder.priority===2">
                    <el-tag type="warning">紧急</el-tag>
                  </span>
                  <span v-else-if="processStructureValue.workOrder.priority===3">
                    <el-tag type="danger">非常紧急</el-tag>
                  </span>
                  <span v-else>
                    <el-tag type="success">一般</el-tag>
                  </span>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </el-card>

      <el-card class="box-card" style="margin-top: 15px;">
        <div slot="header" class="clearfix">
          <span>表单信息</span>
        </div>
        <div class="text item">
          <template v-for="(tplItem, tplIndex) in processStructureValue.tpls">
            <fm-generate-form
              v-show="currentNode.hideTpls===undefined ||
                currentNode.hideTpls===null ||
                currentNode.hideTpls.indexOf(tplItem.form_structure.id)===-1"
              :key="tplIndex"
              :ref="'generateForm-'+tplItem.id"
              :preview="!!((currentNode.hideTpls!==undefined &&
                currentNode.hideTpls!==null &&
                currentNode.hideTpls.indexOf(tplItem.form_structure.id)!==-1) ||
                (currentNode.writeTpls===undefined ||
                currentNode.writeTpls===null ||
                currentNode.writeTpls.indexOf(tplItem.form_structure.id)===-1)||
                (isActiveProcessing && currentNode.activeOrder))"
              :remote="remoteFunc"
              :value="tplItem.form_data"
              :data="tplItem.form_structure"
            />
          </template>
        </div>
        <div v-if="processStructureValue.userAuthority">
          <hr style="background-color: #d9d9d9; border:0; height:1px; margin-bottom: 15px">
          <div>
            <el-input
              v-model="remarks"
              type="textarea"
              placeholder="请输入备注信息"
              maxlength="200"
              :autosize="{ minRows: 3, maxRows: 99}"
              show-word-limit
            />
          </div>
          <div class="text item" style="text-align: center;margin-top:18px">
            <div
              v-if="isActiveProcessing && currentNode.activeOrder"
            >
              <el-button
                v-permisaction="['process:list:handle:active']"
                type="primary"
                @click="activeOrderActive"
              >
                主动接单
              </el-button>
            </div>
            <div v-else>
              <template v-for="(item, index) in processStructureValue.edges">
                <el-button
                  v-if="processStructureValue.workOrder.is_end===0 && item.source===currentNode.id"
                  :key="index"
                  type="primary"
                  @click="submitAction(item)"
                >
                  {{ item.label }}
                </el-button>
              </template>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="box-card" style="margin-top: 15px">
        <div slot="header" class="clearfix">
          <span>工单流转历史</span>
        </div>
        <div class="text item">
          <el-table
            :data="circulationHistoryList"
            border
            style="width: 100%"
          >
            <el-table-column
              prop="state"
              label="节点"
            />
            <el-table-column
              prop="circulation"
              label="流转"
            />
            <el-table-column
              prop="processor"
              label="处理人"
            />
            <el-table-column
              prop="create_time"
              label="处理时间"
            />
            <el-table-column
              prop="remarks"
              label="备注"
            />
          </el-table>
        </div>
      </el-card>
    </div>
    <el-dialog
      title="转交工单"
      :visible.sync="dialogVisible"
      width="30%"
    >
      <el-form ref="ruleForm_2" :model="ruleForm_2" :rules="rules" label-width="60px" class="demo-ruleForm">
        <el-form-item label="节点" prop="node_id">
          <el-select v-model="ruleForm_2.node_id" placeholder="选择节点" size="small" style="width: 100%">
            <el-option v-for="(item, index) in nodeList" :key="index" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户" prop="user_id">
          <el-select v-model="ruleForm_2.user_id" filterable placeholder="选择用户" size="small" style="width: 100%">
            <el-option v-for="(item, index) in users" :key="index" :label="item.nickName" :value="item.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="ruleForm_2.remarks" type="textarea" size="small" />
        </el-form-item>
        <el-form-item style="text-align: right">
          <el-button type="primary" @click="submitForm('ruleForm_2')">提交</el-button>
          <el-button @click="dialogVisible = false">关闭</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import Vue from 'vue'
import {
  GenerateForm
} from '@/components/VueFormMaking'
import 'form-making/dist/FormMaking.css'
Vue.component(GenerateForm.name, GenerateForm)

import {
  processStructure,
  handleWorkOrder,
  activeOrder,
  workOrderList,
  inversionWorkOrder
} from '@/api/process/work-order'

import { listUser } from '@/api/system/sysuser'

import { mapGetters } from 'vuex'
import { getDeptList } from '@/api/system/dept'
export default {
  data() {
    return {
      listQuery: {},
      queryParams: {},
      ticketList: [],
      nodeList: [],
      users: [],
      dialogVisible: false,
      isLoadingStatus: true,
      currentNode: {
        hideTpls: null,
        writeTpls: null
      },
      isActiveProcessing: false,
      tpls: [],
      remarks: '', // 备注信息
      alertMessage: '',
      nodeStepList: [],
      circulationHistoryList: [],
      activeIndex: 0,
      processStructureValue: {
        workOrder: { title: '' }
      },
      ruleForm: {
        title: '',
        process: '',
        classify: '',
        state_id: '',
        state: '',
        source_state: '',
        processor: '',
        process_method: '',
        tpls: [],
        tasks: []
      },
      ruleForm_2: {
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
      },
      remoteFunc: {
        // 获取用户列表
        async userList(resolve) {
          const res = await listUser({
            pageSize: 999999
          })
          const options = res.data.list
          resolve(options)
        },
        async deptTreeList(resolve) {
          const res = await getDeptList()
          resolve(res.data)
        }
      }
    }
  },
  computed: {
    ...mapGetters([
      'userId'
    ])
  },
  created() {
    this.getProcessNodeList()
  },
  methods: {
    getList() {
      this.loading = true
      this.listQuery.page = 1
      this.listQuery.per_page = 100000
      this.listQuery.classify = 4
      workOrderList(this.listQuery).then(response => {
        this.ticketList = response.data.data
        this.queryParams.pageIndex = response.data.page
        this.queryParams.pageSize = response.data.per_page
        this.total = response.data.total_count
        this.loading = false
        this.ticketList.forEach(element => {
          if (element.id === this.ruleForm_2.work_order_id) {
            this.ruleForm_2.node_id = element.state[0].id
          }
        })
        console.log('test workOrderList ', this.ticketList)
      })
    },
    getProcessNodeList() {
      processStructure({
        processId: this.$route.query.processId,
        workOrderId: this.$route.query.workOrderId
      }).then(response => {
        this.ruleForm_2.work_order_id = this.$route.query.workOrderId
        this.isActiveProcessing = false
        this.processStructureValue = response.data
        this.circulationHistoryList = this.processStructureValue.circulationHistory
        // 获取当前展示节点列表
        this.nodeStepList = []
        if (this.processStructureValue.nodes) {
          for (var i = 0; i < this.processStructureValue.nodes.length; i++) {
            if (this.processStructureValue.nodes[i].id === this.processStructureValue.workOrder.current_state) {
              // 当前节点
              this.nodeStepList.push(this.processStructureValue.nodes[i])
              this.activeIndex = this.nodeStepList.length - 1
              if (i + 1 === this.processStructureValue.nodes.length) {
                this.activeIndex = this.nodeStepList.length
              }
              this.currentNode = this.processStructureValue.nodes[i]
            } else if (!this.processStructureValue.nodes[i].isHideNode) {
              // 非隐藏节点
              this.nodeStepList.push(this.processStructureValue.nodes[i])
            }
          }
        }

        // 如果回退到初始节点则可编辑。
        if (this.activeIndex === 0 && this.currentNode.clazz === 'start') {
          this.currentNode.writeTpls = []
          for (var tplTmp of this.processStructureValue.tpls) {
            this.currentNode.writeTpls.push(tplTmp.form_structure.id)
          }
        }

        // 判断是否需要主动处理
        for (var stateValue of this.processStructureValue.workOrder.state) {
          if (this.processStructureValue.workOrder.current_state === stateValue.id && stateValue.processor.length > 1) {
            this.isActiveProcessing = true
            break
          }
        }
        this.isLoadingStatus = false
        this.getAlertMessage()
      })
    },
    submitAction(item) {
      var promiseList = []
      this.tpls = []
      for (var tpl of this.processStructureValue.tpls) {
        this.tpls.push({
          tplDataId: tpl.id,
          tplId: tpl.form_structure.id
        })
        promiseList.push(this.$refs['generateForm-' + tpl.id][0].getData())
      }
      Promise.all(promiseList).then(values => {
        for (var tplDataIndex in this.tpls) {
          this.tpls[tplDataIndex].tplValue = values[tplDataIndex]
        }
        handleWorkOrder({
          tasks: this.processStructureValue.process.task,
          source_state: this.processStructureValue.workOrder.current_state,
          target_state: item.target,
          circulation: item.label,
          flow_properties: item.flowProperties === undefined ? 2 : parseInt(item.flowProperties),
          work_order_id: parseInt(this.$route.query.workOrderId),
          remarks: this.remarks,
          is_exec_task: item.isExecuteTask,
          tpls: this.tpls
        }).then(response => {
          if (response.code === 200) {
          // this.$router.push({ name: 'upcoming' })
            // window.location.reload()
            this.getList()
            if (this.checkForEnd(item.target)) {
              this.dialogVisible = false
            } else {
              this.handleInversion()
              this.dialogVisible = true
            }
            this.getProcessNodeList()
          }
        })
      })
    },
    handleInversion() {
      listUser({
        pageSize: 999999
      }).then(response => {
        this.users = response.data.list
      })
    },
    checkForEnd(str1) {
      // 将字符串转换为小写，以避免大小写敏感性
      str1 = str1.toLowerCase()
      // 使用 indexOf() 方法检查字符串中是否包含 'end'
      if (str1.indexOf('end') !== -1) {
        return true
      } else {
        return false
      }
    },
    submitForm(formName) {
      console.log('this.ruleFormx ', this.ruleForm_2)
      this.$refs[formName].validate((valid) => {
        if (valid) {
          inversionWorkOrder(this.ruleForm_2).then(response => {
            if (response.code === 200) {
              this.getList()
              this.dialogVisible = false
            }
          })
        }
      })
    },
    // 获取提示消息
    getAlertMessage() {
      if (this.processStructureValue.workOrder.is_end === 1) {
        this.alertMessage = '当前工单已结束。'
      }
    },
    activeOrderActive() {
      var jsonData = [{
        id: this.nodeStepList[this.activeIndex].id,
        label: this.nodeStepList[this.activeIndex].label,
        process_method: 'person',
        processor: [this.userId]
      }]
      activeOrder(jsonData, this.$route.query.workOrderId).then(() => {
        this.getProcessNodeList()
      })
    }
  }
}
</script>
