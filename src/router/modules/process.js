import Layout from '@/layout'

const processRouter = {
  path: '/process',
  component: Layout,
  redirect: '/process/list',
  name: 'Process',
  meta: {
    title: '工单中心',
    icon: 'form'
  },
  children: [
    {
      path: 'list',
      component: () => import('@/views/process/list/index'),
      name: 'ProcessList',
      meta: { title: '工单列表', icon: 'list' }
    },
    {
      path: 'create',
      component: () => import('@/views/process/list/create'),
      name: 'CreateProcess',
      meta: { title: '创建工单', icon: 'edit' }
    },
    {
      path: 'classify',
      component: () => import('@/views/process/admin/classify'),
      name: 'ProcessClassify',
      meta: { title: '工单分类', icon: 'nested' }
    },
    {
      path: 'manager',
      component: () => import('@/views/process/admin/process-manager'),
      name: 'ProcessManager',
      meta: { title: '流程管理', icon: 'guide' }
    },
    {
      path: 'template',
      component: () => import('@/views/process/admin/template'),
      name: 'ProcessTemplate',
      meta: { title: '模板管理', icon: 'template' }
    },
    {
      path: 'monitor',
      component: () => import('@/views/process/admin/monitor'),
      name: 'ProcessMonitor',
      meta: { title: '流程监控', icon: 'monitor' }
    },
    {
      path: 'report',
      component: () => import('@/views/process/list/maintenance-report'),
      name: 'MaintenanceReport',
      meta: { title: '维修分析报告', icon: 'chart' }
    },
    {
      path: 'consumable',
      component: () => import('@/views/process/list/consumable-management'),
      name: 'ConsumableManagement',
      meta: { title: '耗材管理', icon: 'box' }
    },
    {
      path: 'worker-kpi',
      component: () => import('@/views/process/list/worker-kpi'),
      name: 'WorkerKPI',
      meta: { title: '人员KPI考核', icon: 'user-solid' }
    }
  ]
}

export default processRouter
