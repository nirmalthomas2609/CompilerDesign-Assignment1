const python = require('lezer-python');


var fs = require('fs');

fs.readFile('source.py', 'utf8', function(err, input) {
    if (err) throw err;
    const tree = python.parser.parse(input);

    const cursor = tree.cursor();

    do {
    //  console.log(cursor.node);
      console.log(cursor.node.type.name);
      console.log(input.substring(cursor.node.from, cursor.node.to));
    } while(cursor.next());
});