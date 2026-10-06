import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for planet Velocis (C++). The player's file holds its own #includes and the functions
// or classes, never main: the harness adds `#include <iostream>` and an `int main()` that runs each
// test (g++ 14, -std=c++20 -O1 on Compiler Explorer). Tests print with std::cout and never rely on
// unordered iteration, addresses or undefined behavior. Each test sits in its own { } block.

/** Code block written at column 0; drops the leading newline of the template literal. */
const src = (s: string) => s.replace(/^\n/, "");

// ─── Region bosses ──────────────────────────────────────────────────────────

/** Value Village boss (Pointer Golem): hand back a pointer into the caller's vector. */
export const findFirstTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: point at the first match", "Mini proyecto: apunta al primer hallazgo", "ミニ課題：最初の一致を指す"),
  brief: L(
    "Write int* findFirst(std::vector<int>& v, int target): return a pointer to the FIRST element equal to target, so the caller can change it through the pointer. If there is no such element (or v is empty), return nullptr. Never read past the end: the Golem is watching your bounds!",
    "Escribe int* findFirst(std::vector<int>& v, int target): devuelve un puntero al PRIMER elemento igual a target, para que quien llama pueda cambiarlo a través del puntero. Si no hay ninguno (o v está vacío), devuelve nullptr. Nunca leas fuera del final: ¡el Gólem vigila tus límites!",
    "int* findFirst(std::vector<int>& v, int target) を書こう。target と等しい「最初の」要素へのポインタを返し、呼び出し側がそれを通して値を変えられるようにする。見つからない（または v が空）なら nullptr。末尾の先は絶対に読まないこと。ゴーレムが範囲を見張っている！",
  ),
  starter: src(`
#include <vector>

int* findFirst(std::vector<int>& v, int target) {
    // your code here
    return nullptr;
}
`),
  solution: src(`
#include <vector>

int* findFirst(std::vector<int>& v, int target) {
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (v[i] == target) return &v[i];
    }
    return nullptr;
}
`),
  nearMiss: [
    // Keeps looking after a match: returns the LAST one.
    src(`
#include <vector>

int* findFirst(std::vector<int>& v, int target) {
    int* found = nullptr;
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (v[i] == target) found = &v[i];
    }
    return found;
}
`),
    // Off by one: never checks the last element.
    src(`
#include <vector>

int* findFirst(std::vector<int>& v, int target) {
    for (std::size_t i = 0; i + 1 < v.size(); ++i) {
        if (v[i] == target) return &v[i];
    }
    return nullptr;
}
`),
  ],
  tests: [
    { run: "{ std::vector<int> v{4, 7, 7}; int* p = findFirst(v, 7); if (p) *p = 0; for (int x : v) std::cout << x << ' '; std::cout << std::endl; }", expect: "4 0 7" },
    { run: "{ std::vector<int> v{1, 2}; std::cout << (findFirst(v, 9) == nullptr) << std::endl; }", expect: "1" },
    { run: "{ std::vector<int> v; std::cout << (findFirst(v, 1) == nullptr) << std::endl; }", expect: "1", hidden: true },
    { run: "{ std::vector<int> v{3, 8}; int* p = findFirst(v, 8); if (p) *p = 1; for (int x : v) std::cout << x << ' '; std::cout << std::endl; }", expect: "3 1", hidden: true },
    { run: "{ std::vector<int> v{5, 5}; int* p = findFirst(v, 5); if (p) *p = 0; for (int x : v) std::cout << x << ' '; std::cout << std::endl; }", expect: "0 5", hidden: true },
  ],
  hint: L(
    "Stop at the first match and hand back its address. What does a pointer hold when there is nothing to aim at?",
    "Detente en el primer hallazgo y devuelve su dirección. ¿Qué guarda un puntero cuando no hay a qué apuntar?",
    "最初の一致で止まり、その住所を返そう。指す物がないとき、ポインタは何を持つ？",
  ),
  note: "boss-safety",
  explain: L(
    "Loop over the valid indexes 0..size-1, return &v[i] on the first match, and nullptr after the loop.",
    "Recorre los índices válidos 0..size-1, devuelve &v[i] en el primer hallazgo y nullptr después del bucle.",
    "有効な番号 0..size-1 を回し、最初の一致で &v[i] を返す。ループの後は nullptr。",
  ),
};

/** Lifetime Forest boss (Lifetime Lich): an RAII class that logs its birth and death. */
export const lanternTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: lanterns that log their lives", "Mini proyecto: faroles que anotan su vida", "ミニ課題：一生を記録するランタン"),
  brief: L(
    "Write class Lantern with Lantern(const std::string& name, std::string& log) and a destructor. The constructor appends \"+\" and the name to the caller's log; the destructor appends \"-\" and the name. Example: two lanterns a then b in one scope leave \"+a+b-b-a\". It must also work on the heap and when an exception leaves the scope. You don't need to copy or move lanterns.",
    "Escribe la clase Lantern con Lantern(const std::string& name, std::string& log) y un destructor. El constructor agrega \"+\" y el nombre al log de quien llama; el destructor agrega \"-\" y el nombre. Ejemplo: dos faroles a y luego b en un ámbito dejan \"+a+b-b-a\". También debe funcionar en el heap y si una excepción sale del ámbito. No hace falta copiar ni mover faroles.",
    "クラス Lantern を書こう。Lantern(const std::string& name, std::string& log) とデストラクタを持つ。コンストラクタは呼び出し側の log に \"+\" と名前を、デストラクタは \"-\" と名前を足す。例：同じスコープで a、b の順に作ると \"+a+b-b-a\"。ヒープ上でも、例外でスコープを抜けても動くこと。コピーやムーブは不要。",
  ),
  starter: src(`
#include <string>

class Lantern {
public:
    Lantern(const std::string& name, std::string& log) {
        // your code here
    }
    ~Lantern() {
        // your code here
    }
};
`),
  solution: src(`
#include <string>

class Lantern {
public:
    Lantern(const std::string& name, std::string& log) : name_(name), log_(log) {
        log_ += "+" + name_;
    }
    ~Lantern() { log_ += "-" + name_; }
    Lantern(const Lantern&) = delete;
    Lantern& operator=(const Lantern&) = delete;

private:
    std::string name_;
    std::string& log_;
};
`),
  nearMiss: [
    // Keeps its own copy of the log: the caller's string never changes.
    src(`
#include <string>

class Lantern {
public:
    Lantern(const std::string& name, std::string& log) : name_(name), log_(log) {
        log_ += "+" + name_;
    }
    ~Lantern() { log_ += "-" + name_; }

private:
    std::string name_;
    std::string log_;
};
`),
    // Forgets the destructor: deaths are never logged.
    src(`
#include <string>

class Lantern {
public:
    Lantern(const std::string& name, std::string& log) {
        log += "+" + name;
    }
};
`),
  ],
  tests: [
    { run: '{ std::string log; { Lantern a("a", log); Lantern b("b", log); } std::cout << log << std::endl; }', expect: "+a+b-b-a" },
    { run: '{ std::string log; { Lantern a("a", log); { Lantern b("b", log); } Lantern c("c", log); } std::cout << log << std::endl; }', expect: "+a+b-b+c-c-a" },
    { run: '{ std::string log; Lantern* p = new Lantern("h", log); log += "|"; delete p; std::cout << log << std::endl; }', expect: "+h|-h", hidden: true },
    { run: '{ std::string log; try { Lantern a("x", log); throw 1; } catch (int) { log += "!"; } std::cout << log << std::endl; }', expect: "+x-x!", hidden: true },
    { run: "{ std::string log; for (int i = 0; i < 2; ++i) { Lantern l(std::to_string(i), log); } std::cout << log << std::endl; }", expect: "+0-0+1-1", hidden: true },
  ],
  hint: L(
    "The destructor needs to reach the caller's string later. What kind of member lets you keep that link?",
    "El destructor tiene que llegar más tarde al string de quien llama. ¿Qué tipo de miembro guarda ese enlace?",
    "デストラクタは後で呼び出し側の文字列に届く必要がある。そのつながりを持てるメンバの種類は？",
  ),
  note: "boss-lifetimes",
  explain: L(
    "Store the name and a std::string& to the log. Locals die in reverse order at }, also during unwinding, and delete runs the destructor.",
    "Guarda el nombre y un std::string& al log. Las locales mueren en orden inverso en }, también al desenrollar, y delete llama al destructor.",
    "名前と log への std::string& を持つ。ローカルは } で逆順に死ぬ（巻き戻し中も）。delete もデストラクタを呼ぶ。",
  ),
};

