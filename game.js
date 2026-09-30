// ---- Card data helpers ----------------------------------------------------

// Numbers are 1-10. We display 10 as "A" (like in the classic game).
function numToLabel(n) {
    return n === 10 ? 'A' : String(n);
}

// ---- Background helper ----------------------------------------------------

// Adds a full-screen background image plus a dimming overlay for readability.
// `dim` is 0 (no darkening) to 1 (fully black). Tune per-scene as needed.
function addBackground(scene, key, dim = 0.4) {
    if (scene.textures.exists(key)) {
        scene.add.image(500, 384, key)
            .setDisplaySize(1000, 768)
            .setDepth(-1000);
        scene.add.rectangle(500, 384, 1000, 768, 0x000000, dim)
            .setDepth(-999);
    }
}

// ---- Game board helper ----------------------------------------------------
// Places a board/frame image behind the grid. Sits above the dimmed
// background (-999) but below the grid cells and cards (default depth 0).
function addGameBoard(scene, key, x = 500, y = 384, w = null, h = null) {
    if (!scene.textures.exists(key)) return null;

    const board = scene.add.image(x, y, key).setDepth(-500);

    // If explicit size given, use it; otherwise show at native size.
    if (w !== null && h !== null) {
        board.setDisplaySize(w, h);
    }
    return board;
}


// ---- Music manager (overlap-proof)----------------------------------------
// One place that owns "what track is playing." Call MusicManager.play(scene, key)
// when a scene starts; if that track is already playing, it does nothing (so
// moving between Title/Deck/Rules won't restart the shared theme). Switching
// to a different track cross-fades out the old and in the new.
const MusicManager = {
    current: null,
    currentKey: null,
    volume: 0.4,

    play(scene, key) {
        // Same track already playing? Do nothing (seamless across scenes).
        if (this.currentKey === key && this.current && this.current.isPlaying) {
            return;
        }

        if (!scene.cache.audio.exists(key)) return;

        // Stop the previous track IMMEDIATELY and destroy it.
        // Instant stop = zero chance of overlap.
        if (this.current) {
            this.current.stop();
            this.current.destroy();
            this.current = null;
            this.currentKey = null;
        }

        // Start the new track and fade it in gently.
        const next = scene.sound.add(key, { loop: true, volume: 0 });
        next.play();
        scene.tweens.add({ targets: next, volume: this.volume, duration: 600 });

        this.current = next;
        this.currentKey = key;
    },

    stop() {
        if (this.current) {
            this.current.stop();
            this.current.destroy();
        }
        this.current = null;
        this.currentKey = null;
    }
};


// ---- Layout constants -----------------------------------------------------

const CARD_W = 90;
const CARD_H = 110;

const GRID_X = 350;   // top-left corner of the 3x3 grid
const GRID_Y = 120;
const CELL_GAP = 6;

const RED = 0xc0392b;
const BLUE = 0x2980b9;

const RED_HAND_X = 60;
const BLUE_HAND_X = 840;
const HAND_START_Y = 60;
const HAND_GAP = 120;


// ---- Card Pool ------------------------------------------------------------
//
// Card values follow a Triple-Triad-style progression across rarity tiers:
// Common cards span lower monster-style levels, Uncommon cards use stronger
// boss-style values, Rare cards use high-tier values, and Elite cards use
// endgame-style value profiles. Side values may therefore vary substantially
// within a rarity; no rarity has a fixed total-power budget.

// Rarity tiers
const RARITY = {
    COMMON:   { name: 'Common',   color: '#bdc3c7' },
    UNCOMMON: { name: 'Uncommon', color: '#2ecc71' },
    RARE:     { name: 'Rare',     color: '#3498db' },
    ELITE:    { name: 'Elite',    color: '#f1c40f' }
};

// ---- Elemental system -----------------------------------------------------
// Elements are a separate tactical identity from rarity. When the optional
// Elemental rule is active, matching a board space grants +1 to all sides;
// a different element gives -1. Values always remain within 1..10.
const ELEMENTS = {
    ocean:  { name: 'Ocean',  asset: 'element_ocean',  color: '#39bff2' },
    jungle: { name: 'Jungle', asset: 'element_jungle', color: '#69c83d' },
    sun:    { name: 'Sun',    asset: 'element_sun',    color: '#f6b72c' },
    wind:   { name: 'Wind',   asset: 'element_wind',   color: '#a9dcff' },
    stone:  { name: 'Stone',  asset: 'element_stone',  color: '#c4b9a6' },
    spirit: { name: 'Spirit', asset: 'element_spirit', color: '#b78cff' }
};

const CARD_ELEMENTS = {
    coconut_crab:'ocean', fruit_bat:'jungle', flame_tree:'sun', reef_fish:'ocean',
    betel_nut:'jungle', carabao:'jungle', breadfruit:'jungle', taro:'jungle', mango:'sun',
    gecko:'jungle', hermit_crab:'ocean', coconut_tree:'wind', kingfisher:'wind',
    monitor_lizard:'sun', plumeria:'sun', hibiscus:'sun', guava:'jungle', totot:'wind',
    binadu:'jungle', babalati:'ocean', pupulu:'jungle', papaya:'sun', haggan:'ocean',
    noni:'jungle', tangan_tangan:'jungle', tuninos:'ocean',

    managaha:'ocean', latte_stone:'stone', grotto:'ocean', birdisland:'wind',
    suicide_cliff:'stone', mt_tapochau:'wind', forbidden_island:'jungle',
    american_memorial:'spirit', taga_beach:'ocean', kalabera_cave:'stone',
    latte_stone_quarry:'stone', house_of_taga:'stone', abandoned_lafiesta:'jungle',
    abandoned_radar:'wind', bomb_pits:'sun', imperial_pacific:'stone',
    old_lighthouse:'wind', tinian_dynasty:'stone',

    chief_taga:'stone', taotaomona:'spirit', sirena:'ocean', master_navigator:'wind',
    refaluwasch:'wind', chamorro_healer:'jungle', puntan:'stone', fuuna:'spirit',
    chief_aghurubw:'wind', duendes:'spirit',

    ed_propst:'sun', tina_sablan:'ocean', glen_hunter:'stone', analee_villagomez:'spirit',
    angelo_villagomez:'ocean', wendy_doromal:'wind', boni_sagana:'sun',
    itos_feliciano:'wind', benigno_fitial:'stone', ralph_torres:'sun'
};


// Helper to define a card definition
function def(id, name, rarity, sides, flavor = '') {
    return {
        id,
        name,
        rarity,
        flavor,
        top: sides.top,
        right: sides.right,
        bottom: sides.bottom,
        left: sides.left
    };
}

