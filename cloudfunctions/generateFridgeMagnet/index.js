// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// API 配置
const API_URL = 'https://b3k6r562p7.coze.site/run'
const API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImY5MGI2N2VmLWNlZjQtNDkwNC05N2EyLTAxZDdmOWRkYWRmZSJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkUwS1hGNnJjcXhIeU5lS1p0em1uMkRtdEJvd1k1QTFSIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzc4ODI1MjU0LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjM5OTU5ODAyMDEzMDI0MjY2Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjM5OTk2MjkxNzExMjM4MTYzIn0.Ooxp_JKXmNqP7QGDSOlNc-63Z5thRvLgR88ZLIFf_0x7fpkzQ-NrJOhmxb4vglrjs9hNOOypAWVU9-Mja6EKnCK_HsQVvKkK3u9Z_0vXxunPlL4yp7GWe4oyAZG8ERTUrnhRG4Xwr_ZTI425j4bk1QQpUpcP6ITmM6-o2kFYkG_e1bD0TcpJa4Ad4IRM-t5Ul4sBaXA_fRqruwFyWoN_CUSyqIWGnrzXC-RRJbsW4MpB581Tr9OrbxZ3HkpABOsWBP8Tx0GP_I4RggtLxdpWW63vyUHyzNA6NIRX1j2iu6WlpUvZj-XadRZejRqvfTxkHgvUMYZ3lIS-i8Dl-iR9lw'

// 云函数入口函数
exports.main = async (event, context) => {
  const { imageUrl } = event

  try {
    const response = await cloud.httpclient.request({
      url: API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      data: {
        input_image: {
          url: imageUrl,
          file_type: 'image'
        }
      },
      timeout: 120000, // 2分钟超时
      dataType: 'json'
    })

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('API调用失败:', error)
    return {
      success: false,
      error: error.message || '生成失败，请重试'
    }
  }
}