/** Polymorph Castle boss (Vtable Dragon): a small class hierarchy behind a base reference. */
export const shapesTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the dragon's shapes", "Mini proyecto: las figuras del dragón", "ミニ課題：ドラゴンの図形"),
  brief: L(
    "Shape is given. Finish Rect(w, h): area() is w * h and name() is \"rect\". Square(side) derives from Rect: its area is side * side and its name() is \"square\", also when called through a const Shape&. Then write totalArea(shapes): the sum of every area (0 for an empty vector).",
    "Shape ya está escrita. Completa Rect(w, h): area() es w * h y name() es \"rect\". Square(side) hereda de Rect: su área es side * side y su name() es \"square\", también al llamarla con un const Shape&. Luego escribe totalArea(shapes): la suma de todas las áreas (0 si el vector está vacío).",
    "Shape は用意済み。Rect(w, h) を完成させよう：area() は w * h、name() は \"rect\"。Square(side) は Rect を継承し、面積は side * side、name() は \"square\"（const Shape& 経由で呼んでも）。最後に totalArea(shapes) で全面積の合計を返す（空なら 0）。",
  ),
  starter: src(`
#include <memory>
#include <string>
#include <vector>

struct Shape {
    virtual ~Shape() = default;
    virtual int area() const = 0;
    virtual std::string name() const = 0;
};

class Rect : public Shape {
public:
    Rect(int w, int h) {
        // your code here
    }
    int area() const override { return 0; }
    std::string name() const override { return ""; }
};

class Square : public Rect {
public:
    explicit Square(int side) : Rect(side, side) {}
    // your code here
};

int totalArea(const std::vector<std::unique_ptr<Shape>>& shapes) {
    // your code here
    return 0;
}
`),
  solution: src(`
#include <memory>
#include <string>
#include <vector>

struct Shape {
    virtual ~Shape() = default;
    virtual int area() const = 0;
    virtual std::string name() const = 0;
};

class Rect : public Shape {
public:
    Rect(int w, int h) : w_(w), h_(h) {}
    int area() const override { return w_ * h_; }
    std::string name() const override { return "rect"; }

private:
    int w_;
    int h_;
};

class Square : public Rect {
public:
    explicit Square(int side) : Rect(side, side) {}
    std::string name() const override { return "square"; }
};

int totalArea(const std::vector<std::unique_ptr<Shape>>& shapes) {
    int total = 0;
    for (const auto& s : shapes) total += s->area();
    return total;
}
`),
  nearMiss: [
    // Square never overrides name(): it answers "rect".
    src(`
#include <memory>
#include <string>
#include <vector>

struct Shape {
    virtual ~Shape() = default;
    virtual int area() const = 0;
    virtual std::string name() const = 0;
};

class Rect : public Shape {
public:
    Rect(int w, int h) : w_(w), h_(h) {}
    int area() const override { return w_ * h_; }
    std::string name() const override { return "rect"; }

private:
    int w_;
    int h_;
};

class Square : public Rect {
public:
    explicit Square(int side) : Rect(side, side) {}
};

int totalArea(const std::vector<std::unique_ptr<Shape>>& shapes) {
    int total = 0;
    for (const auto& s : shapes) total += s->area();
    return total;
}
`),
    // Missing const (and no override): a new function that hides, so Shape& still calls Rect::name.
    src(`
#include <memory>
#include <string>
#include <vector>

struct Shape {
    virtual ~Shape() = default;
    virtual int area() const = 0;
    virtual std::string name() const = 0;
};

class Rect : public Shape {
public:
    Rect(int w, int h) : w_(w), h_(h) {}
    int area() const override { return w_ * h_; }
    std::string name() const override { return "rect"; }

private:
    int w_;
    int h_;
};

class Square : public Rect {
public:
    explicit Square(int side) : Rect(side, side) {}
    std::string name() { return "square"; }
};

int totalArea(const std::vector<std::unique_ptr<Shape>>& shapes) {
    int total = 0;
    for (const auto& s : shapes) total += s->area();
    return total;
}
`),
  ],
  tests: [
    { run: "{ std::vector<std::unique_ptr<Shape>> v; v.push_back(std::make_unique<Rect>(2, 3)); v.push_back(std::make_unique<Square>(4)); std::cout << totalArea(v) << std::endl; }", expect: "22" },
    { run: "{ Square s(3); const Shape& r = s; std::cout << r.name() << ' ' << r.area() << std::endl; }", expect: "square 9" },
    { run: "{ std::vector<std::unique_ptr<Shape>> v; std::cout << totalArea(v) << std::endl; }", expect: "0", hidden: true },
    { run: "{ Rect r(5, 1); const Shape& s = r; std::cout << s.name() << ' ' << s.area() << std::endl; }", expect: "rect 5", hidden: true },
    { run: "{ std::vector<std::unique_ptr<Shape>> v; v.push_back(std::make_unique<Square>(1)); v.push_back(std::make_unique<Square>(2)); v.push_back(std::make_unique<Rect>(0, 9)); std::cout << totalArea(v) << ' ' << v[1]->name() << std::endl; }", expect: "5 square", hidden: true },
  ],
  hint: L(
    "Through a Shape&, only a function with the exact same signature as the virtual one gets called. Check const.",
    "A través de un Shape&, solo se llama a una función con la misma firma exacta que la virtual. Revisa const.",
    "Shape& 経由で呼ばれるのは、仮想関数とまったく同じ形の関数だけ。const を確認しよう。",
  ),
  note: "recap-dispatch",
  explain: L(
    "Rect stores w and h; Square only overrides name() with the same const signature (add override). totalArea calls area() through each pointer.",
    "Rect guarda w y h; Square solo redefine name() con la misma firma const (agrega override). totalArea llama a area() por cada puntero.",
    "Rect は w と h を持つ。Square は同じ const の形で name() だけ上書き（override を付ける）。totalArea は各ポインタで area()。",
  ),
};

