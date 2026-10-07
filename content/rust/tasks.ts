import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for planet Oxide (Rust). The player's file holds only items (functions, structs,
// traits, impls); the harness adds `fn main` with the tests, which run on the Rust Playground through
// /api/run, so hidden tests never reach the player's browser. Any implementation that passes is accepted;
// the validator proves the reference solution passes, the starter fails and each near miss fails.

// ─── REGION BOSS MINI PROJECTS ──────────────────────────────────────────────

/** Let Village boss: let, shadowing and a capped value. */
export const healTask: CodeTaskBeat = {
  slug: "heal",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: drink the potions", "Mini proyecto: bebe las pociones", "ミニ課題：ポーションを飲む"),
  brief: L(
    "Write heal(hp: i32, potions: i32) -> i32. Each potion restores 15 HP, but HP can never go above 100. Return the new HP. The Golem hits hard: you start with any HP from 0 to 100 and 0 or more potions.",
    "Escribe heal(hp: i32, potions: i32) -> i32. Cada poción recupera 15 HP, pero el HP nunca puede pasar de 100. Devuelve el HP nuevo. El Golem pega fuerte: empiezas con cualquier HP de 0 a 100 y 0 o más pociones.",
    "heal(hp: i32, potions: i32) -> i32 を書こう。ポーション1つで HP が 15 回復する。ただし HP は 100 を超えない。新しい HP を返す。最初の HP は 0〜100、ポーションは 0 個以上。",
  ),
  starter: `fn heal(hp: i32, potions: i32) -> i32 {
    // your code here
    hp
}
`,
  solution: `fn heal(hp: i32, potions: i32) -> i32 {
    let hp = hp + potions * 15;
    hp.min(100)
}
`,
  nearMiss: [
    // Forgets the cap.
    `fn heal(hp: i32, potions: i32) -> i32 {
    hp + potions * 15
}
`,
    // Caps the old value, then adds: the order is wrong.
    `fn heal(hp: i32, potions: i32) -> i32 {
    let mut hp = hp;
    if hp > 100 {
        hp = 100;
    }
    hp += potions * 15;
    hp
}
`,
  ],
  tests: [
    { run: 'println!("{}", heal(50, 2));', expect: "80" },
    { run: 'println!("{}", heal(90, 1));', expect: "100" },
    { run: 'println!("{}", heal(10, 0));', expect: "10", hidden: true },
    { run: 'println!("{}", heal(0, 7));', expect: "100", hidden: true },
    { run: 'println!("{}", heal(0, 6));', expect: "90", hidden: true },
  ],
  hint: L(
    "First work out the HP after every potion, then make sure the result never passes the limit.",
    "Primero calcula el HP tras todas las pociones y luego asegúrate de que el resultado nunca pase el límite.",
    "まず全部飲んだあとの HP を出し、それから上限を超えないようにしよう。",
  ),
  note: "recap-mut",
  explain: L(
    "Add potions * 15 first, then cap: hp.min(100) keeps the smaller of the two. Capping before adding still lets the total pass 100.",
    "Suma potions * 15 primero y luego limita: hp.min(100) se queda con el menor. Limitar antes de sumar deja que el total pase de 100.",
    "先に potions * 15 を足してから上限をかける。hp.min(100) は小さいほうを残す。足す前に制限しても合計は 100 を超える。",
  ),
};

/** Ownership Forest boss: borrow the loot, mutably borrow the bag, clone what you keep. */
export const packTask: CodeTaskBeat = {
  slug: "pack",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: pack the loot", "Mini proyecto: guarda el botín", "ミニ課題：戦利品をしまう"),
  brief: L(
    "Write pack(bag: &mut Vec<String>, loot: &[String]). Add each loot item to the end of bag, in order, unless bag already has it (that includes items you just added). Don't take loot by value: the caller keeps using it after the call.",
    "Escribe pack(bag: &mut Vec<String>, loot: &[String]). Agrega cada objeto de loot al final de bag, en orden, salvo que bag ya lo tenga (incluidos los que acabas de agregar). No tomes loot por valor: quien llama lo sigue usando después.",
    "pack(bag: &mut Vec<String>, loot: &[String]) を書こう。loot の各アイテムを順に bag の末尾へ足す。ただし bag にもうあるもの（いま足したものも含む）は足さない。loot は値で受け取らないこと。呼び出し側があとで使う。",
  ),
  starter: `fn pack(bag: &mut Vec<String>, loot: &[String]) {
    // your code here
}
`,
  solution: `fn pack(bag: &mut Vec<String>, loot: &[String]) {
    for item in loot {
        if !bag.contains(item) {
            bag.push(item.clone());
        }
    }
}
`,
  nearMiss: [
    // Checks against a snapshot of the bag, so duplicates inside loot get in twice.
    `fn pack(bag: &mut Vec<String>, loot: &[String]) {
    let before = bag.clone();
    for item in loot {
        if !before.contains(item) {
            bag.push(item.clone());
        }
    }
}
`,
    // No duplicate check at all.
    `fn pack(bag: &mut Vec<String>, loot: &[String]) {
    bag.extend(loot.iter().cloned());
}
`,
  ],
  tests: [
    {
      run: 'let mut bag = vec![String::from("gem")];\nlet loot = vec![String::from("key"), String::from("gem")];\npack(&mut bag, &loot);\nprintln!("{:?}", bag);',
      expect: '["gem", "key"]',
    },
    { run: 'let mut bag: Vec<String> = Vec::new();\npack(&mut bag, &[]);\nprintln!("{:?}", bag);', expect: "[]" },
    {
      run: 'let mut bag = Vec::new();\nlet loot = vec![String::from("axe")];\npack(&mut bag, &loot);\nprintln!("{:?} {:?}", bag, loot);',
      expect: '["axe"] ["axe"]',
      hidden: true,
    },
    {
      run: 'let mut bag = Vec::new();\nlet loot = vec![String::from("orb"), String::from("orb"), String::from("map")];\npack(&mut bag, &loot);\nprintln!("{:?}", bag);',
      expect: '["orb", "map"]',
      hidden: true,
    },
    {
      run: 'let mut bag = vec![String::from("b"), String::from("a")];\nlet loot = vec![String::from("c"), String::from("a")];\npack(&mut bag, &loot);\nprintln!("{:?}", bag);',
      expect: '["b", "a", "c"]',
      hidden: true,
    },
  ],
  hint: L(
    "You only borrow each loot item. To keep one in the bag, the bag needs its own String, and check the bag as it grows.",
    "Cada objeto de loot es prestado. Para guardarlo, la bolsa necesita su propio String; revisa la bolsa mientras crece.",
    "loot のアイテムは借りているだけ。袋に入れるには袋専用の String が要る。袋は増えながら確かめよう。",
  ),
  note: "recap-borrow",
  explain: L(
    "Loop over &loot, check bag.contains(item) each time (so new items count too) and push item.clone(): the bag owns a copy, loot stays the caller's.",
    "Recorre &loot, revisa bag.contains(item) cada vez (cuentan los nuevos) y haz push de item.clone(): la bolsa tiene su copia y loot sigue intacto.",
    "&loot を回し、毎回 bag.contains(item) で確かめ（足したものも数える）、item.clone() を push。袋はコピーを持ち、loot は呼び出し側のまま。",
  ),
};

