const { GATE_SYLLABUS } = require('../data/gate-data.js');

const pdfSections = {
  em: {
    name: 'Engineering Mathematics',
    items: [
      // Discrete Mathematics:
      'Propositional and first order logic',
      'Sets',
      'Relations',
      'Functions',
      'Partial orders and lattices',
      'Monoids',
      'Groups',
      'Graphs',
      'Connectivity',
      'Matching',
      'Coloring',
      'Counting',
      'Recurrence relations',
      'Generating functions',
      // Linear Algebra:
      'Matrices',
      'Determinants',
      'System of linear equations',
      'Eigenvalues/eigenvectors',
      'LU decomposition',
      // Calculus:
      'Limits',
      'Continuity/differentiability',
      'Maxima/minima',
      'Mean value theorem',
      'Integration',
      // Probability and Statistics:
      'Random variables',
      'Uniform distribution',
      'Normal distribution',
      'Exponential distribution',
      'Poisson distribution',
      'Binomial distribution',
      'Mean',
      'Median',
      'Mode',
      'Standard deviation',
      'Conditional probability',
      'Bayes theorem'
    ]
  },
  dl: {
    name: 'Digital Logic',
    items: [
      'Boolean algebra',
      'Combinational circuits',
      'Sequential circuits',
      'Minimization',
      'Number representations',
      'Computer arithmetic',
      'Fixed-point',
      'Floating-point'
    ]
  },
  coa: {
    name: 'Computer Organization and Architecture',
    items: [
      'Machine instructions',
      'Addressing modes',
      'ALU',
      'Datapath',
      'Control',
      'Instruction pipelining',
      'Pipeline hazards',
      'Cache',
      'Main memory',
      'Secondary storage',
      'I/O interface',
      'Interrupt',
      'DMA'
    ]
  },
  pds: {
    name: 'Programming and Data Structures',
    items: [
      'C programming',
      'Recursion',
      'Arrays',
      'Stacks',
      'Queues',
      'Linked lists',
      'Trees',
      'Binary search trees',
      'Binary heaps',
      'Graphs'
    ]
  },
  algo: {
    name: 'Algorithms',
    items: [
      'Searching',
      'Sorting',
      'Hashing',
      'Asymptotic worst-case time',
      'Asymptotic worst-case space',
      'Greedy',
      'Dynamic programming',
      'Divide-and-conquer',
      'Graph traversals',
      'Minimum spanning trees',
      'Shortest paths'
    ]
  },
  toc: {
    name: 'Theory of Computation',
    items: [
      'Regular expressions',
      'Finite automata',
      'Context-free grammars',
      'Pushdown automata',
      'Regular languages',
      'Context-free languages',
      'Pumping lemma',
      'Turing machines',
      'Undecidability'
    ]
  },
  cd: {
    name: 'Compiler Design',
    items: [
      'Lexical analysis',
      'Parsing',
      'Syntax-directed translation',
      'Runtime environments',
      'Intermediate code generation',
      'Local optimization',
      'Data-flow analyses',
      'Constant propagation',
      'Liveness analysis',
      'Common subexpression elimination'
    ]
  },
  os: {
    name: 'Operating System',
    items: [
      'System calls',
      'Processes',
      'Threads',
      'IPC',
      'Concurrency',
      'Synchronization',
      'Deadlock',
      'CPU scheduling',
      'I/O scheduling',
      'Memory management',
      'Virtual memory',
      'File systems'
    ]
  },
  dbms: {
    name: 'Databases',
    items: [
      'ER model',
      'Relational model',
      'Relational algebra',
      'Tuple calculus',
      'SQL',
      'Integrity constraints',
      'Normal forms',
      'File organization',
      'Indexing',
      'B trees',
      'B+ trees',
      'Transactions',
      'Concurrency control'
    ]
  },
  cn: {
    name: 'Computer Networks',
    items: [
      'OSI',
      'TCP/IP',
      'Packet switching',
      'Circuit switching',
      'Virtual circuit switching',
      'Data-link framing',
      'Error detection',
      'MAC',
      'Ethernet bridging',
      'Shortest path',
      'Flooding',
      'Distance vector',
      'Link state',
      'Fragmentation',
      'IP addressing',
      'IPv4',
      'CIDR',
      'ARP',
      'DHCP',
      'ICMP',
      'NAT',
      'Flow control',
      'Congestion control',
      'UDP',
      'TCP',
      'Sockets',
      'DNS',
      'SMTP',
      'HTTP',
      'FTP',
      'Email'
    ]
  }
};