/** Template Tower boss (Undefined Overlord): erase without tripping over invalidated positions. */
export const eraseWhereTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: erase without invalidation", "Mini proyecto: borrar sin invalidar", "ミニ課題：無効化せずに消す"),
  brief: L(
    "Write the template eraseWhere(std::vector<T>& v, Pred pred): remove from v every element for which pred returns true, keep the others in their order, and return how many were removed. It must work for any T and any callable (the tests pass lambdas). Watch out: erasing shifts the elements after it.",
    "Escribe la plantilla eraseWhere(std::vector<T>& v, Pred pred): quita de v cada elemento para el que pred devuelve true, deja los demás en su orden y devuelve cuántos quitaste. Debe servir para cualquier T y cualquier invocable (las pruebas pasan lambdas). Cuidado: borrar corre los elementos que siguen.",
    "テンプレート eraseWhere(std::vector<T>& v, Pred pred) を書こう。pred が true を返す要素を v からすべて消し、残りは順番どおり残して、消した数を返す。どんな T とどんな呼び出し可能なものでも動くこと（テストはラムダを渡す）。注意：消すと後ろの要素がずれる。",
  ),
  starter: src(`
#include <algorithm>
#include <string>
#include <vector>

template <typename T, typename Pred>
std::size_t eraseWhere(std::vector<T>& v, Pred pred) {
    // your code here
    return 0;
}
`),
  solution: src(`
#include <algorithm>
#include <string>
#include <vector>

template <typename T, typename Pred>
std::size_t eraseWhere(std::vector<T>& v, Pred pred) {
    auto newEnd = std::remove_if(v.begin(), v.end(), pred);
    std::size_t removed = static_cast<std::size_t>(v.end() - newEnd);
    v.erase(newEnd, v.end());
    return removed;
}
`),
  nearMiss: [
    // Erases by index but always moves on: the element that slid into place is skipped.
    src(`
#include <algorithm>
#include <string>
#include <vector>

template <typename T, typename Pred>
std::size_t eraseWhere(std::vector<T>& v, Pred pred) {
    std::size_t removed = 0;
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (pred(v[i])) {
            v.erase(v.begin() + i);
            ++removed;
        }
    }
    return removed;
}
`),
    // remove_if alone never shrinks the vector: the tail is still there.
    src(`
#include <algorithm>
#include <string>
#include <vector>

template <typename T, typename Pred>
std::size_t eraseWhere(std::vector<T>& v, Pred pred) {
    auto newEnd = std::remove_if(v.begin(), v.end(), pred);
    return static_cast<std::size_t>(v.end() - newEnd);
}
`),
  ],
  tests: [
    { run: "{ std::vector<int> v{1, 2, 4, 5, 6}; std::size_t n = eraseWhere(v, [](int x) { return x % 2 == 0; }); std::cout << n << ':'; for (int x : v) std::cout << ' ' << x; std::cout << std::endl; }", expect: "3: 1 5" },
    { run: '{ std::vector<std::string> v{"ok", "", "go", ""}; std::size_t n = eraseWhere(v, [](const std::string& s) { return s.empty(); }); std::cout << n << \':\'; for (const auto& s : v) std::cout << \' \' << s; std::cout << std::endl; }', expect: "2: ok go" },
    { run: "{ std::vector<int> v{2, 4, 6, 7}; std::size_t n = eraseWhere(v, [](int x) { return x % 2 == 0; }); std::cout << n << ':'; for (int x : v) std::cout << ' ' << x; std::cout << std::endl; }", expect: "3: 7", hidden: true },
    { run: "{ std::vector<int> v{1, 3}; std::size_t n = eraseWhere(v, [](int x) { return x > 5; }); std::cout << n << ':'; for (int x : v) std::cout << ' ' << x; std::cout << std::endl; }", expect: "0: 1 3", hidden: true },
    { run: "{ std::vector<int> v{2, 2}; std::size_t n = eraseWhere(v, [](int x) { return x == 2; }); std::cout << n << ':' << v.size() << std::endl; }", expect: "2:0", hidden: true },
    { run: "{ std::vector<int> v; std::size_t n = eraseWhere(v, [](int x) { return x < 0; }); std::cout << n << ':' << v.size() << std::endl; }", expect: "0:0", hidden: true },
  ],
  hint: L(
    "After an erase, what sits at the position you just checked? Or let an STL algorithm do the shuffling first.",
    "Tras un erase, ¿qué hay en la posición que acabas de revisar? O deja que un algoritmo STL reacomode primero.",
    "erase の後、今見た位置には何がある？ または STL のアルゴリズムに先に並べ替えさせよう。",
  ),
  note: "iterator-invalidation",
  explain: L(
    "Erase-remove: remove_if packs the kept elements at the front and returns the new end; erase cuts the tail. C++20 std::erase_if does both.",
    "Erase-remove: remove_if junta al frente lo que se queda y devuelve el nuevo final; erase corta la cola. std::erase_if de C++20 hace ambos.",
    "erase-remove：remove_if が残す要素を前に詰めて新しい終端を返し、erase で後ろを切る。C++20 の std::erase_if は両方を行う。",
  ),
};

// ─── Junior screening ───────────────────────────────────────────────────────

export const reverseWordsTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "containers",
  difficulty: 1,
  prompt: L("Coding: reverse the words", "Código: invierte las palabras", "コーディング：単語を逆順に"),
  brief: L(
    "Write std::string reverseWords(const std::string& s): return the words of s in reverse order, joined by single spaces. Words are separated by one or more spaces, and s may start or end with spaces. The letters inside each word stay as they are. An empty or all-space s gives \"\".",
    "Escribe std::string reverseWords(const std::string& s): devuelve las palabras de s en orden inverso, unidas por un solo espacio. Las palabras se separan con uno o más espacios, y s puede empezar o terminar con espacios. Las letras de cada palabra no cambian. Un s vacío o solo con espacios da \"\".",
    "std::string reverseWords(const std::string& s) を書こう。s の単語を逆の順に並べ、空白1つでつないで返す。単語は1つ以上の空白で区切られ、先頭や末尾に空白があることも。単語の中の文字はそのまま。空、または空白だけなら \"\"。",
  ),
  starter: src(`
#include <string>

std::string reverseWords(const std::string& s) {
    // your code here
    return "";
}
`),
  solution: src(`
#include <sstream>
#include <string>
#include <vector>

std::string reverseWords(const std::string& s) {
    std::istringstream in(s);
    std::vector<std::string> words;
    std::string w;
    while (in >> w) words.push_back(w);
    std::string out;
    for (auto it = words.rbegin(); it != words.rend(); ++it) {
        if (!out.empty()) out += ' ';
        out += *it;
    }
    return out;
}
`),
  nearMiss: [
    // Reverses the characters, not the words.
    src(`
#include <string>

std::string reverseWords(const std::string& s) {
    return std::string(s.rbegin(), s.rend());
}
`),
    // Leaves a separator after the last word.
    src(`
#include <sstream>
#include <string>
#include <vector>

std::string reverseWords(const std::string& s) {
    std::istringstream in(s);
    std::vector<std::string> words;
    std::string w;
    while (in >> w) words.push_back(w);
    std::string out;
    for (auto it = words.rbegin(); it != words.rend(); ++it) out += *it + " ";
    return out;
}
`),
  ],
  tests: [
    { run: 'std::cout << "[" << reverseWords("hello world") << "]" << std::endl;', expect: "[world hello]" },
    { run: 'std::cout << "[" << reverseWords("") << "]" << std::endl;', expect: "[]" },
    { run: 'std::cout << "[" << reverseWords("  one   two  ") << "]" << std::endl;', expect: "[two one]", hidden: true },
    { run: 'std::cout << "[" << reverseWords("solo") << "]" << std::endl;', expect: "[solo]", hidden: true },
    { run: 'std::cout << "[" << reverseWords("a bc def") << "]" << std::endl;', expect: "[def bc a]", hidden: true },
  ],
  explain: L(
    "Read the words with an istringstream (>> skips any spaces), then join them from the last to the first with one space between.",
    "Lee las palabras con un istringstream (>> salta los espacios) y únelas de la última a la primera con un espacio entre ellas.",
    "istringstream で単語を読み（>> は空白を飛ばす）、最後から最初へ空白1つでつなぐ。",
  ),
};

export const clampAllTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "references",
  difficulty: 1,
  prompt: L("Coding: clamp every value", "Código: limita cada valor", "コーディング：全部の値を範囲に収める"),
  brief: L(
    "Write void clampAll(std::vector<int>& v, int lo, int hi): change v in place so every value below lo becomes lo and every value above hi becomes hi. Values already in [lo, hi] stay. lo <= hi always holds. Nothing is returned: the caller's vector must change.",
    "Escribe void clampAll(std::vector<int>& v, int lo, int hi): cambia v en su lugar para que cada valor menor que lo pase a lo y cada valor mayor que hi pase a hi. Los valores dentro de [lo, hi] quedan igual. Siempre se cumple lo <= hi. No devuelve nada: debe cambiar el vector de quien llama.",
    "void clampAll(std::vector<int>& v, int lo, int hi) を書こう。v をその場で変え、lo より小さい値は lo に、hi より大きい値は hi にする。[lo, hi] の中の値はそのまま。lo <= hi は常に成り立つ。戻り値はなく、呼び出し側の vector が変わること。",
  ),
  starter: src(`
#include <vector>

void clampAll(std::vector<int>& v, int lo, int hi) {
    // your code here
}
`),
  solution: src(`
#include <vector>

void clampAll(std::vector<int>& v, int lo, int hi) {
    for (int& x : v) {
        if (x < lo) x = lo;
        else if (x > hi) x = hi;
    }
}
`),
  nearMiss: [
    // The loop variable is a copy: the vector never changes.
    src(`
#include <vector>

void clampAll(std::vector<int>& v, int lo, int hi) {
    for (int x : v) {
        if (x < lo) x = lo;
        else if (x > hi) x = hi;
    }
}
`),
    // Only clamps the top.
    src(`
#include <vector>

void clampAll(std::vector<int>& v, int lo, int hi) {
    for (int& x : v) {
        if (x > hi) x = hi;
    }
}
`),
  ],
  tests: [
    { run: "{ std::vector<int> v{-5, 3, 12}; clampAll(v, 0, 10); for (int x : v) std::cout << x << ' '; std::cout << std::endl; }", expect: "0 3 10" },
    { run: "{ std::vector<int> v; clampAll(v, 0, 10); std::cout << v.size() << std::endl; }", expect: "0" },
    { run: "{ std::vector<int> v{1, 2, 3}; clampAll(v, 5, 9); for (int x : v) std::cout << x << ' '; std::cout << std::endl; }", expect: "5 5 5", hidden: true },
    { run: "{ std::vector<int> v{-20, -1}; clampAll(v, -10, -5); for (int x : v) std::cout << x << ' '; std::cout << std::endl; }", expect: "-10 -5", hidden: true },
    { run: "{ std::vector<int> v{7, 100}; clampAll(v, 7, 7); for (int x : v) std::cout << x << ' '; std::cout << std::endl; }", expect: "7 7", hidden: true },
  ],
  explain: L(
    "Loop with int& x so each change writes into the vector; with int x you only change a copy. Raise values below lo, lower values above hi.",
    "Recorre con int& x para que cada cambio se escriba en el vector; con int x solo cambias una copia. Sube lo menor que lo, baja lo mayor que hi.",
    "int& x で回せば変更が vector に書かれる。int x だとコピーを変えるだけ。lo 未満は上げ、hi 超えは下げる。",
  ),
};

