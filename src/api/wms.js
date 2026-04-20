import request from '@/utils/request'

const wmsApi = {
  getGoodsList(params) {
    return request({
      url: '/api/v1/wms/goods',
      method: 'get',
      params
    })
  },

  getGoodsDetail(id) {
    return request({
      url: '/api/v1/wms/goods/' + id,
      method: 'get'
    })
  },

  createGoods(data) {
    return request({
      url: '/api/v1/wms/goods',
      method: 'post',
      data
    })
  },

  updateGoods(data) {
    return request({
      url: '/api/v1/wms/goods',
      method: 'put',
      data
    })
  },

  deleteGoods(id) {
    return request({
      url: '/api/v1/wms/goods/' + id,
      method: 'delete'
    })
  },

  getInboundList(params) {
    return request({
      url: '/api/v1/wms/inbound',
      method: 'get',
      params
    })
  },

  createInbound(data) {
    return request({
      url: '/api/v1/wms/inbound',
      method: 'post',
      data
    })
  },

  getOutboundList(params) {
    return request({
      url: '/api/v1/wms/outbound',
      method: 'get',
      params
    })
  },

  createOutbound(data) {
    return request({
      url: '/api/v1/wms/outbound',
      method: 'post',
      data
    })
  },

  getHistoryList(params) {
    return request({
      url: '/api/v1/wms/history',
      method: 'get',
      params
    })
  },

  revertHistory(id) {
    return request({
      url: '/api/v1/wms/history/revert/' + id,
      method: 'post'
    })
  },

  getItemByCode(code) {
    return request({
      url: '/api/v1/wms/item/code/' + code,
      method: 'get'
    })
  },

  getItemList(params) {
    return request({
      url: '/api/v1/wms/item',
      method: 'get',
      params
    })
  },

  importGoods(data) {
    return request({
      url: '/api/v1/wms/import',
      method: 'post',
      data
    })
  },

  getDashboardStats() {
    return request({
      url: '/api/v1/wms/dashboard/stats',
      method: 'get'
    })
  },

  checkPermission(permission) {
    return request({
      url: '/api/v1/wms/check-permission',
      method: 'post',
      data: { permission: permission }
    })
  }
}

export default wmsApi
