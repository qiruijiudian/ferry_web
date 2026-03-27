import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'https://order.cdqrmi.com/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 21d0a483f135421349481400ce9588b7'
  }
})

// 请求拦截器（简化，直接使用固定的token）
api.interceptors.request.use(
  function(config) {
    // 确保Authorization头存在
    if (!config.headers['Authorization']) {
      config.headers['Authorization'] = 'Bearer 21d0a483f135421349481400ce9588b7'
    }
    return config
  },
  function(error) {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  function(response) {
    // 直接返回响应数据
    return response.data
  },
  function(error) {
    console.error('API请求错误:', error)
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('未授权，请重新登录')
          break
        case 403:
          console.error('禁止访问')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          if (error.response.data && error.response.data.detail === 'Please Add Token To Your Request Headers') {
            console.error('Token缺失或无效')
            alert('Token无效或已过期，请检查token值')
          } else {
            console.error('服务器错误')
          }
          break
      }
    }
    return Promise.reject(error)
  }
)

// 初始化token（保持兼容）
export function initToken() {
  console.log('Token already initialized in API interceptor')
}

// 耗材管理相关API（从工单系统获取材料信息）
export const consumableApi = {
  // 获取工单列表（用于提取材料信息）
  getWorkOrderList: function(params) {
    if (!params) params = {}
    return api.get('/analysis/list', { params: params })
  },

  // 获取工单统计信息
  getWorkOrderAnalysis: function(params) {
    if (!params) params = {}
    return api.get('/analysis', { params: params })
  }
}

// 为了兼容现有代码，同时导出stockApi（已废弃，仅用于兼容）
export const stockApi = {
  // 获取库存列表 - 已废弃，请使用consumableApi.getWorkOrderList
  getStockList: function(params) {
    console.warn('stockApi.getStockList已废弃，请使用consumableApi.getWorkOrderList')
    return consumableApi.getWorkOrderList(params)
  },

  // 获取单个商品详情 - 已废弃
  getStockDetail: function(id) {
    console.warn('stockApi.getStockDetail已废弃')
    return Promise.resolve({})
  },

  // 新增商品 - 已废弃
  createGoods: function(data) {
    console.warn('stockApi.createGoods已废弃')
    return Promise.resolve({ success: true })
  },

  // 更新商品 - 已废弃
  updateGoods: function(id, data) {
    console.warn('stockApi.updateGoods已废弃')
    return Promise.resolve({ success: true })
  },

  // 删除商品 - 已废弃
  deleteGoods: function(id) {
    console.warn('stockApi.deleteGoods已废弃')
    return Promise.resolve({ success: true })
  },

  // 入库操作 - 已废弃
  stockIn: function(data) {
    console.warn('stockApi.stockIn已废弃')
    return Promise.resolve({ success: true, message: '功能已调整' })
  },

  // 出库操作 - 已废弃
  stockOut: function(data) {
    console.warn('stockApi.stockOut已废弃')
    return Promise.resolve({ success: true, message: '功能已调整' })
  },

  // 获取商品种类列表 - 已废弃
  getGoodsSortList: function(params) {
    console.warn('stockApi.getGoodsSortList已废弃，请使用consumableApi')
    return Promise.resolve([])
  },

  // 或者单独获取count - 已废弃
  getGoodsSortCount: function() {
    console.warn('stockApi.getGoodsSortCount已废弃')
    return Promise.resolve({ count: 0 })
  }
}

export default api