export const palindromeTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "basics",
  difficulty: 1,
  prompt: L("Coding: is it a palindrome?", "Código: ¿es un palíndromo?", "コーディング：回文かな？"),
  brief: L(
    "Write bool isPalindrome(const std::string& s): true when s reads the same forwards and backwards, looking only at letters and digits and ignoring upper/lower case. Spaces and punctuation are skipped. The empty string is a palindrome. Input is plain ASCII.",
    "Escribe bool isPalindrome(const std::string& s): true si s se lee igual al derecho y al revés, mirando solo letras y dígitos y sin distinguir mayúsculas de minúsculas. Se saltan espacios y signos. El string vacío es palíndromo. La entrada es ASCII simple.",
    "bool isPalindrome(const std::string& s) を書こう。英字と数字だけを見て、大文字・小文字を区別せずに、前から読んでも後ろから読んでも同じなら true。空白や記号は飛ばす。空文字列は回文。入力は ASCII のみ。",
  ),
  starter: src(`
#include <string>

bool isPalindrome(const std::string& s) {
    // your code here
    return false;
}
`),
  solution: src(`
#include <cctype>
#include <string>

bool isPalindrome(const std::string& s) {
    std::string clean;
    for (unsigned char c : s) {
        if (std::isalnum(c)) clean += static_cast<char>(std::tolower(c));
    }
    std::size_t n = clean.size();
    for (std::size_t i = 0; i < n / 2; ++i) {
        if (clean[i] != clean[n - 1 - i]) return false;
    }
    return true;
}
`),
  nearMiss: [
    // Case-sensitive: "Racecar" fails.
    src(`
#include <cctype>
#include <string>

bool isPalindrome(const std::string& s) {
    std::string clean;
    for (unsigned char c : s) {
        if (std::isalnum(c)) clean += static_cast<char>(c);
    }
    return clean == std::string(clean.rbegin(), clean.rend());
}
`),
    // Keeps spaces and punctuation.
    src(`
#include <cctype>
#include <string>

bool isPalindrome(const std::string& s) {
    std::string clean;
    for (unsigned char c : s) clean += static_cast<char>(std::tolower(c));
    return clean == std::string(clean.rbegin(), clean.rend());
}
`),
  ],
  tests: [
    { run: 'std::cout << (isPalindrome("Racecar") ? "yes" : "no") << std::endl;', expect: "yes" },
    { run: 'std::cout << (isPalindrome("hello") ? "yes" : "no") << std::endl;', expect: "no" },
    { run: 'std::cout << (isPalindrome("A man, a plan, a canal: Panama") ? "yes" : "no") << std::endl;', expect: "yes", hidden: true },
    { run: 'std::cout << (isPalindrome("") ? "yes" : "no") << std::endl;', expect: "yes", hidden: true },
    { run: 'std::cout << (isPalindrome("ab") ? "yes" : "no") << std::endl;', expect: "no", hidden: true },
    { run: 'std::cout << (isPalindrome("No lemon, no melon") ? "yes" : "no") << std::endl;', expect: "yes", hidden: true },
  ],
  explain: L(
    "Keep only the characters where std::isalnum is true, lower-cased with std::tolower, then compare the string with its reverse.",
    "Quédate solo con los caracteres donde std::isalnum es true, en minúscula con std::tolower, y compara el string con su reverso.",
    "std::isalnum が true の文字だけを std::tolower で小文字にして残し、逆順と比べる。",
  ),
};

export const accountTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "classes",
  difficulty: 1,
  prompt: L("Coding: a bank account class", "Código: una clase de cuenta bancaria", "コーディング：口座クラス"),
  brief: L(
    "Finish class Account. Account(start) sets the balance. deposit(amount) adds amount only if it is positive. withdraw(amount) takes the money and returns true only if amount is positive and not more than the balance; otherwise it changes nothing and returns false. balance() returns the current balance and is const.",
    "Completa la clase Account. Account(start) fija el saldo. deposit(amount) suma amount solo si es positivo. withdraw(amount) saca el dinero y devuelve true solo si amount es positivo y no supera el saldo; si no, no cambia nada y devuelve false. balance() devuelve el saldo actual y es const.",
    "クラス Account を完成させよう。Account(start) は残高を設定。deposit(amount) は正のときだけ足す。withdraw(amount) は amount が正で残高以下のときだけ引いて true、それ以外は何も変えず false。balance() は今の残高を返す const 関数。",
  ),
  starter: src(`
class Account {
public:
    explicit Account(int start) {
        // your code here
    }
    void deposit(int amount) {
        // your code here
    }
    bool withdraw(int amount) {
        // your code here
        return false;
    }
    int balance() const {
        // your code here
        return 0;
    }
};
`),
  solution: src(`
class Account {
public:
    explicit Account(int start) : balance_(start) {}
    void deposit(int amount) {
        if (amount > 0) balance_ += amount;
    }
    bool withdraw(int amount) {
        if (amount <= 0 || amount > balance_) return false;
        balance_ -= amount;
        return true;
    }
    int balance() const { return balance_; }

private:
    int balance_;
};
`),
  nearMiss: [
    // Off by one: refuses to withdraw the exact balance.
    src(`
class Account {
public:
    explicit Account(int start) : balance_(start) {}
    void deposit(int amount) {
        if (amount > 0) balance_ += amount;
    }
    bool withdraw(int amount) {
        if (amount <= 0 || amount >= balance_) return false;
        balance_ -= amount;
        return true;
    }
    int balance() const { return balance_; }

private:
    int balance_;
};
`),
    // Accepts negative deposits.
    src(`
class Account {
public:
    explicit Account(int start) : balance_(start) {}
    void deposit(int amount) { balance_ += amount; }
    bool withdraw(int amount) {
        if (amount <= 0 || amount > balance_) return false;
        balance_ -= amount;
        return true;
    }
    int balance() const { return balance_; }

private:
    int balance_;
};
`),
  ],
  tests: [
    { run: "{ Account a(10); a.deposit(5); std::cout << a.balance() << std::endl; }", expect: "15" },
    { run: '{ Account a(10); std::cout << a.withdraw(4) << a.withdraw(7) << " " << a.balance() << std::endl; }', expect: "10 6" },
    { run: '{ Account a(8); std::cout << a.withdraw(8) << " " << a.balance() << std::endl; }', expect: "1 0", hidden: true },
    { run: '{ Account a(3); a.deposit(-5); std::cout << a.withdraw(-2) << " " << a.balance() << std::endl; }', expect: "0 3", hidden: true },
    { run: '{ Account a(0); std::cout << a.withdraw(1) << " " << a.balance() << std::endl; }', expect: "0 0", hidden: true },
  ],
  explain: L(
    "Keep a private int balance_ set in the init list. Guard each change: deposit needs amount > 0; withdraw needs 0 < amount <= balance_.",
    "Guarda un int balance_ privado fijado en la lista de init. Protege cada cambio: deposit pide amount > 0; withdraw pide 0 < amount <= balance_.",
    "private の int balance_ を初期化リストで設定。deposit は amount > 0、withdraw は 0 < amount <= balance_ のときだけ変える。",
  ),
};

// ─── Mid screening ──────────────────────────────────────────────────────────

