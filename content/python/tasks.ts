import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for planet Serpentia (Python). Any implementation that passes the tests is accepted;
// the validator proves the reference solution passes, the starter fails and each near miss fails.

/** Region boss mini project (Collection Forest): merge two inventories without touching them. */
export const mergeInventoryTask: CodeTaskBeat = {
  slug: "merge-inventory",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: merge two loot bags", "Mini proyecto: fusiona dos bolsas", "ミニ課題：2つの袋をまとめる"),
  brief: L(
    "Write merge_inventory(a, b). Both are dicts of item → count. Return a NEW dict with every item and the counts added up. Keys from a come first, then new keys from b. Don't modify a or b: the Hydra is watching for shared references!",
    "Escribe merge_inventory(a, b). Ambos son dicts de objeto → cantidad. Devuelve un dict NUEVO con todos los objetos y las cantidades sumadas. Primero las claves de a, luego las nuevas de b. No modifiques a ni b: ¡la Hidra vigila las referencias compartidas!",
    "merge_inventory(a, b) を書こう。どちらも「アイテム → 個数」の dict。全アイテムの個数を足した「新しい」dict を返す。a のキーが先、その後 b の新しいキー。a も b も変えないこと。ヒドラは共有参照を見張っている！",
  ),
  starter: "def merge_inventory(a, b):\n    # your code here\n    return {}\n",
  solution: "def merge_inventory(a, b):\n    merged = dict(a)\n    for item, count in b.items():\n        merged[item] = merged.get(item, 0) + count\n    return merged\n",
  nearMiss: [
    // Adds into `a` itself: correct sums, but the caller's dict changes.
    "def merge_inventory(a, b):\n    for item, count in b.items():\n        a[item] = a.get(item, 0) + count\n    return a\n",
    // Overwrites instead of adding.
    "def merge_inventory(a, b):\n    return {**a, **b}\n",
  ],
  tests: [
    { run: 'print(merge_inventory({"gem": 1}, {"gem": 2, "key": 1}))', expect: "{'gem': 3, 'key': 1}" },
    { run: "print(merge_inventory({}, {}))", expect: "{}" },
    { run: 'bag = {"potion": 1}\nmerge_inventory(bag, {"potion": 4})\nprint(bag)', expect: "{'potion': 1}", hidden: true },
    { run: 'print(merge_inventory({"sword": 1}, {"axe": 2, "sword": 1}))', expect: "{'sword': 2, 'axe': 2}", hidden: true },
    { run: 'print(merge_inventory({"b": 1}, {"a": 2}))', expect: "{'b': 1, 'a': 2}", hidden: true },
  ],
  hint: L("Start from a copy of a, then add each count from b with .get(item, 0).", "Empieza de una copia de a y suma cada cantidad de b con .get(item, 0).", "a のコピーから始めて、b の個数を .get(item, 0) で足していこう。"),
  note: "recap-shared",
  explain: L(
    "dict(a) makes a separate copy, so adding into it never touches a. .get(item, 0) adds to an existing count or starts at 0.",
    "dict(a) hace una copia aparte, así que sumar en ella nunca toca a. .get(item, 0) suma a la cantidad que haya o empieza en 0.",
    "dict(a) は別のコピーを作るので、足しても a は変わらない。.get(item, 0) は既存の個数に足すか 0 から始める。",
  ),
};

/** Junior screening: a warm-up function in a normal editor. */
export const countVowelsTask: ExamQuestion = {
  slug: "count-vowels",
  kind: "code",
  mode: "ide",
  topic: "numbers_strings",
  difficulty: 1,
  prompt: L("Coding: count the vowels", "Código: cuenta las vocales", "コーディング：母音を数える"),
  brief: L(
    "Write count_vowels(text) that returns how many vowels (a, e, i, o, u) the text has, in upper or lower case.",
    "Escribe count_vowels(text) que devuelva cuántas vocales (a, e, i, o, u) tiene el texto, en mayúscula o minúscula.",
    "count_vowels(text) を書こう。text の母音（a, e, i, o, u）の数を、大文字・小文字どちらも数えて返す。",
  ),
  starter: "def count_vowels(text):\n    # your code here\n    return 0\n",
  solution: 'def count_vowels(text):\n    return sum(1 for ch in text.lower() if ch in "aeiou")\n',
  nearMiss: ['def count_vowels(text):\n    return sum(1 for ch in text if ch in "aeiou")\n'],
  tests: [
    { run: 'print(count_vowels("Bitwise"))', expect: "3" },
    { run: 'print(count_vowels(""))', expect: "0" },
    { run: 'print(count_vowels("AEIOU xyz"))', expect: "5", hidden: true },
    { run: 'print(count_vowels("rhythm"))', expect: "0", hidden: true },
    { run: 'print(count_vowels("Queue"))', expect: "4", hidden: true },
  ],
  explain: L(
    "Lower-case the text first so 'A' and 'a' both count, then count the characters that are in \"aeiou\".",
    "Pasa el texto a minúsculas para que 'A' y 'a' cuenten, y luego cuenta los caracteres que están en \"aeiou\".",
    "先に小文字にすれば 'A' も 'a' も数えられる。あとは \"aeiou\" に含まれる文字を数える。",
  ),
};

