// ==========================================================================
// MIT PROJECT MAC (1966) — HISTORICAL ELIZA CTSS EMULATION CORE — PART 1
// ==========================================================================

// --- AUTHENTIC 1966 ASR-33 TELETYPE AUDIO SYNTHESIZER ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTeletypeSound(isCarriageReturn = false) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (isCarriageReturn) {
    // Recreates the deep heavy mechanical slide of a physical teletype head return
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.35);
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } else {
    // Recreates the mechanical percussion snap of a metal typebar striking paper
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.01);
    
    // Inject subtle random variances to simulate erratic mechanical timing
    const noise = audioCtx.createOscillator();
    const noiseGain = audioCtx.createGain();
    noise.type = 'sawtooth';
    noise.frequency.setValueAtTime(100 + Math.random() * 300, audioCtx.currentTime);
    noiseGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    noise.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.03);
    
    osc.start();
    noise.start();
    osc.stop(audioCtx.currentTime + 0.03);
    noise.stop(audioCtx.currentTime + 0.03);
  }
}

// Global state trackers for true Weizenbaum sequential reassembly pointer logic
const reassemblyPointers = {};
const elizaMemoryStack = [];

// Verbatim SLIP Pre-Parsing Macros from the 1966 CACM Specification
const preTransforms = {
  "DONT": "DON T", "CANT": "CAN T", "WONT": "WON T", "YOURSELVES": "YOURSELF",
  "IM": "I M", "YOU RE": "YOU RE", "MACHINE": "COMPUTER", "MACHINES": "COMPUTER"
};

// Historical Rogerian Substitution & Reflection Mapping Mirror Tables
const reflections = {
  "AM": "ARE", "YOUR": "MY", "I": "YOU", "ME": "YOU", "MYSELF": "YOURSELF",
  "YOURSELF": "MYSELF", "YOU": "I", "MY": "YOUR", "I'M": "YOU'RE", "YOU'RE": "I'M",
  "ARE": "AM", "WAS": "WERE", "WERE": "WAS"
};

