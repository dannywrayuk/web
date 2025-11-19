#!/usr/bin/env node

type Message = {
  text: string;
};

const message: Message = {
  text: "Hello bin.{{name}}!",
};

console.log(message);
