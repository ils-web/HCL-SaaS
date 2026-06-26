const fs = require('fs');
let html = fs.readFileSync('tenant-app/public/admin.html', 'utf8');

const startMarker = '    <!-- Banners Settings Modal -->';
const endMarker = '    </div>\n\n</body></html>\n            `);';

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const sectionToRemove = html.substring(startIdx, endIdx);
    
    // The actual modal is sectionToRemove but we remove the trailing `</body></html>\n            `);` if it's there
    // wait, endMarker is NOT in sectionToRemove because substring excludes it.
    // So sectionToRemove is JUST the modal + whitespace.
    // Wait, the endMarker is '    </div>\n\n</body></html>\n            `);'
    // So sectionToRemove ends with the char BEFORE '    </div>'
    // Let's just use string replacement.
    
    // First, let's just grab the whole modal string using regex or simple search.
    const modalEnd = html.indexOf('</div>', startIdx + 500); // just to find the end
    // actually, the modal has 3 nested divs.
    
    // Let's find exactly the block:
    const blockEnd = html.indexOf('</body></html>\n            `);');
    const modalBlock = html.substring(startIdx, blockEnd); // this contains the modal
    
    // Remove the modal from inside the printQR function
    html = html.substring(0, startIdx) + '\n</body></html>\n            `);' + html.substring(blockEnd + '</body></html>\n            `);'.length);
    
    // Now inject the modal at the bottom of the real HTML
    const realBodyClose = html.lastIndexOf('</body>');
    html = html.substring(0, realBodyClose) + modalBlock + '\n\n' + html.substring(realBodyClose);
    
    fs.writeFileSync('tenant-app/public/admin.html', html);
    console.log('Successfully moved Banners Settings Modal!');
} else {
    console.log('Could not find markers');
}