/** Mid screening, written-test style: no running, no paste, one submission. */
export const topWordsTask: ExamQuestion = {
  slug: "top-words",
  kind: "code",
  mode: "paper",
  topic: "stdlib",
  difficulty: 2,
  prompt: L("Written test: the most frequent words", "Prueba escrita: las palabras más frecuentes", "筆記：よく出る単語"),
  brief: L(
    "Write top_words(text, n): the n most frequent words in text, lower-cased, as a list. Most frequent first; on a tie, alphabetical order. Words are separated by spaces.",
    "Escribe top_words(text, n): las n palabras más frecuentes de text, en minúsculas, como lista. Primero la más frecuente; si empatan, en orden alfabético. Las palabras se separan con espacios.",
    "top_words(text, n) を書こう。text で多く出る単語を小文字で n 個、リストで返す。多い順、同数ならアルファベット順。単語は空白で区切られる。",
  ),
  starter: "def top_words(text, n):\n    # your code here\n    return []\n",
  solution: "from collections import Counter\n\ndef top_words(text, n):\n    counts = Counter(text.lower().split())\n    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))\n    return [word for word, _ in ranked[:n]]\n",
  nearMiss: [
    // most_common keeps ties in first-seen order, not alphabetical.
    "from collections import Counter\n\ndef top_words(text, n):\n    return [w for w, _ in Counter(text.lower().split()).most_common(n)]\n",
    // Forgets to lower-case.
    "from collections import Counter\n\ndef top_words(text, n):\n    counts = Counter(text.split())\n    return [w for w, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:n]]\n",
  ],
  tests: [
    { run: 'print(top_words("b a b c a b", 2))', expect: "['b', 'a']" },
    { run: 'print(top_words("x y z", 2))', expect: "['x', 'y']" },
    { run: 'print(top_words("Go go GO stop", 1))', expect: "['go']", hidden: true },
    { run: 'print(top_words("", 3))', expect: "[]", hidden: true },
    { run: 'print(top_words("pear apple pear apple", 2))', expect: "['apple', 'pear']", hidden: true },
  ],
  explain: L(
    "Count with Counter, then sort by (-count, word): the minus puts big counts first and the word breaks ties alphabetically.",
    "Cuenta con Counter y ordena por (-cantidad, palabra): el menos pone primero las cantidades grandes y la palabra desempata en orden alfabético.",
    "Counter で数え、(-個数, 単語) で並べる。マイナスで多い順、単語で同数のときアルファベット順になる。",
  ),
};

/** Senior screening, written-test style: recursion over nested data. */
export const flattenTask: ExamQuestion = {
  slug: "flatten",
  kind: "code",
  mode: "paper",
  topic: "patterns",
  difficulty: 3,
  prompt: L("Written test: flatten nested data", "Prueba escrita: aplana datos anidados", "筆記：入れ子をたいらに"),
  brief: L(
    "Write flatten(items): items can contain values, lists and tuples nested at any depth. Return one flat list with the values in order. Strings are values: don't split them into letters.",
    "Escribe flatten(items): items puede contener valores, listas y tuplas anidadas a cualquier profundidad. Devuelve una sola lista plana con los valores en orden. Los strings son valores: no los separes en letras.",
    "flatten(items) を書こう。items には値・リスト・タプルがどんな深さでも入れ子になる。値を順番どおり1つの平らなリストで返す。文字列は値なので、1文字ずつに分けないこと。",
  ),
  starter: "def flatten(items):\n    # your code here\n    return []\n",
  solution: "def flatten(items):\n    out = []\n    for item in items:\n        if isinstance(item, (list, tuple)):\n            out.extend(flatten(item))\n        else:\n            out.append(item)\n    return out\n",
  nearMiss: [
    // Only lists are flattened: tuples stay whole.
    "def flatten(items):\n    out = []\n    for item in items:\n        if isinstance(item, list):\n            out.extend(flatten(item))\n        else:\n            out.append(item)\n    return out\n",
    // One level only.
    "def flatten(items):\n    out = []\n    for item in items:\n        if isinstance(item, (list, tuple)):\n            out.extend(item)\n        else:\n            out.append(item)\n    return out\n",
  ],
  tests: [
    { run: "print(flatten([1, [2, [3, 4]], 5]))", expect: "[1, 2, 3, 4, 5]" },
    { run: "print(flatten([]))", expect: "[]" },
    { run: 'print(flatten([[["deep"]], "ab", (1, 2)]))', expect: "['deep', 'ab', 1, 2]", hidden: true },
    { run: "print(flatten([[], [[]], 7]))", expect: "[7]", hidden: true },
  ],
  explain: L(
    "Recursion: when an item is a list or tuple, flatten it and extend; otherwise append it. Strings aren't lists, so they stay whole.",
    "Recursión: si un elemento es lista o tupla, aplánalo y extiende; si no, agrégalo. Los strings no son listas, así que quedan enteros.",
    "再帰：要素がリストかタプルなら flatten して extend、それ以外は append。文字列はリストではないのでそのまま。",
  ),
};

// ─── Region boss mini projects ─────────────────────────────────────────────

/** Region boss mini project (Name Village): // and % plus a zero-padded f-string. */
export const formatClockTask: CodeTaskBeat = {
  slug: "format-clock",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the golem's clock", "Mini proyecto: el reloj del gólem", "ミニ課題：ゴーレムの時計"),
  brief: L(
    "Write format_clock(seconds). seconds is a whole number ≥ 0. Return a string \"H:MM:SS\": hours without padding (they can go past 23), minutes and seconds always with 2 digits. Example: 3661 → \"1:01:01\", 59 → \"0:00:59\".",
    "Escribe format_clock(seconds). seconds es un entero ≥ 0. Devuelve un string \"H:MM:SS\": las horas sin relleno (pueden pasar de 23), minutos y segundos siempre con 2 dígitos. Ejemplo: 3661 → \"1:01:01\", 59 → \"0:00:59\".",
    "format_clock(seconds) を書こう。seconds は 0 以上の整数。\"H:MM:SS\" の文字列を返す。時は桁をそろえず（23 を超えてもよい）、分と秒はいつも2桁。例：3661 → \"1:01:01\"、59 → \"0:00:59\"。",
  ),
  starter: "def format_clock(seconds):\n    # your code here\n    return \"\"\n",
  solution: "def format_clock(seconds):\n    hours = seconds // 3600\n    minutes = seconds % 3600 // 60\n    secs = seconds % 60\n    return f\"{hours}:{minutes:02}:{secs:02}\"\n",
  nearMiss: [
    // Forgets the zero padding.
    "def format_clock(seconds):\n    return f\"{seconds // 3600}:{seconds % 3600 // 60}:{seconds % 60}\"\n",
    // Uses / instead of //: floats sneak in.
    "def format_clock(seconds):\n    hours = int(seconds / 3600)\n    minutes = seconds / 60 % 60\n    return f\"{hours}:{minutes:02}:{seconds % 60:02}\"\n",
  ],
  tests: [
    { run: "print(format_clock(3661))", expect: "1:01:01" },
    { run: "print(format_clock(59))", expect: "0:00:59" },
    { run: "print(format_clock(0))", expect: "0:00:00", hidden: true },
    { run: "print(format_clock(86399))", expect: "23:59:59", hidden: true },
    { run: "print(format_clock(90000))", expect: "25:00:00", hidden: true },
  ],
  hint: L("// gives whole hours, % gives what is left over. A format spec after : can pad a number with zeros.", "// da las horas enteras y % lo que sobra. Un formato tras : puede rellenar un número con ceros.", "// で時、% で残り。: のあとの書式で数字を0で埋められる。"),
  note: "recap-numbers",
  explain: L(
    "// 3600 gives the hours, % 3600 // 60 the minutes, % 60 the seconds. {m:02} pads to 2 digits.",
    "// 3600 da las horas, % 3600 // 60 los minutos y % 60 los segundos. {m:02} rellena a 2 dígitos.",
    "// 3600 で時、% 3600 // 60 で分、% 60 で秒。{m:02} で2桁にそろう。",
  ),
};