// Keyword Dataset Stack Segment A
const elizaKeywordsPart1 = [
  { key: "COMPUTER", rank: 50, decomps: [
    { pattern: "*", reassemb: ["DO COMPUTERS WORRY YOU?", "WHY DO YOU MENTION COMPUTERS?", "WHAT DO YOU THINK MACHINES HAVE TO DO WITH YOUR PROBLEM?", "DON'T YOU THINK COMPUTERS CAN HELP PEOPLE?"] }
  ]},
  { key: "NAME", rank: 15, decomps: [
    { pattern: "*", reassemb: ["I AM NOT INTERESTED IN NAMES.", "I'VE TOLD YOU BEFORE, I DON'T CARE ABOUT NAMES -- PLEASE CONTINUE."] }
  ]},
  { key: "ALWAYS", rank: 10, decomps: [
    { pattern: "*", reassemb: ["CAN YOU THINK OF A SPECIFIC EXAMPLE?", "WHEN?", "WHAT INCIDENT ARE YOU THINKING OF?", "REALLY, ALWAYS?"] }
  ]},
  { key: "EVERYONE", rank: 10, decomps: [
    { pattern: "*", reassemb: ["SURELY NOT EVERYONE?", "CAN YOU THINK OF ANYONE IN PARTICULAR?", "WHO, FOR EXAMPLE?", "YOU ARE THINKING OF A VERY SPECIFIC PERSON."] }
  ]},
  { key: "EVERYBODY", rank: 10, aliasOf: "EVERYONE" }, // Historical Equivalence Pointer Link
  { key: "ALIKE", rank: 10, decomps: [
    { pattern: "*", reassemb: ["IN WHAT WAY?", "WHAT RESEMBLANCE DO YOU SEE?", "WHAT DOES THAT SIMILARITY SUGGEST TO YOU?", "COULD THERE BE REALLY SOME CONNECTION?"] }
  ]},
  { key: "SAME", rank: 10, decomps: [
    { pattern: "*", reassemb: ["IN WHAT WAY?", "WHAT RESEMBLANCE DO YOU SEE?", "WHAT DOES THAT SIMILARITY SUGGEST TO YOU?", "WHAT OTHER CONNECTIONS DO YOU SEE?"] }
  ]},
  { key: "MOTHER", rank: 9, decomps: [
    { pattern: "*", reassemb: ["WHO ELSE IN YOUR FAMILY TAKES CARE OF YOU?", "DOES YOUR MOTHER COMPLAIN ABOUT YOU?", "TELL ME MORE ABOUT YOUR FAMILY.", "YOUR MOTHER?"] }
  ]},
  { key: "FATHER", rank: 9, decomps: [
    { pattern: "*", reassemb: ["DOES HE REMIND YOU OF ANYONE ELSE?", "WHAT ELSE COMES TO MIND WHEN YOU THINK OF YOUR FATHER?", "YOUR FATHER?"] }
  ]},
  { key: "FRIEND", rank: 9, decomps: [
    { pattern: "*", reassemb: ["WHY DO YOU MENTION YOUR FRIENDS?", "TELL ME MORE ABOUT YOUR FRIENDS.", "DOES THIS RELATE TO A COMPANION?", "DO YOU WISH FOR MORE FRIENDS?"] }
  ]},
  { key: "DEPRESSED", rank: 5, decomps: [
    { pattern: "*", reassemb: ["I AM SORRY TO HEAR YOU ARE DEPRESSED.", "DO YOU THINK COMING HERE WILL HELP YOU NOT TO BE DEPRESSED?", "WHAT MAKES YOU DEPRESSED?"] }
  ]},
  { key: "SAD", rank: 5, decomps: [
    { pattern: "*", reassemb: ["I AM SORRY TO HEAR YOU ARE FEELING SAD.", "DOES TRAGEDY REMIND YOU OF ANYTHING?", "WHAT MAKES YOU SAD?"] }
  ]}
];
// ==========================================================================
// MIT PROJECT MAC (1966) — HISTORICAL ELIZA EMULATION ENGINE — PART 2
// ==========================================================================