/** Lifetime Peaks boss: return a borrow tied to one input only. */
export const findTagTask: CodeTaskBeat = {
  slug: "find-tag",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: read the trail marker", "Mini proyecto: lee el cartel del sendero", "ミニ課題：道しるべを読む"),
  brief: L(
    "Write find_tag(text, key). text holds pairs like \"hp=10;name=Ferro\" separated by ';'. Return Some(value) for the first pair whose key equals key exactly, or None. The value is a slice of text, so it must stay valid after key is gone: look at the 'a in the signature.",
    "Escribe find_tag(text, key). text tiene pares como \"hp=10;name=Ferro\" separados por ';'. Devuelve Some(valor) del primer par cuya clave sea exactamente key, o None. El valor es un trozo de text, así que debe seguir válido cuando key ya no exista: mira el 'a de la firma.",
    "find_tag(text, key) を書こう。text は \"hp=10;name=Ferro\" のように ';' で区切った組。キーが key と完全に一致する最初の組の Some(値) を返し、なければ None。値は text の一部なので、key が消えても有効：シグネチャの 'a を見よう。",
  ),
  starter: `fn find_tag<'a>(text: &'a str, key: &str) -> Option<&'a str> {
    // your code here
    None
}
`,
  solution: `fn find_tag<'a>(text: &'a str, key: &str) -> Option<&'a str> {
    for pair in text.split(';') {
        if let Some((k, v)) = pair.split_once('=') {
            if k == key {
                return Some(v);
            }
        }
    }
    None
}
`,
  nearMiss: [
    // Prefix match: "h" also matches "hp".
    `fn find_tag<'a>(text: &'a str, key: &str) -> Option<&'a str> {
    for pair in text.split(';') {
        if pair.starts_with(key) {
            return pair.split_once('=').map(|(_, v)| v);
        }
    }
    None
}
`,
    // Keeps looking and returns the last match.
    `fn find_tag<'a>(text: &'a str, key: &str) -> Option<&'a str> {
    let mut found = None;
    for pair in text.split(';') {
        if let Some((k, v)) = pair.split_once('=') {
            if k == key {
                found = Some(v);
            }
        }
    }
    found
}
`,
  ],
  tests: [
    { run: 'println!("{:?}", find_tag("hp=10;name=Ferro", "name"));', expect: 'Some("Ferro")' },
    { run: 'println!("{:?}", find_tag("hp=10", "mp"));', expect: "None" },
    { run: 'println!("{:?}", find_tag("hp=10;h=2", "h"));', expect: 'Some("2")', hidden: true },
    { run: 'println!("{:?}", find_tag("a=1;a=2", "a"));', expect: 'Some("1")', hidden: true },
    { run: 'println!("{:?}", find_tag("", "x"));', expect: "None", hidden: true },
    {
      run: 'let found;\n{\n    let key = String::from("lvl");\n    found = find_tag("lvl=3;hp=9", &key);\n}\nprintln!("{:?}", found);',
      expect: 'Some("3")',
      hidden: true,
    },
  ],
  hint: L(
    "Split text into pairs, then each pair into key and value. Compare whole keys, and stop at the first match.",
    "Divide text en pares y cada par en clave y valor. Compara claves completas y detente en la primera coincidencia.",
    "text を組に分け、各組をキーと値に分けよう。キーは丸ごと比べ、最初に一致したら止める。",
  ),
  note: "recap-annotations",
  explain: L(
    "split(';') then split_once('=') give slices of text, so they live as long as 'a. Compare k == key (not starts_with) and return on the first hit.",
    "split(';') y luego split_once('=') dan trozos de text, que viven tanto como 'a. Compara k == key (no starts_with) y devuelve en la primera coincidencia.",
    "split(';') と split_once('=') は text の一部を返すので 'a の間生きる。k == key で比べ（starts_with ではない）、最初の一致で返す。",
  ),
};

/** Trait Castle boss: implement a trait for two types and pick from a Vec<Box<dyn Trait>>. */
export const strongestTask: CodeTaskBeat = {
  slug: "strongest",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: rank the squad", "Mini proyecto: elige al más fuerte", "ミニ課題：最強の仲間を選ぶ"),
  brief: L(
    "Implement Skill for Mage (power = level * 3, label \"Mage\") and Archer (power = arrows * 2, label \"Archer\"). Then write strongest(squad): the label of the member with the highest power, or None if the squad is empty. On a tie, the first one in the squad wins.",
    "Implementa Skill para Mage (power = level * 3, label \"Mage\") y Archer (power = arrows * 2, label \"Archer\"). Luego escribe strongest(squad): el label del miembro con más power, o None si la tropa está vacía. Si empatan, gana el primero de la tropa.",
    "Mage（power = level * 3、label \"Mage\"）と Archer（power = arrows * 2、label \"Archer\"）に Skill を実装しよう。次に strongest(squad) を書く。power が最大の仲間の label を返し、空なら None。同点なら先にいるほうが勝ち。",
  ),
  starter: `trait Skill {
    fn power(&self) -> u32;
    fn label(&self) -> String;
}

struct Mage {
    level: u32,
}

struct Archer {
    arrows: u32,
}

impl Skill for Mage {
    fn power(&self) -> u32 {
        0 // your code here
    }
    fn label(&self) -> String {
        String::new()
    }
}

impl Skill for Archer {
    fn power(&self) -> u32 {
        0 // your code here
    }
    fn label(&self) -> String {
        String::new()
    }
}

fn strongest(squad: &[Box<dyn Skill>]) -> Option<String> {
    // your code here
    None
}
`,
  solution: `trait Skill {
    fn power(&self) -> u32;
    fn label(&self) -> String;
}

struct Mage {
    level: u32,
}

struct Archer {
    arrows: u32,
}

impl Skill for Mage {
    fn power(&self) -> u32 {
        self.level * 3
    }
    fn label(&self) -> String {
        String::from("Mage")
    }
}

impl Skill for Archer {
    fn power(&self) -> u32 {
        self.arrows * 2
    }
    fn label(&self) -> String {
        String::from("Archer")
    }
}

fn strongest(squad: &[Box<dyn Skill>]) -> Option<String> {
    let mut best: Option<&Box<dyn Skill>> = None;
    for member in squad {
        if best.map_or(true, |b| member.power() > b.power()) {
            best = Some(member);
        }
    }
    best.map(|b| b.label())
}
`,
  nearMiss: [
    // max_by_key returns the LAST maximum on a tie.
    `trait Skill {
    fn power(&self) -> u32;
    fn label(&self) -> String;
}

struct Mage {
    level: u32,
}

struct Archer {
    arrows: u32,
}

impl Skill for Mage {
    fn power(&self) -> u32 {
        self.level * 3
    }
    fn label(&self) -> String {
        String::from("Mage")
    }
}

impl Skill for Archer {
    fn power(&self) -> u32 {
        self.arrows * 2
    }
    fn label(&self) -> String {
        String::from("Archer")
    }
}

fn strongest(squad: &[Box<dyn Skill>]) -> Option<String> {
    squad.iter().max_by_key(|m| m.power()).map(|m| m.label())
}
`,
    // >= also lets a later member with the same power take the lead.
    `trait Skill {
    fn power(&self) -> u32;
    fn label(&self) -> String;
}

struct Mage {
    level: u32,
}

struct Archer {
    arrows: u32,
}

impl Skill for Mage {
    fn power(&self) -> u32 {
        self.level * 3
    }
    fn label(&self) -> String {
        String::from("Mage")
    }
}

impl Skill for Archer {
    fn power(&self) -> u32 {
        self.arrows * 2
    }
    fn label(&self) -> String {
        String::from("Archer")
    }
}

fn strongest(squad: &[Box<dyn Skill>]) -> Option<String> {
    let mut best: Option<&Box<dyn Skill>> = None;
    for member in squad {
        if best.map_or(true, |b| member.power() >= b.power()) {
            best = Some(member);
        }
    }
    best.map(|b| b.label())
}
`,
  ],
  tests: [
    {
      run: 'let squad: Vec<Box<dyn Skill>> = vec![Box::new(Mage { level: 2 }), Box::new(Archer { arrows: 4 })];\nprintln!("{:?}", strongest(&squad));',
      expect: 'Some("Archer")',
    },
    { run: 'println!("{} {}", Mage { level: 5 }.power(), Archer { arrows: 5 }.power());', expect: "15 10" },
    { run: 'let squad: Vec<Box<dyn Skill>> = Vec::new();\nprintln!("{:?}", strongest(&squad));', expect: "None", hidden: true },
    {
      run: 'let squad: Vec<Box<dyn Skill>> = vec![Box::new(Archer { arrows: 3 }), Box::new(Mage { level: 2 })];\nprintln!("{:?}", strongest(&squad));',
      expect: 'Some("Archer")',
      hidden: true,
    },
    {
      run: 'let squad: Vec<Box<dyn Skill>> = vec![Box::new(Archer { arrows: 1 }), Box::new(Mage { level: 10 }), Box::new(Archer { arrows: 14 })];\nprintln!("{:?}", strongest(&squad));',
      expect: 'Some("Mage")',
      hidden: true,
    },
  ],
  hint: L(
    "Each impl reads its own field via &self. In strongest, keep the leader and replace them only if someone is stronger.",
    "Cada impl lee su campo con &self. En strongest, recuerda al líder y cámbialo solo si alguien es de verdad más fuerte.",
    "各 impl は &self で自分のフィールドを読むだけ。strongest では今の首位を覚え、本当に強い仲間が来たときだけ入れかえよう。",
  ),
  note: "recap-dyn",
  explain: L(
    "Each type fills in the trait's methods. A Vec<Box<dyn Skill>> mixes them; replace the leader only on a strictly greater power to keep the first on a tie.",
    "Cada tipo completa los métodos del trait y un Vec<Box<dyn Skill>> los mezcla. Cambia de líder solo con power estrictamente mayor: el primero gana el empate.",
    "各型がトレイトのメソッドを埋める。Vec<Box<dyn Skill>> で混ぜられる。power が「より大きい」ときだけ首位を替えれば、同点は先の者が勝つ。",
  ),
};