/** Region boss mini project (Function Peaks): a closure with nonlocal state. */
export const makeCounterTask: CodeTaskBeat = {
  slug: "make-counter",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the wyvern's counters", "Mini proyecto: los contadores del guiverno", "ミニ課題：ワイバーンのカウンター"),
  brief: L(
    "Write make_counter(start=0, step=1). It returns a function; each call to that function returns the next number: start + step, then start + 2*step, and so on. Every counter keeps its own count: two counters never affect each other.",
    "Escribe make_counter(start=0, step=1). Devuelve una función; cada llamada a esa función devuelve el siguiente número: start + step, luego start + 2*step, etc. Cada contador lleva su propia cuenta: dos contadores nunca se afectan.",
    "make_counter(start=0, step=1) を書こう。関数を返し、その関数を呼ぶたびに次の数を返す：start + step、次に start + 2*step…。カウンターはそれぞれ自分の数を持ち、2つが影響しあうことはない。",
  ),
  starter: "def make_counter(start=0, step=1):\n    # your code here\n    pass\n",
  solution: "def make_counter(start=0, step=1):\n    current = start\n    def tick():\n        nonlocal current\n        current += step\n        return current\n    return tick\n",
  nearMiss: [
    // No nonlocal: `current += step` makes current local -> UnboundLocalError.
    "def make_counter(start=0, step=1):\n    current = start\n    def tick():\n        current += step\n        return current\n    return tick\n",
    // One shared module-level count for every counter.
    "count = [0]\n\ndef make_counter(start=0, step=1):\n    count[0] = start\n    def tick():\n        count[0] += step\n        return count[0]\n    return tick\n",
  ],
  tests: [
    { run: "c = make_counter()\nprint(c(), c(), c())", expect: "1 2 3" },
    { run: "c = make_counter(10, 5)\nprint(c(), c())", expect: "15 20" },
    { run: "a = make_counter()\nb = make_counter(100)\nprint(a(), b(), a(), b())", expect: "1 101 2 102", hidden: true },
    { run: "c = make_counter(step=-2)\nprint(c(), c())", expect: "-2 -4", hidden: true },
    { run: "c = make_counter(start=7, step=0)\nprint(c())", expect: "7", hidden: true },
  ],
  hint: L("Keep the count in the outer function. Which keyword lets the inner function change that outer name?", "Guarda la cuenta en la función externa. ¿Qué palabra deja a la interna cambiar ese nombre externo?", "数は外側の関数に置こう。内側から外側の名前を変えるのに必要なキーワードは？"),
  note: "closures",
  explain: L(
    "Each make_counter call makes a fresh current. nonlocal lets tick() update it; without it, += makes current local.",
    "Cada llamada a make_counter crea un current nuevo. nonlocal deja que tick() lo actualice; sin él, += lo vuelve local.",
    "make_counter を呼ぶたびに新しい current ができる。nonlocal で tick() から更新できる。なければ += で local 扱いになる。",
  ),
};

/** Region boss mini project (Object Tower): a small class with per-instance state and a property. */
export const ledgerTask: CodeTaskBeat = {
  slug: "ledger",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the lich's ledger", "Mini proyecto: el libro del liche", "ミニ課題：リッチの帳簿"),
  brief: L(
    "Write class Ledger. Ledger(owner) stores owner and starts with no entries. add(amount) records an amount; an amount of 0 raises ValueError. The read-only property total is the sum of the entries, and len(ledger) is how many entries it has. Each ledger has its own entries.",
    "Escribe la clase Ledger. Ledger(owner) guarda owner y empieza sin movimientos. add(amount) registra un monto; un monto de 0 lanza ValueError. La propiedad de solo lectura total es la suma de los movimientos y len(ledger) es cuántos tiene. Cada ledger tiene sus propios movimientos.",
    "Ledger クラスを書こう。Ledger(owner) は owner を持ち、記録0件で始まる。add(amount) は金額を記録し、0 なら ValueError。読み取り専用プロパティ total は合計、len(ledger) は記録の件数。帳簿ごとに記録は別々。",
  ),
  starter: "class Ledger:\n    def __init__(self, owner):\n        self.owner = owner\n\n    def add(self, amount):\n        pass\n",
  solution: "class Ledger:\n    def __init__(self, owner):\n        self.owner = owner\n        self.entries = []\n\n    def add(self, amount):\n        if amount == 0:\n            raise ValueError(\"empty entry\")\n        self.entries.append(amount)\n\n    @property\n    def total(self):\n        return sum(self.entries)\n\n    def __len__(self):\n        return len(self.entries)\n",
  nearMiss: [
    // Class attribute: every ledger shares one list.
    "class Ledger:\n    entries = []\n\n    def __init__(self, owner):\n        self.owner = owner\n\n    def add(self, amount):\n        if amount == 0:\n            raise ValueError(\"empty entry\")\n        self.entries.append(amount)\n\n    @property\n    def total(self):\n        return sum(self.entries)\n\n    def __len__(self):\n        return len(self.entries)\n",
    // Accepts 0 silently.
    "class Ledger:\n    def __init__(self, owner):\n        self.owner = owner\n        self.entries = []\n\n    def add(self, amount):\n        self.entries.append(amount)\n\n    @property\n    def total(self):\n        return sum(self.entries)\n\n    def __len__(self):\n        return len(self.entries)\n",
  ],
  tests: [
    { run: 'l = Ledger("ann")\nl.add(5)\nl.add(-2)\nprint(l.owner, l.total, len(l))', expect: "ann 3 2" },
    { run: 'print(Ledger("bo").total, len(Ledger("bo")))', expect: "0 0" },
    { run: 'a = Ledger("a")\nb = Ledger("b")\na.add(4)\nprint(len(a), len(b), b.total)', expect: "1 0 0", hidden: true },
    { run: 'l = Ledger("cy")\ntry:\n    l.add(0)\nexcept ValueError:\n    print("refused", len(l))', expect: "refused 0", hidden: true },
    { run: 'l = Ledger("di")\nl.add(1)\nl.add(2)\nl.add(3)\nprint(l.total)', expect: "6", hidden: true },
  ],
  hint: L("Where does the list go so each object gets its own? total is read like an attribute, not called.", "¿Dónde va la lista para que cada objeto tenga la suya? total se lee como atributo, no se llama.", "各オブジェクトが自分のリストを持つにはどこで作る？total は呼ばずに属性として読む。"),
  note: "class-attributes",
  explain: L(
    "Create the list in __init__ so it belongs to self. @property makes total readable without (), __len__ makes len() work.",
    "Crea la lista en __init__ para que sea de self. @property hace que total se lea sin () y __len__ hace funcionar len().",
    "リストは __init__ で作れば self のものになる。@property で total を () なしで読め、__len__ で len() が使える。",
  ),
};