export const countWordsTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "lambdas_stl",
  difficulty: 2,
  prompt: L("Coding: count the words", "Código: cuenta las palabras", "コーディング：単語を数える"),
  brief: L(
    "Write std::map<std::string, int> countWords(const std::string& text): how many times each word appears. Words are separated by one or more spaces and are compared lower-cased, so \"Go\" and \"go\" are the same word (store it lower-cased). An empty text gives an empty map. Input is plain ASCII.",
    "Escribe std::map<std::string, int> countWords(const std::string& text): cuántas veces aparece cada palabra. Las palabras se separan con uno o más espacios y se comparan en minúsculas, así que \"Go\" y \"go\" son la misma (guárdala en minúsculas). Un texto vacío da un map vacío. La entrada es ASCII simple.",
    "std::map<std::string, int> countWords(const std::string& text) を書こう。各単語の出現回数を返す。単語は1つ以上の空白で区切られ、小文字で比べるので \"Go\" と \"go\" は同じ単語（小文字で保存）。空のテキストなら空の map。入力は ASCII のみ。",
  ),
  starter: src(`
#include <map>
#include <string>

std::map<std::string, int> countWords(const std::string& text) {
    // your code here
    return {};
}
`),
  solution: src(`
#include <cctype>
#include <map>
#include <sstream>
#include <string>

std::map<std::string, int> countWords(const std::string& text) {
    std::map<std::string, int> counts;
    std::istringstream in(text);
    std::string w;
    while (in >> w) {
        for (char& c : w) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
        ++counts[w];
    }
    return counts;
}
`),
  nearMiss: [
    // Forgets to lower-case.
    src(`
#include <map>
#include <sstream>
#include <string>

std::map<std::string, int> countWords(const std::string& text) {
    std::map<std::string, int> counts;
    std::istringstream in(text);
    std::string w;
    while (in >> w) ++counts[w];
    return counts;
}
`),
    // Splits on each single space: two spaces in a row count an empty word.
    src(`
#include <cctype>
#include <map>
#include <string>

std::map<std::string, int> countWords(const std::string& text) {
    std::map<std::string, int> counts;
    std::string w;
    for (char c : text) {
        if (c == ' ') {
            ++counts[w];
            w.clear();
        } else {
            w += static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
        }
    }
    if (!w.empty()) ++counts[w];
    return counts;
}
`),
  ],
  tests: [
    { run: '{ for (const auto& [w, n] : countWords("b a b")) std::cout << w << \'=\' << n << \' \'; std::cout << std::endl; }', expect: "a=1 b=2" },
    { run: '{ std::cout << countWords("").size() << std::endl; }', expect: "0" },
    { run: '{ for (const auto& [w, n] : countWords("Go go GO stop")) std::cout << w << \'=\' << n << \' \'; std::cout << std::endl; }', expect: "go=3 stop=1", hidden: true },
    { run: '{ for (const auto& [w, n] : countWords("x  y")) std::cout << w << \'=\' << n << \' \'; std::cout << std::endl; }', expect: "x=1 y=1", hidden: true },
    { run: '{ for (const auto& [w, n] : countWords("the cat the hat")) std::cout << w << \'=\' << n << \' \'; std::cout << std::endl; }', expect: "cat=1 hat=1 the=2", hidden: true },
  ],
  explain: L(
    "Read words with >> (it skips any run of spaces), lower-case each char with std::tolower, and ++counts[word]: std::map keeps keys sorted.",
    "Lee palabras con >> (salta cualquier cantidad de espacios), pasa cada char a minúscula con std::tolower y haz ++counts[word]: std::map ordena las claves.",
    ">> で単語を読み（空白の連続は飛ばす）、std::tolower で小文字にして ++counts[word]。std::map はキーを並べて保つ。",
  ),
};

export const scopedCounterTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "raii",
  difficulty: 2,
  prompt: L("Coding: an RAII counter", "Código: un contador RAII", "コーディング：RAII カウンタ"),
  brief: L(
    "Write class ScopedCounter. ScopedCounter(int& count) adds 1 to the caller's count; when the object is destroyed, it subtracts 1 again. So count always says how many ScopedCounter objects are alive. It must hold for scopes, loops, new/delete and exceptions. Copying isn't needed (you may delete it).",
    "Escribe la clase ScopedCounter. ScopedCounter(int& count) suma 1 al count de quien llama; cuando el objeto se destruye, vuelve a restar 1. Así count siempre dice cuántos ScopedCounter están vivos. Debe cumplirse con ámbitos, bucles, new/delete y excepciones. No hace falta copiar (puedes eliminar la copia).",
    "クラス ScopedCounter を書こう。ScopedCounter(int& count) は呼び出し側の count に 1 足し、オブジェクトが壊れるときに 1 引く。つまり count は生きている ScopedCounter の数を表す。スコープ、ループ、new/delete、例外でも成り立つこと。コピーは不要（削除してよい）。",
  ),
  starter: src(`
class ScopedCounter {
public:
    explicit ScopedCounter(int& count) {
        // your code here
    }
    ~ScopedCounter() {
        // your code here
    }
};
`),
  solution: src(`
class ScopedCounter {
public:
    explicit ScopedCounter(int& count) : count_(count) { ++count_; }
    ~ScopedCounter() { --count_; }
    ScopedCounter(const ScopedCounter&) = delete;
    ScopedCounter& operator=(const ScopedCounter&) = delete;

private:
    int& count_;
};
`),
  nearMiss: [
    // Never undoes its +1.
    src(`
class ScopedCounter {
public:
    explicit ScopedCounter(int& count) { ++count; }
};
`),
    // Keeps a copy of the count: the caller's int never moves.
    src(`
class ScopedCounter {
public:
    explicit ScopedCounter(int& count) : count_(count) { ++count_; }
    ~ScopedCounter() { --count_; }

private:
    int count_;
};
`),
  ],
  tests: [
    { run: "{ int n = 0; { ScopedCounter a(n); ScopedCounter b(n); std::cout << n << ' '; } std::cout << n << std::endl; }", expect: "2 0" },
    { run: "{ int n = 5; { ScopedCounter a(n); std::cout << n << ' '; } std::cout << n << std::endl; }", expect: "6 5" },
    { run: "{ int n = 0; try { ScopedCounter a(n); throw 1; } catch (int) {} std::cout << n << std::endl; }", expect: "0", hidden: true },
    { run: "{ int n = 0; ScopedCounter* p = new ScopedCounter(n); std::cout << n << ' '; delete p; std::cout << n << std::endl; }", expect: "1 0", hidden: true },
    { run: "{ int n = 0; for (int i = 0; i < 3; ++i) { ScopedCounter c(n); std::cout << n; } std::cout << ' ' << n << std::endl; }", expect: "111 0", hidden: true },
  ],
  explain: L(
    "Store an int& member: the constructor does ++, the destructor --. Destructors run at }, during exception unwinding and on delete.",
    "Guarda un miembro int&: el constructor hace ++ y el destructor --. Los destructores corren en }, al desenrollar una excepción y con delete.",
    "int& メンバを持ち、コンストラクタで ++、デストラクタで --。デストラクタは }、例外の巻き戻し、delete で動く。",
  ),
};