/** Fearless Tower boss: one thread per wave, results back through a channel. */
export const totalDamageTask: CodeTaskBeat = {
  slug: "total-damage",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: count the flames", "Mini proyecto: cuenta las llamas", "ミニ課題：炎のダメージを数える"),
  brief: L(
    "Write total_damage(waves: Vec<Vec<u32>>) -> u32. Each wave is a list of hits. Process each wave in its own thread: its damage is the sum of its hits, but your shield caps each wave at 100. Send each wave's damage back (a channel works well) and return the total. No waves means 0.",
    "Escribe total_damage(waves: Vec<Vec<u32>>) -> u32. Cada oleada es una lista de golpes. Procesa cada oleada en su propio hilo: su daño es la suma de sus golpes, pero tu escudo limita cada oleada a 100. Envía el daño de cada oleada de vuelta (un canal sirve) y devuelve el total. Sin oleadas, 0.",
    "total_damage(waves: Vec<Vec<u32>>) -> u32 を書こう。各ウェーブは攻撃のリスト。ウェーブごとに別スレッドで処理する。ダメージは攻撃の合計だが、盾で各ウェーブは最大 100。各ダメージを送り返し（チャネルが便利）、合計を返す。ウェーブがなければ 0。",
  ),
  starter: `use std::sync::mpsc;
use std::thread;

fn total_damage(waves: Vec<Vec<u32>>) -> u32 {
    // your code here
    0
}
`,
  solution: `use std::sync::mpsc;
use std::thread;

fn total_damage(waves: Vec<Vec<u32>>) -> u32 {
    let (tx, rx) = mpsc::channel();
    for wave in waves {
        let tx = tx.clone();
        thread::spawn(move || {
            let sum: u32 = wave.iter().sum();
            tx.send(sum.min(100)).unwrap();
        });
    }
    drop(tx);
    rx.iter().sum()
}
`,
  nearMiss: [
    // Caps the grand total instead of each wave.
    `use std::sync::mpsc;
use std::thread;

fn total_damage(waves: Vec<Vec<u32>>) -> u32 {
    let (tx, rx) = mpsc::channel();
    for wave in waves {
        let tx = tx.clone();
        thread::spawn(move || {
            let sum: u32 = wave.iter().sum();
            tx.send(sum).unwrap();
        });
    }
    drop(tx);
    rx.iter().sum::<u32>().min(100)
}
`,
    // Caps each hit instead of each wave.
    `use std::sync::mpsc;
use std::thread;

fn total_damage(waves: Vec<Vec<u32>>) -> u32 {
    let (tx, rx) = mpsc::channel();
    for wave in waves {
        let tx = tx.clone();
        thread::spawn(move || {
            let sum: u32 = wave.iter().map(|&h| h.min(100)).sum();
            tx.send(sum).unwrap();
        });
    }
    drop(tx);
    rx.iter().sum()
}
`,
  ],
  tests: [
    { run: 'println!("{}", total_damage(vec![vec![10, 20], vec![5]]));', expect: "35" },
    { run: 'println!("{}", total_damage(vec![vec![60, 70], vec![1, 2]]));', expect: "103" },
    { run: 'println!("{}", total_damage(vec![]));', expect: "0", hidden: true },
    { run: 'println!("{}", total_damage(vec![vec![100], vec![101], vec![50, 50, 1]]));', expect: "300", hidden: true },
    { run: 'println!("{}", total_damage(vec![vec![], vec![7]]));', expect: "7", hidden: true },
  ],
  hint: L(
    "Give each thread its own sender and move its wave in. The receiver's loop only ends once every sender is gone.",
    "Dale a cada hilo su propio emisor y mueve su oleada adentro. El bucle del receptor acaba cuando no queda ningún emisor.",
    "各スレッドに自分の送信側を渡し、ウェーブを move しよう。受信側のループは送信側が全部なくなると終わる。",
  ),
  note: "recap-channels",
  explain: L(
    "Clone tx per thread, move the wave in, send sum.min(100). drop(tx) the original so rx.iter() ends, then sum what arrives: the order doesn't matter.",
    "Clona tx por hilo, mueve la oleada adentro y envía sum.min(100). Haz drop(tx) del original para que rx.iter() termine y suma lo que llega: el orden da igual.",
    "スレッドごとに tx を clone し、ウェーブを move して sum.min(100) を送る。元の tx を drop すると rx.iter() が終わる。届いた順は関係なく合計する。",
  ),
};

// ─── JUNIOR SCREENING (ide) ─────────────────────────────────────────────────

export const longestWordTask: ExamQuestion = {
  slug: "longest-word",
  kind: "code",
  mode: "ide",
  topic: "borrowing",
  difficulty: 1,
  prompt: L("Coding: the longest word", "Código: la palabra más larga", "コーディング：いちばん長い単語"),
  brief: L(
    "Write longest_word(text: &str) -> &str: the longest word in text, as a slice of it. Words are separated by any whitespace (spaces, tabs, newlines). On a tie, return the first one. Return \"\" when there are no words.",
    "Escribe longest_word(text: &str) -> &str: la palabra más larga de text, como un trozo de él. Las palabras se separan con cualquier espacio en blanco (espacios, tabs, saltos de línea). Si empatan, devuelve la primera. Devuelve \"\" si no hay palabras.",
    "longest_word(text: &str) -> &str を書こう。text でいちばん長い単語を text の一部として返す。単語は空白（スペース・タブ・改行）で区切られる。同じ長さなら最初のもの。単語がなければ \"\"。",
  ),
  starter: `fn longest_word(text: &str) -> &str {
    // your code here
    ""
}
`,
  solution: `fn longest_word(text: &str) -> &str {
    let mut best = "";
    for word in text.split_whitespace() {
        if word.len() > best.len() {
            best = word;
        }
    }
    best
}
`,
  nearMiss: [
    // max_by_key keeps the LAST longest word on a tie.
    `fn longest_word(text: &str) -> &str {
    text.split_whitespace().max_by_key(|w| w.len()).unwrap_or("")
}
`,
    // Splits on ' ' only: tabs and newlines stay inside "words".
    `fn longest_word(text: &str) -> &str {
    let mut best = "";
    for word in text.split(' ') {
        if word.len() > best.len() {
            best = word;
        }
    }
    best
}
`,
  ],
  tests: [
    { run: 'println!("{}", longest_word("the quick brown fox"));', expect: "quick" },
    { run: 'println!("[{}]", longest_word(""));', expect: "[]" },
    { run: 'println!("{}", longest_word("ab cd ef"));', expect: "ab", hidden: true },
    { run: 'println!("{}", longest_word("  sky   is   blue  "));', expect: "blue", hidden: true },
    { run: 'println!("{}", longest_word("hi\\tthere\\nfriend"));', expect: "friend", hidden: true },
  ],
  explain: L(
    "split_whitespace() handles any spacing. Replace the best word only when a longer one appears (>), so the first wins a tie; max_by_key keeps the last.",
    "split_whitespace() maneja cualquier espaciado. Cambia la mejor solo si aparece una más larga (>): gana la primera; max_by_key se queda con la última.",
    "split_whitespace() はどんな空白も扱う。より長い単語のとき（>）だけ入れかえれば同じ長さは最初が勝つ。max_by_key は最後を残す。",
  ),
};