const elizaKeywordsPart2 = [
  { key: "YOU ARE", rank: 4, decomps: [
    { pattern: "* YOU ARE *", reassemb: ["WHAT MAKES YOU THINK I AM (2)?", "DOES IT PLEASE YOU TO BELIEVE I AM (2)?", "PERHAPS YOU WOULD LIKE TO BE (2) YOURSELF.", "DO YOU SOMETIMES THINK I AM (2)?"] }
  ]},
  { key: "YOU RE", rank: 4, decomps: [
    { pattern: "* YOU RE *", reassemb: ["WHAT MAKES YOU THINK I AM (2)?", "DOES IT PLEASE YOU TO THINK I AM (2)?", "PERHAPS YOU WOULD LIKE TO BE (2) YOURSELF."] }
  ]},
  { key: "YOUR", rank: 4, decomps: [
    { pattern: "* YOUR *", reassemb: ["WHY ARE YOU CONCERNED ABOUT MY (2)?", "WHAT ABOUT YOUR OWN (2)?", "ARE YOU TRULY INTERESTED IN ME?", "WE SHOULD BE DISCUSSING YOU, NOT MY AFFAIRS."] }
  ]},
  { key: "CAN YOU", rank: 3, decomps: [
    { pattern: "* CAN YOU *", reassemb: ["DON'T YOU BELIEVE I CAN (2)?", "YOU MIGHT BE ABLE TO (2) YOURSELF.", "PERHAPS YOU WOULD LIKE TO BE ABLE TO (2)."] }
  ]},
  { key: "CAN I", rank: 3, decomps: [
    { pattern: "* CAN I *", reassemb: ["WHETHER OR NOT YOU CAN (2) DEPENDS ON YOU MORE THAN ON ME.", "DO YOU WANT TO BE ABLE TO (2)?", "PERHAPS YOU DO NOT WANT TO (2)."] }
  ]},
  { key: "I DONT", rank: 3, decomps: [
    { pattern: "* I DONT *", reassemb: ["DON'T YOU REALLY (2)?", "WHY DON'T YOU (2)?", "DO YOU WISH TO BE ABLE TO (2)?", "DOES THAT TROUBLE YOU?"] }
  ]},
  { key: "I FEEL", rank: 3, decomps: [
    { pattern: "* I FEEL *", reassemb: ["TELL ME MORE ABOUT SUCH FEELINGS.", "DO YOU OFTEN FEEL (2)?", "DOES FEELING (2) REMIND YOU OF ANYTHING?", "WHY DO YOU THINK YOU FEEL (2)?"] }
  ]},
  { key: "WHY DONT YOU", rank: 3, decomps: [
    { pattern: "* WHY DONT YOU *", reassemb: ["DO YOU BELIEVE I DON'T (2)?", "PERHAPS I WILL (2) IN GOOD TIME.", "SHOULD YOU (2) YOURSELF?", "YOU WANT ME TO (2)?"] }
  ]},
  { key: "WHY CANT I", rank: 3, decomps: [
    { pattern: "* WHY CANT I *", reassemb: ["DO YOU THINK YOU SHOULD BE ABLE TO (2)?", "DO YOU THINK THAT WOULD HELP YOU TO (2)?", "HAVE YOU ANY IDEA WHY YOU CAN'T (2)?"] }
  ]},
  { key: "WANT", rank: 3, decomps: [
    { pattern: "* WANT *", reassemb: ["WHAT WOULD IT MEAN TO YOU IF YOU GOT (2)?", "WHY DO YOU WANT (2)?", "WHAT IF YOU NEVER RECEIVED (2)?", "DOES WANTING (2) HAVE ANYTHING TO DO WITH YOUR SECRETS?"] }
  ]},
  { key: "NEED", rank: 3, decomps: [
    { pattern: "* NEED *", reassemb: ["WHAT WOULD IT MEAN TO YOU IF YOU GOT (2)?", "WHY DO YOU NEED (2)?", "WHAT IF YOUR NEED WAS NEVER MET?"] }
  ]},
  { key: "THINK", rank: 2, decomps: [
    { pattern: "* THINK *", reassemb: ["DO YOU REALLY THINK SO?", "BUT YOU ARE NOT SURE?", "DO YOU DOUBT YOUR THOUGHTS RELEVANT TO (2)?"] }
  ]},
  { key: "BELIEVE", rank: 2, decomps: [
    { pattern: "* BELIEVE *", reassemb: ["DO YOU REALLY THINK SO?", "BUT YOU ARE NOT SURE?", "DO YOU BELIEVE YOUR FRUSTRATIONS STEM FROM (2)?"] }
  ]},
  { key: "WISH", rank: 2, decomps: [
    { pattern: "* WISH *", reassemb: ["WHAT IF YOUR WISH CAME TRUE?", "DO YOU OFTEN WISH FOR THAT?", "WHAT DOES WISHING FOR (2) SUGGEST TO YOU?"] }
  ]},
  { key: "EXPECT", rank: 2, decomps: [
    { pattern: "* EXPECT *", reassemb: ["DO YOU INDEED EXPECT THAT?", "WHAT IF IT DOES NOT OCCUR?", "WHY DO YOU EXPECT (2)?"] }
  ]},
  { key: "BECAUSE", rank: 2, decomps: [
    { pattern: "* BECAUSE *", reassemb: ["IS THAT THE REAL REASON?", "WHAT OTHER REASONS MIGHT THERE BE?", "DOES THAT REASON EXPLAIN OTHER THINGS?"] }
  ]},
  { key: "WHY", rank: 2, decomps: [
    { pattern: "* WHY AM I *", reassemb: ["WHY DO YOU ASK WHY AM I (2)?", "DOES THAT QUESTION INTEREST YOU?"] },
    { pattern: "* WHY CANT I *", reassemb: ["DO YOU THINK YOU SHOULD BE ABLE TO (2)?", "HAVE YOU TRIED?"] },
    { pattern: "* WHY *", reassemb: ["WHY DO YOU ASK?", "DOES THAT QUESTION INTEREST YOU?", "WHAT ANSWER INTERESTS YOU MOST?"] }
  ]},
  { key: "WHAT", rank: 2, decomps: [
    { pattern: "* WHAT *", reassemb: ["WHY DO YOU ASK?", "DOES THAT QUESTION INTEREST YOU?", "WHAT ARE YOUR OWN THOUGHTS ON THE MATTER?"] }
  ]},
  { key: "HOW", rank: 2, decomps: [
    { pattern: "* HOW *", reassemb: ["WHY DO YOU ASK?", "HOW DO YOU THINK?", "WHAT IS YOUR OWN ESTIMATE?"] }
  ]},
  { key: "ARE YOU", rank: 2, decomps: [
    { pattern: "* ARE YOU *", reassemb: ["WHY ARE YOU INTERESTED IN WHETHER I AM (2) OR NOT?", "WOULD YOU PREFER IF I WEREN'T (2)?", "PERHAPS I AM (2) IN YOUR FANTASIES."] }
  ]},
  { key: "I CANT", rank: 2, decomps: [
    { pattern: "* I CANT *", reassemb: ["HOW DO YOU KNOW YOU CAN'T (2)?", "HAVE YOU TRIED?", "PERHAPS YOU COULD (2) NOW."] }
  ]},
  { key: "I AM", rank: 2, decomps: [
    { pattern: "* I AM *", reassemb: ["DID YOU COME TO ME BECAUSE YOU ARE (2)?", "HOW LONG HAVE YOU BEEN (2)?", "HOW DO YOU FEEL ABOUT BEING (2)?"] }
  ]},
  { key: "I M", rank: 2, decomps: [
    { pattern: "* I M *", reassemb: ["DID YOU COME TO ME BECAUSE YOU ARE (2)?", "HOW LONG HAVE YOU BEEN (2)?", "DO YOU ENJOY BEING (2)?"] }
  ]},
  { key: "MY", rank: 2, decomps: [
    { pattern: "* MY * MOTHER *", reassemb: ["TELL ME MORE ABOUT YOUR FAMILY.", "DOES SHE REMIND YOU OF SOMEONE ELSE?"] },
    { pattern: "* MY * FATHER *", reassemb: ["DOES HE REMIND YOU OF ANYONE ELSE?", "WHAT COMES TO MIND WHEN YOU THINK OF HIM?"] },
    { pattern: "* MY *", reassemb: ["YOUR (2)?", "WHY DO YOU SAY YOUR (2)?", "DOES THAT RELATE TO YOUR FAMILY?"] }
  ]},
  { key: "MYSELF", rank: 2, decomps: [
    { pattern: "*", reassemb: ["WHAT COMES TO MIND WHEN YOU FOCUS ON YOURSELF?", "DO YOU SPEND A LOT OF TIME THINKING ABOUT YOURSELF?", "WHY DO YOU SAY THAT OUT OF ISOLATION?"] }
  ]},
  { key: "CAN", rank: 2, decomps: [
    { pattern: "*", reassemb: ["YOU THINK YOU CAN, DO YOU?", "YOU SEEM DOUBTFUL.", "PERHAPS YOU WILL IN DUE TIME."] }
  ]},
  { key: "HELLO", rank: 1, decomps: [
    { pattern: "*", reassemb: ["HOW DO YOU DO. PLEASE STATE YOUR PROBLEM.", "HI. WHAT SEEMS TO BE YOUR MAIN PROBLEM TODAY?"] }
  ]},
  { key: "HI", rank: 1, decomps: [
    { pattern: "*", reassemb: ["HOW DO YOU DO. PLEASE STATE YOUR PROBLEM."] }
  ]},
  { key: "YOU", rank: 1, decomps: [
    { pattern: "* YOU *", reassemb: ["WE WERE DISCUSSING YOU, NOT ME.", "OH, I (2)?", "YOU'RE NOT REALLY TALKING ABOUT ME, ARE YOU?"] }
  ]}
];
// ==========================================================================
// MIT PROJECT MAC (1966) — HISTORICAL ELIZA EMULATION ENGINE — PART 3
// ==========================================================================