// ─── Junior screening (ide) ────────────────────────────────────────────────

export const secondLargestTask: ExamQuestion = {
  slug: "second-largest",
  kind: "code",
  mode: "ide",
  topic: "collections_basics",
  difficulty: 1,
  prompt: L("Coding: the second largest number", "Código: el segundo número más grande", "コーディング：2番目に大きい数"),
  brief: L(
    "Write second_largest(nums): nums is a list of ints. Return the second largest DISTINCT value. If there isn't one (fewer than 2 different values, or an empty list), return None. Example: [4, 9, 9, 2] → 4.",
    "Escribe second_largest(nums): nums es una lista de ints. Devuelve el segundo valor DISTINTO más grande. Si no existe (menos de 2 valores diferentes, o lista vacía), devuelve None. Ejemplo: [4, 9, 9, 2] → 4.",
    "second_largest(nums) を書こう。nums は int のリスト。「異なる値」の中で2番目に大きいものを返す。なければ（異なる値が2つ未満や空リスト）None。例：[4, 9, 9, 2] → 4。",
  ),
  starter: "def second_largest(nums):\n    # your code here\n    return None\n",
  solution: "def second_largest(nums):\n    distinct = sorted(set(nums))\n    if len(distinct) < 2:\n        return None\n    return distinct[-2]\n",
  nearMiss: [
    // Ignores duplicates of the maximum.
    "def second_largest(nums):\n    if len(nums) < 2:\n        return None\n    return sorted(nums)[-2]\n",
    // Starts at 0, so all-negative lists go wrong.
    "def second_largest(nums):\n    first = second = 0\n    for n in nums:\n        if n > first:\n            first, second = n, first\n        elif first > n > second:\n            second = n\n    return second if second != 0 else None\n",
  ],
  tests: [
    { run: "print(second_largest([4, 9, 9, 2]))", expect: "4" },
    { run: "print(second_largest([7]))", expect: "None" },
    { run: "print(second_largest([]))", expect: "None", hidden: true },
    { run: "print(second_largest([5, 5, 5]))", expect: "None", hidden: true },
    { run: "print(second_largest([-3, -1, -7]))", expect: "-3", hidden: true },
  ],
  explain: L(
    "set() drops duplicates and sorted() orders them, so the second from the end is the answer. Check the length first.",
    "set() quita duplicados y sorted() los ordena, así que el penúltimo es la respuesta. Revisa el largo primero.",
    "set() で重複を消し sorted() で並べれば、後ろから2番目が答え。先に長さを確認しよう。",
  ),
};

export const isPalindromeTask: ExamQuestion = {
  slug: "is-palindrome",
  kind: "code",
  mode: "ide",
  topic: "numbers_strings",
  difficulty: 1,
  prompt: L("Coding: is it a palindrome?", "Código: ¿es un palíndromo?", "コーディング：回文かな？"),
  brief: L(
    "Write is_palindrome(text): return True if text reads the same backward, counting only letters and digits and ignoring case. Spaces and punctuation don't count. An empty string is a palindrome. Example: \"Never odd or even\" → True.",
    "Escribe is_palindrome(text): devuelve True si text se lee igual al revés, contando solo letras y dígitos e ignorando mayúsculas. Espacios y signos no cuentan. Un string vacío es palíndromo. Ejemplo: \"Never odd or even\" → True.",
    "is_palindrome(text) を書こう。英字と数字だけを見て、大文字・小文字を区別せずに逆から読んでも同じなら True。空白や記号は数えない。空文字列は回文。例：\"Never odd or even\" → True。",
  ),
  starter: "def is_palindrome(text):\n    # your code here\n    return False\n",
  solution: "def is_palindrome(text):\n    chars = [ch.lower() for ch in text if ch.isalnum()]\n    return chars == chars[::-1]\n",
  nearMiss: [
    // Keeps spaces and punctuation.
    "def is_palindrome(text):\n    t = text.lower()\n    return t == t[::-1]\n",
    // Case-sensitive.
    "def is_palindrome(text):\n    chars = [ch for ch in text if ch.isalnum()]\n    return chars == chars[::-1]\n",
  ],
  tests: [
    { run: 'print(is_palindrome("Never odd or even"))', expect: "True" },
    { run: 'print(is_palindrome("python"))', expect: "False" },
    { run: 'print(is_palindrome(""))', expect: "True", hidden: true },
    { run: 'print(is_palindrome("A man, a plan, a canal: Panama!"))', expect: "True", hidden: true },
    { run: 'print(is_palindrome("Abca"))', expect: "False", hidden: true },
    { run: 'print(is_palindrome("12 21"))', expect: "True", hidden: true },
  ],
  explain: L(
    "Keep only isalnum() characters, lower-cased, then compare with the reverse [::-1].",
    "Quédate solo con los caracteres isalnum() en minúsculas y compáralos con su reverso [::-1].",
    "isalnum() の文字だけを小文字で残し、逆順 [::-1] とくらべる。",
  ),
};