const CARD_POOL = [

    // --- Common: CNMI flora, fauna, everyday life -------------------------
    def('coconut_crab', 'Coconut Crab', 'COMMON', { top: 7, right: 7, bottom: 4, left: 2 },
        "The largest land-living arthropod on Earth. Known locally as 'ayuyu,' it can crack open coconuts with its powerful claws."),
    def('fruit_bat', 'Fruit Bat', 'COMMON', { top: 5, right: 3, bottom: 7, left: 6 },
        "The Mariana fruit bat, or 'fanihi,' is a culturally significant and protected species in the CNMI."),
    def('flame_tree', 'Flame Tree', 'COMMON', { top: 7, right: 5, bottom: 4, left: 3 },
        "The 'trongkon Atbot' bursts into brilliant red-orange blooms in early summer, painting the islands in fire."),
    def('reef_fish', 'Reef Fish', 'COMMON', { top: 5, right: 2, bottom: 5, left: 3 },
        "The coral reefs of the Marianas teem with vibrant fish, a cornerstone of local diet and tradition."),
    def('betel_nut', 'Betel Nut', 'COMMON', { top: 5, right: 6, bottom: 2, left: 4 },
        "The areca nut, or 'pugua,' is chewed across the islands — a social tradition passed down through generations."),
    def('carabao', 'Carabao', 'COMMON', { top: 6, right: 5, bottom: 6, left: 5 },
        "The water buffalo was long a farmer's steadfast companion, a symbol of rural island life and hard work."),
    def('breadfruit', 'Breadfruit', 'COMMON', { top: 3, right: 5, bottom: 5, left: 5 },
        "The 'lemmai' is a staple food across the Marianas — roasted, boiled, or fried, it has sustained island families for generations."),
    def('taro', 'Taro', 'COMMON', { top: 4, right: 4, bottom: 5, left: 2 },
        "The 'suni' is a hardy root crop grown in island gardens and wetlands, a dependable source of nourishment."),
    def('mango', 'Mango', 'COMMON', { top: 3, right: 4, bottom: 5, left: 3 },
        "When mango season arrives, island trees hang heavy with sweet golden fruit — a beloved taste of home."),
    def('gecko', 'House Gecko', 'COMMON', { top: 1, right: 4, bottom: 1, left: 5 },
        "The chirping 'guali'ek' is a familiar nighttime companion on every island porch and ceiling."),
    def('hermit_crab', 'Hermit Crab', 'COMMON', { top: 2, right: 1, bottom: 4, left: 4 },
        "Scuttling along beaches in borrowed shells, the 'umang' is a small but constant presence in island life."),
    def('coconut_tree', 'Coconut Tree', 'COMMON', { top: 4, right: 5, bottom: 5, left: 6 },
        "The 'niyok' provides food, drink, oil, and material — the tree of life for Pacific island peoples."),
    def('kingfisher', 'Mariana Kingfisher', 'COMMON', { top: 7, right: 6, bottom: 5, left: 3 },
        "The 'sihek,' a jewel-toned kingfisher found only in the Marianas. Once extinct in the wild, it survives through dedicated conservation efforts."),
    def('monitor_lizard', 'Monitor Lizard', 'COMMON', { top: 4, right: 6, bottom: 2, left: 7 },
        "The 'hilitai' patrols island jungles and roadsides — an introduced reptile that has become part of the landscape."),
    def('plumeria', 'Plumeria', 'COMMON', { top: 5, right: 1, bottom: 1, left: 3 },
        "Fragrant plumeria blossoms are a familiar sight in island gardens, their white, yellow, and pink flowers often gathered for leis and floral decorations."),
    def('hibiscus', 'Hibiscus', 'COMMON', { top: 1, right: 3, bottom: 3, left: 5 },
        "Brilliant hibiscus flowers flourish across the Marianas, bringing vivid tropical color to gardens, roadsides, and island landscapes."),
    def('guava', 'Guava', 'COMMON', { top: 4, right: 2, bottom: 4, left: 3 },
        "A familiar fruit of island backyards and thickets, guava is enjoyed fresh or transformed into juices, jams, jellies, and other treats."),
    def('totot', 'Marianas Fruit-Dove', 'COMMON', { top: 6, right: 2, bottom: 7, left: 3 },
        "Known in Chamorro as 'totot,' the colorful Marianas fruit-dove is native to the Mariana Islands, feeding among the forest canopy on the fruits of island trees."),
    def('binadu', 'Philippine Deer', 'COMMON', { top: 7, right: 4, bottom: 4, left: 4 },
        "Known in Chamorro as 'binådu,' Philippine deer were introduced to the Marianas during the Spanish era as a food source and remain part of the islands' hunting tradition."),
    def('babalati', 'Sea Cucumber', 'COMMON', { top: 3, right: 6, bottom: 4, left: 4 },
        "Known in Chamorro as 'båbalåti,' these slow-moving reef dwellers feed on organic matter along the seafloor and play an important role in the Marianas' marine ecosystems."),
    def('pupulu', 'Pepper Leaf', 'COMMON', { top: 5, right: 6, bottom: 3, left: 3 },
        "Known as 'pupulu,' the pepper leaf is traditionally combined with pugua and afok in the centuries-old Chamorro practice of betel-nut chewing."),
    def('papaya', 'Papaya', 'COMMON', { top: 5, right: 3, bottom: 3, left: 4 },
        "Papaya trees thrive in island yards and gardens, producing abundant tropical fruit enjoyed ripe or prepared green in countless dishes."),
    def('haggan', 'Green Sea Turtle', 'COMMON', { top: 5, right: 2, bottom: 4, left: 3 },
        "Known as 'haggan' in Chamorro and 'wong mool' in Carolinian, the endangered green sea turtle nests and forages throughout the Mariana Archipelago."),
    def('noni', 'Noni', 'COMMON', { top: 7, right: 2, bottom: 7, left: 4 },
        "Recognizable by its pale, pungent fruit, noni grows readily in the tropical islands of the Pacific and has a long history of traditional use."),
    def('tangan_tangan', 'Tangan-Tangan', 'COMMON', { top: 7, right: 5, bottom: 1, left: 3 },
        "Fast-growing tangan-tangan forms dense thickets across the Marianas, becoming one of the most conspicuous introduced plants in the islands' modern landscape."),
    def('tuninos', 'Spinner Dolphin', 'COMMON', { top: 6, right: 6, bottom: 2, left: 7 },
        "A year-round coastal resident of the Marianas, the spinner dolphin travels in social groups and is famous for its spectacular spinning leaps above the sea."),


    // --- Uncommon: places & landmarks -------------------------------------
    def('managaha', 'Managaha Island', 'UNCOMMON', { top: 5, right: 6, bottom: 6, left: 8 },
        "A tiny islet off Saipan ringed by white sand and turquoise water — a beloved spot for swimming and remembrance."),
    def('latte_stone', 'Latte Stone', 'UNCOMMON', { top: 7, right: 7, bottom: 2, left: 8 },
        "Ancient pillars ('haligi') topped with capstones ('tasa') that once supported Chamorro homes. An enduring symbol of the Marianas."),
    def('grotto', 'The Grotto', 'UNCOMMON', { top: 8, right: 6, bottom: 7, left: 3 },
        "A collapsed limestone cavern on Saipan filled with crystal-blue seawater — one of the world's premier dive sites."),
    def('birdisland', 'Bird Island', 'UNCOMMON', { top: 7, right: 2, bottom: 8, left: 5 },
        "A protected limestone islet off Saipan's northeast coast, a sanctuary for seabirds and a breathtaking lookout."),
    def('suicide_cliff', 'Suicide Cliff', 'UNCOMMON', { top: 6, right: 8, bottom: 4, left: 7 },
        "A solemn site from the final days of WWII on Saipan, now a place of memorial and reflection."),
    def('mt_tapochau', 'Mt. Tapochau', 'UNCOMMON', { top: 8, right: 5, bottom: 2, left: 8 },
        "The highest point on Saipan at 1,555 feet, offering a 360-degree view of the entire island."),
    def('forbidden_island', 'Forbidden Island', 'UNCOMMON', { top: 6, right: 8, bottom: 4, left: 5 },
        "A remote, rugged peninsula on Saipan's east coast, reached by a steep trail down to a hidden natural pool and reef."),
    def('american_memorial', 'American Memorial Park', 'UNCOMMON', { top: 6, right: 5, bottom: 8, left: 4 },
        "A park in Garapan honoring the American and Marianas people who died in the WWII Marianas campaign."),
    def('taga_beach', 'Taga Beach', 'UNCOMMON', { top: 7, right: 8, bottom: 3, left: 4 },
        "A picturesque cove on Tinian with limestone cliffs and clear water, a favorite spot for cliff-jumping and swimming."),
    def('kalabera_cave', 'Kalabera Cave', 'UNCOMMON', { top: 8, right: 3, bottom: 5, left: 8 },
        "A limestone cave on Saipan bearing ancient Chamorro pictographs — a window into the islands' deep past."),
    def('latte_stone_quarry', 'Latte Stone Quarry', 'UNCOMMON', { top: 5, right: 7, bottom: 8, left: 5 },
        "An ancient quarry on Rota where unfinished latte pillars and capstones reveal how the Ancient Chamorro people carved their monumental stone foundations."),
    def('house_of_taga', 'House of Taga', 'UNCOMMON', { top: 8, right: 8, bottom: 4, left: 4 },
        "The largest set of latte stones in the Marianas, on Tinian — said to be the home of the legendary Chief Taga."),
    def('abandoned_lafiesta', 'Abandoned La Fiesta Mall', 'UNCOMMON', { top: 1, right: 8, bottom: 8, left: 3 },
        "Once Saipan's sprawling open-air shopping destination, La Fiesta closed in 2004 and became an eerie, overgrown monument to the island's vanished tourism boom."),
    def('abandoned_radar', 'Abandoned Pacific Barrier Radar III', 'UNCOMMON', { top: 4, right: 8, bottom: 7, left: 3 },
        "A former U.S. Air Force radar tracking station atop Mt. Petosukara, built during the Cold War to watch the skies over the Pacific and abandoned in the 1990s."),
    def('bomb_pits', 'Atomic Bomb Pits', 'UNCOMMON', { top: 8, right: 8, bottom: 5, left: 4 },
        "Historic pits at Tinian's North Field where the atomic bombs Little Boy and Fat Man were loaded aboard B-29s before the missions over Hiroshima and Nagasaki in 1945."),
    def('imperial_pacific', 'Imperial Pacific Resort', 'UNCOMMON', { top: 1, right: 8, bottom: 4, left: 8 },
        "An unfinished casino-resort towering over Garapan — a remnant of Saipan's short-lived casino boom, marked by grand ambitions, labor controversy, and stalled construction."),
    def('old_lighthouse', 'Old Japanese Lighthouse', 'UNCOMMON', { top: 7, right: 5, bottom: 8, left: 1 },
        "Built atop Navy Hill in 1934 to guide ships toward Tanapag Harbor, this surviving Japanese-era lighthouse endured the Battle of Saipan and decades of abandonment."),
    def('tinian_dynasty', 'Tinian Dynasty', 'UNCOMMON', { top: 2, right: 8, bottom: 8, left: 4 },
        "Opened in 1998 as Tinian's landmark hotel-casino, the Dynasty once anchored the island's tourism ambitions before closing in 2015 amid financial and regulatory turmoil."),


    // --- Rare: legends & cultural figures (historical / traditional) ------
    def('chief_taga', 'Chief Taga', 'RARE', { top: 10, right: 8, bottom: 2, left: 6 },
        "A legendary Chamorro chief of immense strength, said to have been a giant who single-handedly raised the great latte stones of Tinian."),
    def('taotaomona', 'Taotaomona', 'RARE', { top: 3, right: 1, bottom: 10, left: 10 },
        "The spirits of the ancestors ('taotao mo'na' — people of before) who dwell in the jungle. Respect them, or face their wrath."),
    def('sirena', 'Sirena', 'RARE', { top: 8, right: 9, bottom:6, left: 2 },
        "A girl transformed into a mermaid by her mother's curse. A beloved Marianas legend of love, freedom, and consequence."),
    def('master_navigator', 'Master Navigator', 'RARE', { top: 2, right: 9, bottom: 9, left: 4 },
        "Carolinian wayfinders who crossed vast oceans guided only by stars, swells, and birds — keepers of ancient seafaring wisdom."),
    def('refaluwasch', 'Refaluwasch Elder', 'RARE', { top: 4, right: 4, bottom: 8, left: 9 },
        "An elder of the Refaluwasch (Carolinian) people, carriers of a distinct language, dance, and canoe-building heritage."),
    def('chamorro_healer', 'Chamorro Healer', 'RARE', { top: 6, right: 7, bottom: 4, left: 9 },
        "The 'suruhanu' or 'suruhana' — traditional healers who use island plants and inherited knowledge to treat the sick."),
    def('puntan', 'Puntan', 'RARE', { top: 4, right: 4, bottom: 9, left: 10 },
        "The Chamorro creator deity whose body became the earth, sky, sun, moon, and sea — his final gift formed the world."),
    def('fuuna', 'Fu\'una', 'RARE', { top: 7, right: 2, bottom: 7, left: 10 },
        "Puntan's sister and co-creator, who brought the world to life and became Fouha Rock, from which the first people emerged."),
    def('chief_aghurubw', 'Chief Aghurubw', 'RARE', { top: 8, right: 10, bottom: 3, left: 5 },
        "A Refaluwasch chief and navigator who led settlers from Satawal to Saipan in 1815 and established the village of Arabwal."),
    def('duendes', 'Duendes', 'RARE', { top: 9, right: 6, bottom: 7, left: 3 },
        "Mischievous little forest spirits of Marianas folklore, known to hide things, play tricks, and lead the unwary astray."),


    // --- Elite: real community figures ------------------------------------
    // Elite cards use Level-10-style value profiles; totals and arrangements vary.
    def('ed_propst', 'Ed Propst', 'ELITE', { top: 10, right: 5, bottom: 9, left: 7 },
        "An outspoken legislator who made government accountability and opposition to corruption central to his public career. His willingness to challenge the political establishment made him a leading voice for reform in the modern CNMI."),
    def('tina_sablan', 'Tina Sablan', 'ELITE', { top: 9, right: 10, bottom: 5, left: 7 },
        "An environmental advocate, reform-minded legislator, and the first woman nominated for governor by a major CNMI political party. Her principled leadership earned her recognition as a conscience of the Commonwealth."),
    def('glen_hunter', 'Glen Hunter', 'ELITE', { top: 7, right: 9, bottom: 10, left: 5 },
        "An entrepreneur and grassroots activist who helped pioneer the CNMI's contemporary anti-corruption movement. Through civic organizing and public advocacy, he challenged the culture of silence surrounding entrenched political power."),
    def('analee_villagomez', 'Analee Villagomez', 'ELITE', { top: 4, right: 10, bottom: 2, left: 10 },
        "A traditional artist, shell carver, and advocate for the Northern Islands. Her work preserves Indigenous Chamorro artistry and carries ancestral knowledge into the present."),
    def('angelo_villagomez', 'Angelo Villagomez', 'ELITE', { top: 8, right: 5, bottom: 10, left: 6 },
        "A Chamorro conservationist who led the grassroots campaign to protect the Mariana Trench. His work helped establish the Mariana Trench Marine National Monument and carried Indigenous-led ocean conservation onto the world stage."),
    def('wendy_doromal', 'Wendy Doromal', 'ELITE', { top: 9, right: 6, bottom: 10, left: 2 },
        "A human-rights advocate who documented the exploitation of CNMI guest workers and carried their stories to Washington. Her decades of testimony and activism helped build the case for federal immigration reform."),
    def('boni_sagana', 'Boni Sagana', 'ELITE', { top: 6, right: 9, bottom: 10, left: 4 },
    "A leader of Dekada and prominent organizer in the CNMI guest-worker movement who fought for dignity, legal protection, and permanent status. His legacy was later soiled by controversy after his federal conviction for conspiring to unlawfully produce a CNMI driver's license."),
    def('itos_feliciano', 'Itos Feliciano', 'ELITE', { top: 10, right: 8, bottom: 6, left: 4 },
        "A longtime foreign-worker organizer who helped his community understand and advocate for immigration reform. He became a vital link between proposed legislation and the people whose futures depended upon it."),
    def('benigno_fitial', 'Benigno Fitial', 'ELITE', { top: 6, right: 7, bottom: 6, left: 10 },
        "A two-term governor whose political career collapsed amid impeachment and public-corruption charges. He pleaded guilty to misconduct in public office and conspiracy to commit theft of services, becoming the CNMI's first governor convicted of crimes committed in office."),
    def('ralph_torres', 'Ralph Torres', 'ELITE', { top: 10, right: 7, bottom: 2, left: 8 },
        "A former governor whose administration became engulfed in controversy over public spending, government-funded travel, and allegations of misconduct. Impeached by the House in 2022, he later faced criminal charges that were ultimately dismissed under a disputed civil settlement.")
];


// Attach element metadata in one auditable place so card stat definitions stay tidy.
CARD_POOL.forEach(card => { card.element = CARD_ELEMENTS[card.id] || null; });

// Quick lookup by id
const CARD_BY_ID = {};
CARD_POOL.forEach(c => { CARD_BY_ID[c.id] = c; });

// ---- Dev-time sanity checks -----------------------------------------------
// Runs once at load. Catches the common "out of sync" mistakes that happen
// when adding cards by hand. Prints clear errors to the browser console (F12)
// so a broken card never fails silently. Does not affect gameplay.
(function validateCardPool() {
    const seen = new Set();
    let problems = 0;

    const fail = (msg) => { console.error('[CardPool] ' + msg); problems++; };

    CARD_POOL.forEach(card => {
        // 1. Duplicate IDs — the second would overwrite the first in CARD_BY_ID
        if (seen.has(card.id)) {
            fail(`Duplicate card id: "${card.id}" (${card.name})`);
        }
        seen.add(card.id);

        // 2. Unknown rarity — a typo here makes the card crash or vanish
        if (!RARITY[card.rarity]) {
            fail(`Card "${card.id}" has unknown rarity: "${card.rarity}"`);
        }

        // 3. Every card must have a known element
        if (!card.element || !ELEMENTS[card.element]) {
            fail(`Card "${card.id}" has missing/unknown element: "${card.element}"`);
        }

        // 4. Side values must be integers 1-10
        ['top', 'right', 'bottom', 'left'].forEach(side => {
            const v = card[side];
            if (!Number.isInteger(v) || v < 1 || v > 10) {
                fail(`Card "${card.id}" side "${side}" is invalid: ${v}`);
            }
        });

    });

    // 5. Starter deck/collection must reference cards that actually exist
    const starterIds = ['coconut_crab', 'fruit_bat', 'flame_tree',
                        'reef_fish', 'betel_nut', 'managaha'];
    starterIds.forEach(id => {
        if (!CARD_BY_ID[id]) {
            fail(`Starter references a missing card id: "${id}"`);
        }
    });

    // Summary line
    const eliteCount = CARD_POOL.filter(c => c.rarity === 'ELITE').length;
    if (problems === 0) {
        console.log(`[CardPool] OK: ${CARD_POOL.length} cards ` +
            `(${eliteCount} elite).`);
    } else {
        console.warn(`[CardPool] ${problems} problem(s) found — see errors above.`);
    }
})();


// ---- Collection & persistence --------------------------------------------

const SAVE_KEY = 'cardbattle_save_v1';

const Collection = {
    // Load save data, or create a starter collection on first run
    load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            // Migrate older saves that predate stats tracking
            if (!data.stats) {
                data.stats = {
                    gamesWon: 0, gamesLost: 0, gamesDrawn: 0,
                    currentStreak: 0, bestStreak: 0
                };
            }
            // Migrate saves that predate optional rules (merge in any missing keys)
            data.rules = Object.assign(
                { same: false, plus: false, combo: false,
                  wall: false, suddenDeath: false, elemental: false },
                data.rules || {}
          );

            return data;
        } catch (e) {
            console.warn('Corrupt save, starting fresh.', e);
        }
    }
    return this.createStarter();
},

    save(data) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    },

     // First-run collection: just a handful of commons + one uncommon.
    // Everything else must be earned by playing.
    createStarter() {
    const owned = {};
    owned['coconut_crab'] = 1;
    owned['fruit_bat']    = 1;
    owned['flame_tree']   = 1;
    owned['reef_fish']    = 1;
    owned['betel_nut']    = 1;
    owned['managaha']     = 1;

    const data = {
            owned,
            deck: ['coconut_crab', 'fruit_bat', 'flame_tree', 'reef_fish', 'betel_nut'],
            stats: {
                gamesWon: 0,
                gamesLost: 0,
                gamesDrawn: 0,
                currentStreak: 0,
                bestStreak: 0
            },
            rules: {
                same: false,
                plus: false,
                combo: false,
                wall: false,        // <-- single toggle
                suddenDeath: false,
                elemental: false
            }
        };

    this.save(data);
    return data;
},

    // Give the player a card (adds to owned counts)
    addCard(data, cardId) {
        data.owned[cardId] = (data.owned[cardId] || 0) + 1;
        this.save(data);
    },

    recordResult(data, result) {   // result: 'win' | 'loss' | 'draw'
    const s = data.stats;
    if (result === 'win') {
        s.gamesWon++;
        s.currentStreak++;
        if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
    } else if (result === 'loss') {
        s.gamesLost++;
        s.currentStreak = 0;
    } else {
        s.gamesDrawn++;
        // draws don't break or extend the streak — your call
    }
    this.save(data);
},

    setRules(data, rules) {
        data.rules = rules;
        this.save(data);
    },

  // Wipe everything and start over (for testing / fresh start)
    reset() {
        localStorage.removeItem(SAVE_KEY);
        return this.createStarter();
    },

    // Returns { owned, total, byRarity: { COMMON: {owned, total}, ... } }
    progress(data) {
        const byRarity = {};
        Object.keys(RARITY).forEach(r => { byRarity[r] = { owned: 0, total: 0 }; });

        let owned = 0;
        CARD_POOL.forEach(card => {
            byRarity[card.rarity].total++;
            if ((data.owned[card.id] || 0) > 0) {
                owned++;
                byRarity[card.rarity].owned++;
            }
        });

        return { owned, total: CARD_POOL.length, byRarity };
    },

};   // <-- Collection object ends here