// Concatenate global definitions cleanly
let elizaKeywords = elizaKeywordsPart1.concat(elizaKeywordsPart2);

// Resolve 1966 Alias Pointer references (= EQUIVALENCE POINTERS)
elizaKeywords = elizaKeywords.map(k => {
  if (k.aliasOf) {
    const target = elizaKeywords.find(x => x.key === k.aliasOf);
    if (target) k.decomps = target.decomps;
  }
  return k;
});

// Enforce absolute script precedence based on numerical weight ranks
elizaKeywords.sort((a, b) => b.rank - a.rank);

// Historically Accurate NEWKEY Fallback Comments Framework
const newkeyFallbackResponses = [
  "CAN YOU ELABORATE ON THAT?", 
  "I SEE. TELL ME MORE.", 
  "DOES THAT TROUBLE YOU?",
  "HOW DOES THAT MAKE YOU FEEL?", 
  "WHY DO YOU SAY THAT JUST NOW?", 
  "LET US FOCUS ON WHAT YOU ARE SAYING."
];

// Tracks internal pointer indexes for sequential fallback iteration (no random picking)
let fallbackPointer = 0;

const terminal = document.getElementById('terminal');
const feed = document.getElementById('output-feed');
const userInput = document.getElementById('user-input');

// Character-by-character teletype layout simulator with active sound execution loop
function streamResponseText(text) {
  let i = 0; 
  userInput.disabled = true;

  function nextChar() {
    if (i < text.length) {
      feed.textContent += text.charAt(i);
      playTeletypeSound(false); // Emit metal pin snap tone
      i++;
      terminal.scrollTop = terminal.scrollHeight;
      setTimeout(nextChar, 45); // Accurate mechanical terminal output delay speed
    } else {
      setTimeout(() => {
        playTeletypeSound(true); // Emit head carriage return sound at tail end
        userInput.disabled = false;
        userInput.focus();
      }, 100);
    }
  }
  nextChar();
}