export const firstUniqueTask: ExamQuestion = {
  slug: "first-unique",
  kind: "code",
  mode: "ide",
  topic: "collections_basics",
  difficulty: 2,
  prompt: L("Coding: the first character that never repeats", "Código: el primer carácter que no se repite", "コーディング：くり返さない最初の文字"),
  brief: L(
    "Write first_unique(text): return the first character that appears exactly once in text. Upper and lower case are different characters. If every character repeats (or text is empty), return None. Example: \"swiss\" → \"w\".",
    "Escribe first_unique(text): devuelve el primer carácter que aparece exactamente una vez en text. Mayúsculas y minúsculas son caracteres distintos. Si todos se repiten (o text está vacío), devuelve None. Ejemplo: \"swiss\" → \"w\".",
    "first_unique(text) を書こう。text にちょうど1回だけ出る最初の文字を返す。大文字と小文字は別の文字。全部くり返す（または空）なら None。例：\"swiss\" → \"w\"。",
  ),
  starter: "def first_unique(text):\n    # your code here\n    return None\n",
  solution: "def first_unique(text):\n    counts = {}\n    for ch in text:\n        counts[ch] = counts.get(ch, 0) + 1\n    for ch in text:\n        if counts[ch] == 1:\n            return ch\n    return None\n",
  nearMiss: [
    // Only compares neighbours.
    "def first_unique(text):\n    for i, ch in enumerate(text):\n        if (i == 0 or text[i - 1] != ch) and (i == len(text) - 1 or text[i + 1] != ch):\n            return ch\n    return None\n",
    // Returns the last unique character instead of the first.
    "def first_unique(text):\n    found = None\n    for ch in text:\n        if text.count(ch) == 1:\n            found = ch\n    return found\n",
  ],
  tests: [
    { run: 'print(first_unique("swiss"))', expect: "w" },
    { run: 'print(first_unique("aabb"))', expect: "None" },
    { run: 'print(first_unique(""))', expect: "None", hidden: true },
    { run: 'print(first_unique("abcab"))', expect: "c", hidden: true },
    { run: 'print(first_unique("aAa"))', expect: "A", hidden: true },
    { run: 'print(first_unique("xyzzyq"))', expect: "x", hidden: true },
  ],
  explain: L(
    "Count every character in a dict first, then walk the text again in order and return the first one with count 1.",
    "Primero cuenta cada carácter en un dict y luego recorre el texto otra vez en orden y devuelve el primero con cuenta 1.",
    "まず dict で全文字を数え、もう一度順に見て個数1の最初の文字を返す。",
  ),
};

// ─── Mid screening (2 ide + 2 paper) ───────────────────────────────────────

export const groupAnagramsTask: ExamQuestion = {
  slug: "group-anagrams",
  kind: "code",
  mode: "ide",
  topic: "stdlib",
  difficulty: 2,
  prompt: L("Coding: group the anagrams", "Código: agrupa los anagramas", "コーディング：アナグラムをまとめる"),
  brief: L(
    "Write group_anagrams(words): return a list of groups (lists) of words that are anagrams of each other (same letters, same counts). Inside a group keep the input order; groups are ordered by their first word's position in the input. Example: [\"tea\", \"eat\", \"tan\", \"ate\", \"nat\"] → [[\"tea\", \"eat\", \"ate\"], [\"tan\", \"nat\"]].",
    "Escribe group_anagrams(words): devuelve una lista de grupos (listas) de palabras que son anagramas entre sí (mismas letras y cantidades). Dentro de un grupo mantén el orden de entrada; los grupos van según la posición de su primera palabra. Ejemplo: [\"tea\", \"eat\", \"tan\", \"ate\", \"nat\"] → [[\"tea\", \"eat\", \"ate\"], [\"tan\", \"nat\"]].",
    "group_anagrams(words) を書こう。アナグラム（同じ文字を同じ数だけ使う）どうしの単語をリストにまとめ、そのリストのリストを返す。グループ内は入力順、グループは最初の単語の入力位置の順。例：[\"tea\", \"eat\", \"tan\", \"ate\", \"nat\"] → [[\"tea\", \"eat\", \"ate\"], [\"tan\", \"nat\"]]。",
  ),
  starter: "def group_anagrams(words):\n    # your code here\n    return []\n",
  solution: "def group_anagrams(words):\n    groups = {}\n    for word in words:\n        groups.setdefault(\"\".join(sorted(word)), []).append(word)\n    return list(groups.values())\n",
  nearMiss: [
    // A set of letters ignores how many times each letter appears.
    "def group_anagrams(words):\n    groups = {}\n    for word in words:\n        groups.setdefault(frozenset(word), []).append(word)\n    return list(groups.values())\n",
    // Sorts the groups alphabetically instead of keeping first-seen order.
    "def group_anagrams(words):\n    groups = {}\n    for word in words:\n        groups.setdefault(\"\".join(sorted(word)), []).append(word)\n    return [groups[k] for k in sorted(groups)]\n",
  ],
  tests: [
    { run: 'print(group_anagrams(["tea", "eat", "tan", "ate", "nat"]))', expect: "[['tea', 'eat', 'ate'], ['tan', 'nat']]" },
    { run: "print(group_anagrams([]))", expect: "[]" },
    { run: 'print(group_anagrams(["ab", "aab", "ba", "abb"]))', expect: "[['ab', 'ba'], ['aab'], ['abb']]", hidden: true },
    { run: 'print(group_anagrams(["zoo", "b", "a", "ozo"]))', expect: "[['zoo', 'ozo'], ['b'], ['a']]", hidden: true },
    { run: 'print(group_anagrams(["x", "x"]))', expect: "[['x', 'x']]", hidden: true },
  ],
  explain: L(
    "Sorted letters are the same for every anagram, so use them as a dict key. Dicts keep insertion order, so groups stay first-seen.",
    "Las letras ordenadas son iguales en todo anagrama: úsalas como clave. Los dicts guardan el orden de inserción.",
    "ソートした文字はアナグラムどうしで同じなので dict のキーにする。dict は挿入順を保つ。",
  ),
};

