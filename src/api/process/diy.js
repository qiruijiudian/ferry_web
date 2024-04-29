import request from '@/utils/request'

// 流程结构
// export function getVerifyCode(params) {
//     return request({
//       url: '/api/v1/public/output.xlsx',
//       method: 'get',
//       params
//     })
// }

export function getVerifyCode(params) {
  return request({
    url: '/api/v1/public/output.xlsx',
    method: 'post',
    params
  })
}

export function sendSMS(params) {
  return request({
    url: '/api/v1/public/send_sms',
    method: 'post',
    data: params
  })
}