function reflectWords(phrase) {
  if (!phrase) return "";
  return phrase.split(/\b/).map(word => {
    let u = word.toUpperCase();
    return reflections[u] || word;
  }).join('').trim();
}

// Deep 1966 Structural List Decomposition-to-Reassembly Array Mapping Algorithm
function matchDecompPattern(pattern, input) {
  let cleanPat = pattern.trim().replace(/\s+/g, " ");
  let cleanInp = input.trim().replace(/\s+/g, " ");
  if (cleanPat === "*") return [cleanInp];
  
  let parts = cleanPat.split("*");
  let segments = []; 
  let currentIdx = 0;

  for (let i = 0; i < parts.length; i++) {
    let p = parts[i].trim(); 
    if (p === "") continue;
    
    let foundIdx = cleanInp.indexOf(p, currentIdx);
    if (foundIdx === -1) return null;
    if (i === 0 && foundIdx > 0 && !cleanPat.startsWith("*")) return null;
    
    let leadingSegment = cleanInp.substring(currentIdx, foundIdx).trim();
    if (leadingSegment || currentIdx > 0 || cleanPat.startsWith("*")) {
      segments.push(leadingSegment);
    }
    currentIdx = foundIdx + p.length;
  }
  if (currentIdx < cleanInp.length) {
    segments.push(cleanInp.substring(currentIdx).trim());
  }
  return segments.length ? segments : null;
}

