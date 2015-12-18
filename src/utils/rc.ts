import rc = require('rc')
import { PROJECT_NAME } from './config'

export interface RcConfig {
  proxy?: string
}

export default rc(PROJECT_NAME) as RcConfig
