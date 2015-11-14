import Insight = require('insight')
import { TRACKING_CODE } from './config'

const pkg = require('../../package.json')

export default new Insight({
  pkg,
  trackingCode: TRACKING_CODE
})