export const sumEvensTask: ExamQuestion = {
  slug: "sum-evens",
  kind: "code",
  mode: "ide",
  topic: "collections",
  difficulty: 1,
  prompt: L("Coding: add up the even numbers", "Código: suma los números pares", "コーディング：偶数を合計する"),
  brief: L(
    "Write sum_evens(nums: &[i32]) -> i32: the sum of the even numbers in nums. Negative numbers count too (-4 is even, -3 is not). An empty slice gives 0.",
    "Escribe sum_evens(nums: &[i32]) -> i32: la suma de los números pares de nums. Los negativos también cuentan (-4 es par, -3 no). Un slice vacío da 0.",
    "sum_evens(nums: &[i32]) -> i32 を書こう。nums の偶数の合計を返す。負の数も数える（-4 は偶数、-3 は違う）。空のスライスなら 0。",
  ),
  starter: `fn sum_evens(nums: &[i32]) -> i32 {
    // your code here
    0
}
`,
  solution: `fn sum_evens(nums: &[i32]) -> i32 {
    nums.iter().filter(|&&n| n % 2 == 0).sum()
}
`,
  nearMiss: [
    // In Rust -3 % 2 is -1, so "not 1" lets negative odd numbers in.
    `fn sum_evens(nums: &[i32]) -> i32 {
    nums.iter().filter(|&&n| n % 2 != 1).sum()
}
`,
    // Sums the items at even positions instead of the even values.
    `fn sum_evens(nums: &[i32]) -> i32 {
    nums.iter().step_by(2).sum()
}
`,
  ],
  tests: [
    { run: 'println!("{}", sum_evens(&[1, 2, 3, 4]));', expect: "6" },
    { run: 'println!("{}", sum_evens(&[]));', expect: "0" },
    { run: 'println!("{}", sum_evens(&[-3, -4, 5]));', expect: "-4", hidden: true },
    { run: 'println!("{}", sum_evens(&[1, 3, 5]));', expect: "0", hidden: true },
    { run: 'println!("{}", sum_evens(&[2, 2, 7, 8]));', expect: "12", hidden: true },
  ],
  explain: L(
    "n % 2 == 0 is the even test for every sign. In Rust the remainder keeps the sign of n, so -3 % 2 is -1, and testing != 1 lets -3 in.",
    "n % 2 == 0 sirve para cualquier signo. En Rust el resto conserva el signo de n: -3 % 2 es -1, así que probar != 1 deja entrar al -3.",
    "n % 2 == 0 は符号に関係なく偶数を判定する。Rust の余りは n の符号を保つので -3 % 2 は -1。!= 1 だと -3 が入る。",
  ),
};

export const parseAgeTask: ExamQuestion = {
  slug: "parse-age",
  kind: "code",
  mode: "ide",
  topic: "errors",
  difficulty: 2,
  prompt: L("Coding: read an age safely", "Código: lee una edad sin riesgos", "コーディング：年齢を安全に読む"),
  brief: L(
    "Write parse_age(s: &str) -> Option<u8>. Ignore spaces around the number. Return Some(age) for a whole number from 0 to 150, and None for anything else (text, negatives, too big). Never panic.",
    "Escribe parse_age(s: &str) -> Option<u8>. Ignora los espacios alrededor del número. Devuelve Some(edad) para un entero de 0 a 150 y None para cualquier otra cosa (texto, negativos, demasiado grande). Nunca hagas panic.",
    "parse_age(s: &str) -> Option<u8> を書こう。数の前後の空白は無視する。0〜150 の整数なら Some(age)、それ以外（文字、負の数、大きすぎ）は None。パニックしないこと。",
  ),
  starter: `fn parse_age(s: &str) -> Option<u8> {
    // your code here
    None
}
`,
  solution: `fn parse_age(s: &str) -> Option<u8> {
    let age: u8 = s.trim().parse().ok()?;
    if age <= 150 {
        Some(age)
    } else {
        None
    }
}
`,
  nearMiss: [
    // Forgets to trim: " 7 " doesn't parse.
    `fn parse_age(s: &str) -> Option<u8> {
    let age: u8 = s.parse().ok()?;
    if age <= 150 {
        Some(age)
    } else {
        None
    }
}
`,
    // u8 stops at 255, not at 150.
    `fn parse_age(s: &str) -> Option<u8> {
    s.trim().parse().ok()
}
`,
  ],
  tests: [
    { run: 'println!("{:?}", parse_age("42"));', expect: "Some(42)" },
    { run: 'println!("{:?}", parse_age("abc"));', expect: "None" },
    { run: 'println!("{:?}", parse_age(" 7 "));', expect: "Some(7)", hidden: true },
    { run: 'println!("{:?}", parse_age("151"));', expect: "None", hidden: true },
    { run: 'println!("{:?}", parse_age("-1"));', expect: "None", hidden: true },
    { run: 'println!("{:?}", parse_age("150"));', expect: "Some(150)", hidden: true },
  ],
  explain: L(
    "trim() first, then parse().ok() turns the Result into an Option and ? returns None on failure. u8 alone allows up to 255, so check <= 150.",
    "Primero trim() y luego parse().ok() convierte el Result en Option; ? devuelve None si falla. u8 solo permite hasta 255, así que revisa <= 150.",
    "先に trim()、parse().ok() で Result を Option にし、? で失敗なら None。u8 は 255 まで入るので <= 150 も確かめる。",
  ),
};