// ---- Compendium / Gallery scene -------------------------------------------

const COMP_W = 84;
const COMP_H = 104;

class CompendiumScene extends Phaser.Scene {
    constructor() { super('CompendiumScene'); }

    create() {
        addBackground(this, 'game_bg', 0.3);
        MusicManager.play(this, 'compendium_music');

        this.saveData = Collection.load();
        const prog = Collection.progress(this.saveData);

        // Title
        this.add.text(500, 28, 'CARD COMPENDIUM', {
            fontSize: '32px', color: '#f1c40f', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Overall progress
        this.add.text(500, 62,
            `Collected: ${prog.owned} / ${prog.total}`, {
            fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Per-rarity breakdown
        const parts = Object.keys(RARITY).map(r => {
            const p = prog.byRarity[r];
            return `${RARITY[r].name}: ${p.owned}/${p.total}`;
        });
        this.add.text(500, 88, parts.join('     '), {
            fontSize: '14px', color: '#cccccc'
        }).setOrigin(0.5);

        this.page = 0;
        this.pageContainer = null;
        this.drawGrid();
        this.drawPager();

        // Back button
        const back = this.add.text(500, 730, '[ Back ]', {
            fontSize: '22px', color: '#cccccc', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        back.on('pointerover', () => back.setColor('#ffffff'));
        back.on('pointerout',  () => back.setColor('#cccccc'));
        back.on('pointerdown', () => this.scene.start('TitleScene'));
    }

    // Full-screen detail popup for a single owned card
    showCardDetail(card) {
        // Prevent stacked detail windows if a card is clicked twice quickly.
        if (this.detailPopup) {
            this.detailPopup.destroy();
            this.detailPopup = null;
        }

        const popup = this.add.container(0, 0).setDepth(1000);
        this.detailPopup = popup;

        // Define ALL escape routes before rendering optional/detail content.
        // This keeps the Compendium recoverable even if a later visual fails.
        let escKey = null;
        const closePopup = () => {
            if (escKey) {
                escKey.removeAllListeners('down');
                escKey = null;
            }
            if (this.artViewer) {
                this.artViewer.destroy();
                this.artViewer = null;
            }
            if (popup && popup.scene) popup.destroy();
            if (this.detailPopup === popup) this.detailPopup = null;
        };

        // Dark backdrop captures clicks so cards behind the popup cannot fire.
        const overlay = this.add.rectangle(500, 384, 1000, 768, 0x000000, 0.78)
            .setInteractive();
        overlay.on('pointerdown', closePopup);
        popup.add(overlay);

        // Panel background
        const panel = this.add.rectangle(500, 384, 600, 520, 0x2c3e50)
            .setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(
                RARITY[card.rarity].color).color);
        popup.add(panel);

        // Always-available close controls.
        const closeX = this.add.text(778, 142, 'X', {
            fontSize: '24px', color: '#f1c40f', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        closeX.on('pointerover', () => closeX.setColor('#ffffff'));
        closeX.on('pointerout',  () => closeX.setColor('#f1c40f'));
        closeX.on('pointerdown', closePopup);
        popup.add(closeX);

        const close = this.add.text(500, 610, '[ Close ]', {
            fontSize: '22px', color: '#f1c40f', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        close.on('pointerover', () => close.setColor('#ffe680'));
        close.on('pointerout',  () => close.setColor('#f1c40f'));
        close.on('pointerdown', closePopup);
        popup.add(close);

        escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        const detailEscHandler = () => {
            // If the art viewer is open, its own Esc handler closes only that layer.
            if (!this.artViewer) closePopup();
        };
        escKey.on('down', detailEscHandler);

        // --- Card name / rarity ---
        const nameText = this.add.text(500, 162, card.name, {
            fontSize: '30px', color: '#ffffff', fontStyle: 'bold',
            align: 'center', wordWrap: { width: 500 }
        }).setOrigin(0.5);
        popup.add(nameText);

        const rarityText = this.add.text(500, 198, RARITY[card.rarity].name, {
            fontSize: '18px', color: RARITY[card.rarity].color, fontStyle: 'bold'
        }).setOrigin(0.5);
        popup.add(rarityText);

        // --- Big card visual ---
        // Compendium cards show their BASE values. Elemental +/-1 applies only
        // when a card occupies an elemental board cell during a match.
        const bigCard = this.makeBigCard(370, 330, card);
        popup.add(bigCard);

        // Make the card artwork discoverably clickable for a full-art gallery view.
        const artHit = this.add.rectangle(370, 330, 150, 185, 0xffffff, 0.001)
            .setInteractive({ useHandCursor: true });
        artHit.on('pointerover', () => bigCard.setScale(1.035));
        artHit.on('pointerout',  () => bigCard.setScale(1));
        artHit.on('pointerdown', () => this.showCardArtViewer(card));
        popup.add(artHit);

        const artHint = this.add.text(370, 438, 'Click card to enlarge art', {
            fontSize: '11px', color: '#aaaaaa', fontStyle: 'italic'
        }).setOrigin(0.5);
        popup.add(artHint);

        // --- Collection / power information ---
        const ownedCount = this.saveData.owned[card.id] || 0;
        const ownedText = this.add.text(625, 292, `Owned: ${ownedCount}`, {
            fontSize: '16px', color: '#cccccc'
        }).setOrigin(0.5);
        popup.add(ownedText);

        const total = card.top + card.right + card.bottom + card.left;
        const statText = this.add.text(625, 322, `Power: ${total}`, {
            fontSize: '16px', color: '#cccccc'
        }).setOrigin(0.5);
        popup.add(statText);

        // --- Element information ---
        const element = card.element ? ELEMENTS[card.element] : null;
        if (element) {
            if (this.textures.exists(element.asset)) {
                const elementIcon = this.add.image(596, 365, element.asset)
                    .setDisplaySize(42, 42);
                popup.add(elementIcon);
            }
            const elementText = this.add.text(625, 365, `Element: ${element.name}`, {
                fontSize: '17px', color: element.color, fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            popup.add(elementText);
        } else {
            const elementText = this.add.text(625, 365, 'Element: None', {
                fontSize: '17px', color: '#aaaaaa', fontStyle: 'bold'
            }).setOrigin(0.5);
            popup.add(elementText);
        }

        // --- Flavor text ---
        const flavorText = this.add.text(500, 495,
            card.flavor || 'No description available.', {
            fontSize: '15px', color: '#dddddd', fontStyle: 'italic',
            align: 'center', wordWrap: { width: 520 }, lineSpacing: 4
        }).setOrigin(0.5);
        popup.add(flavorText);
    }

    // Full-art viewer layered above the More Details popup.
    // Clicking anywhere outside the artwork, or pressing Esc, returns to details.
    showCardArtViewer(card) {
        if (this.artViewer) return;
        if (!this.textures.exists(card.id)) return;

        const viewer = this.add.container(0, 0).setDepth(2000);
        this.artViewer = viewer;

        let artEscKey = null;
        const closeViewer = () => {
            if (artEscKey) {
                artEscKey.removeAllListeners('down');
                artEscKey = null;
            }
            if (viewer && viewer.scene) viewer.destroy();
            if (this.artViewer === viewer) this.artViewer = null;
        };

        // This backdrop sits above More Details and is the click-out target.
        const shade = this.add.rectangle(500, 384, 1000, 768, 0x000000, 0.90)
            .setInteractive({ useHandCursor: true });
        shade.on('pointerdown', closeViewer);
        viewer.add(shade);

        // Preserve the original card-art aspect ratio and fit it generously onscreen.
        const texture = this.textures.get(card.id).getSourceImage();
        const maxW = 500;
        const maxH = 620;
        const scale = Math.min(maxW / texture.width, maxH / texture.height);
        const displayW = texture.width * scale;
        const displayH = texture.height * scale;

        const rarityColor = Phaser.Display.Color.HexStringToColor(
            RARITY[card.rarity].color).color;
        const frame = this.add.rectangle(500, 370, displayW + 12, displayH + 12, 0x111820)
            .setStrokeStyle(4, rarityColor);
        viewer.add(frame);

        const art = this.add.image(500, 370, card.id)
            .setDisplaySize(displayW, displayH)
            .setInteractive();
        // Consume clicks on the art itself so only clicking OUTSIDE closes the viewer.
        art.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
        });
        viewer.add(art);

        const caption = this.add.text(500, 704, `${card.name}  •  Full Card Art`, {
            fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        viewer.add(caption);

        const hint = this.add.text(500, 734, 'Click outside the artwork to return', {
            fontSize: '14px', color: '#bbbbbb', fontStyle: 'italic'
        }).setOrigin(0.5);
        viewer.add(hint);

        artEscKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        artEscKey.on('down', closeViewer);
    }

    // A larger card visual for the detail popup.
    // Uses BASE card values because Compendium cards are not on a board cell.
    makeBigCard(x, y, card) {
        const w = 150, h = 185;
        const rarityColor = Phaser.Display.Color.HexStringToColor(
            RARITY[card.rarity].color).color;

        const bg = this.add.rectangle(0, 0, w, h, 0x1a2530)
            .setStrokeStyle(4, rarityColor);

        const children = [bg];

        if (this.textures.exists(card.id)) {
            const art = this.add.image(0, 0, card.id)
                .setDisplaySize(w - 8, h - 8);
            children.push(art);
        }

        const numStyle = { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' };
        const top    = this.add.text(0, -h / 2 + 20, numToLabel(card.top), numStyle).setOrigin(0.5);
        const bottom = this.add.text(0, h / 2 - 20, numToLabel(card.bottom), numStyle).setOrigin(0.5);
        const left   = this.add.text(-w / 2 + 18, 0, numToLabel(card.left), numStyle).setOrigin(0.5);
        const right  = this.add.text(w / 2 - 18, 0, numToLabel(card.right), numStyle).setOrigin(0.5);

        children.push(top, bottom, left, right);
        return this.add.container(x, y, children);
    }

    // How many cards fit comfortably on one page (8 cols x 4 rows).
    // 4 rows keeps the bottom row clear of the Back button / pager.
    static get PER_PAGE() { return 32; }

    // Draw the current page of cards (owned = full color, unowned = locked)
    drawGrid() {
        // Clear the previous page's visuals if we're flipping pages
        if (this.pageContainer) this.pageContainer.destroy();
        this.pageContainer = this.add.container(0, 0);

        const cols = 8;
        const startX = 70;
        const startY = 130;
        const gapX = 114;
        const gapY = 128;

        const perPage = CompendiumScene.PER_PAGE;
        const startIndex = this.page * perPage;
        const endIndex = Math.min(startIndex + perPage, CARD_POOL.length);

        for (let i = startIndex; i < endIndex; i++) {
            const card = CARD_POOL[i];

            // Position is based on the slot WITHIN this page (0..perPage-1)
            const slot = i - startIndex;
            const col = slot % cols;
            const row = Math.floor(slot / cols);
            const x = startX + col * gapX + COMP_W / 2;
            const y = startY + row * gapY + COMP_H / 2;

            const owned = (this.saveData.owned[card.id] || 0) > 0;

            if (owned) {
                const visual = this.drawOwnedCard(x, y, card);
                visual.list[0].setInteractive();
                visual.list[0].on('pointerover', () => visual.setScale(1.08));
                visual.list[0].on('pointerout',  () => visual.setScale(1.0));
                visual.list[0].on('pointerdown', () => this.showCardDetail(card));
                this.pageContainer.add(visual);
            } else {
                const locked = this.drawLockedCard(x, y, card);
                this.pageContainer.add(locked);
            }
        }
    }

    // Draw the page navigation (Prev / page indicator / Next)
    drawPager() {
        const totalPages = Math.ceil(CARD_POOL.length / CompendiumScene.PER_PAGE);

        // Only show pager controls if there's more than one page
        if (totalPages <= 1) return;

        const y = 692;

        // Prev button
        this.prevBtn = this.add.text(360, y, '< Prev', {
            fontSize: '20px', color: '#cccccc', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        this.prevBtn.on('pointerover', () => this.prevBtn.setColor('#ffffff'));
        this.prevBtn.on('pointerout',  () => this.refreshPager());
        this.prevBtn.on('pointerdown', () => this.changePage(-1));

        // Page indicator
        this.pageText = this.add.text(500, y, '', {
            fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Next button
        this.nextBtn = this.add.text(640, y, 'Next >', {
            fontSize: '20px', color: '#cccccc', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        this.nextBtn.on('pointerover', () => this.nextBtn.setColor('#ffffff'));
        this.nextBtn.on('pointerout',  () => this.refreshPager());
        this.nextBtn.on('pointerdown', () => this.changePage(1));

        this.refreshPager();
    }

    changePage(delta) {
        const totalPages = Math.ceil(CARD_POOL.length / CompendiumScene.PER_PAGE);
        const next = Phaser.Math.Clamp(this.page + delta, 0, totalPages - 1);
        if (next === this.page) return;   // already at an edge
        this.page = next;
        this.drawGrid();
        this.refreshPager();
    }

    // Update page number text and grey out unavailable arrows
    refreshPager() {
        const totalPages = Math.ceil(CARD_POOL.length / CompendiumScene.PER_PAGE);
        if (this.pageText) {
            this.pageText.setText(`Page ${this.page + 1} / ${totalPages}`);
        }
        if (this.prevBtn) {
            const atStart = this.page === 0;
            this.prevBtn.setColor(atStart ? '#555555' : '#cccccc');
            if (atStart) this.prevBtn.disableInteractive();
            else this.prevBtn.setInteractive();
        }
        if (this.nextBtn) {
            const atEnd = this.page >= totalPages - 1;
            this.nextBtn.setColor(atEnd ? '#555555' : '#cccccc');
            if (atEnd) this.nextBtn.disableInteractive();
            else this.nextBtn.setInteractive();
        }
    }

    // A fully-revealed card with rarity border
    drawOwnedCard(x, y, card) {
        const rarityColor = Phaser.Display.Color.HexStringToColor(
            RARITY[card.rarity].color).color;

        const bg = this.add.rectangle(0, 0, COMP_W, COMP_H, 0x2c3e50)
            .setStrokeStyle(3, rarityColor);

        const children = [bg];

        if (this.textures.exists(card.id)) {
            const art = this.add.image(0, 0, card.id)
                .setDisplaySize(COMP_W - 6, COMP_H - 6);
            children.push(art);
        }

        const numStyle = { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' };
        const top    = this.add.text(0, -COMP_H / 2 + 12, numToLabel(card.top), numStyle).setOrigin(0.5);
        const bottom = this.add.text(0, COMP_H / 2 - 12, numToLabel(card.bottom), numStyle).setOrigin(0.5);
        const left   = this.add.text(-COMP_W / 2 + 11, 0, numToLabel(card.left), numStyle).setOrigin(0.5);
        const right  = this.add.text(COMP_W / 2 - 11, 0, numToLabel(card.right), numStyle).setOrigin(0.5);

        const nameStyle = {
            fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
            align: 'center', wordWrap: { width: COMP_W - 18 }
        };
        const name = this.add.text(0, 4, card.name, nameStyle).setOrigin(0.5);

        children.push(top, bottom, left, right, name);
        return this.add.container(x, y, children);
    }

    // A locked silhouette: hides stats and name, shows only rarity color hint
    drawLockedCard(x, y, card) {
        const rarityColor = Phaser.Display.Color.HexStringToColor(
            RARITY[card.rarity].color).color;

        // Dim background + dashed-feeling darker border
        const bg = this.add.rectangle(0, 0, COMP_W, COMP_H, 0x1a1a1a)
            .setStrokeStyle(3, rarityColor)
            .setAlpha(0.6);

        // Big "?" in the middle
        const q = this.add.text(0, -6, '?', {
            fontSize: '40px', color: '#555555', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Rarity label so the player knows what tier they're missing
        const tier = this.add.text(0, COMP_H / 2 - 14, RARITY[card.rarity].name, {
            fontSize: '9px', color: RARITY[card.rarity].color
        }).setOrigin(0.5);

        return this.add.container(x, y, [bg, q, tier]);
    }
}

// ---- Adaptive difficulty --------------------------------------------------

const Difficulty = {
    // Rough numeric power of a single card (sum of sides).
    cardPower(card) {
        return card.top + card.right + card.bottom + card.left;
    },

    // Average power of a list of card ids.
    deckPower(deckIds) {
        if (!deckIds.length) return 0;
        const valid = deckIds.map(id => CARD_BY_ID[id]).filter(Boolean);
        if (!valid.length) return 0;
        const total = valid.reduce((sum, card) => sum + this.cardPower(card), 0);
        return total / valid.length;
    },

    // Build an opponent deck from the strength of the FIVE cards the player
    // actually brought into this match. Ownership, collection size, rarity
    // unlocked, and lifetime wins do not increase the opponent's raw card power.
    //
    // Each equipped player card becomes one target. The AI gets a card with a
    // nearby four-side total, chosen randomly from the closest few candidates so
    // matches stay varied instead of becoming stat-for-stat mirrors.
    matchedOpponentDeck(playerDeckIds) {
        const playerCards = playerDeckIds
            .map(id => CARD_BY_ID[id])
            .filter(Boolean)
            .slice(0, 5);

        // Safety fallback for a corrupt/incomplete saved deck.
        if (!playerCards.length) {
            return Phaser.Utils.Array.Shuffle(CARD_POOL.slice())
                .slice(0, 5)
                .map(card => card.id);
        }

        const available = CARD_POOL.slice();
        const picks = [];

        playerCards.forEach(playerCard => {
            const target = this.cardPower(playerCard);

            // Sort remaining cards by distance from this player's card power.
            // A tiny random tie-break keeps repeated matches from producing the
            // exact same opposing hand every time.
            const ranked = available
                .map(card => ({
                    card,
                    distance: Math.abs(this.cardPower(card) - target),
                    tie: Math.random()
                }))
                .sort((a, b) => a.distance - b.distance || a.tie - b.tie);

            // Randomly choose among cards that are essentially equally suitable.
            // Prefer +/- 1 total-power point; widen to +/- 2, then use the
            // closest three only if the card pool has no near match.
            let near = ranked.filter(x => x.distance <= 1);
            if (!near.length) near = ranked.filter(x => x.distance <= 2);
            if (!near.length) near = ranked.slice(0, 3);

            const chosen = Phaser.Utils.Array.GetRandom(near).card;
            picks.push(chosen.id);

            // No duplicate cards in the AI hand.
            const idx = available.findIndex(c => c.id === chosen.id);
            if (idx >= 0) available.splice(idx, 1);
        });

        // A normal deck should always contain five cards. If an old/corrupt save
        // supplied fewer than five valid player cards, fill the remainder around
        // the player's average hand power rather than escalating by rarity.
        const avgTarget = playerCards.reduce((sum, c) => sum + this.cardPower(c), 0)
            / playerCards.length;
        while (picks.length < 5 && available.length) {
            const ranked = available
                .map(card => ({ card, distance: Math.abs(this.cardPower(card) - avgTarget), tie: Math.random() }))
                .sort((a, b) => a.distance - b.distance || a.tie - b.tie);
            const chosen = Phaser.Utils.Array.GetRandom(ranked.slice(0, Math.min(3, ranked.length))).card;
            picks.push(chosen.id);
            available.splice(available.findIndex(c => c.id === chosen.id), 1);
        }

        return Phaser.Utils.Array.Shuffle(picks);
    },

    // Win history affects HOW WELL the opponent plays, not how powerful a hand
    // it is allowed to bring. This keeps experienced players challenged without
    // punishing them for experimenting with weaker decks.
    lookaheadChance(stats) {
        const wins = stats.gamesWon;
        return Phaser.Math.Clamp(0.3 + wins * 0.05, 0.3, 0.9);
    }
};


// Pick a random card id, weighted by rarity. Elites are very rare.
function randomRewardCardId() {
    const roll = Phaser.Math.Between(1, 100);
    let tier;
    if (roll <= 70)      tier = 'COMMON';
    else if (roll <= 90) tier = 'UNCOMMON';
    else if (roll <= 99) tier = 'RARE';
    else                 tier = 'ELITE';

    const options = CARD_POOL.filter(c => c.rarity === tier);
    return Phaser.Utils.Array.GetRandom(options).id;
};

// ---- Boot / preload scene -------------------------------------------------

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
        // Simple loading text
        this.add.text(500, 384, 'Loading...', {
            fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5);

        // Background image (loaded once)
        this.load.image('game_bg', 'assets/game-background.png');
        this.load.image('game_board', 'assets/game-board.png');   // <-- NEW
        this.load.image('match_logo', 'assets/logo.png');
        this.load.image('title_logo', 'assets/title-logo.png');
        this.load.audio('theme_music',      ['assets/theme.ogg',      'assets/theme.mp3']);
        this.load.audio('battle_music',     ['assets/battle-music.ogg', 'assets/battle-music.mp3']);
        this.load.audio('sudden_death_music', ['assets/sudden-death.ogg', 'assets/sudden-death.mp3']);
        this.load.audio('compendium_music', ['assets/compendium.ogg', 'assets/compendium.mp3']);

        // Elemental rule icons
        Object.values(ELEMENTS).forEach(el => {
            this.load.image(el.asset, `assets/${el.asset}.png`);
        });

        // Load art for EVERY card in the pool. The key is the card id,
        // so lookups are trivial later. Since all cards have art, we derive
        // this straight from CARD_POOL — no separate list to keep in sync.
        CARD_POOL.forEach(card => {
            this.load.image(card.id, `assets/${card.id}.png`);
        });

        // If a file is missing, log it instead of silently failing
        this.load.on('loaderror', (file) => {
            console.warn('Failed to load image:', file.key, file.src);
        });
    }

    create() {
        this.scene.start('TitleScene');
    }
}

// ---- Title scene ----------------------------------------------------------

class TitleScene extends Phaser.Scene {
    constructor() { super('TitleScene'); }

    create() {
        addBackground(this, 'game_bg', 0.1);
        MusicManager.play(this, 'theme_music');

        // ---- Logo image ----
if (this.textures.exists('title_logo')) {
    this.add.image(500, 160, 'title_logo')
        .setDisplaySize(240, 240)   // spans y=40 to y=280
        .setOrigin(0.5);
} else {
    // Fallback to text if the logo failed to load
    this.add.text(500, 150, 'LATTE STONE LEGENDS', {
        fontSize: '44px', color: '#f1c40f', fontStyle: 'bold',
        align: 'center'
    }).setOrigin(0.5);
}

        // ---- Tagline ----
        this.add.text(500, 290, 'Raise. Rule. Remember.', {
            fontSize: '20px', color: '#cccccc', fontStyle: 'italic'
        }).setOrigin(0.5);

        // ---- Instructions ----
        this.add.text(500, 332,
            "Place cards. Beat your neighbor's number to flip them.", {
            fontSize: '18px', color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(500, 350,
            "Own the most cards when the board fills up to win.", {
            fontSize: '18px', color: '#cccccc'
        }).setOrigin(0.5);

        // ---- Menu buttons ----
        const play = this.add.text(500, 410, '[ Play ]', {
            fontSize: '36px', color: '#2ecc71', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        play.on('pointerover', () => play.setColor('#7fffa0'));
        play.on('pointerout',  () => play.setColor('#2ecc71'));
        // Explicitly clear any launch data left behind by a previous Sudden
        // Death replay so a new match always loads the player's saved deck.
        play.on('pointerdown', () => this.scene.start('MainScene', {
            suddenDeath: null
        }));

        const deck = this.add.text(500, 480, '[ Deck ]', {
            fontSize: '36px', color: '#3498db', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        deck.on('pointerover', () => deck.setColor('#7fc8ff'));
        deck.on('pointerout',  () => deck.setColor('#3498db'));
        deck.on('pointerdown', () => this.scene.start('CollectionScene'));

        const compendium = this.add.text(500, 545, '[ Compendium ]', {
            fontSize: '30px', color: '#f1c40f', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        compendium.on('pointerover', () => compendium.setColor('#ffe680'));
        compendium.on('pointerout',  () => compendium.setColor('#f1c40f'));
        compendium.on('pointerdown', () => this.scene.start('CompendiumScene'));

        const rules = this.add.text(500, 600, '[ Rules ]', {
            fontSize: '26px', color: '#e67e22', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        rules.on('pointerover', () => rules.setColor('#f0a050'));
        rules.on('pointerout',  () => rules.setColor('#e67e22'));
        rules.on('pointerdown', () => this.scene.start('RulesScene'));

        // ---- Reset Save button (with confirm step) ----
        this.resetConfirming = false;
        const reset = this.add.text(500, 720, '[ Reset Save ]', {
            fontSize: '16px', color: '#888888'
        }).setOrigin(0.5).setInteractive();

        reset.on('pointerover', () => reset.setColor('#e74c3c'));
        reset.on('pointerout',  () => {
            reset.setColor(this.resetConfirming ? '#e74c3c' : '#888888');
        });

        reset.on('pointerdown', () => {
            if (!this.resetConfirming) {
                // First click: ask for confirmation
                this.resetConfirming = true;
                reset.setText('[ Click again to CONFIRM reset ]');
                reset.setColor('#e74c3c');

                // Auto-cancel if they don't confirm within 3 seconds
                this.time.delayedCall(3000, () => {
                    if (this.resetConfirming) {
                        this.resetConfirming = false;
                        reset.setText('[ Reset Save ]');
                        reset.setColor('#888888');
                    }
                });
            } else {
                // Second click: actually reset
                Collection.reset();
                reset.setText('[ Save reset! ]');
                reset.setColor('#2ecc71');
                this.resetConfirming = false;
            }
        });
    }
}

// ---- Rules toggle scene ---------------------------------------------------

class RulesScene extends Phaser.Scene {
    constructor() { super('RulesScene'); }

    create() {
        addBackground(this, 'game_bg', 0.3);
        MusicManager.play(this, 'theme_music');

        this.saveData = Collection.load();
        // Work on a copy; commit when leaving
        this.rules = Object.assign(
            { same: false, plus: false, combo: false, wall: false, suddenDeath: false, elemental: false },
            this.saveData.rules
        );

        this.add.text(500, 60, 'OPTIONAL RULES', {
            fontSize: '40px', color: '#f1c40f', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(500, 105,
            'Toggle extra rules to change how cards flip.', {
            fontSize: '16px', color: '#cccccc'
        }).setOrigin(0.5);

        // Each rule: key, title, description
        this.ruleDefs = [
    {
        key: 'same',
        title: 'SAME',
        desc: "Touch 2+ cards with equal-value sides? All matched\nenemy cards flip, even if the numbers wouldn't win."
    },
    {
        key: 'plus',
        title: 'PLUS',
        desc: "Touch 2+ cards where the side-sums are equal?\nAll matched enemy cards flip, regardless of values."
    },
    {
        key: 'wall',
        title: 'WALL',
        desc: "Board edges count as an A (10) for Same and Plus.\nA Wall trigger must also involve a real adjacent card.\n(Requires Same or Plus.)"
    },
    {
        key: 'combo',
        title: 'COMBO',
        desc: "Cards flipped by Same or Plus then attack their\nown neighbors normally. Flips can cascade!\n(Requires Same or Plus.)"
    },
    {
    key: 'suddenDeath',
    title: 'SUDDEN DEATH',
    desc: "If the match ends in a draw, replay it! Each side's\nnew deck is the cards they held at the end. Repeats until someone wins."
    },
    {
    key: 'elemental',
    title: 'ELEMENTAL',
    desc: "Some spaces gain random elements. Match the space for +1 to all sides;\nplace a different element there for -1. Values stay between 1 and A."
    }
];


        this.rowObjects = {};   // so we can refresh toggle labels

        const startY = 150;
        const rowGap = 88;

        this.ruleDefs.forEach((def, i) => {
            this.drawRuleRow(def, startY + i * rowGap);
        });

        this.refreshRows();

        // Back button (saves on exit)
        const back = this.add.text(500, 710, '[ Back ]', {
            fontSize: '24px', color: '#cccccc', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        back.on('pointerover', () => back.setColor('#ffffff'));
        back.on('pointerout',  () => back.setColor('#cccccc'));
        back.on('pointerdown', () => {
            Collection.setRules(this.saveData, this.rules);
            this.scene.start('TitleScene');
        });
    }

    drawRuleRow(def, y) {
        // Rule title
        const title = this.add.text(120, y, def.title, {
            fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        // Description
        this.add.text(120, y + 30, def.desc, {
            fontSize: '13px', color: '#aaaaaa', lineSpacing: 2
        }).setOrigin(0, 0);

        // Toggle button (label set in refreshRows)
        const toggle = this.add.text(820, y, '', {
            fontSize: '26px', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();

        toggle.on('pointerdown', () => this.onToggle(def.key));

        this.rowObjects[def.key] = { title, toggle };
    }

    onToggle(key) {
    // Flip the value
    this.rules[key] = !this.rules[key];

    // If Same and Plus are both off, Combo AND Wall must turn off too
    if (!this.rules.same && !this.rules.plus) {
        this.rules.combo = false;
        this.rules.wall = false;
    }

    this.refreshRows();
}

    refreshRows() {
    const dependsLocked = !this.rules.same && !this.rules.plus;

    this.ruleDefs.forEach(def => {
        const row = this.rowObjects[def.key];
        const on = this.rules[def.key];

        // Both Combo and Wall require Same or Plus to be active
        const isLocked = (def.key === 'combo' || def.key === 'wall')
            && dependsLocked;

        if (isLocked) {
            row.toggle.setText('[ LOCKED ]');
            row.toggle.setColor('#555555');
            row.toggle.disableInteractive();
            row.title.setColor('#555555');
        } else {
            row.toggle.setInteractive();
            row.toggle.setText(on ? '[ ON ]' : '[ OFF ]');
            row.toggle.setColor(on ? '#2ecc71' : '#888888');
            row.title.setColor(on ? '#ffffff' : '#888888');
        }
    });
}
}

// ---- The main scene -------------------------------------------------------

class MainScene extends Phaser.Scene {

    constructor() { super('MainScene'); }

    static get MAX_SUDDEN_DEATH() { return 5; }   // safety cap on replays

    init(data) {
    // Sudden Death carries decks + round number between restarts.
    this.suddenDeathData = (data && data.suddenDeath) || null;
    this.suddenDeathRound = this.suddenDeathData
        ? this.suddenDeathData.round
        : 0;
  }

     create() {
        addBackground(this, 'game_bg', 0.3);
        addGameBoard(this, 'game_board');

        // Sudden Death rounds get their own soundtrack.
        MusicManager.play(
            this,
            this.suddenDeathData ? 'sudden_death_music' : 'battle_music'
        );

        // Persistent match logo below the grid, above the board artwork.
        // The guard keeps the match playable even if the optional asset
        // is missing or fails to load.
        if (this.textures.exists('match_logo')) {
            this.add.image(500, 555, 'match_logo')
                .setDisplaySize(360, 120)
                .setAlpha(0.32)
                .setDepth(-400);
        }

        // Load persistent collection/deck
        this.saveData = Collection.load();
        // Active optional rules for this match
        this.rules = Object.assign(
            { same: false, plus: false, combo: false, wall: false, suddenDeath: false, elemental: false },
            this.saveData.rules
        );

        // Elemental board layout. Sudden Death keeps the original layout because
        // it is a continuation of the same match; a fresh match rolls a new one.
        this.elementalBoard = this.rules.elemental
            ? (this.suddenDeathData && this.suddenDeathData.elementalBoard
                ? this.suddenDeathData.elementalBoard.slice()
                : this.generateElementalBoard())
            : Array(9).fill(null);

        // Game state
        this.board = [null, null, null, null, null, null, null, null, null];
        if (this.suddenDeathData) {
           // Rebuild both hands from the cards each side controlled last round.
           this.redHand  = this.deckToHand(this.suddenDeathData.redDeck);
           this.blueHand = this.deckToHand(this.suddenDeathData.blueDeck);
           // Keep the ORIGINAL ai deck for capture rewards (from round 1).
           this.aiOriginalDeck = this.suddenDeathData.redDeck;
         } else {
           this.redHand = this.makeAiDeck();  // uses difficulty
           this.aiOriginalDeck = this.redHand.map(c => c.id); // for win rewards
           this.blueHand = this.deckToHand(this.saveData.deck); // player's chosen deck
         }
        this.currentPlayer = 'blue';
        this.selectedCard = null;
        this.gameOver = false;
        this.inputLocked = false;

        this.boardGraphics = [];
        this.boardVisualByIndex = {};
        this.handSprites = { red: [], blue: [] };

        this.drawGridCells();
        this.drawHands();
        this.drawTurnText();
        this.createScoreDisplay();
        this.drawDifficultyBadge();   // optional feedback (below)

        this.drawInGameButtons();   // <-- add this line
    }



    // Restart / Quit buttons available during a match (with confirmation)
    drawInGameButtons() {
        const restart = this.add.text(60, 700, '[ Restart ]', {
            fontSize: '18px', color: '#2ecc71', fontStyle: 'bold'
        }).setInteractive();

        this.makeConfirmButton(restart, {
            normalLabel:  '[ Restart ]',
            confirmLabel: '[ Confirm restart? ]',
            normalColor:  '#2ecc71',
            hoverColor:   '#7fffa0',
            // Restart as a fresh match with the saved deck, not with any
            // temporary cards controlled during a Sudden Death round.
            onConfirm:    () => this.scene.restart({ suddenDeath: null })
        });

        const quit = this.add.text(230, 700, '[ Quit to Title ]', {
            fontSize: '18px', color: '#cccccc', fontStyle: 'bold'
        }).setInteractive();

        this.makeConfirmButton(quit, {
            normalLabel:  '[ Quit to Title ]',
            confirmLabel: '[ Confirm quit? ]',
            normalColor:  '#cccccc',
            hoverColor:   '#ffffff',
            onConfirm:    () => this.scene.start('TitleScene')
        });
    }

      // Turns a text button into a two-click "are you sure?" button.
    // First click shows a confirm prompt; second click runs the action.
    // Auto-cancels after 3 seconds if not confirmed.
    makeConfirmButton(btn, opts) {
        const {
            normalLabel,   // e.g. '[ Restart ]'
            confirmLabel,  // e.g. '[ Click again to confirm ]'
            normalColor,   // e.g. '#2ecc71'
            hoverColor,    // e.g. '#7fffa0'
            onConfirm      // function to run on the second click
        } = opts;

        let confirming = false;
        let timer = null;

        const resetState = () => {
            confirming = false;
            btn.setText(normalLabel);
            btn.setColor(normalColor);
            if (timer) { timer.remove(); timer = null; }
        };

        btn.on('pointerover', () => {
            btn.setColor(confirming ? '#e74c3c' : hoverColor);
        });
        btn.on('pointerout', () => {
            btn.setColor(confirming ? '#e74c3c' : normalColor);
        });

        btn.on('pointerdown', () => {
            if (!confirming) {
                confirming = true;
                btn.setText(confirmLabel);
                btn.setColor('#e74c3c');
                timer = this.time.delayedCall(3000, resetState);
            } else {
                resetState();
                onConfirm();
            }
        });

        return btn;
    }

    // Convert a list of card ids into hand objects (clone so board edits are safe)
    deckToHand(deckIds) {
        return deckIds.map(id => this.cloneCard(CARD_BY_ID[id]));
    }

    // Build a 5-card AI deck matched to the player's CURRENT equipped hand.
    // Card strength is independent of collection size and lifetime wins.
    makeAiDeck() {
        const ids = Difficulty.matchedOpponentDeck(this.saveData.deck);
        const picks = ids.map(id => this.cloneCard(CARD_BY_ID[id]));

        // Store useful matchup diagnostics for the small in-game badge.
        this.playerHandPower = Difficulty.deckPower(this.saveData.deck);
        this.aiHandPower = picks.length
            ? picks.reduce((sum, c) => sum + Difficulty.cardPower(c), 0) / picks.length
            : 0;
        this.aiEliteCount = picks.filter(c => c.rarity === 'ELITE').length;

        return picks;
    }
drawDifficultyBadge() {
    const s = this.saveData.stats;
    const playerPower = Number.isFinite(this.playerHandPower)
        ? this.playerHandPower.toFixed(1) : Difficulty.deckPower(this.saveData.deck).toFixed(1);
    const aiPower = Number.isFinite(this.aiHandPower)
        ? this.aiHandPower.toFixed(1) : '?';

    this.add.text(500, 645,
        `Wins: ${s.gamesWon}  |  Streak: ${s.currentStreak}  |  Hand Power: ${playerPower} vs ${aiPower}`, {
        fontSize: '16px', color: '#f1c40f'
    }).setOrigin(0.5);

    // Active optional rules (only shown if any are on)
    const active = [];
if (this.rules.same)  active.push('Same');
if (this.rules.plus)  active.push('Plus');
if (this.rules.wall)  active.push('Wall');
if (this.rules.combo) active.push('Combo');
if (this.rules.elemental) active.push('Elemental');

    const rulesLabel = active.length > 0
        ? `Rules: ${active.join(' + ')}`
        : 'Rules: None';

    this.add.text(500, 670, rulesLabel, {
        fontSize: '14px', color: active.length > 0 ? '#2ecc71' : '#888888'
    }).setOrigin(0.5);

    // If we're in a Sudden Death replay, show which round.
    if (this.suddenDeathRound > 0) {
        this.add.text(500, 695, `SUDDEN DEATH — Round ${this.suddenDeathRound}`, {
            fontSize: '15px', color: '#e74c3c', fontStyle: 'bold'
        }).setOrigin(0.5);
    }
}


    // Clone a card definition into a mutable hand/board card
    cloneCard(c) {
        return { id: c.id, name: c.name, rarity: c.rarity, element: c.element,
                 top: c.top, right: c.right, bottom: c.bottom, left: c.left };
        }

    // Randomly mark 3-5 unique spaces for an Elemental match.
    generateElementalBoard() {
        const layout = Array(9).fill(null);
        const indices = Phaser.Utils.Array.Shuffle([0,1,2,3,4,5,6,7,8]);
        const keys = Object.keys(ELEMENTS);
        const count = Phaser.Math.Between(3, 5);
        for (let i = 0; i < count; i++) {
            layout[indices[i]] = Phaser.Utils.Array.GetRandom(keys);
        }
        return layout;
    }

    // Modifier for a card occupying a particular board cell.
    elementalModifier(card, cellIndex) {
        if (!this.rules.elemental || cellIndex === null || cellIndex === undefined) return 0;
        const spaceElement = this.elementalBoard[cellIndex];
        if (!spaceElement) return 0;
        return card.element === spaceElement ? 1 : -1;
    }

    // The single source of truth for battle values. All rules and AI simulations
    // call this, preventing displayed and calculated numbers from diverging.
    cardSideValue(card, cellIndex, side) {
        return Phaser.Math.Clamp(card[side] + this.elementalModifier(card, cellIndex), 1, 10);
    }

    // Draw the 9 empty grid cell backgrounds
    drawGridCells() {
        this.cellZones = [];
        for (let i = 0; i < 9; i++) {
            const { x, y } = this.cellPosition(i);

            const bg = this.add.rectangle(x, y, CARD_W, CARD_H, 0x000000, 0.15)
    .setStrokeStyle(2, 0xf1c40f, 0.4)   // subtle gold outline
    .setInteractive();

            const elementKey = this.elementalBoard[i];
            if (elementKey) {
                const el = ELEMENTS[elementKey];
                if (el && this.textures.exists(el.asset)) {
                    this.add.image(x, y, el.asset)
                        .setDisplaySize(54, 54)
                        .setAlpha(0.52)
                        .setDepth(-1);
                }
            }

            bg.on('pointerdown', () => this.tryPlaceCard(i));
            this.cellZones.push(bg);
        }
    }

    // Center pixel position of grid cell index (0-8)
    cellPosition(i) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = GRID_X + col * (CARD_W + CELL_GAP) + CARD_W / 2;
        const y = GRID_Y + row * (CARD_H + CELL_GAP) + CARD_H / 2;
        return { x, y };
    }

    // Draw both players' hands
    drawHands() {
        // Clear old hand sprites
        this.handSprites.red.forEach(s => s.destroy());
        this.handSprites.blue.forEach(s => s.destroy());
        this.handSprites.red = [];
        this.handSprites.blue = [];

        this.drawOneHand('red', this.redHand, RED_HAND_X, RED);
        this.drawOneHand('blue', this.blueHand, BLUE_HAND_X, BLUE);
    }

    drawOneHand(owner, hand, xPos, color) {
        hand.forEach((card, index) => {
            const y = HAND_START_Y + index * HAND_GAP + CARD_H / 2;
            const container = this.makeCardVisual(xPos + CARD_W / 2, y, card, color);

            // Only the HUMAN (blue) player's cards are clickable
            if (owner === this.currentPlayer && owner === 'blue' &&
                !this.gameOver && !this.inputLocked) {
                container.list[0].setInteractive();  // the background rect
                container.list[0].on('pointerdown', () => {
                    this.selectCard(owner, index, container);
                });
            }

            // Highlight the selected card
            if (this.selectedCard &&
                this.selectedCard.owner === owner &&
                this.selectedCard.index === index) {
                container.list[0].setStrokeStyle(4, 0xffff00);
            }

            this.handSprites[owner].push(container);
        });
    }

 // Build a visual card (a Phaser container) at x,y
    makeCardVisual(x, y, card, color, cellIndex = null) {
        const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, color)
            .setStrokeStyle(2, 0x000000);

        const children = [bg];

        // Card art (if available) — inset slightly so the border shows
        if (this.textures.exists(card.id)) {
            const art = this.add.image(0, 0, card.id)
                .setDisplaySize(CARD_W - 6, CARD_H - 6);
            children.push(art);
        }

        // Elemental board feedback. Keep the artwork clean: placed cards on an
        // elemental space get only a compact +/-1 corner badge. Their displayed
        // ranks below still use the effective Elemental-adjusted values.
        const elementalMod = cellIndex === null ? 0 : this.elementalModifier(card, cellIndex);
        if (elementalMod !== 0) {
            const positive = elementalMod > 0;
            const effectColor = positive ? 0x2ecc71 : 0xe74c3c;
            const effectHex = positive ? '#72f59d' : '#ff8175';

            // Tuck the badge into the lower-right corner, away from the rank values.
            const badgeX = CARD_W / 2 - 14;
            const badgeY = CARD_H / 2 - 14;
            const badgeBg = this.add.circle(badgeX, badgeY, 11, 0x000000, 0.82)
                .setStrokeStyle(2, effectColor, 1);
            const badge = this.add.text(badgeX, badgeY, positive ? '+1' : '-1', {
                fontSize: '10px', color: effectHex, fontStyle: 'bold'
            }).setOrigin(0.5);
            children.push(badgeBg, badge);
        }

        const valueColor = '#ffffff';
        const style = {
            fontSize: '20px', color: valueColor, fontStyle: 'bold',
            stroke: elementalMod !== 0 ? '#000000' : undefined,
            strokeThickness: elementalMod !== 0 ? 3 : 0
        };
        const shownTop    = cellIndex === null ? card.top    : this.cardSideValue(card, cellIndex, 'top');
        const shownBottom = cellIndex === null ? card.bottom : this.cardSideValue(card, cellIndex, 'bottom');
        const shownLeft   = cellIndex === null ? card.left   : this.cardSideValue(card, cellIndex, 'left');
        const shownRight  = cellIndex === null ? card.right  : this.cardSideValue(card, cellIndex, 'right');
        const topText    = this.add.text(0, -CARD_H / 2 + 14, numToLabel(shownTop), style).setOrigin(0.5);
        const bottomText = this.add.text(0, CARD_H / 2 - 14, numToLabel(shownBottom), style).setOrigin(0.5);
        const leftText   = this.add.text(-CARD_W / 2 + 12, 0, numToLabel(shownLeft), style).setOrigin(0.5);
        const rightText  = this.add.text(CARD_W / 2 - 12, 0, numToLabel(shownRight), style).setOrigin(0.5);

        children.push(topText, bottomText, leftText, rightText);

        // Small element badge. It stays visible on hand and board cards.
        if (card.element && ELEMENTS[card.element] && this.textures.exists(ELEMENTS[card.element].asset)) {
            const badge = this.add.image(0, -10, ELEMENTS[card.element].asset)
                .setDisplaySize(22, 22)
                .setAlpha(0.95);
            children.push(badge);
        }

        // Name label in the center (only if the card has a name)
        if (card.name) {
            const nameStyle = {
                fontSize: '11px',
                color: '#ffffff',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: CARD_W - 20 }
            };
            const nameText = this.add.text(0, 6, card.name, nameStyle).setOrigin(0.5);
            children.push(nameText);
        }

        const container = this.add.container(x, y, children);
        return container;
    }

    // Player clicks a card in their hand
    selectCard(owner, index, container) {
        if (this.gameOver || this.inputLocked) return;
        if (owner !== this.currentPlayer) return;

        this.selectedCard = { owner, index };
        this.drawHands(); // redraw to show highlight
    }

    // Player clicks a grid cell to place the selected card
    tryPlaceCard(cellIndex) {
        if (this.gameOver || this.inputLocked) return;
        if (!this.selectedCard) return;              // nothing picked up
        if (this.board[cellIndex] !== null) return;  // cell taken

        const hand = this.currentPlayer === 'red' ? this.redHand : this.blueHand;
        const card = hand[this.selectedCard.index];

        // Place the card on the board (data)
        this.board[cellIndex] = { card, owner: this.currentPlayer };
        hand.splice(this.selectedCard.index, 1);
        this.selectedCard = null;

        this.resolveAndContinue(cellIndex);
    }

    // Play placed-card entrance + all flip animations, then advance the game
    async resolveAndContinue(cellIndex) {
        this.inputLocked = true;
        this.drawHands();   // redraw to remove interactivity/highlight

        this.redrawBoard();
        await this.animatePlace(cellIndex);   // entrance pop

        const steps = this.computeFlips(cellIndex);
        for (const step of steps) {
            if (step.reason) {
                this.showFlipBanner(step.index, step.reason + '!',
                    this.flipReasonColor(step.reason));
                await this.animateFlip(step.index, step.to);
                await this.wait(240);   // let the special-rule popup register before the next flip
            } else {
                await this.animateFlip(step.index, step.to);
            }
        }

        this.updateScoreDisplay();

        // Check for game over (all 9 cells filled)
        const filled = this.board.every(c => c !== null);
        if (filled) {
            this.inputLocked = false;
            this.endGame();
            return;
        }

        // Switch turns
        this.currentPlayer = this.currentPlayer === 'blue' ? 'red' : 'blue';
        this.drawTurnText();
        this.inputLocked = false;
        this.drawHands();

        // If it's now the AI's turn, let it move after a short pause
        if (this.currentPlayer === 'red' && !this.gameOver) {
            this.time.delayedCall(500, () => this.aiMove());
        }
    }

    // Entrance animation for a freshly placed card
    animatePlace(cellIndex) {
        return new Promise(resolve => {
            const visual = this.boardVisualByIndex[cellIndex];
            if (!visual) { resolve(); return; }
            visual.setScale(0);
            this.playSound('place');
            this.tweens.add({
                targets: visual,
                scale: 1,
                duration: 180,
                ease: 'Back.easeOut',
                onComplete: resolve
            });
        });
    }

    // Animate a single board card flipping to a new owner
    animateFlip(cellIndex, newOwner) {
        return new Promise(resolve => {
            const visual = this.boardVisualByIndex[cellIndex];
            if (!visual) { resolve(); return; }

            const bg = visual.list[0]; // the rectangle
            this.tweens.add({
                targets: visual,
                scaleX: 0,
                duration: 120,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    bg.fillColor = newOwner === 'red' ? RED : BLUE;
                    this.playSound('flip');
                    this.tweens.add({
                        targets: visual,
                        scaleX: 1,
                        duration: 120,
                        ease: 'Quad.easeOut',
                        onComplete: resolve
                    });
                }
            });
        });
    }


    // Small awaitable pause used between animated flip steps.
    wait(ms) {
        return new Promise(resolve => this.time.delayedCall(ms, resolve));
    }


// Resolve flips for a freshly placed card. Handles normal comparison, the
// optional Same / Plus rules, and (if enabled) Wall, and Combo cascades. Mutates board
// ownership and returns ordered flip steps for animation.
computeFlips(startIndex) {
    const placed = this.board[startIndex];
    if (!placed) return [];

    const owner = placed.owner;
    const neighbors = this.getNeighbors(startIndex);

    // Cards flipped by Same/Plus — these SEED the combo cascade.
    const specialFlips = new Set();
    // All flips this turn (special + normal + cascade), for de-duping.
    const flipped = new Set();
    // Ordered steps for animation.
    const flipSteps = [];

    // Helper: flip a cell to `owner`, record the step. Returns true if it
    // actually changed hands (was an enemy card not already flipped).
    const doFlip = (index, reason) => {
        const cell = this.board[index];
        if (!cell || cell.owner === owner || flipped.has(index)) return false;
        const from = cell.owner;
        cell.owner = owner;
        flipped.add(index);
        flipSteps.push({ index, from, to: owner, reason });   // <-- reason added
        return true;
    };


    // --- Special phase: Same / Plus (detect on all neighbors, flip enemies) ---

    const WALL = 10;   // walls act as an 'A' for the Wall rule

    if (this.rules.same) {
    // Real-neighbor matches...
    const matches = neighbors.filter(
        n => this.cardSideValue(placed.card, startIndex, n.mySide) === this.cardSideValue(n.card, n.index, n.theirSide)
    );

    let wallMatches = 0;
    if (this.rules.wall) {
        this.getWallSides(startIndex).forEach(side => {
            if (this.cardSideValue(placed.card, startIndex, side) === WALL) wallMatches++;
        });
    }

    // Same Wall may use a wall as one of the required matches, but the
    // trigger must include at least one real neighboring card. Corner walls
    // matching each other cannot create a special capture by themselves.
    if (matches.length >= 1 && matches.length + wallMatches >= 2) {
        const reason = wallMatches > 0 ? 'Same Wall' : 'Same';
        matches.forEach(n => {
            if (n.owner !== owner && doFlip(n.index, reason)) {
                specialFlips.add(n.index);
            }
        });
    }
}

    if (this.rules.plus) {
        const sums = {};
        neighbors.forEach(n => {
            const sum = this.cardSideValue(placed.card, startIndex, n.mySide) + this.cardSideValue(n.card, n.index, n.theirSide);
            (sums[sum] = sums[sum] || []).push(n);
        });

    if (this.rules.wall) {
        this.getWallSides(startIndex).forEach(side => {
            const sum = this.cardSideValue(placed.card, startIndex, side) + WALL;
            (sums[sum] = sums[sum] || []).push({ wall: true });
        });
    }

    Object.values(sums).forEach(group => {
        // A Plus/Plus Wall trigger must involve at least one REAL neighboring
        // card. Two board edges are not allowed to manufacture a special
        // trigger by matching only each other in a corner.
        const realEntries = group.filter(n => !n.wall);
        const wallEntries = group.filter(n => n.wall);
        if (group.length >= 2 && realEntries.length >= 1) {
            const usedWall = wallEntries.length > 0;
            const reason = usedWall ? 'Plus Wall' : 'Plus';
            realEntries.forEach(n => {
                if (n.owner !== owner && doFlip(n.index, reason)) {
                    specialFlips.add(n.index);
                }
            });
        }
    });
}


    // --- Normal phase for the placed card (these do NOT seed combos) ---
    neighbors.forEach(n => {
        if (n.owner === owner) return;
        if (this.cardSideValue(placed.card, startIndex, n.mySide) > this.cardSideValue(n.card, n.index, n.theirSide)) {
            doFlip(n.index, null);   // null = no special banner
        }
    });

    // --- Combo cascade: each special-flipped card attacks its neighbors
    //     with NORMAL rules. New flips from those attacks also cascade. ---
    if (this.rules.combo && specialFlips.size > 0) {
        const queue = [...specialFlips];

        while (queue.length > 0) {
            const attackerIndex = queue.shift();
            const attacker = this.board[attackerIndex];
            const attackerNeighbors = this.getNeighbors(attackerIndex);

            attackerNeighbors.forEach(n => {
                if (n.owner === owner) return;
                if (this.cardSideValue(attacker.card, attackerIndex, n.mySide) > this.cardSideValue(n.card, n.index, n.theirSide)) {
                if (doFlip(n.index, 'Combo')) {
                    queue.push(n.index);
                    }
                }
            });
        }
    }

    return flipSteps;
}

// Helper: returns on-board neighbors of a cell with the touching-side info.
// Each entry: { index, owner, card, mySide, theirSide }
getNeighbors(cellIndex) {
    const col = cellIndex % 3;
    const row = Math.floor(cellIndex / 3);
    const dirs = [
        [-1, 0, 'top', 'bottom'],
        [1, 0, 'bottom', 'top'],
        [0, -1, 'left', 'right'],
        [0, 1, 'right', 'left']
    ];

    const result = [];
    dirs.forEach(([dr, dc, mySide, theirSide]) => {
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr > 2 || nc < 0 || nc > 2) return;

        const nIndex = nr * 3 + nc;
        const neighbor = this.board[nIndex];
        if (!neighbor) return;

        result.push({
            index: nIndex,
            owner: neighbor.owner,
            card: neighbor.card,
            mySide,
            theirSide
        });
    });
    return result;
}

// Returns the directions of this cell that face a board edge (no neighbor
// beyond the grid). Each entry tells us which side of the PLACED card touches
// that wall. Used by the Wall rule.
getWallSides(cellIndex) {
    const col = cellIndex % 3;
    const row = Math.floor(cellIndex / 3);
    const walls = [];
    if (row === 0) walls.push('top');
    if (row === 2) walls.push('bottom');
    if (col === 0) walls.push('left');
    if (col === 2) walls.push('right');
    return walls;
}

    // Redraw all cards currently on the board
    redrawBoard() {
        // Clear old board visuals
        this.boardGraphics.forEach(g => g.destroy());
        this.boardGraphics = [];
        this.boardVisualByIndex = {};

        this.board.forEach((cell, i) => {
            if (!cell) return;
            const { x, y } = this.cellPosition(i);
            const color = cell.owner === 'red' ? RED : BLUE;
            const visual = this.makeCardVisual(x, y, cell.card, color, i);
            this.boardGraphics.push(visual);
            this.boardVisualByIndex[i] = visual;
        });
    }

    // Show whose turn it is
    drawTurnText() {
        if (this.turnText) this.turnText.destroy();
        const who = this.currentPlayer === 'red' ? 'RED' : 'BLUE';
        const color = this.currentPlayer === 'red' ? '#e74c3c' : '#3498db';
        this.turnText = this.add.text(500, 30, who + "'s turn", {
            fontSize: '28px', color: color, fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    // ---- Score display ----------------------------------------------------

    createScoreDisplay() {
        this.redScoreText = this.add.text(150, 30, 'RED: 5', {
            fontSize: '24px', color: '#e74c3c', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.blueScoreText = this.add.text(850, 30, 'BLUE: 5', {
            fontSize: '24px', color: '#3498db', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        let red = this.redHand.length;
        let blue = this.blueHand.length;
        this.board.forEach(cell => {
            if (!cell) return;
            if (cell.owner === 'red') red++; else blue++;
        });
        if (this.redScoreText)  this.redScoreText.setText('RED: ' + red);
        if (this.blueScoreText) this.blueScoreText.setText('BLUE: ' + blue);
    }

    // ---- Sound effects (Web Audio, no asset files needed) -----------------

    playSound(type) {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'place') {
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        } else if (type === 'flip') {
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        } else if (type === 'win') {
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        }
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // ---- AI opponent (controls Red) ---------------------------------------

    // Simulate placing `card` at `cellIndex` for `owner`, using the REAL rules
    // (normal + Same/Plus/Combo). Returns how many enemy cards would flip.
    // Fully non-destructive: restores the board before returning.
    simulateFlips(cellIndex, card, owner) {
    // Place the hypothetical card.
    this.board[cellIndex] = { card, owner };

    // Snapshot current ownership so we can restore after simulating.
    const ownerSnapshot = this.board.map(c => (c ? c.owner : null));

    // Run the real flip logic (this mutates board ownership).
    const steps = this.computeFlips(cellIndex);
    const flipCount = steps.length;

    // Restore ownership of every cell, then clear the hypothetical card.
    this.board.forEach((cell, i) => {
        if (cell) cell.owner = ownerSnapshot[i];
    });
    this.board[cellIndex] = null;

    return flipCount;
}

    // Count how many enemy cards a hypothetical placement would DIRECTLY flip
    countFlips(cellIndex, card, owner) {
        const col = cellIndex % 3;
        const row = Math.floor(cellIndex / 3);

        const dirs = [
            [-1, 0, 'top', 'bottom'],
            [1, 0, 'bottom', 'top'],
            [0, -1, 'left', 'right'],
            [0, 1, 'right', 'left']
        ];

        let flips = 0;
        dirs.forEach(([dr, dc, mySide, theirSide]) => {
            const nr = row + dr;
            const nc = col + dc;
            if (nr < 0 || nr > 2 || nc < 0 || nc > 2) return;

            const neighbor = this.board[nr * 3 + nc];
            if (!neighbor) return;
            if (neighbor.owner === owner) return;

            if (this.cardSideValue(card, cellIndex, mySide) >
                this.cardSideValue(neighbor.card, nr * 3 + nc, theirSide)) {
                flips++;
            }
        });
        return flips;
    }

    // Prefer safer cells: corners expose 0 center-lines, center exposes 2.
    cellDefenseValue(cellIndex) {
        const col = cellIndex % 3;
        const row = Math.floor(cellIndex / 3);
        const exposed = (col === 1 ? 1 : 0) + (row === 1 ? 1 : 0);
        return (2 - exposed);
    }

    // The AI picks and plays its best move
    aiMove() {
    if (this.gameOver) return;

    const smart = Math.random() < Difficulty.lookaheadChance(this.saveData.stats);

    let best = null;

    this.redHand.forEach((card, handIndex) => {
        this.board.forEach((cell, cellIndex) => {
            if (cell !== null) return;

            // Flips this move would make, accounting for ALL active rules.
            const flips = this.simulateFlips(cellIndex, card, 'red');
            let score = flips * 10 + this.cellDefenseValue(cellIndex);
            // Prefer matching elemental spaces and avoid mismatches when choices
            // are otherwise similar. Actual flips are already computed with the modifier.
            score += this.elementalModifier(card, cellIndex) * 3;

            // Smart mode: subtract the worst counter-flip the player could make.
            if (smart) {
                score -= this.worstPlayerResponse(cellIndex, card) * 8;
            }

            if (best === null || score > best.score) {
                best = { cellIndex, handIndex, flips, score };
            }
        });
    });

    if (best === null) return;

    const card = this.redHand[best.handIndex];
    this.board[best.cellIndex] = { card, owner: 'red' };
    this.redHand.splice(best.handIndex, 1);
    this.resolveAndContinue(best.cellIndex);
}


// Simulate placing `card` at `cellIndex` for red, then find the max cards
// the player could flip back on their turn — accounting for active rules.
// Non-destructive.
worstPlayerResponse(cellIndex, card) {
    // Temporarily commit red's hypothetical placement.
    this.board[cellIndex] = { card, owner: 'red' };

    let worst = 0;
    this.blueHand.forEach(pCard => {
        this.board.forEach((cell, idx) => {
            if (cell !== null) return;
            const back = this.simulateFlips(idx, pCard, 'blue');
            if (back > worst) worst = back;
        });
    });

    this.board[cellIndex] = null;   // undo red's placement
    return worst;
}

// Brief dramatic flash before a Sudden Death replay, then run `next`.
showSuddenDeathTransition(roundNumber, next) {
    if (this.turnText) this.turnText.destroy();

    // Dark overlay on top of everything.
    const overlay = this.add.rectangle(500, 384, 1000, 768, 0x000000, 0)
        .setDepth(1000);

    const title = this.add.text(500, 340, 'SUDDEN DEATH', {
        fontSize: '54px', color: '#e74c3c', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1001).setAlpha(0);

    const sub = this.add.text(500, 400, `Round ${roundNumber}`, {
        fontSize: '26px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1001).setAlpha(0);

    // Fade the overlay + text in, hold, then run `next`.
    this.tweens.add({
        targets: overlay,
        fillAlpha: 0.8,
        duration: 400
    });
    this.tweens.add({
        targets: [title, sub],
        alpha: 1,
        duration: 400,
        onComplete: () => {
            this.time.delayedCall(1100, next);
        }
    });
}

    // ---- End game ---------------------------------------------------------

    // Count cards and declare a winner
    endGame() {
    this.gameOver = true;
    this.playSound('win');

    let redCount = this.redHand.length;
    let blueCount = this.blueHand.length;
    this.board.forEach(cell => {
        if (cell.owner === 'red') redCount++;
        else blueCount++;
    });

    const isDraw = redCount === blueCount;

    // ---- Sudden Death: on a draw, replay with reshuffled ownership ----
    if (isDraw && this.rules.suddenDeath &&
        this.suddenDeathRound < MainScene.MAX_SUDDEN_DEATH) {

        // Each player's new deck = the cards they currently control
        // (their leftover hand + the board cards they own).
        const blueCards = this.blueHand.map(c => c.id);
        const redCards  = this.redHand.map(c => c.id);
        this.board.forEach(cell => {
            if (cell.owner === 'blue') blueCards.push(cell.card.id);
            else redCards.push(cell.card.id);
        });

        const nextRound = this.suddenDeathRound + 1;

        this.showSuddenDeathTransition(nextRound, () => {
            this.scene.restart({
                suddenDeath: {
                    round: nextRound,
                    blueDeck: blueCards,
                    redDeck: redCards,
                    elementalBoard: this.elementalBoard.slice()
                }
            });
        });
        return;
    }

    // ---- Normal end-of-match ----
    const playerWon = blueCount > redCount;
    const result = playerWon ? 'win'
     : (redCount > blueCount ? 'loss' : 'draw');
    Collection.recordResult(this.saveData, result);

    if (this.turnText) this.turnText.destroy();

    // Overlay + result text
    this.add.rectangle(500, 384, 1000, 768, 0x000000, 0.6);

    const resultText = playerWon ? 'BLUE WINS!' :
             (redCount > blueCount ? 'RED WINS!' : "IT'S A DRAW!");
    this.add.text(500, 320, resultText, {
        fontSize: '48px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    const cont = this.add.text(500, 460, '[ Continue ]', {
        fontSize: '26px', color: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive();
    cont.on('pointerover', () => cont.setColor('#ffe680'));
    cont.on('pointerout',  () => cont.setColor('#f1c40f'));
    cont.on('pointerdown', () => {
        this.scene.start('RewardScene', {
            playerWon,
            aiDeck: this.aiOriginalDeck   // ids the player can capture
        });
    });
}

// Punchy rule popup over a card whenever a special capture occurs.
// SAME / PLUS / WALL variants / COMBO each inherit their own accent color.
showFlipBanner(cellIndex, label, color) {
    const { x, y } = this.cellPosition(cellIndex);
    const accent = Phaser.Display.Color.HexStringToColor(color).color;

    // A compact plate keeps the rule readable even over bright card artwork.
    const shadow = this.add.rectangle(3, 4, 112, 40, 0x000000, 0.58)
        .setStrokeStyle(2, 0x000000, 0.35);
    const plate = this.add.rectangle(0, 0, 112, 40, 0x08131f, 0.94)
        .setStrokeStyle(3, accent, 1);
    const flash = this.add.rectangle(0, 0, 120, 48, accent, 0)
        .setStrokeStyle(3, accent, 0.9);

    const text = this.add.text(0, -1, label, {
        fontSize: label.length > 10 ? '19px' : '23px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
    }).setOrigin(0.5);

    // Tiny caption helps distinguish these from ordinary capture feedback.
    const tag = this.add.text(0, 14, 'SPECIAL', {
        fontSize: '8px',
        color: color,
        fontStyle: 'bold',
        letterSpacing: 1
    }).setOrigin(0.5);

    const popup = this.add.container(x, y - 4, [shadow, flash, plate, text, tag])
        .setDepth(1200)
        .setScale(0.35)
        .setAlpha(0);

    // Pop in hard, settle, then float away. The flash ring expands separately
    // so the capture reads even in a busy Combo chain.
    this.tweens.add({
        targets: popup,
        scaleX: 1.12,
        scaleY: 1.12,
        alpha: 1,
        duration: 115,
        ease: 'Back.easeOut',
        onComplete: () => {
            this.tweens.add({
                targets: popup,
                scaleX: 1,
                scaleY: 1,
                duration: 90,
                ease: 'Quad.easeOut'
            });
            this.tweens.add({
                targets: popup,
                y: y - 42,
                alpha: 0,
                delay: 500,
                duration: 430,
                ease: 'Cubic.easeIn',
                onComplete: () => popup.destroy(true)
            });
        }
    });

    this.tweens.add({
        targets: flash,
        scaleX: 1.22,
        scaleY: 1.35,
        alpha: { from: 0.8, to: 0 },
        duration: 360,
        ease: 'Cubic.easeOut'
    });
}

// Color for each flip-reason banner.
flipReasonColor(reason) {
    switch (reason) {
        case 'Same':      return '#3498db';   // blue
        case 'Same Wall': return '#5dade2';   // lighter blue
        case 'Plus':      return '#e67e22';   // orange
        case 'Plus Wall': return '#f0a050';   // lighter orange
        case 'Combo':     return '#e74c3c';   // red
        default:          return '#ffffff';
    }
}
}   // <-- closes the MainScene class

// ---- Reward scene ---------------------------------------------------------

class RewardScene extends Phaser.Scene {
    constructor() { super('RewardScene'); }

    init(data) {
        this.playerWon = data.playerWon;
        this.aiDeck = data.aiDeck || [];
    }

    create() {
        addBackground(this, 'game_bg', 0.3);
        MusicManager.play(this, 'battle_music');   // <-- ADD THIS


        this.saveData = Collection.load();

        if (this.playerWon) {
            this.showWinReward();
        } else {
            this.showLossReward();
        }
    }

    // WIN: choose one of the opponent's cards to capture
    showWinReward() {
        this.add.text(500, 50, 'VICTORY!', {
            fontSize: '48px', color: '#2ecc71', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(500, 100, 'Choose an opponent card to capture:', {
            fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);

        // Unique card ids from the AI deck (dedupe so duplicates show once)
        const uniqueIds = [...new Set(this.aiDeck)];

        const gapX = 150;
        const startX = 500 - ((uniqueIds.length - 1) * gapX) / 2;
        const y = 300;

        uniqueIds.forEach((id, i) => {
            const card = CARD_BY_ID[id];
            const x = startX + i * gapX;
            const rarityColor = Phaser.Display.Color.HexStringToColor(
                RARITY[card.rarity].color).color;

            const visual = this.makeRewardCard(x, y, card, rarityColor);

            // Show how many copies the player already owns before they choose.
            // A never-owned card gets a more prominent NEW CARD! label instead.
            const ownedCount = this.saveData.owned[id] || 0;
            const ownershipLabel = ownedCount === 0
                ? 'NEW CARD!'
                : `OWNED ×${ownedCount}`;
            const ownershipColor = ownedCount === 0
                ? '#f1c40f'
                : '#d7dde5';

            const ownershipBg = this.add.rectangle(x, y + 84, 104, 24, 0x101820, 0.88)
                .setStrokeStyle(2, ownedCount === 0 ? 0xf1c40f : 0x65727e)
                .setDepth(20);
            const ownershipText = this.add.text(x, y + 84, ownershipLabel, {
                fontSize: ownedCount === 0 ? '13px' : '12px',
                color: ownershipColor,
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(21);

            visual.list[0].setInteractive();
            visual.list[0].on('pointerover', () => {
                visual.setScale(1.1);
                ownershipBg.setScale(1.05);
                ownershipText.setScale(1.05);
            });
            visual.list[0].on('pointerout',  () => {
                visual.setScale(1.0);
                ownershipBg.setScale(1.0);
                ownershipText.setScale(1.0);
            });
            visual.list[0].on('pointerdown', () => this.captureCard(id, card));
        });

        // Option to skip (take nothing)
        const skip = this.add.text(500, 520, '[ Take nothing ]', {
            fontSize: '18px', color: '#888888'
        }).setOrigin(0.5).setInteractive();
        skip.on('pointerdown', () => this.finish());
    }

    captureCard(id, card) {
        Collection.addCard(this.saveData, id);
        this.showGranted(card, 'Captured!');
    }

    // LOSS: random consolation (mostly common, tiny elite chance)
    showLossReward() {
        this.add.text(500, 50, 'DEFEAT', {
            fontSize: '48px', color: '#e74c3c', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(500, 100, 'But you found a card along the way...', {
            fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);

        const id = randomRewardCardId();
        const card = CARD_BY_ID[id];
        Collection.addCard(this.saveData, id);

        const rarityColor = Phaser.Display.Color.HexStringToColor(
            RARITY[card.rarity].color).color;
        this.makeRewardCard(500, 280, card, rarityColor);

        const label = card.rarity === 'ELITE'
            ? 'INCREDIBLE! An Elite card!'
            : `You received: ${card.name}`;
        this.add.text(500, 400, label, {
            fontSize: '24px',
            color: card.rarity === 'ELITE' ? '#f1c40f' : '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.addContinueButton();
    }

    // Confirmation flash after capturing, then continue
    showGranted(card, verb) {
        this.children.removeAll();
        this.add.text(500, 200, verb, {
            fontSize: '40px', color: '#2ecc71', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(500, 260, card.name, {
            fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(500, 300, `(${RARITY[card.rarity].name})`, {
            fontSize: '18px',
            color: RARITY[card.rarity].color
        }).setOrigin(0.5);
        this.addContinueButton();
    }

    addContinueButton() {
        const cont = this.add.text(500, 480, '[ Continue ]', {
            fontSize: '26px', color: '#f1c40f', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        cont.on('pointerover', () => cont.setColor('#ffe680'));
        cont.on('pointerout',  () => cont.setColor('#f1c40f'));
        cont.on('pointerdown', () => this.finish());
    }

    finish() {
        this.scene.start('TitleScene');
    }

    // A medium card visual for reward display
    makeRewardCard(x, y, card, rarityColor) {
        const w = 100, h = 124;
        const bg = this.add.rectangle(0, 0, w, h, 0x2c3e50)
            .setStrokeStyle(4, rarityColor);

         const children = [bg];

        if (this.textures.exists(card.id)) {
            const art = this.add.image(0, 0, card.id)
                .setDisplaySize(w - 8, h - 8);
            children.push(art);
        }

        const numStyle = { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' };
        const top    = this.add.text(0, -h / 2 + 13, numToLabel(card.top), numStyle).setOrigin(0.5);
        const bottom = this.add.text(0, h / 2 - 13, numToLabel(card.bottom), numStyle).setOrigin(0.5);
        const left   = this.add.text(-w / 2 + 12, 0, numToLabel(card.left), numStyle).setOrigin(0.5);
        const right  = this.add.text(w / 2 - 12, 0, numToLabel(card.right), numStyle).setOrigin(0.5);

        const nameStyle = {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
            align: 'center', wordWrap: { width: w - 20 }
        };
        const name = this.add.text(0, 5, card.name, nameStyle).setOrigin(0.5);

        children.push(top, bottom, left, right, name);
        return this.add.container(x, y, children);
    }
}   // <-- ADD THIS: closes the RewardScene class


// ---- Deck builder scene ---------------------------------------------------

const DECK_SIZE = 5;

// Small card size for the collection grid
const MINI_W = 84;
const MINI_H = 104;

class CollectionScene extends Phaser.Scene {
    constructor() { super('CollectionScene'); }

    create() {
        addBackground(this, 'game_bg', 0.3);
        MusicManager.play(this, 'theme_music');
        
        this.saveData = Collection.load();
        // Work on a copy of the deck; commit on save
        this.deck = this.saveData.deck.slice();

        this.miniSprites = [];   // pool grid visuals
        this.deckSprites = [];   // current deck visuals
        this.poolPage = 0;       // which page of the pool grid we're on

        this.add.text(500, 30, 'BUILD YOUR DECK', {
            fontSize: '32px', color: '#f1c40f', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(500, 62, 'Click a card to add it. Click a deck card to remove it. Duplicates allowed.', {
            fontSize: '15px', color: '#cccccc'
        }).setOrigin(0.5);

        // Section labels
        this.add.text(60, 95, 'CARD POOL', {
            fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
        });

        this.deckLabel = this.add.text(60, 560, '', {
            fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
        });

        this.drawPoolGrid();
        this.drawPager();
        this.drawDeck();
        this.drawButtons();
    }

    // How many owned cards fit above the deck row (8 cols x 3 rows).
    static get POOL_PER_PAGE() { return 24; }

    // Draw the current page of OWNED cards, with owned/in-deck counts
    drawPoolGrid() {
        const cols = 8;
        const startX = 70;
        const startY = 130;
        const gapX = 100;
        const gapY = 120;

        // Owned card ids, in pool order for consistent layout
        const ownedIds = CARD_POOL
            .filter(c => (this.saveData.owned[c.id] || 0) > 0)
            .map(c => c.id);

        // Clamp the page in case the owned list shrank (shouldn't, but safe)
        const totalPages = Math.max(1,
            Math.ceil(ownedIds.length / CollectionScene.POOL_PER_PAGE));
        this.poolPage = Phaser.Math.Clamp(this.poolPage, 0, totalPages - 1);

        const perPage = CollectionScene.POOL_PER_PAGE;
        const startIndex = this.poolPage * perPage;
        const endIndex = Math.min(startIndex + perPage, ownedIds.length);

        for (let i = startIndex; i < endIndex; i++) {
            const id = ownedIds[i];
            const card = CARD_BY_ID[id];

            // Position based on slot WITHIN this page
            const slot = i - startIndex;
            const col = slot % cols;
            const row = Math.floor(slot / cols);
            const x = startX + col * gapX + MINI_W / 2;
            const y = startY + row * gapY + MINI_H / 2;

            const rarityColor = Phaser.Display.Color.HexStringToColor(
                RARITY[card.rarity].color).color;

            const visual = this.makeMiniCard(x, y, card, rarityColor);

            // Show how many you own and how many are already in the deck
            const owned = this.saveData.owned[id];
            const inDeck = this.deck.filter(d => d === id).length;
            const countLabel = this.add.text(x, y + MINI_H / 2 + 10,
                `${inDeck}/${owned}`, {
                    fontSize: '12px', color: '#cccccc'
                }).setOrigin(0.5);
            this.miniSprites.push(countLabel);

            visual.list[0].setInteractive();
            visual.list[0].on('pointerdown', () => this.addToDeck(id));
            this.miniSprites.push(visual);
        }
    }

    // Draw pool page navigation (only if more than one page of owned cards)
    drawPager() {
        const ownedCount = CARD_POOL
            .filter(c => (this.saveData.owned[c.id] || 0) > 0).length;
        const totalPages = Math.ceil(ownedCount / CollectionScene.POOL_PER_PAGE);
        if (totalPages <= 1) return;   // no pager needed yet

        const y = 520;

        this.poolPrevBtn = this.add.text(400, y, '< Prev', {
            fontSize: '18px', color: '#cccccc', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        this.poolPrevBtn.on('pointerover', () => this.poolPrevBtn.setColor('#ffffff'));
        this.poolPrevBtn.on('pointerout',  () => this.refreshPager());
        this.poolPrevBtn.on('pointerdown', () => this.changePoolPage(-1));

        this.poolPageText = this.add.text(500, y, '', {
            fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.poolNextBtn = this.add.text(600, y, 'Next >', {
            fontSize: '18px', color: '#cccccc', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        this.poolNextBtn.on('pointerover', () => this.poolNextBtn.setColor('#ffffff'));
        this.poolNextBtn.on('pointerout',  () => this.refreshPager());
        this.poolNextBtn.on('pointerdown', () => this.changePoolPage(1));

        this.refreshPager();
    }

    changePoolPage(delta) {
        const ownedCount = CARD_POOL
            .filter(c => (this.saveData.owned[c.id] || 0) > 0).length;
        const totalPages = Math.ceil(ownedCount / CollectionScene.POOL_PER_PAGE);
        const next = Phaser.Math.Clamp(this.poolPage + delta, 0, totalPages - 1);
        if (next === this.poolPage) return;
        this.poolPage = next;
        this.redrawAll();
    }

    refreshPager() {
        const ownedCount = CARD_POOL
            .filter(c => (this.saveData.owned[c.id] || 0) > 0).length;
        const totalPages = Math.ceil(ownedCount / CollectionScene.POOL_PER_PAGE);

        if (this.poolPageText) {
            this.poolPageText.setText(`Page ${this.poolPage + 1} / ${totalPages}`);
        }
        if (this.poolPrevBtn) {
            const atStart = this.poolPage === 0;
            this.poolPrevBtn.setColor(atStart ? '#555555' : '#cccccc');
            atStart ? this.poolPrevBtn.disableInteractive()
                    : this.poolPrevBtn.setInteractive();
        }
        if (this.poolNextBtn) {
            const atEnd = this.poolPage >= totalPages - 1;
            this.poolNextBtn.setColor(atEnd ? '#555555' : '#cccccc');
            atEnd ? this.poolNextBtn.disableInteractive()
                  : this.poolNextBtn.setInteractive();
        }
    }

    // Redraw both the pool (to update counts) and the deck row
    redrawAll() {
        this.miniSprites.forEach(s => s.destroy());
        this.miniSprites = [];
        this.drawPoolGrid();
        this.refreshPager();
        this.drawDeck();
        this.refreshBattleButton();
    }

    // Draw the current deck row
    drawDeck() {
        this.deckSprites.forEach(s => s.destroy());
        this.deckSprites = [];

        this.deckLabel.setText(`YOUR DECK  (${this.deck.length}/${DECK_SIZE})`);

        const startX = 70;
        const y = 590 + MINI_H / 2;
        const gapX = 100;

        this.deck.forEach((id, i) => {
            const card = CARD_BY_ID[id];
            const rarityColor = Phaser.Display.Color.HexStringToColor(
                RARITY[card.rarity].color).color;
            const x = startX + i * gapX + MINI_W / 2;

            const visual = this.makeMiniCard(x, y, card, rarityColor);
            visual.list[0].setInteractive();
            visual.list[0].on('pointerdown', () => this.removeFromDeck(i));
            this.deckSprites.push(visual);
        });
    }

    addToDeck(cardId) {
        if (this.deck.length >= DECK_SIZE) return;
        const owned = this.saveData.owned[cardId] || 0;
        const inDeck = this.deck.filter(d => d === cardId).length;
        if (inDeck >= owned) return;          // no free copies left
        this.deck.push(cardId);
        this.redrawAll();
    }

    removeFromDeck(deckIndex) {
        this.deck.splice(deckIndex, 1);
        this.redrawAll();
    }

    drawButtons() {
        // Save & Battle (only enabled at exactly DECK_SIZE)
        this.battleBtn = this.add.text(720, 600, '[ Save & Battle ]', {
            fontSize: '26px', color: '#2ecc71', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setInteractive();
        this.battleBtn.on('pointerdown', () => {
            if (this.deck.length !== DECK_SIZE) return;
            this.saveData.deck = this.deck.slice();
            Collection.save(this.saveData);
            // Clear stale Sudden Death scene data so this newly saved deck is
            // guaranteed to become the player's hand in the next match.
            this.scene.start('MainScene', { suddenDeath: null });
        });

        // Back to title (also saves)
        const back = this.add.text(720, 650, '[ Back ]', {
            fontSize: '22px', color: '#cccccc', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setInteractive();
        back.on('pointerover', () => back.setColor('#ffffff'));
        back.on('pointerout',  () => back.setColor('#cccccc'));
        back.on('pointerdown', () => {
            if (this.deck.length === DECK_SIZE) {
                this.saveData.deck = this.deck.slice();
                Collection.save(this.saveData);
            }
            this.scene.start('TitleScene');
        });

        this.refreshBattleButton();
    }

    refreshBattleButton() {
        const ready = this.deck.length === DECK_SIZE;
        this.battleBtn.setColor(ready ? '#2ecc71' : '#555555');
    }

    // A compact card visual for the grid (rarity-colored border)
    makeMiniCard(x, y, card, rarityColor) {
        const bg = this.add.rectangle(0, 0, MINI_W, MINI_H, 0x2c3e50)
            .setStrokeStyle(3, rarityColor);

        const children = [bg];

        if (this.textures.exists(card.id)) {
            const art = this.add.image(0, 0, card.id)
                .setDisplaySize(MINI_W - 6, MINI_H - 6);
            children.push(art);
        }

        const numStyle = { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' };
        const top    = this.add.text(0, -MINI_H / 2 + 12, numToLabel(card.top), numStyle).setOrigin(0.5);
        const bottom = this.add.text(0, MINI_H / 2 - 12, numToLabel(card.bottom), numStyle).setOrigin(0.5);
        const left   = this.add.text(-MINI_W / 2 + 11, 0, numToLabel(card.left), numStyle).setOrigin(0.5);
        const right  = this.add.text(MINI_W / 2 - 11, 0, numToLabel(card.right), numStyle).setOrigin(0.5);

        const nameStyle = {
            fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
            align: 'center', wordWrap: { width: MINI_W - 18 }
        };
        const name = this.add.text(0, 4, card.name, nameStyle).setOrigin(0.5);

        children.push(top, bottom, left, right, name);
        return this.add.container(x, y, children);
    }
}   // <-- ADD THIS: closes the CollectionScene class

// ---- Game config ----------------------------------------------------------

const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    scene: [BootScene, TitleScene, RulesScene, CollectionScene, MainScene, RewardScene, CompendiumScene]
};

const game = new Phaser.Game(config);