export const sortByLengthTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "lambdas_stl",
  difficulty: 2,
  prompt: L("Written test: sort by length", "Prueba escrita: ordena por largo", "筆記：長さで並べる"),
  brief: L(
    "Write void sortByLength(std::vector<std::string>& words): sort words in place, shortest first. Words of the same length go in alphabetical order. The vector may be empty.",
    "Escribe void sortByLength(std::vector<std::string>& words): ordena words en su lugar, de la más corta a la más larga. Las palabras del mismo largo van en orden alfabético. El vector puede estar vacío.",
    "void sortByLength(std::vector<std::string>& words) を書こう。words をその場で短い順に並べる。同じ長さならアルファベット順。vector は空のこともある。",
  ),
  starter: src(`
#include <string>
#include <vector>

void sortByLength(std::vector<std::string>& words) {
    // your code here
}
`),
  solution: src(`
#include <algorithm>
#include <string>
#include <vector>

void sortByLength(std::vector<std::string>& words) {
    std::sort(words.begin(), words.end(), [](const std::string& a, const std::string& b) {
        if (a.size() != b.size()) return a.size() < b.size();
        return a < b;
    });
}
`),
  nearMiss: [
    // Length only: ties keep their input order.
    src(`
#include <algorithm>
#include <string>
#include <vector>

void sortByLength(std::vector<std::string>& words) {
    std::stable_sort(words.begin(), words.end(), [](const std::string& a, const std::string& b) {
        return a.size() < b.size();
    });
}
`),
    // Alphabetical only.
    src(`
#include <algorithm>
#include <string>
#include <vector>

void sortByLength(std::vector<std::string>& words) {
    std::sort(words.begin(), words.end());
}
`),
  ],
  tests: [
    { run: '{ std::vector<std::string> w{"pear", "fig", "apple", "kiwi"}; sortByLength(w); for (const auto& s : w) std::cout << s << \' \'; std::cout << std::endl; }', expect: "fig kiwi pear apple" },
    { run: "{ std::vector<std::string> w; sortByLength(w); std::cout << w.size() << std::endl; }", expect: "0" },
    { run: '{ std::vector<std::string> w{"bb", "a", "ab", "b"}; sortByLength(w); for (const auto& s : w) std::cout << s << \' \'; std::cout << std::endl; }', expect: "a b ab bb", hidden: true },
    { run: '{ std::vector<std::string> w{"same", "sale", "safe"}; sortByLength(w); for (const auto& s : w) std::cout << s << \' \'; std::cout << std::endl; }', expect: "safe sale same", hidden: true },
    { run: '{ std::vector<std::string> w{"z", "yy", "x"}; sortByLength(w); for (const auto& s : w) std::cout << s << \' \'; std::cout << std::endl; }', expect: "x z yy", hidden: true },
  ],
  explain: L(
    "std::sort with a lambda comparing size first and, when sizes are equal, the strings themselves (a < b) to break the tie.",
    "std::sort con una lambda que compara primero el tamaño y, si es igual, los strings mismos (a < b) para desempatar.",
    "std::sort にラムダを渡し、まず size を比べ、同じなら文字列そのもの（a < b）で決める。",
  ),
};

export const linkedListTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "smart_pointers",
  difficulty: 2,
  prompt: L("Written test: a unique_ptr list", "Prueba escrita: una lista con unique_ptr", "筆記：unique_ptr のリスト"),
  brief: L(
    "Node is given: { int value; std::unique_ptr<Node> next; }. Write pushFront(head, value): put a new node with value at the front, keeping the rest of the list behind it. Write int sum(const Node* head): the sum of all values (0 for an empty list, head == nullptr). No raw new or delete.",
    "Node ya está dado: { int value; std::unique_ptr<Node> next; }. Escribe pushFront(head, value): pone un nodo nuevo con value al frente y deja el resto de la lista detrás. Escribe int sum(const Node* head): la suma de todos los valores (0 si la lista está vacía, head == nullptr). Sin new ni delete a mano.",
    "Node は用意済み：{ int value; std::unique_ptr<Node> next; }。pushFront(head, value) を書こう：value を持つ新しいノードを先頭に置き、残りのリストをその後ろにつなぐ。int sum(const Node* head) は全値の合計（空のリスト head == nullptr なら 0）。new/delete を直接使わないこと。",
  ),
  starter: src(`
#include <memory>

struct Node {
    int value;
    std::unique_ptr<Node> next;
};

void pushFront(std::unique_ptr<Node>& head, int value) {
    // your code here
}

int sum(const Node* head) {
    // your code here
    return 0;
}
`),
  solution: src(`
#include <memory>

struct Node {
    int value;
    std::unique_ptr<Node> next;
};

void pushFront(std::unique_ptr<Node>& head, int value) {
    auto node = std::make_unique<Node>();
    node->value = value;
    node->next = std::move(head);
    head = std::move(node);
}

int sum(const Node* head) {
    int total = 0;
    for (const Node* p = head; p != nullptr; p = p->next.get()) total += p->value;
    return total;
}
`),
  nearMiss: [
    // Replaces the head instead of linking it: only the newest node survives.
    src(`
#include <memory>

struct Node {
    int value;
    std::unique_ptr<Node> next;
};

void pushFront(std::unique_ptr<Node>& head, int value) {
    head = std::make_unique<Node>();
    head->value = value;
}

int sum(const Node* head) {
    int total = 0;
    for (const Node* p = head; p != nullptr; p = p->next.get()) total += p->value;
    return total;
}
`),
    // Stops one node early: the last value is never added.
    src(`
#include <memory>

struct Node {
    int value;
    std::unique_ptr<Node> next;
};

void pushFront(std::unique_ptr<Node>& head, int value) {
    auto node = std::make_unique<Node>();
    node->value = value;
    node->next = std::move(head);
    head = std::move(node);
}

int sum(const Node* head) {
    int total = 0;
    const Node* p = head;
    while (p != nullptr && p->next != nullptr) {
        total += p->value;
        p = p->next.get();
    }
    return total;
}
`),
  ],
  tests: [
    { run: "{ std::unique_ptr<Node> head; pushFront(head, 1); pushFront(head, 2); pushFront(head, 3); std::cout << (head ? head->value : -1) << ' ' << sum(head.get()) << std::endl; }", expect: "3 6" },
    { run: "{ std::unique_ptr<Node> head; std::cout << sum(head.get()) << std::endl; }", expect: "0" },
    { run: "{ std::unique_ptr<Node> head; pushFront(head, 5); std::cout << sum(head.get()) << ' ' << (head && !head->next) << std::endl; }", expect: "5 1", hidden: true },
    { run: "{ std::unique_ptr<Node> head; pushFront(head, -2); pushFront(head, 7); pushFront(head, 4); for (const Node* p = head.get(); p; p = p->next.get()) std::cout << p->value << ' '; std::cout << std::endl; }", expect: "4 7 -2", hidden: true },
    { run: "{ std::unique_ptr<Node> head; pushFront(head, -2); pushFront(head, 7); pushFront(head, 4); std::cout << sum(head.get()) << std::endl; }", expect: "9", hidden: true },
  ],
  explain: L(
    "Make the node, move the old head into node->next, then move the node into head. sum walks with a raw const Node* via next.get() until nullptr.",
    "Crea el nodo, mueve la cabeza vieja a node->next y luego mueve el nodo a head. sum avanza con un const Node* vía next.get() hasta nullptr.",
    "ノードを作り、古い head を node->next にムーブ、ノードを head にムーブ。sum は const Node* で next.get() を nullptr までたどる。",
  ),
};

// ─── Senior screening ───────────────────────────────────────────────────────

