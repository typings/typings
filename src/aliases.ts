import * as bundle from './bin-bundle'
import * as init from './bin-init'
import * as uninstall from './bin-uninstall'
import * as install from './bin-install'
import * as list from './bin-list'
import * as search from './bin-search'
import * as open from './bin-open'
import * as view from './bin-view'
import * as prune from './bin-prune'

export interface Aliases {
  [cmd: string]: {
    exec (args: string[], options: Object): any;
    help (): string;
  }
}

export const aliases: Aliases = {
  // Install.
  i: install,
  in: install,
  install: install,
  // Remove.
  r: uninstall,
  rm: uninstall,
  un: uninstall,
  remove: uninstall,
  uninstall: uninstall,
  // Init.
  init: init,
  // List.
  ls: list,
  ll: list,
  la: list,
  list: list,
  // Bundle.
  bundle: bundle,
  // Search.
  search: search,
  // Open.
  open: open,
  // View.
  view: view,
  info: view,
  // Prune.
  prune: prune
}