export const initialsTask: ExamQuestion = {
  slug: "initials",
  kind: "code",
  mode: "ide",
  topic: "ownership",
  difficulty: 1,
  prompt: L("Coding: build the initials", "Código: arma las iniciales", "コーディング：イニシャルを作る"),
  brief: L(
    "Write initials(name: &str) -> String: the first letter of each word, upper-cased and followed by a dot. \"ada lovelace\" gives \"A.L.\". Words are separated by one or more spaces; ignore extra spaces. An empty name gives \"\".",
    "Escribe initials(name: &str) -> String: la primera letra de cada palabra, en mayúscula y seguida de un punto. \"ada lovelace\" da \"A.L.\". Las palabras se separan con uno o más espacios; ignora los espacios de más. Un nombre vacío da \"\".",
    "initials(name: &str) -> String を書こう。各単語の最初の文字を大文字にして点をつける。\"ada lovelace\" なら \"A.L.\"。単語は1つ以上の空白で区切られ、余分な空白は無視。空なら \"\"。",
  ),
  starter: `fn initials(name: &str) -> String {
    // your code here
    String::new()
}
`,
  solution: `fn initials(name: &str) -> String {
    let mut out = String::new();
    for word in name.split_whitespace() {
        if let Some(c) = word.chars().next() {
            out.push(c.to_ascii_uppercase());
            out.push('.');
        }
    }
    out
}
`,
  nearMiss: [
    // Forgets to upper-case.
    `fn initials(name: &str) -> String {
    let mut out = String::new();
    for word in name.split_whitespace() {
        if let Some(c) = word.chars().next() {
            out.push(c);
            out.push('.');
        }
    }
    out
}
`,
    // split(' ') yields empty pieces for double spaces, and unwrap() panics on them.
    `fn initials(name: &str) -> String {
    let mut out = String::new();
    for word in name.split(' ') {
        out.push(word.chars().next().unwrap().to_ascii_uppercase());
        out.push('.');
    }
    out
}
`,
  ],
  tests: [
    { run: 'println!("{}", initials("ada lovelace"));', expect: "A.L." },
    { run: 'println!("{}", initials("Grace Brewster Hopper"));', expect: "G.B.H." },
    { run: 'println!("[{}]", initials(""));', expect: "[]", hidden: true },
    { run: 'println!("{}", initials("  linus   torvalds "));', expect: "L.T.", hidden: true },
    { run: 'println!("{}", initials("x"));', expect: "X.", hidden: true },
  ],
  explain: L(
    "split_whitespace() skips empty pieces, chars().next() gives the first letter safely, and the function builds and returns an owned String.",
    "split_whitespace() salta los trozos vacíos, chars().next() da la primera letra sin riesgo y la función arma y devuelve un String propio.",
    "split_whitespace() は空の部分を飛ばし、chars().next() で最初の文字を安全に取る。関数は自分の String を作って返す。",
  ),
};

// ─── MID SCREENING (2 ide + 2 paper) ────────────────────────────────────────

export const wordFreqTask: ExamQuestion = {
  slug: "word-freq",
  kind: "code",
  mode: "ide",
  topic: "collections",
  difficulty: 2,
  prompt: L("Coding: word frequencies", "Código: frecuencia de palabras", "コーディング：単語の出現回数"),
  brief: L(
    "Write word_freq(text: &str) -> Vec<(String, usize)>: each distinct word, lower-cased, with how many times it appears. Words are separated by whitespace. Sort by count, highest first; on a tie, alphabetically. Empty text gives an empty Vec.",
    "Escribe word_freq(text: &str) -> Vec<(String, usize)>: cada palabra distinta, en minúsculas, con cuántas veces aparece. Las palabras se separan con espacios en blanco. Ordena por cantidad, de mayor a menor; si empatan, alfabéticamente. Un texto vacío da un Vec vacío.",
    "word_freq(text: &str) -> Vec<(String, usize)> を書こう。異なる単語を小文字にし、出現回数と組で返す。単語は空白区切り。回数の多い順、同数ならアルファベット順。空の text なら空の Vec。",
  ),
  starter: `use std::collections::HashMap;

fn word_freq(text: &str) -> Vec<(String, usize)> {
    // your code here
    Vec::new()
}
`,
  solution: `use std::collections::HashMap;

fn word_freq(text: &str) -> Vec<(String, usize)> {
    let mut counts: HashMap<String, usize> = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word.to_lowercase()).or_insert(0) += 1;
    }
    let mut out: Vec<(String, usize)> = counts.into_iter().collect();
    out.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    out
}
`,
  nearMiss: [
    // Forgets to lower-case.
    `use std::collections::HashMap;

fn word_freq(text: &str) -> Vec<(String, usize)> {
    let mut counts: HashMap<String, usize> = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word.to_string()).or_insert(0) += 1;
    }
    let mut out: Vec<(String, usize)> = counts.into_iter().collect();
    out.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    out
}
`,
    // A BTreeMap is alphabetical, but the counts are never sorted.
    `use std::collections::BTreeMap;

fn word_freq(text: &str) -> Vec<(String, usize)> {
    let mut counts: BTreeMap<String, usize> = BTreeMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word.to_lowercase()).or_insert(0) += 1;
    }
    counts.into_iter().collect()
}
`,
  ],
  tests: [
    { run: 'println!("{:?}", word_freq("b a b c a b"));', expect: '[("b", 3), ("a", 2), ("c", 1)]' },
    { run: 'println!("{:?}", word_freq(""));', expect: "[]" },
    { run: 'println!("{:?}", word_freq("Go go GO stop"));', expect: '[("go", 3), ("stop", 1)]', hidden: true },
    { run: 'println!("{:?}", word_freq("pear apple pear apple"));', expect: '[("apple", 2), ("pear", 2)]', hidden: true },
    { run: 'println!("{:?}", word_freq("z y x"));', expect: '[("x", 1), ("y", 1), ("z", 1)]', hidden: true },
  ],
  explain: L(
    "Count with entry().or_insert(0), then sort: b.1.cmp(&a.1) puts big counts first and .then(a.0.cmp(&b.0)) breaks ties. HashMap order is random, so always sort.",
    "Cuenta con entry().or_insert(0); b.1.cmp(&a.1) pone primero lo mayor y .then(a.0.cmp(&b.0)) desempata. El orden de un HashMap es aleatorio: ordena.",
    "entry().or_insert(0) で数え、b.1.cmp(&a.1) で多い順、.then(a.0.cmp(&b.0)) で同数を並べる。HashMap の順番はランダムなので必ずソートする。",
  ),
};

export const parseKvTask: ExamQuestion = {
  slug: "parse-kv",
  kind: "code",
  mode: "ide",
  topic: "errors",
  difficulty: 2,
  prompt: L("Coding: parse a config line", "Código: lee una línea de config", "コーディング：設定行を読む"),
  brief: L(
    "Write parse_kv(line: &str) -> Result<(String, i32), String> for lines like \"hp=10\". Split at the first '=', trim spaces around key and value. Errors: no '=' → Err(\"missing =\"); empty key → Err(\"empty key\"); value not an i32 → Err(\"bad value\"). Never panic.",
    "Escribe parse_kv(line: &str) -> Result<(String, i32), String> para líneas como \"hp=10\". Divide en el primer '=' y quita espacios alrededor de clave y valor. Errores: sin '=' → Err(\"missing =\"); clave vacía → Err(\"empty key\"); valor que no es i32 → Err(\"bad value\"). Nunca hagas panic.",
    "\"hp=10\" のような行を読む parse_kv(line: &str) -> Result<(String, i32), String> を書こう。最初の '=' で分け、キーと値の前後の空白を除く。'=' なし → Err(\"missing =\")、キーが空 → Err(\"empty key\")、値が i32 でない → Err(\"bad value\")。パニック禁止。",
  ),
  starter: `fn parse_kv(line: &str) -> Result<(String, i32), String> {
    // your code here
    Err(String::new())
}
`,
  solution: `fn parse_kv(line: &str) -> Result<(String, i32), String> {
    let (key, value) = line.split_once('=').ok_or("missing =")?;
    let key = key.trim();
    if key.is_empty() {
        return Err("empty key".to_string());
    }
    let value: i32 = value.trim().parse().map_err(|_| "bad value".to_string())?;
    Ok((key.to_string(), value))
}
`,
  nearMiss: [
    // Forgets to trim: " 10" isn't an i32.
    `fn parse_kv(line: &str) -> Result<(String, i32), String> {
    let (key, value) = line.split_once('=').ok_or("missing =")?;
    if key.is_empty() {
        return Err("empty key".to_string());
    }
    let value: i32 = value.parse().map_err(|_| "bad value".to_string())?;
    Ok((key.to_string(), value))
}
`,
    // Never checks for an empty key.
    `fn parse_kv(line: &str) -> Result<(String, i32), String> {
    let (key, value) = line.split_once('=').ok_or("missing =")?;
    let value: i32 = value.trim().parse().map_err(|_| "bad value".to_string())?;
    Ok((key.trim().to_string(), value))
}
`,
  ],
  tests: [
    { run: 'println!("{:?}", parse_kv("hp=10"));', expect: 'Ok(("hp", 10))' },
    { run: 'println!("{:?}", parse_kv("hp"));', expect: 'Err("missing =")' },
    { run: 'println!("{:?}", parse_kv(" mp = -3 "));', expect: 'Ok(("mp", -3))', hidden: true },
    { run: 'println!("{:?}", parse_kv("=5"));', expect: 'Err("empty key")', hidden: true },
    { run: 'println!("{:?}", parse_kv("lvl=ten"));', expect: 'Err("bad value")', hidden: true },
    { run: 'println!("{:?}", parse_kv("a=1=2"));', expect: 'Err("bad value")', hidden: true },
  ],
  explain: L(
    "split_once('=') gives an Option: ok_or turns it into an error and ? returns early. map_err replaces the parse error with your message.",
    "split_once('=') da un Option: ok_or lo convierte en error y ? sale antes. map_err cambia el error de parse por tu mensaje.",
    "split_once('=') は Option を返す。ok_or でエラーにし、? で早めに返す。map_err で parse のエラーを自分のメッセージに替える。",
  ),
};

