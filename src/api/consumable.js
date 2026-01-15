import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'https://wms.cdqrmi.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'token': '21d0a483f135421349481400ce9588b7' // 这里直接写死token
  }
})

// 请求拦截器（简化，直接使用固定的token）
api.interceptors.request.use(
  function(config) {
    // 直接使用固定token，不再从localStorage获取
    // 如果需要，也可以在这里添加固定的token
    if (!config.headers.token) {
      config.headers.token = '21d0a483f135421349481400ce9588b7'
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

// 商品管理相关API
export const goodsApi = {
  // 获取商品列表（支持分页）
  getGoodsList: function(params) {
    if (!params) params = {}
    return api.get('/goods/', { params: params })
  },

  // 获取单个商品详情
  getGoodsDetail: function(id) {
    return api.get(`/goods/${id}/`)
  },

  // 新增商品
  createGoods: function(data) {
    return api.post('/goods/create/', data)
  },

  // 更新商品
  updateGoods: function(id, data) {
    return api.put(`/goods/${id}/update/`, data)
  },

  // 删除商品
  deleteGoods: function(id) {
    return api.delete(`/goods/${id}/delete/`)
  },

  // 获取商品相关列表（单位、分类、品牌等）
  getGoodsOptions: function() {
    return api.get('/goods/options/')
  }
}

// 为了兼容现有代码，同时导出stockApi
export const stockApi = {
  // 获取库存列表 - 使用商品接口
  getStockList: function(params) {
    if (!params) params = {}
    // 确保token存在
    if (!api.defaults.headers['token']) {
      api.defaults.headers['token'] = '21d0a483f135421349481400ce9588b7'
    }
    return api.get('/goods/', { params: params })
  },

  // 获取单个商品详情
  getStockDetail: function(id) {
    return api.get(`/goods/${id}/`)
  },

  // 新增商品
  createGoods: function(data) {
    // 根据API文档调整字段映射
    const postData = {
      goods_code: data.goods_code,
      goods_desc: data.goods_desc,
      goods_specs: data.goods_specs || '-',
      goods_supplier: data.supplier || 'Supplier Name-1',
      goods_weight: data.goods_weight || 1.0,
      goods_w: data.goods_w || 1.0,
      goods_d: data.goods_d || 1.0,
      goods_h: data.goods_h || 1.0,
      goods_unit: data.unit || 'Piece',
      goods_class: 'Industrial',
      goods_brand: 'Brand Name-1',
      goods_color: 'Indigo',
      goods_shape: 'Cylinder',
      goods_origin: 'Kamba_1',
      goods_cost: data.goods_cost || 1.0,
      goods_price: data.goods_price || 1.0,
      bar_code: data.bar_code || '',
      creater: 'admin'
    }
    return api.post('/goods/create/', postData)
  },

  // 更新商品
  updateGoods: function(id, data) {
    const updateData = {
      goods_code: data.goods_code,
      goods_desc: data.goods_desc,
      goods_specs: data.goods_specs || '-',
      goods_supplier: data.supplier || 'Supplier Name-1',
      goods_weight: data.goods_weight || 1.0,
      goods_unit: data.unit || 'Piece',
      goods_cost: data.goods_cost || 1.0,
      goods_price: data.goods_price || 1.0,
      bar_code: data.bar_code || ''
    }
    return api.put(`/goods/${id}/update/`, updateData)
  },

  // 删除商品
  deleteGoods: function(id) {
    return api.delete(`/goods/${id}/delete/`)
  },

  // 入库操作 - 需要根据实际API调整
  stockIn: function(data) {
    console.log('入库操作:', data)
    return Promise.resolve({ success: true, message: '入库成功' })
  },

  // 出库操作 - 需要根据实际API调整
  stockOut: function(data) {
    console.log('出库操作:', data)
    return Promise.resolve({ success: true, message: '出库成功' })
  }
}

// 在页面加载时自动设置token
export const initToken = function() {
  const token = '21d0a483f135421349481400ce9588b7'
  api.defaults.headers['token'] = token
  localStorage.setItem('wms_token', token) // 同时也存到localStorage
  console.log('Token已初始化')
}

// 立即初始化token
initToken()

export default api
