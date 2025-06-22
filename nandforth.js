const fs = require("fs");

fs.readFile("main.fs", "utf8", (err, data) => {
  if (err) return console.error("Error reading file:", err);
  run(parse(data)); rl.prompt();
});

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on("line", input => { run(parse(input)); rl.prompt(); });
const parse = (string) => string.split(/\s+/).filter(token => token != "");

let [ptr, stk, rtn, adr, mem] = [[], [], [], [], []];

function run(instr) {
  ptr.unshift(-1);
  while (ptr[0]++ < instr.length - 1) {
    if (is_primitive(instr)) continue;
    if (is_macro(instr)) continue;
    if (is_literal(instr)) continue;
    error(`>>>${instr[ptr[0]]}<<< Not a word.`); return;
  };
  ptr.shift();
};

function error(message) {
  [ptr, stk, rtn, adr, mem] = [[], [], [], [], []];
  console.log(message);
};

function is_literal(instr) {
  const token = instr[ptr[0]];
  if (token[0] !== "0") return false;
  let num; const val = token.slice(2, token.length);
  switch (["b", "d", "x"].indexOf(token[1])) {
    case 0: num = parseInt(val, 2); break;
    case 1: num = parseInt(val, 10); break;
    case 2: num = parseInt(val, 16); break;
    default: return false;
  };
  if (Number.isNaN(num)) return false;
  stk.push(...num
    .toString(2)
    .padStart(val.length, 0)
    .split("")
    .map(str => +str)
  );
  return true;
};

function is_primitive(instr) {
  const token = instr[ptr[0]];
  const i = list.findIndex(obj => obj.name === token);
  if (i < 0) return false;
  list[i].exec(instr);
  return true;
};

function is_macro(instr) {
  const token = instr[ptr[0]];
  const i = macro.findIndex(obj => obj.name === token);
  if (i < 0) return false;
  run(macro[i].def);
  return true;
}

const macro = [];
const list = [{
    name: "0",
    exec: () => stk.push(0)
  }, {
    name: "1",
    exec: () => stk.push(1)
  }, {
    name: "nand",
    exec: () => stk.push((stk.pop() + stk.pop() > 1) ? 0 : 1)
  }, {
    name: "drop",
    exec: () => stk.pop()
  }, {
    name: "dup",
    exec: () => stk.push(stk.at(-1))
  }, {
    name: "over",
    exec: () => stk.push(stk.at(-2))
  }, {
    name: ">r",
    exec: () => rtn.push(stk.pop())
  }, {
    name: "r>",
    exec: () => stk.push(rtn.pop())
  }, {
    name: ">a",
    exec: () => adr.push(stk.pop())
  }, {
    name: "a>",
    exec: () => stk.push(adr.pop())
  }, {
    name: "!",
    exec: () => {
      const addr = adr.join("");
      const val = stk; stk = [];
      const i = mem.findIndex(obj => obj.addr === addr);
      if (i < 0) return mem.push({addr: addr, val: val});
      mem[i] = {addr: addr, val: val};
    }
  }, {
    name: "@",
    exec: () => {
      const addr = adr.join("");
      const i = mem.findIndex(obj => obj.addr === addr);
      if (i >= 0) stk.push(mem[i].val);
    }
  }, {
    name: "if",
    exec: (instr) => {
      if (stk.pop() === 1) return;
      while (ptr[0]++ < instr.length - 1) {
        if (instr[ptr[0]] === "else") break;
        if (instr[ptr[0]] === "then") break;
      }
    }
  }, {
    name: "else",
    exec: (instr) => {
      while (ptr[0]++ < instr.length - 1)
        if (instr[ptr[0]] === "then") break;
    }
  }, {
    name: "then",
    exec: () => {}
  }, {
    name: "jump",
    exec: (instr) => {
      while (ptr[0]-- > 0)
        if (instr[ptr[0]] === "here") break;
    }
  }, {
    name: "here",
    exec: () => {}
  }, {
    name: ":",
    exec: (instr) => {
      ptr[0]++;
      const name = instr[ptr[0]];
      const def = [];
      while (ptr[0]++ < instr.length - 1) {
        if (instr[ptr[0]] === ";") break;
        def.push(instr[ptr[0]]);
      }
      macro.unshift({name: name, def: def});
    }
  }, {
    name: "(",
    exec: (instr) => {
      while (ptr[0]++ < instr.length - 1)
        if (instr[ptr[0]] === ")") break;
    }
// EXTENSION WORDS
  }, {
    name: "0b",
    exec: (instr) => {
      ptr[0]++;
      const token = instr[ptr[0]];
      if (!/^[01]+$/.test(token))
        return error(`>>>${token}<<< Not a valid binary string.`);
      stk.push(
        ...parseInt(token, 2)
        .toString(2)
        .padStart(token.length, "0")
        .split("")
        .map(str => +str)
      );
    }
  }, {
    name: "0x",
    exec: (instr) => {
      ptr[0]++;
      const token = instr[ptr[0]];
      if (!/^[0-9a-f]+$/.test(token))
        return error(`>>>${token}<<< Not a valid hex string.`);
      stk.push(
        ...parseInt(token, 16)
        .toString(2)
        .padStart(token.length * 4, "0")
        .split("")
        .map(str => +str)
      );
    }
  }, {
    name: ".",
    exec: print
  }, {
    name: ".b", // print binary format
    exec: () => console.log(bin_bin(stk.join("")))
  }, {
    name: ".x", // print hex format
    exec: () => console.log(bin_hex(stk.join("")))
  }, {
    name: ".d", // print decimal format
    exec: () => console.log(bin_dec(stk.join("")))
  }, {
    name: "words",
    exec: () => {
      const words = [];
      for (let i = macro.length - 1; i >= 0; i--)
        words.push(macro[i].name);
      console.log(words.join(" "));
    }
  }, {
    name: "see",
    exec: (instr) => {
      ptr[0]++; const name = instr[ptr[0]];
      const i = macro.findIndex(obj => obj.name === name);
      if (i < 0) return console.log(`>>>${name}<<< Undefined word.`);
      console.log(`: ${name} ${macro[i].def.join(" ")} ;`);
    }
  }, {
    name: "list",
    exec: () => macro.forEach(obj => console.log(`: ${obj.name} ${obj.def.join(" ")} ;`))
}];

const bin_bin = str => parseInt(str, 2).toString(2).padStart(str.length, "0");
const bin_dec = str => parseInt(str, 2).toString(10);
const bin_hex = str => parseInt(str, 2).toString(16).padStart(Math.ceil(str.length / 4), "0");

function print() {
  for (let i=0; i<mem.length; i++)
  console.log(`0b${mem[i].addr}: ${mem[i].val.join("")} ${bin_hex(mem[i].val.join(""))}`);
  const _stk = stk.join("");
  const _rtn = rtn.join("");
  const _adr = adr.join("");
  console.log(`stk: <${stk.length}> 0b${bin_bin(_stk)} 0x${bin_hex(_stk)}`);
  console.log(`rtn: <${rtn.length}> 0b${bin_bin(_rtn)} 0x${bin_hex(_rtn)}`);
  console.log(`adr: <${adr.length}> 0b${bin_bin(_adr)} 0x${bin_hex(_adr)}`);
};