export const rleTask: ExamQuestion = {
  slug: "rle",
  kind: "code",
  mode: "paper",
  topic: "iterators",
  difficulty: 2,
  prompt: L("Written test: run-length encoding", "Prueba escrita: codificación por rachas", "筆記：ランレングス圧縮"),
  brief: L(
    "Write rle(s: &str) -> String: replace each run of the same character with the character followed by the run's length. \"aaabcc\" gives \"a3b1c2\". Always write the count, even 1. Counts can have several digits. Empty input gives \"\".",
    "Escribe rle(s: &str) -> String: cambia cada racha del mismo carácter por el carácter seguido del largo de la racha. \"aaabcc\" da \"a3b1c2\". Escribe siempre la cuenta, incluso 1. La cuenta puede tener varios dígitos. Una entrada vacía da \"\".",
    "rle(s: &str) -> String を書こう。同じ文字の連続を「文字＋連続した数」に置きかえる。\"aaabcc\" なら \"a3b1c2\"。1 でも数を書く。数は2桁以上もある。空なら \"\"。",
  ),
  starter: `fn rle(s: &str) -> String {
    // your code here
    String::new()
}
`,
  solution: `fn rle(s: &str) -> String {
    let mut out = String::new();
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        let mut n = 1;
        while chars.peek() == Some(&c) {
            chars.next();
            n += 1;
        }
        out.push_str(&format!("{}{}", c, n));
    }
    out
}
`,
  nearMiss: [
    // Writes a run only when the next one starts, so the last run is lost.
    `fn rle(s: &str) -> String {
    let mut out = String::new();
    let mut prev: Option<char> = None;
    let mut n = 0;
    for c in s.chars() {
        if Some(c) == prev {
            n += 1;
        } else {
            if let Some(p) = prev {
                out.push_str(&format!("{}{}", p, n));
            }
            prev = Some(c);
            n = 1;
        }
    }
    out
}
`,
    // Skips the count when it is 1.
    `fn rle(s: &str) -> String {
    let mut out = String::new();
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        let mut n = 1;
        while chars.peek() == Some(&c) {
            chars.next();
            n += 1;
        }
        out.push(c);
        if n > 1 {
            out.push_str(&n.to_string());
        }
    }
    out
}
`,
  ],
  tests: [
    { run: 'println!("{}", rle("aaabcc"));', expect: "a3b1c2" },
    { run: 'println!("[{}]", rle(""));', expect: "[]" },
    { run: 'println!("{}", rle("z"));', expect: "z1", hidden: true },
    { run: 'println!("{}", rle("aabbaa"));', expect: "a2b2a2", hidden: true },
    { run: 'println!("{}", rle("aaaaaaaaaaaa"));', expect: "a12", hidden: true },
  ],
  explain: L(
    "A peekable iterator lets you count while the next char matches. Writing a run only when a new one starts forgets the last run: flush it at the end.",
    "Un iterador peekable te deja contar mientras el siguiente carácter coincide. Escribir una racha solo al empezar otra olvida la última: vacíala al final.",
    "peekable なイテレータなら次の文字が同じ間だけ数えられる。新しい連続のときだけ書くと最後の連続が抜ける。最後に書き出そう。",
  ),
};

export const largestTask: ExamQuestion = {
  slug: "largest",
  kind: "code",
  mode: "paper",
  topic: "traits",
  difficulty: 2,
  prompt: L("Written test: a generic largest", "Prueba escrita: el mayor, genérico", "筆記：ジェネリックな最大値"),
  brief: L(
    "Write largest<T: PartialOrd + Copy>(items: &[T]) -> Option<T>: the largest item, or None for an empty slice. It must work for any such T (integers, floats, chars). Don't panic on empty input.",
    "Escribe largest<T: PartialOrd + Copy>(items: &[T]) -> Option<T>: el elemento mayor, o None si el slice está vacío. Debe funcionar con cualquier T así (enteros, floats, chars). No hagas panic con una entrada vacía.",
    "largest<T: PartialOrd + Copy>(items: &[T]) -> Option<T> を書こう。最大の要素を返し、空のスライスなら None。条件を満たすどんな T（整数・浮動小数・char）でも動くこと。空でパニックしないこと。",
  ),
  starter: `fn largest<T: PartialOrd + Copy>(items: &[T]) -> Option<T> {
    // your code here
    None
}
`,
  solution: `fn largest<T: PartialOrd + Copy>(items: &[T]) -> Option<T> {
    let mut best = *items.first()?;
    for &x in items {
        if x > best {
            best = x;
        }
    }
    Some(best)
}
`,
  nearMiss: [
    // items[0] panics on an empty slice.
    `fn largest<T: PartialOrd + Copy>(items: &[T]) -> Option<T> {
    let mut best = items[0];
    for &x in items {
        if x > best {
            best = x;
        }
    }
    Some(best)
}
`,
    // The comparison is flipped: this finds the smallest.
    `fn largest<T: PartialOrd + Copy>(items: &[T]) -> Option<T> {
    let mut best = *items.first()?;
    for &x in items {
        if x < best {
            best = x;
        }
    }
    Some(best)
}
`,
  ],
  tests: [
    { run: 'println!("{:?}", largest(&[3, 9, 2]));', expect: "Some(9)" },
    { run: "println!(\"{:?}\", largest(&['r', 'u', 's', 't']));", expect: "Some('u')" },
    { run: 'println!("{:?}", largest(&[1.5, -2.0, 3.25]));', expect: "Some(3.25)", hidden: true },
    { run: 'println!("{:?}", largest(&[-5, -1, -9]));', expect: "Some(-1)", hidden: true },
    { run: 'println!("{:?}", largest::<i32>(&[]));', expect: "None", hidden: true },
  ],
  explain: L(
    "items.first()? returns None for an empty slice instead of panicking like items[0]. PartialOrd gives >, and Copy lets you keep the value out of the slice.",
    "items.first()? devuelve None con un slice vacío en vez de hacer panic como items[0]. PartialOrd da el >, y Copy te deja quedarte con el valor fuera del slice.",
    "items.first()? は空なら None を返し、items[0] のようにパニックしない。PartialOrd で > が使え、Copy で値をスライスの外に持ち出せる。",
  ),
};

// ─── SENIOR SCREENING (1 ide + 3 paper) ─────────────────────────────────────

