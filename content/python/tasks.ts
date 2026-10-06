import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for planet Serpentia (Python). Any implementation that passes the tests is accepted;
// the validator proves the reference solution passes, the starter fails and each near miss fails.

/** Region boss mini project (Collection Forest): merge two inventories without touching them. */
export const mergeInventoryTask: CodeTaskBeat = {
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