export const lruCacheTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "modern",
  difficulty: 3,
  prompt: L("Coding: an LRU cache", "Código: una caché LRU", "コーディング：LRU キャッシュ"),
  brief: L(
    "Write class LruCache(capacity), capacity >= 1. get(key) returns std::optional<int>: the value, or std::nullopt if missing; a hit makes the key the most recently used. put(key, value) inserts or updates the key and makes it the most recently used; when a new key doesn't fit, first evict the least recently used one. Aim for O(1) per call.",
    "Escribe la clase LruCache(capacity), capacity >= 1. get(key) devuelve std::optional<int>: el valor, o std::nullopt si falta; un acierto vuelve la clave la más reciente. put(key, value) inserta o actualiza la clave y la vuelve la más reciente; si una clave nueva no cabe, primero expulsa la usada hace más tiempo. Apunta a O(1) por llamada.",
    "クラス LruCache(capacity)（capacity >= 1）を書こう。get(key) は std::optional<int> を返す：値、なければ std::nullopt。ヒットしたキーは最近使ったものになる。put(key, value) はキーを追加か更新して最近使ったものにする。新しいキーが入らないときは、最も長く使われていないキーを先に追い出す。1回 O(1) を目指そう。",
  ),
  starter: src(`
#include <cstddef>
#include <optional>

class LruCache {
public:
    explicit LruCache(std::size_t capacity) {
        // your code here
    }
    std::optional<int> get(int key) {
        // your code here
        return std::nullopt;
    }
    void put(int key, int value) {
        // your code here
    }
};
`),
  solution: src(`
#include <cstddef>
#include <list>
#include <optional>
#include <unordered_map>
#include <utility>

class LruCache {
public:
    explicit LruCache(std::size_t capacity) : capacity_(capacity) {}

    std::optional<int> get(int key) {
        auto it = index_.find(key);
        if (it == index_.end()) return std::nullopt;
        order_.splice(order_.begin(), order_, it->second);
        return it->second->second;
    }

    void put(int key, int value) {
        if (auto it = index_.find(key); it != index_.end()) {
            it->second->second = value;
            order_.splice(order_.begin(), order_, it->second);
            return;
        }
        if (order_.size() == capacity_) {
            index_.erase(order_.back().first);
            order_.pop_back();
        }
        order_.emplace_front(key, value);
        index_[key] = order_.begin();
    }

private:
    std::size_t capacity_;
    std::list<std::pair<int, int>> order_;
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> index_;
};
`),
  nearMiss: [
    // get() never refreshes the key.
    src(`
#include <cstddef>
#include <list>
#include <optional>
#include <unordered_map>
#include <utility>

class LruCache {
public:
    explicit LruCache(std::size_t capacity) : capacity_(capacity) {}

    std::optional<int> get(int key) {
        auto it = index_.find(key);
        if (it == index_.end()) return std::nullopt;
        return it->second->second;
    }

    void put(int key, int value) {
        if (auto it = index_.find(key); it != index_.end()) {
            it->second->second = value;
            order_.splice(order_.begin(), order_, it->second);
            return;
        }
        if (order_.size() == capacity_) {
            index_.erase(order_.back().first);
            order_.pop_back();
        }
        order_.emplace_front(key, value);
        index_[key] = order_.begin();
    }

private:
    std::size_t capacity_;
    std::list<std::pair<int, int>> order_;
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> index_;
};
`),
    // Updating an existing key keeps its old place in the order.
    src(`
#include <cstddef>
#include <list>
#include <optional>
#include <unordered_map>
#include <utility>

class LruCache {
public:
    explicit LruCache(std::size_t capacity) : capacity_(capacity) {}

    std::optional<int> get(int key) {
        auto it = index_.find(key);
        if (it == index_.end()) return std::nullopt;
        order_.splice(order_.begin(), order_, it->second);
        return it->second->second;
    }

    void put(int key, int value) {
        if (auto it = index_.find(key); it != index_.end()) {
            it->second->second = value;
            return;
        }
        if (order_.size() == capacity_) {
            index_.erase(order_.back().first);
            order_.pop_back();
        }
        order_.emplace_front(key, value);
        index_[key] = order_.begin();
    }

private:
    std::size_t capacity_;
    std::list<std::pair<int, int>> order_;
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> index_;
};
`),
  ],
  tests: [
    { run: "{ LruCache c(2); c.put(1, 10); c.put(2, 20); std::cout << c.get(1).value_or(-1) << ' ' << c.get(3).value_or(-1) << std::endl; }", expect: "10 -1" },
    { run: "{ LruCache c(2); c.put(1, 10); c.put(2, 20); c.put(3, 30); std::cout << c.get(1).value_or(-1) << ' ' << c.get(3).value_or(-1) << std::endl; }", expect: "-1 30" },
    { run: "{ LruCache c(2); c.put(1, 10); c.put(2, 20); c.get(1); c.put(3, 30); std::cout << c.get(1).value_or(-1) << ' ' << c.get(2).value_or(-1) << std::endl; }", expect: "10 -1", hidden: true },
    { run: "{ LruCache c(2); c.put(1, 10); c.put(2, 20); c.put(1, 11); c.put(3, 30); std::cout << c.get(1).value_or(-1) << ' ' << c.get(2).value_or(-1) << std::endl; }", expect: "11 -1", hidden: true },
    { run: "{ LruCache c(1); c.put(1, 1); c.put(2, 2); std::cout << c.get(1).value_or(-1) << ' ' << c.get(2).value_or(-1) << std::endl; }", expect: "-1 2", hidden: true },
  ],
  explain: L(
    "A std::list keeps recency (front = newest) and an unordered_map points to list nodes; splice moves a node to the front in O(1).",
    "Una std::list guarda el orden de uso (frente = más reciente) y un unordered_map apunta a sus nodos; splice mueve un nodo al frente en O(1).",
    "std::list で使用順（先頭が最新）を持ち、unordered_map でそのノードを指す。splice でノードを O(1) で先頭へ。",
  ),
};

export const joinAllTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "templates",
  difficulty: 3,
  prompt: L("Written test: join any arguments", "Prueba escrita: une cualquier argumento", "筆記：任意の引数をつなぐ"),
  brief: L(
    "Write the variadic template std::string joinAll(const Args&... args): every argument written as operator<< would print it, separated by \", \". No separator before the first or after the last; no arguments gives \"\". Example: joinAll(1, \"a\", 2.5) is \"1, a, 2.5\".",
    "Escribe la plantilla variádica std::string joinAll(const Args&... args): cada argumento escrito como lo imprimiría operator<<, separados por \", \". Sin separador antes del primero ni después del último; sin argumentos da \"\". Ejemplo: joinAll(1, \"a\", 2.5) es \"1, a, 2.5\".",
    "可変長テンプレート std::string joinAll(const Args&... args) を書こう。各引数を operator<< で出すとおりに書き、\", \" で区切る。先頭の前と最後の後には区切りなし。引数なしなら \"\"。例：joinAll(1, \"a\", 2.5) は \"1, a, 2.5\"。",
  ),
  starter: src(`
#include <sstream>
#include <string>

template <typename... Args>
std::string joinAll(const Args&... args) {
    // your code here
    return "";
}
`),
  solution: src(`
#include <sstream>
#include <string>

template <typename... Args>
std::string joinAll(const Args&... args) {
    std::ostringstream out;
    const char* sep = "";
    ((out << sep << args, sep = ", "), ...);
    return out.str();
}
`),
  nearMiss: [
    // Separator after every argument, including the last.
    src(`
#include <sstream>
#include <string>

template <typename... Args>
std::string joinAll(const Args&... args) {
    std::ostringstream out;
    ((out << args << ", "), ...);
    return out.str();
}
`),
    // Separator before every argument, including the first.
    src(`
#include <sstream>
#include <string>

template <typename... Args>
std::string joinAll(const Args&... args) {
    std::ostringstream out;
    ((out << ", " << args), ...);
    return out.str();
}
`),
  ],
  tests: [
    { run: 'std::cout << "[" << joinAll(1, "a", 2.5) << "]" << std::endl;', expect: "[1, a, 2.5]" },
    { run: 'std::cout << "[" << joinAll() << "]" << std::endl;', expect: "[]" },
    { run: 'std::cout << "[" << joinAll(7) << "]" << std::endl;', expect: "[7]", hidden: true },
    { run: 'std::cout << "[" << joinAll(std::string("x"), \'y\', true) << "]" << std::endl;', expect: "[x, y, 1]", hidden: true },
    { run: 'std::cout << "[" << joinAll(-3, 0) << "]" << std::endl;', expect: "[-3, 0]", hidden: true },
  ],
  explain: L(
    "A fold over the comma operator writes sep then the arg into an ostringstream; sep starts empty and becomes \", \" after the first one.",
    "Un fold sobre el operador coma escribe sep y luego el arg en un ostringstream; sep empieza vacío y pasa a \", \" tras el primero.",
    "カンマ演算子の fold で ostringstream に sep と引数を書く。sep は空で始まり、1つ目の後に \", \" になる。",
  ),
};