export const lruCacheTask: ExamQuestion = {
  slug: "lru-cache",
  kind: "code",
  mode: "ide",
  topic: "classes",
  difficulty: 2,
  prompt: L("Coding: a tiny LRU cache", "Código: una caché LRU pequeña", "コーディング：小さな LRU キャッシュ"),
  brief: L(
    "Write class LRUCache. LRUCache(capacity) holds at most capacity keys. get(key) returns the value or -1 if missing; a hit makes that key the most recently used. put(key, value) adds or updates a key (it becomes the most recent); when that goes over capacity, drop the least recently used key.",
    "Escribe la clase LRUCache. LRUCache(capacity) guarda como mucho capacity claves. get(key) devuelve el valor o -1 si falta; un acierto vuelve esa clave la más reciente. put(key, value) agrega o actualiza una clave (pasa a ser la más reciente); si eso supera capacity, borra la usada hace más tiempo.",
    "LRUCache クラスを書こう。LRUCache(capacity) はキーを最大 capacity 個持つ。get(key) は値を、なければ -1 を返し、見つかったキーは「最近使った」ものになる。put(key, value) は追加か更新（最新になる）。容量を超えたら、いちばん長く使っていないキーを捨てる。",
  ),
  starter: "class LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n\n    def get(self, key):\n        return -1\n\n    def put(self, key, value):\n        pass\n",
  solution: "from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.data = OrderedDict()\n\n    def get(self, key):\n        if key not in self.data:\n            return -1\n        self.data.move_to_end(key)\n        return self.data[key]\n\n    def put(self, key, value):\n        self.data[key] = value\n        self.data.move_to_end(key)\n        if len(self.data) > self.capacity:\n            self.data.popitem(last=False)\n",
  nearMiss: [
    // get() doesn't refresh recency.
    "from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.data = OrderedDict()\n\n    def get(self, key):\n        return self.data.get(key, -1)\n\n    def put(self, key, value):\n        self.data[key] = value\n        self.data.move_to_end(key)\n        if len(self.data) > self.capacity:\n            self.data.popitem(last=False)\n",
    // Updating an existing key doesn't move it to the end.
    "class LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.data = {}\n\n    def get(self, key):\n        if key not in self.data:\n            return -1\n        value = self.data.pop(key)\n        self.data[key] = value\n        return value\n\n    def put(self, key, value):\n        self.data[key] = value\n        if len(self.data) > self.capacity:\n            del self.data[next(iter(self.data))]\n",
  ],
  tests: [
    { run: 'c = LRUCache(2)\nc.put("a", 1)\nc.put("b", 2)\nprint(c.get("a"), c.get("z"))', expect: "1 -1" },
    { run: 'c = LRUCache(2)\nc.put("a", 1)\nc.put("b", 2)\nc.put("c", 3)\nprint(c.get("a"), c.get("b"), c.get("c"))', expect: "-1 2 3" },
    { run: 'c = LRUCache(2)\nc.put("a", 1)\nc.put("b", 2)\nc.get("a")\nc.put("c", 3)\nprint(c.get("a"), c.get("b"), c.get("c"))', expect: "1 -1 3", hidden: true },
    { run: 'c = LRUCache(2)\nc.put("a", 1)\nc.put("b", 2)\nc.put("a", 10)\nc.put("c", 3)\nprint(c.get("a"), c.get("b"))', expect: "10 -1", hidden: true },
    { run: 'c = LRUCache(1)\nc.put("x", 1)\nc.put("y", 2)\nprint(c.get("x"), c.get("y"))', expect: "-1 2", hidden: true },
  ],
  explain: L(
    "OrderedDict keeps keys by recency: move_to_end on every get hit and put, popitem(last=False) drops the oldest.",
    "OrderedDict guarda las claves por uso: move_to_end en cada get acertado y put, popitem(last=False) quita la más vieja.",
    "OrderedDict で使った順を保つ。get の成功と put で move_to_end、popitem(last=False) で最古を捨てる。",
  ),
};

export const parseScoresTask: ExamQuestion = {
  slug: "parse-scores",
  kind: "code",
  mode: "paper",
  topic: "exceptions",
  difficulty: 2,
  prompt: L("Written test: parse a messy score list", "Prueba escrita: lee una lista de puntajes sucia", "筆記：乱れたスコア表を読む"),
  brief: L(
    "Write parse_scores(lines): each line should look like \"name: score\". Return a dict name → int score. Strip spaces around the name and the score. Skip any line that isn't valid (no colon, or a score that isn't an integer). If a name appears again, keep its HIGHEST score. Keys in order of first valid appearance.",
    "Escribe parse_scores(lines): cada línea debería ser \"name: score\". Devuelve un dict nombre → puntaje int. Quita los espacios alrededor del nombre y del puntaje. Salta las líneas inválidas (sin dos puntos, o puntaje que no es entero). Si un nombre se repite, guarda su puntaje MÁS ALTO. Claves en orden de primera aparición válida.",
    "parse_scores(lines) を書こう。各行は \"name: score\" の形のはず。名前 → int のスコアの dict を返す。名前とスコアの前後の空白は取る。不正な行（コロンがない、スコアが整数でない）は飛ばす。同じ名前がまた出たら「最高」スコアを残す。キーは最初に正しく出た順。",
  ),
  starter: "def parse_scores(lines):\n    # your code here\n    return {}\n",
  solution: "def parse_scores(lines):\n    scores = {}\n    for line in lines:\n        name, sep, raw = line.partition(\":\")\n        if not sep:\n            continue\n        try:\n            score = int(raw)\n        except ValueError:\n            continue\n        name = name.strip()\n        scores[name] = max(score, scores.get(name, score))\n    return scores\n",
  nearMiss: [
    // The last score wins instead of the highest.
    "def parse_scores(lines):\n    scores = {}\n    for line in lines:\n        name, sep, raw = line.partition(\":\")\n        if not sep:\n            continue\n        try:\n            scores[name.strip()] = int(raw)\n        except ValueError:\n            continue\n    return scores\n",
    // Name isn't stripped.
    "def parse_scores(lines):\n    scores = {}\n    for line in lines:\n        name, sep, raw = line.partition(\":\")\n        if not sep:\n            continue\n        try:\n            score = int(raw)\n        except ValueError:\n            continue\n        scores[name] = max(score, scores.get(name, score))\n    return scores\n",
  ],
  tests: [
    { run: 'print(parse_scores(["ann: 5", "bo: 7"]))', expect: "{'ann': 5, 'bo': 7}" },
    { run: 'print(parse_scores(["ann: 5", "oops", "bo: x"]))', expect: "{'ann': 5}" },
    { run: "print(parse_scores([]))", expect: "{}", hidden: true },
    { run: 'print(parse_scores(["ann: 9", "ann: 3", " bo :-2"]))', expect: "{'ann': 9, 'bo': -2}", hidden: true },
    { run: 'print(parse_scores(["cy: 1.5", "ed 4", "di:  12  "]))', expect: "{'di': 12}", hidden: true },
  ],
  explain: L(
    "partition(\":\") splits once and tells you if the colon was there; int() raises ValueError on bad scores, so catch it and skip.",
    "partition(\":\") corta una vez y dice si había dos puntos; int() lanza ValueError con puntajes malos: atrápalo y salta.",
    "partition(\":\") は1回だけ分け、コロンの有無もわかる。不正なスコアで int() は ValueError を出すので捕まえて飛ばす。",
  ),
};