export const sumLinesTask: ExamQuestion = {
  slug: "sum-lines",
  kind: "code",
  mode: "ide",
  topic: "errors",
  difficulty: 3,
  prompt: L("Coding: sum a report, with errors", "Código: suma un reporte, con errores", "コーディング：エラーつきで集計"),
  brief: L(
    "Write sum_lines(input: &str) -> Result<i64, String>. Each line holds one integer (spaces around it allowed); blank lines are skipped. Return Ok(sum), or for the first line that isn't an integer Err(\"line N: bad number\"), N counting from 1 (blank lines count too). Values may not fit in an i32.",
    "Escribe sum_lines(input: &str) -> Result<i64, String>. Cada línea tiene un entero (puede tener espacios alrededor); las líneas en blanco se saltan. Devuelve Ok(suma) o, para la primera línea que no sea entero, Err(\"line N: bad number\"), con N contando desde 1 (las líneas en blanco también cuentan). Los valores pueden no caber en un i32.",
    "sum_lines(input: &str) -> Result<i64, String> を書こう。各行に整数が1つ（前後に空白あり）、空行は飛ばす。Ok(合計) を返す。整数でない最初の行には Err(\"line N: bad number\")。N は1から数え、空行も数える。値は i32 に収まらないこともある。",
  ),
  starter: `fn sum_lines(input: &str) -> Result<i64, String> {
    // your code here
    Ok(0)
}
`,
  solution: `fn sum_lines(input: &str) -> Result<i64, String> {
    let mut total = 0;
    for (i, line) in input.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let n: i64 = line.parse().map_err(|_| format!("line {}: bad number", i + 1))?;
        total += n;
    }
    Ok(total)
}
`,
  nearMiss: [
    // enumerate() starts at 0.
    `fn sum_lines(input: &str) -> Result<i64, String> {
    let mut total = 0;
    for (i, line) in input.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let n: i64 = line.parse().map_err(|_| format!("line {}: bad number", i))?;
        total += n;
    }
    Ok(total)
}
`,
    // Doesn't skip blank lines: "" isn't a number.
    `fn sum_lines(input: &str) -> Result<i64, String> {
    let mut total = 0;
    for (i, line) in input.lines().enumerate() {
        let n: i64 = line.trim().parse().map_err(|_| format!("line {}: bad number", i + 1))?;
        total += n;
    }
    Ok(total)
}
`,
  ],
  tests: [
    { run: 'println!("{:?}", sum_lines("1\\n2\\n3"));', expect: "Ok(6)" },
    { run: 'println!("{:?}", sum_lines("10\\nx\\n5"));', expect: 'Err("line 2: bad number")' },
    { run: 'println!("{:?}", sum_lines(""));', expect: "Ok(0)", hidden: true },
    { run: 'println!("{:?}", sum_lines(" 4 \\n\\n-6\\n"));', expect: "Ok(-2)", hidden: true },
    { run: 'println!("{:?}", sum_lines("1\\n\\n2\\noops"));', expect: 'Err("line 4: bad number")', hidden: true },
    { run: 'println!("{:?}", sum_lines("9000000000\\n1"));', expect: "Ok(9000000001)", hidden: true },
  ],
  explain: L(
    "enumerate() counts from 0, so report i + 1. Skip blank lines before parsing, and let map_err plus ? stop at the first bad line.",
    "enumerate() cuenta desde 0, así que informa i + 1. Salta las líneas en blanco antes de parsear y deja que map_err con ? se detenga en la primera línea mala.",
    "enumerate() は 0 から数えるので i + 1 を報告する。parse の前に空行を飛ばし、map_err と ? で最初の悪い行で止める。",
  ),
};

export const tokensTask: ExamQuestion = {
  slug: "tokens",
  kind: "code",
  mode: "paper",
  topic: "lifetimes",
  difficulty: 3,
  prompt: L("Written test: a zero-copy tokenizer", "Prueba escrita: tokenizer sin copias", "筆記：コピーなしのトークナイザ"),
  brief: L(
    "Write tokens(src: &str) -> Vec<&str>: split src into tokens that are slices of src (no new Strings). Whitespace separates tokens and is dropped. Each of ( ) , ; is a token on its own, even with no spaces around it: \"f(a, b);\" gives [\"f\", \"(\", \"a\", \",\", \"b\", \")\", \";\"]. Input is ASCII.",
    "Escribe tokens(src: &str) -> Vec<&str>: divide src en tokens que sean trozos de src (sin Strings nuevos). Los espacios en blanco separan tokens y se descartan. Cada uno de ( ) , ; es un token propio, aunque no tenga espacios alrededor: \"f(a, b);\" da [\"f\", \"(\", \"a\", \",\", \"b\", \")\", \";\"]. La entrada es ASCII.",
    "tokens(src: &str) -> Vec<&str> を書こう。src を src の一部（新しい String なし）のトークンに分ける。空白は区切りで捨てる。( ) , ; は空白がなくても1つのトークン。\"f(a, b);\" なら [\"f\", \"(\", \"a\", \",\", \"b\", \")\", \";\"]。入力は ASCII。",
  ),
  starter: `fn tokens(src: &str) -> Vec<&str> {
    // your code here
    Vec::new()
}
`,
  solution: `fn tokens(src: &str) -> Vec<&str> {
    let mut out = Vec::new();
    let mut start: Option<usize> = None;
    for (i, c) in src.char_indices() {
        if c.is_whitespace() || "(),;".contains(c) {
            if let Some(s) = start.take() {
                out.push(&src[s..i]);
            }
            if !c.is_whitespace() {
                out.push(&src[i..i + 1]);
            }
        } else if start.is_none() {
            start = Some(i);
        }
    }
    if let Some(s) = start {
        out.push(&src[s..]);
    }
    out
}
`,
  nearMiss: [
    // Never flushes the word still open at the end of the input.
    `fn tokens(src: &str) -> Vec<&str> {
    let mut out = Vec::new();
    let mut start: Option<usize> = None;
    for (i, c) in src.char_indices() {
        if c.is_whitespace() || "(),;".contains(c) {
            if let Some(s) = start.take() {
                out.push(&src[s..i]);
            }
            if !c.is_whitespace() {
                out.push(&src[i..i + 1]);
            }
        } else if start.is_none() {
            start = Some(i);
        }
    }
    out
}
`,
    // Treats punctuation as a separator and drops it.
    `fn tokens(src: &str) -> Vec<&str> {
    src.split(|c: char| c.is_whitespace() || "(),;".contains(c))
        .filter(|t| !t.is_empty())
        .collect()
}
`,
  ],
  tests: [
    { run: 'println!("{:?}", tokens("f(a, b);"));', expect: '["f", "(", "a", ",", "b", ")", ";"]' },
    { run: 'println!("{:?}", tokens("let x = 5;"));', expect: '["let", "x", "=", "5", ";"]' },
    { run: 'println!("{:?}", tokens(""));', expect: "[]", hidden: true },
    { run: 'println!("{:?}", tokens("  go   to"));', expect: '["go", "to"]', hidden: true },
    { run: 'println!("{:?}", tokens("((x))"));', expect: '["(", "(", "x", ")", ")"]', hidden: true },
    { run: 'println!("{:?}", tokens("max(a,b)"));', expect: '["max", "(", "a", ",", "b", ")"]', hidden: true },
  ],
  explain: L(
    "Track where the current word starts; on a separator push &src[start..i], push punctuation as its own slice, and flush the open word after the loop.",
    "Guarda dónde empieza la palabra actual; en un separador agrega &src[start..i], agrega la puntuación como trozo propio y vacía la palabra abierta tras el bucle.",
    "今の単語の開始位置を覚え、区切りで &src[start..i] を push。記号はそれ自体を push し、ループのあとで残った単語も push する。",
  ),
};

