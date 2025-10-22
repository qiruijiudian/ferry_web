import Layout from '@/layout'

const processRouter = {
  path: '/process',
  component: Layout,
  redirect: '/process/list',
  name: 'Process',
  meta: {
    title: '工单系统',
    icon: 'documentation'
  },
  children: [
    {
      path: 'list',
      component: () => import('@/views/process/list'),
      name: 'ProcessList',
      meta: { title: '工单列表', icon: 'list' }
    },
    {
      path: 'weekly-report',
      component: () => import('@/views/process/weekly-report'),
      name: 'WeeklyReport',
      meta: { title: '每周汇报', icon: 'documentation' }
    }
  ]
}

export default processRouter
