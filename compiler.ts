import { Stmt, Expr } from "./ast";
import { parse } from "./parser";

// https://learnxinyminutes.com/docs/wasm/

type LocalEnv = Map<string, boolean>;

type CompileResult = {
  wasmSource: string,
};

export function compile(source: string) : CompileResult {
  const ast = parse(source);

  console.log("Parsed source = " + ast);

  const definedVars = new Set();
  ast.forEach(s => {
    switch(s.tag) {
      case "define":
        definedVars.add(s.name);
        break;
    }
  }); 
  const scratchVar : string = `(local $$last i32)`;
  const localDefines = [scratchVar];
  definedVars.forEach(v => {
    localDefines.push(`(local $${v} i32)`);
  })
  
  // console.log("Local defined variables = " + localDefines);
  const assignedVars = new Set();

  const commandGroups = ast.map((stmt) => codeGen(stmt, definedVars, assignedVars));

  // console.log("Command groups = " + commandGroups);

  const commands = localDefines.concat([].concat.apply([], commandGroups));

  console.log("Generated: ", commands.join("\n"));

  return {
    wasmSource: commands.join("\n"),
  };
}

function codeGen(stmt: Stmt, definedVars: Set<unknown>, assignedVars: Set<unknown>) : Array<string> {
  switch(stmt.tag) {
    case "define":
      var valStmts = codeGenExpr(stmt.value, definedVars, assignedVars);
      assignedVars.add(stmt.name);
      return valStmts.concat([`(local.set $${stmt.name})`]);
    case "expr":
      var exprStmts = codeGenExpr(stmt.expr, definedVars, assignedVars);
      return exprStmts.concat([`(local.set $$last)`]);
  }
}

function codeGenExpr(expr : Expr, definedVars: Set<unknown>, assignedVars: Set<unknown>) : Array<string> {
  switch(expr.tag) {
    case "builtin1":
      const argStmts = codeGenExpr(expr.arg, definedVars, assignedVars);
      return argStmts.concat([`(call $${expr.name})`]);
    case "builtin2":
      const arg1Stmts = codeGenExpr(expr.arg1, definedVars, assignedVars);
      const arg2Stmts = codeGenExpr(expr.arg2, definedVars, assignedVars);
      return [...arg1Stmts, ...arg2Stmts].concat([`(call $${expr.name})`]);
    case "num":
      if (!Number.isInteger(expr.value)){
        throw new Error("CompileError: Invalid Literal / ParseError");
      }
      return ["(i32.const " + expr.value + ")"];
    case "id":
      if (!definedVars.has(expr.name) || !assignedVars.has(expr.name)){
        throw new Error("ReferenceError: Undefined variable " + expr.name);
      }
      return [`(local.get $${expr.name})`];
    case "binOperator":
      const left_expr_commands = codeGenExpr(expr.left, definedVars, assignedVars);
      const right_expr_commands = codeGenExpr(expr.right, definedVars, assignedVars);
      const operator_commands = codeGenBinOperation(expr.op);
      return [...left_expr_commands, ...right_expr_commands, ...operator_commands];
    case "unaryOperator":
      const arg_commands = codeGenExpr(expr.arg, definedVars, assignedVars);
      if (expr.op == "+"){
        return arg_commands;
      }
      return [...arg_commands, '(i32.const -1)', '(i32.mul)'];
  }
}

function codeGenBinOperation(operation: string) : Array<string> {
  switch(operation) {
    case "+":
      return ["(i32.add)"];
    case "-":
      return ["(i32.sub)"];
    case "*":
      return ["(i32.mul)"];
    default:
      throw new Error("Compile Error: Unrecognized binary operator -> " + operation);
  }

}