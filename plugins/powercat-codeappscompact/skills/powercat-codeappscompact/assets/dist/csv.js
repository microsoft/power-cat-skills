export function parseCsv(input) {
    const text = input.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    let closed = false;
    const pushCell = () => { row.push(cell); cell = ''; closed = false; };
    const pushRow = () => { pushCell(); rows.push(row); row = []; };
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    cell += '"';
                    i++;
                }
                else {
                    quoted = false;
                    closed = true;
                }
            }
            else
                cell += char;
        }
        else if (char === ',')
            pushCell();
        else if (char === '\r' || char === '\n') {
            if (char === '\r' && text[i + 1] === '\n')
                i++;
            pushRow();
        }
        else if (char === '"' && !cell && !closed)
            quoted = true;
        else {
            if (closed || char === '"')
                throw new Error(`Malformed CSV near character ${i + 1}.`);
            cell += char;
        }
    }
    if (quoted)
        throw new Error('Unclosed quoted CSV value.');
    if (cell || row.length || closed)
        pushRow();
    return rows;
}
export function toCsv(headers, rows) {
    const cell = (value) => `"${String(value).replaceAll('"', '""')}"`;
    return [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
export function downloadCsv(name, text) {
    if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function')
        throw new Error('This browser does not support CSV downloads.');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    try {
        link.click();
    }
    finally {
        link.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
