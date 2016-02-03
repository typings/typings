import rc = require('rc')
import extend = require('xtend')
import { PROJECT_NAME } from './config'

export interface RcConfig {
  proxy?: string
  httpProxy?: string
  httpsProxy?: string
  noProxy?: string
  rejectUnauthorized?: boolean
  ca?: string | string[]
  key?: string
  cert?: string
  userAgent?: string
}

export const DEFAULTS = {
  userAgent: `${PROJECT_NAME}/{typingsVersion} node/{nodeVersion} {platform} {arch}`
}

export default extend(DEFAULTS, rc(PROJECT_NAME)) as RcConfig
