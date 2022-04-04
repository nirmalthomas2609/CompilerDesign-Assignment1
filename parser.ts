import {parser} from "lezer-python";
import {TreeCursor} from "lezer-tree";
import {Expr, Stmt} from "./ast";

export function traverseExpr(c : TreeCursor, s : string) : Expr {
  switch(c.type.name) {
    case "Number":
      return {
        tag: "num",
        value: Number(s.substring(c.from, c.to))
      }
    case "VariableName":
      return {
        tag: "id",
        name: s.substring(c.from, c.to)
      }
    case "BinaryExpression":
      c.firstChild(); //Move into the parsing the expression
      const arg1  = traverseExpr(c, s);
      c.nextSibling();
      const operation = s.substring(c.from, c.to);
      if (!["+", "-", "*"].includes(operation)){
        throw new Error("Operation not recognized: " + s.substring(c.from, c.to) + " / ParseError");
      }
      c.nextSibling();
      const arg2 = traverseExpr(c, s);
      c.parent();
      return {
        tag: 'binOperator',
        left: arg1,
        op: operation,
        right: arg2
      }
    case "UnaryExpression":
      c.firstChild(); //Move into the number
      const unary_operator = s.substring(c.from, c.to);
      if (!['+', '-'].includes(unary_operator)){
        throw new Error("UnaryOperation not recognized: " + s.substring(c.from, c.to) + " / ParseError");
      }
      c.nextSibling();
      const arg = traverseExpr(c, s);
      c.parent();
      return {
        tag: 'unaryOperator',
        arg: arg,
        op: unary_operator
      }
    case "CallExpression":
      c.firstChild();
      const callName = s.substring(c.from, c.to);
      let argList: Array<Expr> = [];
      c.nextSibling(); // go to arglist
      // console.log("As part of parsing the expression 1 at " + s.substring(c.from, c.to));
      c.firstChild(); //Open bracket
      c.nextSibling(); //First argument expression
      // console.log("Supposedly the first argument expression " + s.substring(c.from, c.to));
      while(s.substring(c.from, c.to) != ')'){
        argList.push(traverseExpr(c, s));
        c.nextSibling();
        if (s.substring(c.from, c.to) == ',') c.nextSibling();
      }
      c.parent(); //Pop ArgList
      c.parent(); //Post Expression
      switch(argList.length){
        case 1:
          if (!["print", "abs"].includes(callName)){
            throw new Error("Compile Error: Function " + callName + " not recognized / ParseError");
          }
          return {
            tag: "builtin1",
            name: callName,
            arg: argList[0]
          };
        case 2:
          if (!["max", "min", "pow"].includes(callName)){
            throw new Error("Compile Error: Function " + callName + " not recognized / ParseError");
          }
          return {
            tag: "builtin2",
            name: callName,
            arg1: argList[0],
            arg2: argList[1]
          };
        default:
          throw new Error("Operation not recognized: " + s.substring(c.from, c.to) + " / ParseError");
      }

    default:
      throw new Error("Could not parse expr at " + c.from + " " + c.to + ": " + s.substring(c.from, c.to) + " with node type " + c.type.name + " / ParseError");
  }
}

export function traverseStmt(c : TreeCursor, s : string) : Stmt {
  switch(c.node.type.name) {
    case "AssignStatement":
      c.firstChild(); // go to name
      const name = s.substring(c.from, c.to);
      c.nextSibling(); // go to equals
      c.nextSibling(); // go to value
      const value = traverseExpr(c, s);
      c.parent();
      return {
        tag: "define",
        name: name,
        value: value
      }
    case "ExpressionStatement":
      c.firstChild();
      const expr = traverseExpr(c, s);
      c.parent(); // pop going into stmt
      return { tag: "expr", expr: expr }
    default:
      throw new Error("ParseError: Could not parse stmt at " + c.node.from + " " + c.node.to + ": " + s.substring(c.from, c.to) + " with node type " + c.node.type.name);
  }
}

export function traverse(c : TreeCursor, s : string) : Array<Stmt> {
  switch(c.node.type.name) {
    case "Script":
      const stmts = [];
      c.firstChild();
      do {
        stmts.push(traverseStmt(c, s));
      } while(c.nextSibling())
      console.log("traversed " + stmts.length + " statements ", stmts, "stopped at " , c.node);
      return stmts;
    default:
      throw new Error("ParseError: Could not parse program at " + c.node.from + " " + c.node.to);
  }
}
export function parse(source : string) : Array<Stmt> {
  const t = parser.parse(source);
  return traverse(t.cursor(), source);
}