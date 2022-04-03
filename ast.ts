
export type Stmt =
  | { tag: "define", name: string, value: Expr }
  | { tag: "expr", expr: Expr }

export type Expr =
    { tag: "num", value: number }
  | { tag: "id", name: string }
  | { tag: "builtin1", name: string, arg: Expr }
  | { tag: "binOperator", left: Expr, right: Expr, op: string}
  | { tag: "builtin2", name: string, arg1: Expr, arg2: Expr}
  | { tag: "unaryOperator", op: string, arg: Expr}
  | { tag: "signedNum", op: string, arg: number}