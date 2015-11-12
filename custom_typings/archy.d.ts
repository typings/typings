declare module "archy" {
  function archy (obj: archy.Tree, prefix?: string, opts?: archy.Options): string

  module archy {
    interface Tree {
      label: string
      nodes: Array<string | Tree>
    }

    interface Options {
      unicode?: boolean
    }
  }

  export = archy
}
