<template>
  <div class="app-container">
    <el-card class="box-card">
      <el-form ref="listQuery" :model="listQuery" :inline="true">
        <el-form-item label="任务名称">
          <el-input
            v-model="listQuery.name"
            placeholder="请输入任务名称"
            clearable
            size="small"
            style="width: 240px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            v-permisaction="['process:admin:task:add']"
            type="primary"
            icon="el-icon-plus"
            size="mini"
            @click="handleCreate"
          >新增</el-button>
        </el-col>
        <!-- <el-col :span="1.5">
          <el-button
            v-permisaction="['system:sysrole:edit']"
            type="success"
            icon="el-icon-edit"
            size="mini"
            :disabled="single"
            @click="handleUpdate"
          >编辑</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            v-permisaction="['system:sysrole:remove']"
            type="danger"
            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
          >删除</el-button>
        </el-col> -->
      </el-row>

      <el-table v-loading="loading" border :data="taskList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" align="center" />
        <el-table-column label="UUID" prop="uuid" />
        <el-table-column label="名称" prop="name" :show-overflow-tooltip="true" />
        <el-table-column label="任务类型" prop="classify" :show-overflow-tooltip="true" />
        <el-table-column label="创建者" prop="creator" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              v-permisaction="['process:admin:task:edit']"
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleEdit(scope.row)"
            >编辑</el-button>
            <el-button
              v-permisaction="['process:admin:task:delete']"
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageIndex"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />

      <el-dialog
        :title="dialogFormVisibleName===1?'新建任务':'编辑任务'"
        :close-on-click-modal="false"
        :visible.sync="open"
      >
        <div class="tpl-create-content">
          <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="100px">
            <el-form-item label="名称" prop="name">
              <el-input v-model="ruleForm.name" placeholder="请输入任务名称" style="width: 50%" />
            </el-form-item>
            <el-form-item label="类型" prop="classify">
              <el-select v-model="ruleForm.classify" placeholder="请选择任务类型" style="width: 50%" @change="selectTaskType">
                <el-option label="Python" value="python" />
                <el-option label="Shell" value="shell" />
              </el-select>
            </el-form-item>
            <el-form-item label="任务" prop="content">
              <div class="codemirror-div">
                <codemirror
                  v-if="codemirrorRefresh"
                  ref="codemirror"
                  :value="ruleForm.content"
                  :options="contentOptions"
                  class="codemirror"
                />
              </div>
            </el-form-item>
          </el-form>
          <div style="text-align: center">
            <el-button type="primary" @click="dialogFormVisibleName===1?submitForm('ruleForm'):editForm('ruleForm')">提交</el-button>
            <el-button @click="open = false">取 消</el-button>
          </div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import {
  createTask,
  taskList,
  taskDetails,
  updateTask,
  deleteTask
} from '@/api/process/admin/task'

// 代码编辑器
import { codemirror } from 'vue-codemirror'
// 导入 codemirror 6.x 的语言支持
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

export default {
  name: 'Task',
  components: {
    codemirror
  },
  data() {
    return {
      dialogFormVisibleName: 1,
      queryParams: {
        pageIndex: 1,
        pageSize: 10
      },
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 总条数
      total: 0,
      // 是否显示弹出层
      open: false,
      // 查询参数
      codemirrorRefresh: true,
      taskList: [],
      ruleForm: {
        name: '',
        classify: '',
        content: ''
      },
      contentOptions: {
        extensions: [python()], // 使用 extensions 替代 mode
        flattenSpans: false,
        matchBrackets: true,
        lineWiseCopyCut: true,
        tabSize: 4,
        value: '',
        lineNumbers: true,
        line: true,
        smartIndent: true,
        autoCloseBrackets: true,
        foldGutter: true,
        indentUnit: 4,
        styleActiveLine: true,
        theme: oneDark // 可选：启用暗色主题
      },
      rules: {
        name: [
          { required: true, message: '请输入任务名称', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value.match(/^[_a-zA-Z0-9]+$/)) {
                callback()
              } else {
                callback(new Error('只能输入大小写英文及下划线'))
              }
            },
            trigger: 'blur'
          }
        ],
        classify: [
          { required: true, message: '请选择任务类型', trigger: 'change' }
        ],
        content: [
          { required: true, message: '请输入任务内容', trigger: 'blur' }
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
      taskList(this.queryParams).then(response => {
        this.taskList = response.data.list
        this.total = response.data.total
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageIndex = 1
      this.getList()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.uuid)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleCreate() {
      this.dialogFormVisibleName = 1
      this.open = true
      this.ruleForm = {
        name: '',
        classify: '',
        content: ''
      }
    },
    handleEdit(row) {
      this.dialogFormVisibleName = 2
      this.open = true
      taskDetails(row.uuid).then(response => {
        this.ruleForm = response.data
      })
    },
    handleDelete(row) {
      this.$confirm('此操作将永久删除该任务, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteTask(row.uuid).then(response => {
          this.$message.success('删除成功')
          this.getList()
        })
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          createTask(this.ruleForm).then(response => {
            this.$message.success('创建成功')
            this.open = false
            this.getList()
          })
        } else {
          return false
        }
      })
    },
    editForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          updateTask(this.ruleForm).then(response => {
            this.$message.success('修改成功')
            this.open = false
            this.getList()
          })
        } else {
          return false
        }
      })
    },
    selectTaskType() {
      if (this.ruleForm.classify === 'python') {
        this.contentOptions.extensions = [python()]
      } else if (this.ruleForm.classify === 'shell') {
        this.contentOptions.extensions = [javascript()]
      } else {
        this.contentOptions.extensions = [python()]
      }
      this.codemirrorRefresh = false
      this.$nextTick(() => {
        this.codemirrorRefresh = true
      })
    }
  }
}