export const parallelSumTask: ExamQuestion = {
  slug: "parallel-sum",
  kind: "code",
  mode: "paper",
  topic: "concurrency",
  difficulty: 3,
  prompt: L("Written test: a parallel sum", "Prueba escrita: suma en paralelo", "筆記：並列で合計"),
  brief: L(
    "Write parallel_sum(data: &[u64], workers: usize) -> u64. Split data into at most workers chunks, sum each chunk in its own thread (std::thread::scope lets threads borrow data) and return the total. workers is at least 1; data may be empty or shorter than workers. Every element must be counted exactly once.",
    "Escribe parallel_sum(data: &[u64], workers: usize) -> u64. Divide data en como mucho workers trozos, suma cada trozo en su propio hilo (std::thread::scope deja que los hilos tomen prestado data) y devuelve el total. workers es al menos 1; data puede estar vacío o ser más corto que workers. Cada elemento debe contarse exactamente una vez.",
    "parallel_sum(data: &[u64], workers: usize) -> u64 を書こう。data を最大 workers 個に分け、それぞれ別スレッドで合計（std::thread::scope なら data を借りられる）して総計を返す。workers は1以上。data は空や workers より短いこともある。全要素をちょうど1回数えること。",
  ),
  starter: `use std::thread;

fn parallel_sum(data: &[u64], workers: usize) -> u64 {
    // your code here
    0
}
`,
  solution: `use std::thread;

fn parallel_sum(data: &[u64], workers: usize) -> u64 {
    let size = ((data.len() + workers - 1) / workers).max(1);
    thread::scope(|s| {
        let handles: Vec<_> = data
            .chunks(size)
            .map(|chunk| s.spawn(move || chunk.iter().sum::<u64>()))
            .collect();
        handles.into_iter().map(|h| h.join().unwrap()).sum()
    })
}
`,
  nearMiss: [
    // Integer division: the remainder after workers * size is never summed.
    `use std::thread;

fn parallel_sum(data: &[u64], workers: usize) -> u64 {
    let size = data.len() / workers;
    thread::scope(|s| {
        let handles: Vec<_> = (0..workers)
            .map(|i| {
                let part = &data[i * size..(i + 1) * size];
                s.spawn(move || part.iter().sum::<u64>())
            })
            .collect();
        handles.into_iter().map(|h| h.join().unwrap()).sum()
    })
}
`,
    // chunks(0) panics when data is shorter than workers.
    `use std::thread;

fn parallel_sum(data: &[u64], workers: usize) -> u64 {
    let size = data.len() / workers;
    thread::scope(|s| {
        let handles: Vec<_> = data
            .chunks(size)
            .map(|chunk| s.spawn(move || chunk.iter().sum::<u64>()))
            .collect();
        handles.into_iter().map(|h| h.join().unwrap()).sum()
    })
}
`,
  ],
  tests: [
    { run: 'let v: Vec<u64> = (1..=10).collect();\nprintln!("{}", parallel_sum(&v, 3));', expect: "55" },
    { run: 'println!("{}", parallel_sum(&[4, 4], 1));', expect: "8" },
    { run: 'println!("{}", parallel_sum(&[], 4));', expect: "0", hidden: true },
    { run: 'println!("{}", parallel_sum(&[5], 8));', expect: "5", hidden: true },
    { run: 'let v: Vec<u64> = (1..=1000).collect();\nprintln!("{}", parallel_sum(&v, 7));', expect: "500500", hidden: true },
  ],
  explain: L(
    "Round the chunk size up (and keep it at least 1) so chunks() covers every element; thread::scope lets each thread borrow its chunk and joins them all.",
    "Redondea el trozo hacia arriba (mínimo 1) para que chunks() cubra todo; thread::scope deja que cada hilo tome prestado su trozo y los une a todos.",
    "チャンクの大きさを切り上げ（最低 1）、chunks() で全要素をおおう。thread::scope なら各スレッドが自分のチャンクを借り、全部 join される。",
  ),
};

export const collatzTask: ExamQuestion = {
  slug: "collatz",
  kind: "code",
  mode: "paper",
  topic: "iterators",
  difficulty: 3,
  prompt: L("Written test: implement Iterator", "Prueba escrita: implementa Iterator", "筆記：Iterator を実装する"),
  brief: L(
    "Make Collatz an Iterator<Item = u64>. Collatz::new(n) yields n, then the next term (n / 2 if n is even, 3 * n + 1 if odd), and so on, ending after it yields 1. Collatz::new(6) yields 6, 3, 10, 5, 16, 8, 4, 2, 1. n is at least 1. Add any fields you need.",
    "Haz que Collatz sea un Iterator<Item = u64>. Collatz::new(n) produce n, luego el siguiente término (n / 2 si n es par, 3 * n + 1 si es impar), y así, terminando después de producir 1. Collatz::new(6) produce 6, 3, 10, 5, 16, 8, 4, 2, 1. n es al menos 1. Agrega los campos que necesites.",
    "Collatz を Iterator<Item = u64> にしよう。Collatz::new(n) は n、次に次の項（偶数なら n / 2、奇数なら 3 * n + 1）…と返し、1 を返したら終わる。Collatz::new(6) は 6, 3, 10, 5, 16, 8, 4, 2, 1。n は1以上。フィールドは自由に足してよい。",
  ),
  starter: `struct Collatz {}

impl Collatz {
    fn new(start: u64) -> Self {
        Collatz {}
    }
}

impl Iterator for Collatz {
    type Item = u64;

    fn next(&mut self) -> Option<u64> {
        // your code here
        None
    }
}
`,
  solution: `struct Collatz {
    next: Option<u64>,
}

impl Collatz {
    fn new(start: u64) -> Self {
        Collatz { next: Some(start) }
    }
}

impl Iterator for Collatz {
    type Item = u64;

    fn next(&mut self) -> Option<u64> {
        let n = self.next?;
        self.next = if n == 1 {
            None
        } else if n % 2 == 0 {
            Some(n / 2)
        } else {
            Some(3 * n + 1)
        };
        Some(n)
    }
}
`,
  nearMiss: [
    // Stops before yielding the final 1.
    `struct Collatz {
    n: u64,
}

impl Collatz {
    fn new(start: u64) -> Self {
        Collatz { n: start }
    }
}

impl Iterator for Collatz {
    type Item = u64;

    fn next(&mut self) -> Option<u64> {
        if self.n == 1 {
            return None;
        }
        let cur = self.n;
        self.n = if cur % 2 == 0 { cur / 2 } else { 3 * cur + 1 };
        Some(cur)
    }
}
`,
    // Advances first, so the starting number is never yielded.
    `struct Collatz {
    n: u64,
}

impl Collatz {
    fn new(start: u64) -> Self {
        Collatz { n: start }
    }
}

impl Iterator for Collatz {
    type Item = u64;

    fn next(&mut self) -> Option<u64> {
        if self.n == 1 {
            return None;
        }
        self.n = if self.n % 2 == 0 { self.n / 2 } else { 3 * self.n + 1 };
        Some(self.n)
    }
}
`,
  ],
  tests: [
    { run: 'println!("{:?}", Collatz::new(6).collect::<Vec<_>>());', expect: "[6, 3, 10, 5, 16, 8, 4, 2, 1]" },
    { run: 'println!("{:?}", Collatz::new(1).collect::<Vec<_>>());', expect: "[1]" },
    { run: 'println!("{}", Collatz::new(27).count());', expect: "112", hidden: true },
    { run: 'println!("{:?}", Collatz::new(7).max());', expect: "Some(52)", hidden: true },
    { run: 'println!("{}", Collatz::new(3).sum::<u64>());', expect: "49", hidden: true },
    { run: 'println!("{:?}", Collatz::new(16).take(3).collect::<Vec<_>>());', expect: "[16, 8, 4]", hidden: true },
  ],
  explain: L(
    "Store the next value as an Option: yield it, then compute the one after, or None once you have yielded 1. Every adapter (count, max, take) then works for free.",
    "Guarda el siguiente valor como Option: devuélvelo y calcula el que sigue, o None tras devolver 1. Así todos los adaptadores (count, max, take) funcionan gratis.",
    "次の値を Option で持つ。それを返してから次を計算し、1 を返したら None。これで count・max・take などのアダプタがそのまま使える。",
  ),
};