export const sumCsvTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "exceptions",
  difficulty: 3,
  prompt: L("Written test: sum a CSV line", "Prueba escrita: suma una línea CSV", "筆記：CSV の行を合計"),
  brief: L(
    "Write int sumCsv(const std::string& csv): csv holds integers (maybe negative) separated by commas, with no spaces. Return their sum; \"\" gives 0. If any token is not a whole integer (empty, \"x\", \"12a\"...), throw std::invalid_argument whose what() is \"bad token: \" followed by that token. Values are small: no overflow.",
    "Escribe int sumCsv(const std::string& csv): csv tiene enteros (quizá negativos) separados por comas, sin espacios. Devuelve su suma; \"\" da 0. Si algún token no es un entero completo (vacío, \"x\", \"12a\"...), lanza std::invalid_argument cuyo what() sea \"bad token: \" seguido de ese token. Los valores son chicos: no hay overflow.",
    "int sumCsv(const std::string& csv) を書こう。csv には整数（負もある）がカンマ区切りで入り、空白はない。合計を返し、\"\" なら 0。整数として丸ごと読めないトークン（空、\"x\"、\"12a\" など）があれば、what() が \"bad token: \" とそのトークンになる std::invalid_argument を投げる。値は小さくオーバーフローしない。",
  ),
  starter: src(`
#include <stdexcept>
#include <string>

int sumCsv(const std::string& csv) {
    // your code here
    return 0;
}
`),
  solution: src(`
#include <stdexcept>
#include <string>

int sumCsv(const std::string& csv) {
    if (csv.empty()) return 0;
    int total = 0;
    std::size_t start = 0;
    while (true) {
        std::size_t comma = csv.find(',', start);
        std::string token = csv.substr(start, comma == std::string::npos ? std::string::npos : comma - start);
        std::size_t used = 0;
        int value = 0;
        try {
            value = std::stoi(token, &used);
        } catch (const std::exception&) {
            throw std::invalid_argument("bad token: " + token);
        }
        if (used != token.size()) throw std::invalid_argument("bad token: " + token);
        total += value;
        if (comma == std::string::npos) return total;
        start = comma + 1;
    }
}
`),
  nearMiss: [
    // Trusts std::stoi: "12a" quietly reads as 12.
    src(`
#include <stdexcept>
#include <string>

int sumCsv(const std::string& csv) {
    if (csv.empty()) return 0;
    int total = 0;
    std::size_t start = 0;
    while (true) {
        std::size_t comma = csv.find(',', start);
        std::string token = csv.substr(start, comma == std::string::npos ? std::string::npos : comma - start);
        try {
            total += std::stoi(token);
        } catch (const std::exception&) {
            throw std::invalid_argument("bad token: " + token);
        }
        if (comma == std::string::npos) return total;
        start = comma + 1;
    }
}
`),
    // Lets std::stoi's own exception escape: its message isn't "bad token: ...".
    src(`
#include <stdexcept>
#include <string>

int sumCsv(const std::string& csv) {
    if (csv.empty()) return 0;
    int total = 0;
    std::size_t start = 0;
    while (true) {
        std::size_t comma = csv.find(',', start);
        std::string token = csv.substr(start, comma == std::string::npos ? std::string::npos : comma - start);
        std::size_t used = 0;
        int value = std::stoi(token, &used);
        if (used != token.size()) throw std::invalid_argument("bad token: " + token);
        total += value;
        if (comma == std::string::npos) return total;
        start = comma + 1;
    }
}
`),
  ],
  tests: [
    { run: 'try { std::cout << sumCsv("1,2,3") << std::endl; } catch (const std::invalid_argument& e) { std::cout << "[" << e.what() << "]" << std::endl; }', expect: "6" },
    { run: 'try { std::cout << sumCsv("4,x") << std::endl; } catch (const std::invalid_argument& e) { std::cout << "[" << e.what() << "]" << std::endl; }', expect: "[bad token: x]" },
    { run: 'try { std::cout << sumCsv("") << std::endl; } catch (const std::invalid_argument& e) { std::cout << "[" << e.what() << "]" << std::endl; }', expect: "0", hidden: true },
    { run: 'try { std::cout << sumCsv("-5,10") << std::endl; } catch (const std::invalid_argument& e) { std::cout << "[" << e.what() << "]" << std::endl; }', expect: "5", hidden: true },
    { run: 'try { std::cout << sumCsv("12a,3") << std::endl; } catch (const std::invalid_argument& e) { std::cout << "[" << e.what() << "]" << std::endl; }', expect: "[bad token: 12a]", hidden: true },
    { run: 'try { std::cout << sumCsv("7,,1") << std::endl; } catch (const std::invalid_argument& e) { std::cout << "[" << e.what() << "]" << std::endl; }', expect: "[bad token: ]", hidden: true },
  ],
  explain: L(
    "Split on commas, std::stoi each token with its pos argument and check it used the whole token; catch stoi's errors and rethrow your own message.",
    "Separa por comas, usa std::stoi con su argumento pos y revisa que leyó todo el token; atrapa los errores de stoi y relanza tu propio mensaje.",
    "カンマで分け、std::stoi の pos 引数でトークン全体を読めたか確かめる。stoi の例外は捕まえて自分のメッセージで投げ直す。",
  ),
};

export const parallelSumTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "concurrency",
  difficulty: 3,
  prompt: L("Written test: a parallel sum", "Prueba escrita: una suma en paralelo", "筆記：並列の合計"),
  brief: L(
    "Write long long parallelSum(const std::vector<int>& v, int threads), threads >= 1: split v into threads contiguous chunks (the last one also takes the remainder), sum each chunk on its own std::thread into its own slot, join them all, and return the total. The total can exceed int. No data races.",
    "Escribe long long parallelSum(const std::vector<int>& v, int threads), threads >= 1: divide v en threads tramos contiguos (el último también toma el resto), suma cada tramo en su propio std::thread en su propia casilla, haz join de todos y devuelve el total. El total puede superar int. Sin data races.",
    "long long parallelSum(const std::vector<int>& v, int threads)（threads >= 1）を書こう。v を threads 個の連続した区間に分け（最後の区間は余りも担当）、各区間を別の std::thread で専用の枠に合計し、全部 join して合計を返す。合計は int を超えうる。データ競合なしで。",
  ),
  starter: src(`
#include <thread>
#include <vector>

long long parallelSum(const std::vector<int>& v, int threads) {
    // your code here
    return 0;
}
`),
  solution: src(`
#include <numeric>
#include <thread>
#include <vector>

long long parallelSum(const std::vector<int>& v, int threads) {
    std::vector<long long> partial(threads, 0);
    std::vector<std::thread> pool;
    std::size_t chunk = v.size() / threads;
    for (int t = 0; t < threads; ++t) {
        std::size_t begin = t * chunk;
        std::size_t end = (t == threads - 1) ? v.size() : begin + chunk;
        pool.emplace_back([&v, &partial, t, begin, end] {
            for (std::size_t i = begin; i < end; ++i) partial[t] += v[i];
        });
    }
    for (auto& th : pool) th.join();
    return std::accumulate(partial.begin(), partial.end(), 0LL);
}
`),
  nearMiss: [
    // Every chunk has the same size: the remainder is never summed.
    src(`
#include <numeric>
#include <thread>
#include <vector>

long long parallelSum(const std::vector<int>& v, int threads) {
    std::vector<long long> partial(threads, 0);
    std::vector<std::thread> pool;
    std::size_t chunk = v.size() / threads;
    for (int t = 0; t < threads; ++t) {
        std::size_t begin = t * chunk;
        std::size_t end = begin + chunk;
        pool.emplace_back([&v, &partial, t, begin, end] {
            for (std::size_t i = begin; i < end; ++i) partial[t] += v[i];
        });
    }
    for (auto& th : pool) th.join();
    return std::accumulate(partial.begin(), partial.end(), 0LL);
}
`),
    // accumulate with an int 0: the total is computed in int and wraps.
    src(`
#include <numeric>
#include <thread>
#include <vector>

long long parallelSum(const std::vector<int>& v, int threads) {
    std::vector<long long> partial(threads, 0);
    std::vector<std::thread> pool;
    std::size_t chunk = v.size() / threads;
    for (int t = 0; t < threads; ++t) {
        std::size_t begin = t * chunk;
        std::size_t end = (t == threads - 1) ? v.size() : begin + chunk;
        pool.emplace_back([&v, &partial, t, begin, end] {
            for (std::size_t i = begin; i < end; ++i) partial[t] += v[i];
        });
    }
    for (auto& th : pool) th.join();
    return std::accumulate(partial.begin(), partial.end(), 0);
}
`),
  ],
  tests: [
    { run: "{ std::vector<int> v{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}; std::cout << parallelSum(v, 3) << std::endl; }", expect: "55" },
    { run: "{ std::vector<int> v; std::cout << parallelSum(v, 2) << std::endl; }", expect: "0" },
    { run: "{ std::vector<int> v{5}; std::cout << parallelSum(v, 4) << std::endl; }", expect: "5", hidden: true },
    { run: "{ std::vector<int> v(100); for (int i = 0; i < 100; ++i) v[i] = i + 1; std::cout << parallelSum(v, 7) << std::endl; }", expect: "5050", hidden: true },
    { run: "{ std::vector<int> v(4, 2000000000); std::cout << parallelSum(v, 2) << std::endl; }", expect: "8000000000", hidden: true },
  ],
  explain: L(
    "chunk = size / threads; the last thread runs to size. Each writes only its own partial[t], join() before reading, accumulate from 0LL.",
    "chunk = size / threads; el último hilo llega hasta size. Cada uno escribe solo su partial[t], join() antes de leer y accumulate desde 0LL.",
    "chunk = size / threads、最後のスレッドは size まで。各自 partial[t] だけに書き、読む前に join()、0LL から accumulate。",
  ),
};