function stemWord(w) {
    if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.endsWith('es')) return w.slice(0, -2);
    if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    if (w.endsWith('ing')) return w.slice(0, -3);
    if (w.endsWith('ed')) return w.slice(0, -2);
    if (w.endsWith('tion')) return w.slice(0, -4);
    if (w.endsWith('tions')) return w.slice(0, -5);
    return w;
}

function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchItem(item, subject) {
    const itemNorm = normalize(item);
    const itemWords = itemNorm.split(' ').filter(w => !['and', 'or', 'of', 'in', 'the'].includes(w));
    const stemmedItemWords = itemWords.map(stemWord);

    for (const topic of subject.topics) {
        const topicNorm = normalize(topic.name);
        const subtopicsNorm = (topic.subtopics || []).map(normalize);
        const checklistNorm = (topic.defaultChecklist || []).map(normalize);
        const allTexts = [topicNorm, ...subtopicsNorm, ...checklistNorm];

        // 1. Exact phrase in any entry
        for (const t of allTexts) {
            if (t.includes(itemNorm)) {
                return { matched: true, topicId: topic.id, matchType: 'exact_phrase' };
            }
        }

        // 2. All key words present in any single entry
        for (const t of allTexts) {
            if (itemWords.length > 1 && itemWords.every(w => {
                const re = new RegExp('\\b' + w + '\\b');
                return re.test(t);
            })) {
                return { matched: true, topicId: topic.id, matchType: 'all_words_in_entry' };
            }
        }

        // 3. Stemmed words match in any single entry
        for (const t of allTexts) {
            const entryWords = normalize(t).split(' ');
            const stemmedEntryWords = entryWords.map(stemWord);
            if (stemmedItemWords.every(sw => stemmedEntryWords.includes(sw))) {
                return { matched: true, topicId: topic.id, matchType: 'stemmed_words_in_entry' };
            }
        }

        // 4. In whole topic scope: all stemmed words present
        const wholeTopicStemmed = normalize([topic.name, ...(topic.subtopics||[]), ...(topic.defaultChecklist||[])].join(' '))
            .split(' ').map(stemWord);
        if (stemmedItemWords.length > 1 && stemmedItemWords.every(sw => wholeTopicStemmed.includes(sw))) {
            return { matched: true, topicId: topic.id, matchType: 'topic_scope_stemmed' };
        }

        // 5. Normalized topic ID match
        if (topic.id.toLowerCase().includes(itemNorm.replace(/\s+/g, '_'))) {
            return { matched: true, topicId: topic.id, matchType: 'topic_id' };
        }
    }

    return { matched: false };
}

let totalPdfItems = 0;
let matchedCount = 0;
let missingItems = [];
const auditReport = {};

for (const [subId, subData] of Object.entries(pdfSections)) {
    const subject = GATE_SYLLABUS.find(s => s.id === subId);
    auditReport[subId] = { subject: subData.name, matched: [], missing: [] };
    
    subData.items.forEach(item => {
        totalPdfItems++;
        const res = matchItem(item, subject);
        if (res.matched) {
            matchedCount++;
            auditReport[subId].matched.push({ item, topicId: res.topicId, type: res.matchType });
        } else {
            missingItems.push({ subject: subData.name, subjectId: subId, item });
            auditReport[subId].missing.push(item);
        }
    });
}

console.log('TOTAL PDF ITEMS:', totalPdfItems);
console.log('MATCHED:', matchedCount);
console.log('MISSING:', missingItems.length);
console.log('\n--- DETAILED MISSING ITEMS ---');
missingItems.forEach(m => console.log(`[${m.subjectId}] ${m.subject} -> "${m.item}"`));

module.exports = { pdfSections, matchItem };
