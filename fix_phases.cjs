const fs = require('fs');

function processFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  const phases = ['intro', 'capturing', 'processing', 'done', 'error', 'result', 'scoring'];
  
  for (const phase of phases) {
    const searchString = `{phase === '${phase}' && (`;
    const searchString2 = `{(phase === '${phase}') && (`;
    let startIndex = code.indexOf(searchString);
    let matchedStr = searchString;
    
    if (startIndex === -1) {
      startIndex = code.indexOf(searchString2);
      matchedStr = searchString2;
    }
    
    if (startIndex !== -1) {
      let braceCount = 1; // for the opening '('
      let i = startIndex + matchedStr.length;
      let endIndex = -1;
      
      while (i < code.length) {
        if (code[i] === '(') braceCount++;
        if (code[i] === ')') {
          braceCount--;
          if (braceCount === 0) {
            // We found the matching closing parenthesis!
            // The structure is `)}`
            if (code[i+1] === '}') {
              endIndex = i + 1;
              break;
            }
          }
        }
        i++;
      }
      
      if (endIndex !== -1) {
        // We found the block!
        // Replace `{phase === 'xyz' && (` with `<div style={{ display: phase === '${phase}' ? 'block' : 'none', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>`
        // Wait, the inner div ALREADY has styles!
        // So we can just wrap the inner div in a wrapper div that controls display!
        // Replace `{phase === 'xyz' && (` with `<div style={{ display: phase === '${phase}' ? 'block' : 'none', width: '100%' }}>`
        // And replace the closing `)}` with `</div>`
        
        const before = code.substring(0, startIndex);
        const middle = code.substring(startIndex + matchedStr.length, endIndex - 1); // -1 to drop the ')'
        const after = code.substring(endIndex + 1);
        
        let displayType = 'block';
        if (phase === 'intro' || phase === 'capturing' || phase === 'processing' || phase === 'done' || phase === 'error' || phase === 'result' || phase === 'scoring') {
          // If we wrap it, it should just be block or contents.
        }
        
        code = before + `\n        <div style={{ display: phase === '${phase}' ? 'flex' : 'none', width: '100%', justifyContent: 'center' }}>\n` + middle + `\n        </div>\n` + after;
      }
    }
  }
  
  fs.writeFileSync(filePath, code);
  console.log('Fixed', filePath);
}

processFile('src/pages/Enroll.jsx');
processFile('src/pages/Auth.jsx');
