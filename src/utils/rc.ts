import rc = require('rc')
import { PROJECT_NAME } from './config'

export interface RcConfig {
  proxy?: string
  rejectUnauthorized?: boolean
  ca?: string | string[]
  key?: string
  cert?: string
}

export default rc(PROJECT_NAME) as RcConfig