// ─── Senior screening (1 ide + 3 paper) ────────────────────────────────────

export const retryTask: ExamQuestion = {
  slug: "retry",
  kind: "code",
  mode: "ide",
  topic: "decorators",
  difficulty: 3,
  prompt: L("Coding: a retry decorator", "Código: un decorador de reintentos", "コーディング：リトライ用デコレータ"),
  brief: L(
    "Write retry(times, exceptions=(Exception,)), a decorator factory. The decorated function is called up to times attempts in total: if it raises one of exceptions, try again; return the first successful result. If every attempt fails, re-raise the last exception. Other exceptions propagate at once. Keep the function's __name__.",
    "Escribe retry(times, exceptions=(Exception,)), una fábrica de decoradores. La función decorada se llama hasta times intentos en total: si lanza una de exceptions, reintenta; devuelve el primer resultado exitoso. Si todos fallan, relanza la última excepción. Otras excepciones se propagan de inmediato. Conserva el __name__ de la función.",
    "デコレータを作る関数 retry(times, exceptions=(Exception,)) を書こう。飾った関数は合計 times 回まで呼ばれる。exceptions のどれかが出たらやり直し、最初に成功した結果を返す。全部失敗したら最後の例外を投げ直す。それ以外の例外はすぐ外へ。関数の __name__ は保つこと。",
  ),
  starter: "import functools\n\ndef retry(times, exceptions=(Exception,)):\n    # your code here\n    pass\n",
  solution: "import functools\n\ndef retry(times, exceptions=(Exception,)):\n    def decorator(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            for attempt in range(times):\n                try:\n                    return fn(*args, **kwargs)\n                except exceptions:\n                    if attempt == times - 1:\n                        raise\n        return wrapper\n    return decorator\n",
  nearMiss: [
    // No functools.wraps: the name becomes "wrapper".
    "def retry(times, exceptions=(Exception,)):\n    def decorator(fn):\n        def wrapper(*args, **kwargs):\n            for attempt in range(times):\n                try:\n                    return fn(*args, **kwargs)\n                except exceptions:\n                    if attempt == times - 1:\n                        raise\n        return wrapper\n    return decorator\n",
    // Off by one: times retries after the first call (times + 1 attempts).
    "import functools\n\ndef retry(times, exceptions=(Exception,)):\n    def decorator(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            for attempt in range(times + 1):\n                try:\n                    return fn(*args, **kwargs)\n                except exceptions:\n                    if attempt == times:\n                        raise\n        return wrapper\n    return decorator\n",
  ],
  tests: [
    { run: "calls = []\n@retry(3)\ndef flaky():\n    calls.append(1)\n    if len(calls) < 3:\n        raise ValueError(\"not yet\")\n    return \"ok\"\nprint(flaky(), len(calls))", expect: "ok 3" },
    { run: "@retry(2)\ndef add(a, b=1):\n    return a + b\nprint(add(2, b=5), add.__name__)", expect: "7 add" },
    { run: "calls = []\n@retry(2)\ndef broken():\n    calls.append(1)\n    raise KeyError(\"k\")\ntry:\n    broken()\nexcept KeyError:\n    print(\"gave up after\", len(calls))", expect: "gave up after 2", hidden: true },
    { run: "calls = []\n@retry(5, exceptions=(ValueError,))\ndef wrong():\n    calls.append(1)\n    raise TypeError(\"no\")\ntry:\n    wrong()\nexcept TypeError:\n    print(\"stopped after\", len(calls))", expect: "stopped after 1", hidden: true },
    { run: "calls = []\n@retry(1)\ndef once():\n    calls.append(1)\n    raise ValueError(\"x\")\ntry:\n    once()\nexcept ValueError:\n    print(len(calls))", expect: "1", hidden: true },
  ],
  explain: L(
    "Three layers: retry(times) returns the decorator, which returns wrapper. except exceptions catches only those; a bare raise re-raises.",
    "Tres capas: retry(times) devuelve el decorador, que devuelve wrapper. except exceptions atrapa solo esas; un raise solo relanza.",
    "3層構造：retry(times) がデコレータを返し、それが wrapper を返す。except exceptions はそれだけを捕まえ、raise だけで投げ直す。",
  ),
};

