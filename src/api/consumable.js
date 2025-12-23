import axios from 'axios'

// 创建axios实例
var api = axios.create({
  baseURL: 'http://192.168.1.20:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  function(config) {
    var token = localStorage.getItem('token') || ''
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
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
          console.error('服务器错误')
          break
      }
    }
    return Promise.reject(error)
  }
)

// 库存相关API
export var stockApi = {
  // 获取库存列表
  getStockList: function(params) {
    if (!params) params = {}
    return api.get('/stock/list', { params: params })
  },

  // 获取单个商品详情
  getStockDetail: function(id) {
    return api.get('/stock/' + id)
  },

  // 新增商品
  createGoods: function(data) {
    return api.post('/stock/create', data)
  },

  // 更新商品
  updateGoods: function(id, data) {
    return api.put('/stock/update/' + id, data)
  },

  // 删除商品
  deleteGoods: function(id) {
    return api.delete('/stock/delete/' + id)
  },

  // 入库操作
  stockIn: function(data) {
    return api.post('/stock/in', data)
  },

  // 出库操作
  stockOut: function(data) {
    return api.post('/stock/out', data)
  },

  // 获取库存统计
  getStatistics: function() {
    return api.get('/stock/statistics')
  }
}

// 分类相关API（如果需要的话）
export var categoryApi = {
  getCategories: function() {
    return api.get('/categories')
  },

  createCategory: function(data) {
    return api.post('/categories', data)
  }
}

export default api