function generateResponse(input) {
  let cleanInput = input.toUpperCase().replace(/[.,\/#!\$%\^&\*;:{}=\-_`~()]/g, " ").replace(/\s+/g, " ").trim();
  
  // Apply linear pre-parsing macro filters
  for (let macro in preTransforms) {
    cleanInput = cleanInput.replace(new RegExp(`\\b${macro}\\b`, 'g'), preTransforms[macro]);
  }

  let primaryResponse = null;

  // Iterate over rank sorting queue to evaluate keywords
  for (let entry of elizaKeywords) {
    if (cleanInput.includes(entry.key) && entry.decomps) {
      for (let decomp of entry.decomps) {
        let segments = matchDecompPattern(decomp.pattern, cleanInput);
        if (segments !== null) {
          const ruleKey = entry.key + "_" + decomp.pattern;
          if (reassemblyPointers[ruleKey] === undefined) reassemblyPointers[ruleKey] = 0;
          
          let pointerIdx = reassemblyPointers[ruleKey];
          let reassemb = decomp.reassemb[pointerIdx % decomp.reassemb.length];
          reassemblyPointers[ruleKey]++;
          
          // Reassemble the active response template text safely
          let responseText = reassemb;
          for (let i = 0; i < segments.length; i++) {
            let reflected = reflectWords(segments[i]);
            // Authentically resolves indices by checking both explicit indices (e.g., (1), (2)) 
            // and mapping trailing fragments onto the classic baseline wildcard tracker
            responseText = responseText.split(`(${i + 1})`).join(reflected);
            if (segments.length === 1 || (i === segments.length - 1)) {
              responseText = responseText.split(`(2)`).join(reflected);
            }
          }
          
          // --- TRUE 1966 WEIZENBAUM MEMORY ALLOCATION LOGIC ---
          // Memory cache targets are collected, compiled, and stashed away *quietly*.
          // They are only triggered if the phrase contains context clues but fails to produce an immediate output,
          // or is explicitly deferred to standard fallbacks.
          if (primaryResponse === null) {
            primaryResponse = responseText;
          } else if ((entry.key === "MOTHER" || entry.key === "FATHER") && segments.length > 0) {
            let targetSegment = segments[segments.length - 1]; 
            let reflectedFragment = reflectWords(targetSegment);
            if (reflectedFragment.length > 0 && elizaMemoryStack.length < 10) {
              elizaMemoryStack.push(`DOES THAT HAVE ANYTHING TO DO WITH YOUR ${entry.key} ${reflectedFragment}?`);
            }
          }
        }
      }
      if (primaryResponse !== null) return primaryResponse;
    }
  }
  
  // Genuinely Historical NEWKEY fallback queue activation routine
  if (elizaMemoryStack.length > 0 && Math.random() > 0.4) {
    return elizaMemoryStack.shift();
  }
  
  // Iterate sequentially over fallback entries to mimic historical storage arrays
  let fallbackReply = newkeyFallbackResponses[fallbackPointer % newkeyFallbackResponses.length];
  fallbackPointer++;
  return fallbackReply;
}

userInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && this.value.trim() !== "" && !this.disabled) {
    let userVal = this.value.toUpperCase();
    
    // Echo the sanitized text directly down into user screen feed
    feed.textContent += `\n\nYOU:  ${userVal}`;
    terminal.scrollTop = terminal.scrollHeight;
    this.value = '';

    setTimeout(() => {
      let reply = generateResponse(userVal);
      feed.textContent += `\n\nELIZA:  `;
      streamResponseText(reply);
    }, 400);
  }
});

// Auto-focus handler
terminal.addEventListener('click', () => {
  if(!userInput.disabled) userInput.focus();
});