export const chunkedTask: ExamQuestion = {
  slug: "chunked",
  kind: "code",
  mode: "paper",
  topic: "generators",
  difficulty: 3,
  prompt: L("Written test: a lazy chunker", "Prueba escrita: un divisor perezoso", "筆記：遅延チャンク分け"),
  brief: L(
    "Write a generator chunked(iterable, size) that yields lists of size items in order; the last list may be shorter. It must work with any iterable, including generators and iterators that can't be indexed or measured with len(). If size < 1, raise ValueError when the generator starts.",
    "Escribe un generador chunked(iterable, size) que produzca listas de size elementos en orden; la última puede ser más corta. Debe funcionar con cualquier iterable, incluidos generadores e iteradores que no se pueden indexar ni medir con len(). Si size < 1, lanza ValueError al arrancar el generador.",
    "ジェネレータ chunked(iterable, size) を書こう。size 個ずつのリストを順に yield し、最後は短くてもよい。添字も len() も使えないジェネレータやイテレータを含め、どんな iterable でも動くこと。size < 1 なら、ジェネレータが動き出したときに ValueError。",
  ),
  starter: "def chunked(iterable, size):\n    # your code here\n    yield []\n",
  solution: "def chunked(iterable, size):\n    if size < 1:\n        raise ValueError(\"size must be at least 1\")\n    chunk = []\n    for item in iterable:\n        chunk.append(item)\n        if len(chunk) == size:\n            yield chunk\n            chunk = []\n    if chunk:\n        yield chunk\n",
  nearMiss: [
    // Slicing needs len() and indexing: breaks on generators.
    "def chunked(iterable, size):\n    if size < 1:\n        raise ValueError(\"size must be at least 1\")\n    for i in range(0, len(iterable), size):\n        yield list(iterable[i:i + size])\n",
    // Drops the last, shorter chunk.
    "def chunked(iterable, size):\n    if size < 1:\n        raise ValueError(\"size must be at least 1\")\n    chunk = []\n    for item in iterable:\n        chunk.append(item)\n        if len(chunk) == size:\n            yield chunk\n            chunk = []\n",
  ],
  tests: [
    { run: "print(list(chunked([1, 2, 3, 4, 5], 2)))", expect: "[[1, 2], [3, 4], [5]]" },
    { run: "print(list(chunked([], 3)))", expect: "[]" },
    { run: "print(list(chunked((n * n for n in range(4)), 3)))", expect: "[[0, 1, 4], [9]]", hidden: true },
    { run: 'print(list(chunked("abcdef", 3)))', expect: "[['a', 'b', 'c'], ['d', 'e', 'f']]", hidden: true },
    { run: "try:\n    list(chunked([1], 0))\nexcept ValueError:\n    print(\"bad size\")", expect: "bad size", hidden: true },
  ],
  explain: L(
    "Fill a list while looping, yield it when it's full and start a new one; after the loop, yield whatever is left.",
    "Llena una lista mientras recorres, haz yield cuando esté llena y empieza otra; tras el bucle, haz yield de lo que quede.",
    "ループしながらリストを埋め、いっぱいになったら yield して作り直す。ループ後に残りを yield する。",
  ),
};

export const mergeIntervalsTask: ExamQuestion = {
  slug: "merge-intervals",
  kind: "code",
  mode: "paper",
  topic: "comprehensions",
  difficulty: 3,
  prompt: L("Written test: merge the booking intervals", "Prueba escrita: fusiona los intervalos de reservas", "筆記：予約の区間をまとめる"),
  brief: L(
    "Write merge_intervals(intervals): a list of (start, end) tuples with start ≤ end, in any order. Merge every overlapping or touching pair (end == next start counts) and return a list of tuples sorted by start. Don't modify the input list. Example: [(5, 7), (1, 3), (2, 4)] → [(1, 4), (5, 7)].",
    "Escribe merge_intervals(intervals): una lista de tuplas (start, end) con start ≤ end, en cualquier orden. Fusiona los pares que se solapan o se tocan (end == siguiente start cuenta) y devuelve una lista de tuplas ordenada por start. No modifiques la lista de entrada. Ejemplo: [(5, 7), (1, 3), (2, 4)] → [(1, 4), (5, 7)].",
    "merge_intervals(intervals) を書こう。start ≤ end の (start, end) タプルのリストで、順番はばらばら。重なる・接する（end == 次の start も含む）区間をまとめ、start 順のタプルのリストで返す。入力リストは変えないこと。例：[(5, 7), (1, 3), (2, 4)] → [(1, 4), (5, 7)]。",
  ),
  starter: "def merge_intervals(intervals):\n    # your code here\n    return []\n",
  solution: "def merge_intervals(intervals):\n    merged = []\n    for start, end in sorted(intervals):\n        if merged and start <= merged[-1][1]:\n            merged[-1] = (merged[-1][0], max(merged[-1][1], end))\n        else:\n            merged.append((start, end))\n    return merged\n",
  nearMiss: [
    // Touching intervals stay apart (< instead of <=).
    "def merge_intervals(intervals):\n    merged = []\n    for start, end in sorted(intervals):\n        if merged and start < merged[-1][1]:\n            merged[-1] = (merged[-1][0], max(merged[-1][1], end))\n        else:\n            merged.append((start, end))\n    return merged\n",
    // Takes the new end even when the old one reaches further.
    "def merge_intervals(intervals):\n    merged = []\n    for start, end in sorted(intervals):\n        if merged and start <= merged[-1][1]:\n            merged[-1] = (merged[-1][0], end)\n        else:\n            merged.append((start, end))\n    return merged\n",
    // Sorts the caller's list in place.
    "def merge_intervals(intervals):\n    intervals.sort()\n    merged = []\n    for start, end in intervals:\n        if merged and start <= merged[-1][1]:\n            merged[-1] = (merged[-1][0], max(merged[-1][1], end))\n        else:\n            merged.append((start, end))\n    return merged\n",
  ],
  tests: [
    { run: "print(merge_intervals([(5, 7), (1, 3), (2, 4)]))", expect: "[(1, 4), (5, 7)]" },
    { run: "print(merge_intervals([]))", expect: "[]" },
    { run: "print(merge_intervals([(1, 2), (2, 3)]))", expect: "[(1, 3)]", hidden: true },
    { run: "print(merge_intervals([(1, 10), (2, 3), (4, 5)]))", expect: "[(1, 10)]", hidden: true },
    { run: "data = [(3, 4), (1, 2)]\nmerge_intervals(data)\nprint(data)", expect: "[(3, 4), (1, 2)]", hidden: true },
    { run: "print(merge_intervals([(-5, -1), (0, 0), (-1, 0)]))", expect: "[(-5, 0)]", hidden: true },
  ],
  explain: L(
    "sorted() makes a sorted copy. Extend the last merged interval while the next start ≤ its end, taking the max of both ends.",
    "sorted() hace una copia ordenada. Extiende el último intervalo mientras el siguiente start ≤ su end, con el max de ambos ends.",
    "sorted() は並べたコピーを作る。次の start ≤ 直前の end の間は、両方の end の max で最後の区間を広げる。",
  ),
};
