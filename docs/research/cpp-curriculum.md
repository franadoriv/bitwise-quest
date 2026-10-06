# C++ planet: proposed curriculum

Curriculum for the **C++ planet** (pack `cpp`, 4 regions) and its entry exams. It is written for a
learner who may know nothing about programming, and it follows what companies actually assess (see
[cpp-hiring-assessments.md](cpp-hiring-assessments.md)). Content authors turn this into a language
pack following [../content-model.md](../content-model.md), [../authoring-lessons.md](../authoring-lessons.md)
and [../exams.md](../exams.md).

## Conventions used in this file

### Verification tags

Every question idea ends with a tag saying how its answer is proven. **All tagged snippets below were
checked on 2026-10-06** against GCC 14.2 (Compiler Explorer `g142`) with `-std=c++20 -O1`, executed,
stdout captured. Content authors should still wire each one into `check` so `content:verify` keeps
them honest.

| Tag | Meaning | How it was checked |
|---|---|---|
| `[R]` | Runtime output | Built and run; stdout compared **exactly** (no trailing newline in the expected text) |
| `[C-]` | Does **not** compile | Built; GCC reports an error inside the snippet (the GCC message is quoted where useful) |
| `[C+]` | Compiles, answer is conceptual (UB, unspecified, "is it safe?") | Built successfully (warnings allowed). **Never** used as expected runtime output |
| `[Doc]` | Design rule or behavior not machine-checkable | Anchored to cppreference or the C++ Core Guidelines (cited in the lesson) |

### Snippet convention

Snippets are written compactly. `top:` is code at namespace scope (types, functions); `main:` is the
body of `int main()`. When there is no `top:`, the snippet is the body of `main`. The check program is:

```cpp
#include <iostream>   // plus whatever the snippet needs: <string> <vector> <map> <unordered_map>
#include <string>     // <memory> <algorithm> <numeric> <optional> <variant> <string_view>
#include <vector>     // <ranges> <thread> <mutex> <atomic> <future> <stdexcept> <type_traits>
                      // <concepts> <utility> <climits>
// top
int main() { /* main */ }
```

All snippets use `std::` explicitly (no `using namespace std;`), which is what interviewers expect to
read. Authors should split the compact lines into readable lines (max 12 lines per question).
A prelude that includes all the headers above is fine for the validator; the code shown to the player
should keep only what matters.

Reusable types (referred to by name below):

```cpp
// TORCH: prints + when born, - when dropped
struct Torch { std::string n; Torch(std::string n) : n(n) { std::cout << "+" << n; }
               ~Torch() { std::cout << "-" << n; } };
// ITEM: announces copies and moves
struct Item { std::string n; Item(std::string n) : n(n) {}
              Item(const Item& o) : n(o.n) { std::cout << "copy "; }
              Item(Item&& o) noexcept : n(std::move(o.n)) { std::cout << "move "; } };
// ANIMAL: a polymorphic family
struct Animal { virtual std::string sound() const { return "..."; } virtual ~Animal() = default; };
struct Dog : Animal { std::string sound() const override { return "woof"; } };
struct Cat : Animal { std::string sound() const override { return "meow"; } };
// VEC: a value type with operators
struct Vec { int x, y; Vec operator+(const Vec& o) const { return {x + o.x, y + o.y}; }
             bool operator==(const Vec&) const = default; };
std::ostream& operator<<(std::ostream& os, const Vec& v) { return os << "(" << v.x << "," << v.y << ")"; }
```

### Determinism rules (from the verification constraint)

- Never use UB, unspecified or implementation-defined results as expected output: moved-from contents
  (except `std::vector` after its **move constructor**, guaranteed empty), NRVO, `unordered_map`
  order, argument evaluation order, pointer values, `typeid().name()`, exact `sizeof` of classes
  (compare instead), thread interleavings.
- `std::boolalpha` is sticky: if a check program uses it, it affects later prints in the same program.
- A function-local `static` object is destroyed **after** `main` returns, and its destructor output
  still appears in stdout (e.g. exam snippet E16 prints `aSb~S`).
- Uncaught exceptions / `std::terminate` are not valid expected output.
- Threads are allowed by the runner (verified), but only print after `join()`.

### Question kinds

`pick` (one `___`, 2-4 options), `predict` (output or Yes/No), `type` (exact token for `___`),
`order` (lines in the correct order, unique), `run` (broken starter → expected stdout substring).
Every `run` below has a starter that **compiles and runs** but prints something without `expect`.

### Visual vocabulary (existing stage effects)

The stage understands: `tag` (label above an actor = a variable name), `value` (value chip), `item`
(sword, potion, gem, shield, scroll, key), `give` (move an item), `clone` (duplicate an item), `lend`
(ghost copy goes and comes back), `drop`, `dead` (binding invalid), `say`, `print` (console output),
`shake` (error), `banner`, `enter`/`exit`, `attack`/`hp`, `wait`. Mapping for this planet:

| Code idea | On stage |
|---|---|
| Variable | `tag` above an actor, `value` chip with its value |
| Object (class instance, `std::string`, `std::vector`) | An `item` (gem = object, scroll = vector/string, shield = class instance, key = function / lambda) |
| Pass / copy by value | `clone`: the callee gets its own copy; changes do not come back |
| Reference (`T&`) | `lend`: the ghost goes, edits the real item, comes back; a second `tag` on the **same** actor (alias) |
| Pointer (`T*`) | The ally holds a `key` pointing at the hero's item; `*p` = using the key; `nullptr` = an empty key; reseating = the key is handed to another actor |
| `std::move` / move constructor | `give`: the item leaves the source actor, which keeps an empty hand |
| Copy constructor | `clone` (banner "COPY") |
| Destructor | `drop` + `exit` (banner "~Name") at the closing `}` |
| Heap object (`new`) | Item floats in the sky (no owner on the ground); a leak = it never comes down (`banner` "LEAK") |
| Dangling reference / pointer | The tag stays but the actor is `dead`; touching it = `shake` + banner "UB" |
| Compile error | `shake` + `say` the GCC message |
| Virtual call | The enemy's real costume decides the move (a `banner` with the dynamic type) |
| Slicing | `clone` that loses the costume (banner "SLICED") |
| Thread | A second ally working in parallel; `join` = ally walks back to the hero |
| Mutex | A `key` that only one actor can hold at a time |

---

# Regions

Learning order: values → lifetimes → polymorphism → generic and modern C++. The learner first learns
what a variable, a reference and a pointer are, then who owns an object and when it dies (the heart
of C++), then class hierarchies, and finally templates, the STL with lambdas, C++17/20 features and
threads.

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `value-village` | village | Values, references, pointers, `const`, vector and string | 4 + boss |
| 2 | `lifetime-forest` | forest | Classes, destructors and RAII, copy vs move, smart pointers | 4 + boss |
| 3 | `polymorph-castle` | castle | Inheritance, `virtual`, slicing, virtual destructors, operators | 4 + boss |
| 4 | `template-tower` | tower | Templates and `constexpr`, lambdas and the STL, modern C++, threads | 4 + boss (UB spotting) |

UB is taught in small doses where it naturally appears (uninitialized and signed overflow in 1.1,
null and dangling pointers in 1.3, out-of-bounds in 1.4, dangling captures and iterator invalidation
in 4.2, `string_view` in 4.3, data races in 4.4) and reviewed in the tower boss.

## Region 1: `value-village`, Values, references and pointers

### 1.1 `boxes-and-types`, "Boxes and types"

- **Concept**: a variable is a typed box: `int`, `double`, `char`, `bool`, `std::string`; printing
  with `std::cout <<`; integer division and `%` (truncate toward zero); implicit conversion
  `double`→`int` truncates; brace init `{}` refuses narrowing; `const`; `auto`; namespaces and `::`.
  UB intro: reading an uninitialized variable and signed overflow.
- **Visual**: hero gets a `tag` `hp` with `value` chip `10`; `int` boxes refuse to hold half-chips
  (`7 / 2` shows the `.5` falling off). Brace init `int x{3.7}` makes the box `shake` with the GCC
  narrowing message. `const` tag is engraved: assigning `shake`s. `std::cout` = `print`.
- **Questions**:
  1. predict: `int hp = 10; hp = hp + 5; std::cout << hp;` → `15` [R]
  2. predict: `std::cout << 7 / 2 << " " << 7.0 / 2;` → `3 3.5` [R]
  3. predict: `std::cout << 7 % 3 << " " << -7 / 2;` → `1 -3` (integer division truncates toward zero) [R]
  4. predict: `bool ok = true; std::cout << ok << " " << std::boolalpha << ok;` → `1 true` [R]
  5. predict "Does it compile?": `int x{3.7};` → No: `narrowing conversion of '3.7...' from 'double' to 'int'` [C-]; follow-up predict: `int y = 3.7; std::cout << y;` → `3` [R]
  6. predict "Does it compile?": `const int lives = 3; lives = 4;` → No: `assignment of read-only variable 'lives'` [C-]
  7. predict: `auto a = 5; auto b = 2.5; std::cout << a * b;` → `12.5` [R]
  8. predict: `char c = 'A'; std::cout << c + 1 << " " << char(c + 1);` → `66 B` (`char + int` is an `int`) [R]
  9. type: top `namespace game { int level = 7; }` main `std::cout << game___level;` → `::` (prints `7`) [R]
  10. pick "Is this program's output defined?": `int x; std::cout << x;` → No: reading an uninitialized `int` is UB / Yes, it prints 0 → No [C+] (Core Guidelines ES.20 "Always initialize an object")
  11. pick "What does `INT_MAX + 1` give for an `int`?": UB (signed overflow) / `INT_MIN` / `0` → UB [C+] (cppreference: Undefined behavior). Contrast: unsigned wraps (boss question 3).
- **Run**: starter `int gold = 7; int friends = 2; double share = gold / friends; std::cout << "share: " << share;`
  prints `share: 3`. Solution: `double share = static_cast<double>(gold) / friends;` (or `gold / 2.0`).
  `expect`: `share: 3.5`. [R]

### 1.2 `lend-or-clone`, "Lend or clone?"

- **Concept**: passing by value copies; passing by reference (`T&`) lends the original; `const T&`
  lends read-only (cheap for big objects, Core Guidelines F.16); a reference is an alias that must be
  initialized and can never be reseated; non-const references cannot bind to temporaries; standard
  containers have value semantics (assigning copies the whole container).
- **Visual**: by value: the hero `clone`s the `hp` chip and gives the copy to the ally; the ally changes
  it, the hero's chip stays. By reference: `lend` (ghost goes, edits the real chip, returns). A
  reference = a second `tag` on the same actor. `r = b` does not move the tag: it copies `b`'s chip in.
- **Questions**:
  1. predict: top `void heal(int hp) { hp += 10; }` main `int hp = 5; heal(hp); std::cout << hp;` → `5` [R]
  2. predict: top `void heal(int& hp) { hp += 10; }` same main → `15` [R]
  3. predict: `int a = 1; int& r = a; r = 9; std::cout << a;` → `9` [R]
  4. predict: `int a = 1, b = 2; int& r = a; r = b; b = 7; std::cout << a << r;` → `22` (`r = b` assigns the value; a reference can't be reseated) [R]
  5. predict "Does it compile?": `int& r;` → No: `'r' declared as reference but not initialized` [C-]
  6. predict "Does it compile?": top `void show(const std::string& s) { s += "!"; }` → No (cannot modify through `const&`) [C-]
  7. predict: `std::vector<int> v{1, 2, 3}; auto w = v; w[0] = 99; std::cout << v[0] << " " << w[0];` → `1 99` (containers copy) [R]
  8. predict "Does it compile?": top `void f(int& x) {}` main `f(5);` → No: `cannot bind non-const lvalue reference of type 'int&' to an rvalue of type 'int'` (a `const int&` parameter would accept it) [C-]
  9. pick "Best parameter to read a long string without copying it": `std::string` / `const std::string&` / `std::string&` → `const std::string&` [Doc: Core Guidelines F.16]
  10. predict: top `void swap2(int& a, int& b) { int t = a; a = b; b = t; }` main `int x = 1, y = 2; swap2(x, y); std::cout << x << y;` → `21` [R]
- **Run**: top `void levelUp(int lvl) { lvl++; }` main `int lvl = 1; levelUp(lvl); std::cout << "level: " << lvl;`
  prints `level: 1`. Solution: `void levelUp(int& lvl)`. `expect`: `level: 2`. [R]

### 1.3 `pointer-paths`, "Keys and pointers"

- **Concept**: a pointer stores an address: `&x` takes it, `*p` follows it; pointers can be reseated
  and can be `nullptr`; `const int*` (can't change the pointee) vs `int* const` (can't reseat);
  arrays decay to pointers, pointer arithmetic; stack vs heap: locals live on the stack and die at `}`,
  `new` puts an object on the heap and only `delete` frees it (leaks, double delete), so modern code
  avoids raw `new`/`delete` (Core Guidelines R.11). UB: dereferencing `nullptr`, returning the address
  of a local (dangling).
- **Visual**: the ally holds a `key` labelled `p` that opens the hero's chest; `*p = 8` = ally uses the
  key and swaps the chip. `p = &b` = the key now opens the enemy's chest. `nullptr` = blank key; using
  it = `shake` + banner "UB". `new` = an item floats in the sky; `delete` makes it `drop`; forgetting it
  = banner "LEAK". Returning `&local`: the local actor `exit`s, the key points to a `dead` actor.
- **Questions**:
  1. predict: `int hp = 5; int* p = &hp; *p = 8; std::cout << hp;` → `8` [R]
  2. predict: `int a = 1, b = 2; int* p = &a; p = &b; *p = 9; std::cout << a << b;` → `19` (a pointer can be reseated, unlike a reference) [R]
  3. predict: `int* p = nullptr; std::cout << (p == nullptr);` → `1` [R]
  4. predict "Does it compile?": `int x = 1; const int* p = &x; *p = 2;` → No: `assignment of read-only location '* p'` [C-]
  5. predict "Does it compile?": `int x = 1, y = 2; int* const p = &x; p = &y;` → No: `assignment of read-only variable 'p'` [C-]
  6. predict: `int arr[3] = {10, 20, 30}; int* p = arr; std::cout << *(p + 2) << " " << p[1];` → `30 20` [R]
  7. predict: `int* p = new int(42); std::cout << *p; delete p;` → `42` [R]; follow-up pick "If `delete p;` is removed?": memory leak / compile error / crash → leak [Doc: Core Guidelines R.11]
  8. pick "Is this safe?": `int* p = nullptr; std::cout << *p;` → No, UB (null dereference) [C+]
  9. pick "Is this safe?": top `int* make() { int x = 5; return &x; }` → No: dangling pointer, `x` died at `}` (GCC warns `address of local variable 'x' returned`) [C+]
  10. type: `int* p = ___hp;` → `&` [R]
  11. pick "Where does `int x = 5;` inside a function live?": stack / heap → stack (`new int(5)` is heap) [Doc]
- **Run**: top `void addGold(int* gold) { gold += 10; }` main `int gold = 5; addGold(&gold); std::cout << "gold: " << gold;`
  prints `gold: 5` (the pointer moved, not the value). Solution: `*gold += 10;`. `expect`: `gold: 15`. [R]

### 1.4 `bags-and-scrolls`, "Vectors and strings"

- **Concept**: `std::vector` (dynamic array): `push_back`, `size`, `back`, `front`; `vector<int>(3)`
  (three zeros) vs `vector<int>{3}` (one element); range-for by value copies, `auto&` edits; `at()`
  checks bounds and throws `std::out_of_range`, `[]` doesn't (out of bounds = UB); `std::string`:
  `+=`, `size`, `[]`, `std::stoi`; `"a" + "b"` doesn't compile (two `const char` arrays);
  `size()` is unsigned (`size_t`).
- **Visual**: a vector is a `scroll` that grows lines on `push_back`. Range-for by value: each line is
  `clone`d into the ally's hand and the edits vanish; `auto&`: `lend`. `at(5)` = a guard who `shake`s
  and throws; `[5]` = walking off the scroll into fog (banner "UB").
- **Questions**:
  1. predict: `std::vector<int> v{3, 1, 4}; v.push_back(1); std::cout << v.size() << " " << v.back();` → `4 1` [R]
  2. predict: `std::vector<int> a(3); std::vector<int> b{3}; std::cout << a.size() << b.size();` → `31` [R]
  3. predict: `std::vector<int> v{1, 2, 3}; for (int x : v) x *= 2; std::cout << v[0];` → `1` [R]; with `int& x` → `2` [R]
  4. predict: `std::string s = "hero"; s += "!"; std::cout << s.size() << " " << s[0];` → `5 h` [R]
  5. predict: `std::vector<int> v{1, 2, 3}; try { v.at(5); } catch (const std::out_of_range&) { std::cout << "caught"; }` → `caught` [R]
  6. pick "`std::vector<int> v{1, 2, 3}; std::cout << v[5];` is…": UB / throws `out_of_range` / prints 0 → UB (`[]` does not check bounds) [C+]
  7. predict: `std::string a = "10", b = "5"; std::cout << a + b << " " << std::stoi(a) + std::stoi(b);` → `105 15` [R]
  8. predict "Does it compile?": `std::string s = "a" + "b";` → No: `invalid operands of types 'const char [2]' and 'const char [2]' to binary 'operator+'` [C-]
  9. predict: `std::vector<int> v{5, 6, 7}; std::cout << v.front() + v.back();` → `12` [R]
  10. predict: `std::vector<int> v; std::cout << v.size() - 1;` → `18446744073709551615` (`size_t` is unsigned and wraps; well-defined) [R]
  11. predict "Does it compile?": `std::vector<int> v{1, 2.5};` → No (narrowing inside braces) [C-]
- **Run**: starter `std::vector<int> v{1, 2, 3}; for (auto x : v) x *= 10; for (auto x : v) std::cout << x << " ";`
  prints `1 2 3 `. Solution: `for (auto& x : v) x *= 10;`. `expect`: `10 20 30`. [R]

### 1.5 Boss `pointer-golem` (mode `boss`)

Mixed, timed:
1. predict: `int a = 5; int& r = a; int* p = &r; *p += 1; r *= 2; std::cout << a;` → `12` [R]
2. predict: `std::cout << 10 / 4 * 4;` → `8` [R]
3. predict: `unsigned int u = 0; u = u - 1; std::cout << (u > 0);` → `1` (unsigned wraps, defined) [R]
4. predict: `std::vector<std::string> v{"a", "b"}; std::string s = v[0]; s += "x"; std::cout << v[0] << s;` → `aax` [R]
5. predict: `int x = 3; auto y = x; auto& z = x; y++; z += 10; std::cout << x << y;` → `134` [R]
6. predict: `std::cout << sizeof(char) << " " << 5 / 2.0;` → `1 2.5` (`sizeof(char)` is always 1) [R]
7. predict: top `void bump(int* p) { (*p)++; } void bumpRef(int& r) { r++; }` main `int hp = 1; bump(&hp); bumpRef(hp); std::cout << hp;` → `3` [R]
8. predict "Does it compile?": `int* p = 5;` → No: `invalid conversion from 'int' to 'int*'` [C-]
9. predict: `int x = 10; int* p = &x; int** pp = &p; **pp = 20; std::cout << x;` → `20` [R]
10. predict: `char s[] = "hi"; std::cout << sizeof(s);` → `3` (the hidden `'\0'`) [R]

## Region 2: `lifetime-forest`, Objects and lifetimes

### 2.1 `forging-classes`, "Forging classes"

- **Concept**: `struct` vs `class` (default `public` vs `private`); members, default member
  initializers, constructors, member initializer list; members are initialized **in declaration
  order**, not in the order of the init list (Core Guidelines C.47); aggregate init fills missing
  members with zero; `explicit` blocks implicit conversions; `static` members; `const` member
  functions; the most vexing parse (`Hero h();` declares a function).
- **Visual**: a class is a blueprint `scroll`; constructing = a new actor `enter`s with a `shield`
  (instance) and its `tag`s. Init order: the fields appear top to bottom regardless of the init list
  (`print` shows the order). Most vexing parse: the actor never appears; a `banner` "FUNCTION?" shows up.
- **Questions**:
  1. predict: top `struct Hero { std::string name; int hp = 100; };` main `Hero h{"Ada"}; std::cout << h.name << " " << h.hp;` → `Ada 100` [R]
  2. predict "Does it compile?": top `class Hero { int hp = 100; };` main `Hero h; std::cout << h.hp;` → No: `'int Hero::hp' is private within this context` [C-]
  3. predict: top `struct Log { Log(const char* s) { std::cout << s; } }; struct P { Log b{"b"}; Log a{"a"}; P() : a("A"), b("B") {} };` main `P p;` → `BA` (declaration order: `b` first) [R]
  4. predict: top `struct Hero { int hp; Hero() : hp(1) { std::cout << "default "; } Hero(int h) : hp(h) { std::cout << "int "; } };` main `Hero a; Hero b(5); Hero c{7};` → `default int int ` [R]
  5. predict: top `struct Hero { Hero() { std::cout << "born "; } };` main `Hero h(); std::cout << "end";` → `end` (most vexing parse: `h` is a function; GCC warns `-Wvexing-parse`) [R]
  6. predict "Does it compile?": top `struct Meters { explicit Meters(int v) : v(v) {} int v; }; void walk(Meters m) {}` main `walk(5);` → No: `could not convert '5' from 'int' to 'Meters'` [C-]
  7. predict: top `struct Counter { inline static int count = 0; Counter() { count++; } };` main `Counter a, b, c; std::cout << Counter::count;` → `3` [R]
  8. predict "Does it compile?": top `struct Hero { int hp = 1; int get() { return hp; } };` main `const Hero h{}; std::cout << h.get();` → No: `passing 'const Hero' as 'this' argument discards qualifiers` (fix: `int get() const`) [C-]
  9. predict: top `struct Point { int x, y; };` main `Point p{1}; std::cout << p.x << p.y;` → `10` [R]
  10. predict "Does it compile?": top `struct Point { int x, y; };` main `Point p{1, 2, 3};` → No: `too many initializers` [C-]
  11. pick "Is `struct P { int b; int a; P() : a(1), b(a + 1) {} };` safe?": No, `b` is initialized first and reads `a` before it is initialized (UB) / Yes → No [C+]
- **Run**: top `struct Hero { int hp = 100; void heal(int amount) { int hp = this->hp; hp += amount; } };`
  main `Hero h; h.heal(20); std::cout << "hp: " << h.hp;` prints `hp: 100` (a local `hp` shadows the
  member). Solution: `void heal(int amount) { hp += amount; }`. `expect`: `hp: 120`. [R]

### 2.2 `drop-the-torch`, "Drop the torch: destructors and RAII"

- **Concept**: the destructor runs when an object's lifetime ends: at the closing `}` for locals, in
  **reverse order of construction**; members are destroyed in reverse declaration order; temporaries
  die at the end of the full expression; heap objects only die on `delete` (leak otherwise); RAII
  (Core Guidelines R.1): acquire in the constructor, release in the destructor, so cleanup happens on
  every path including early `return` and exceptions (stack unwinding); if a constructor throws, the
  destructor of that object does **not** run, but already-built members are destroyed.
- **Visual**: each `Torch` actor `enter`s with a lit torch (`print` `+a`); at `}` the actors `drop`
  their torches and `exit` in reverse order (`print` `-b-a`). A `throw` is a gust of wind that sweeps
  through the scope: every actor drops its torch on the way out. `new Torch` floats in the sky and
  never comes down (banner "LEAK").
- **Questions** (top: TORCH):
  1. predict: `Torch a("a"); Torch b("b");` → `+a+b-b-a` [R]
  2. predict: `{ Torch a("a"); } Torch b("b");` → `+a-a+b-b` [R]
  3. predict: `Torch* p = new Torch("h"); std::cout << "|";` → `+h|` (never deleted: no `-h`, a leak) [R]
  4. predict: `auto p = std::make_unique<Torch>("u"); std::cout << "|";` → `+u|-u` [R]
  5. predict: `try { Torch a("a"); throw 1; } catch (int) { std::cout << "!"; }` → `+a-a!` (unwinding runs the destructor before the handler) [R]
  6. predict: top TORCH + `struct Pair { Torch x{"x"}; Torch y{"y"}; };` main `Pair p;` → `+x+y-y-x` [R]
  7. predict: top TORCH + `struct Boom { Torch t{"t"}; Boom() { throw 1; } ~Boom() { std::cout << "~Boom"; } };` main `try { Boom b; } catch (int) { std::cout << "!"; }` → `+t-t!` (`~Boom` never runs) [R]
  8. pick "RAII means…": a resource is acquired in a constructor and released in the destructor / every object lives on the heap / you call `delete` at the end of each function → the first [Doc: Core Guidelines R.1]
  9. predict: `for (int i = 0; i < 2; ++i) { Torch t(std::to_string(i)); }` → `+0-0+1-1` [R]
  10. predict: `Torch("tmp"); std::cout << "|";` → `+tmp-tmp|` (a temporary dies at the `;`) [R]
  11. order: put the output of `Torch a("a"); { Torch b("b"); auto c = std::make_unique<Torch>("c"); } Torch d("d");` in order → `+a +b +c -c -b +d -d -a` [R: `+a+b+c-c-b+d-d-a`]
- **Run**: top `struct Lock { Lock() { std::cout << "lock "; } ~Lock() { std::cout << "unlock "; } }; void work(bool fail) { Lock* l = new Lock(); if (fail) return; delete l; }`
  main `work(true); std::cout << "done";` prints `lock done` (early return leaks the lock). Solution:
  `void work(bool fail) { Lock l; if (fail) return; }`. `expect`: `unlock done`. [R]

### 2.3 `give-or-clone`, "Give or clone: copy and move"

- **Concept**: copy constructor / copy assignment vs move constructor; `std::move` is only a cast to
  an rvalue (it moves nothing by itself); moving from a `const` object silently copies; pass-by-value
  copies lvalues and moves rvalues; returning a prvalue is guaranteed copy elision (C++17); the moved-from
  object is "valid but unspecified" (assign it or destroy it; don't rely on its value, except a
  `std::vector` after its move constructor, which is guaranteed empty); rule of 3 / 5 / 0 (Core
  Guidelines C.20, C.21): if you write one of destructor / copy / move, you probably need all of them,
  and best is to write none (rule of zero, use `std::string`, `std::vector`, `std::unique_ptr`);
  declaring a move constructor deletes the implicit copy assignment; a `unique_ptr` member makes the
  class move-only; `noexcept` move constructors let `std::vector` move (not copy) on reallocation
  (Core Guidelines C.66); the `noexcept` operator.
- **Visual**: copy = `clone` (banner "COPY"); move = `give` (banner "MOVE", the source keeps an empty
  hand). `std::move(a)` alone = the hero raises a "you may take this" flag, nothing moves until someone
  takes it. `const` item: chained to the hero, so `give` turns into `clone`.
- **Questions** (top: ITEM unless stated):
  1. predict: `Item a("gem"); Item b = a;` → `copy ` [R]
  2. predict: `Item a("gem"); Item b = std::move(a);` → `move ` [R]
  3. predict: top ITEM + `void take(Item i) {}` main `Item a("gem"); take(a); take(std::move(a));` → `copy move ` [R]
  4. predict: top ITEM + `Item make() { return Item("x"); }` main `Item a = make(); std::cout << "done";` → `done` (guaranteed copy elision: no copy, no move) [R]
  5. predict: `const Item a("gem"); Item b = std::move(a);` → `copy ` (`const Item&&` can't bind to `Item&&`) [R]
  6. pick "After `std::string t = std::move(s);`, what may you do with `s`?": assign it a new value or destroy it / read it and expect the old text / nothing, it is destroyed → assign or destroy [C+: `std::cout << s.size();` compiles and is not UB, but the value is unspecified]
  7. predict: `Item a("gem"); Item&& r = std::move(a); std::cout << "none";` → `none` (`std::move` only casts) [R]
  8. predict "Does it compile?": top `struct Bag { std::unique_ptr<int> p; };` main `Bag a; Bag b = a;` → No: `use of deleted function 'Bag::Bag(const Bag&)'` [C-]
  9. predict "Does it compile?": main `Item a("a"); Item b("b"); b = a;` → No: `use of deleted function 'Item& Item::operator=(const Item&)'` (declaring a move constructor deletes the implicit copy assignment) [C-]
  10. predict: `std::vector<Item> v; v.reserve(1); v.emplace_back("a"); v.emplace_back("b");` → `move ` (reallocation moves the old element because the move constructor is `noexcept`) [R]; same with the `noexcept` removed from ITEM's move constructor → `copy ` [R] (senior)
  11. pick "A class owns a raw pointer and `delete`s it in its destructor. With only the destructor written, copying it causes…": a double delete; write copy constructor and copy assignment too (rule of three), or use `std::unique_ptr` (rule of zero) / nothing, the compiler handles it → the first [Doc: cppreference rule of three/five/zero]
  12. predict: top `void a() noexcept {} void b() {}` main `std::cout << noexcept(a()) << noexcept(b());` → `10` [R]
- **Run**: top `struct Bag { std::vector<int> items; };` main `Bag a{{1, 2, 3}}; Bag b = a; std::cout << "a has " << a.items.size() << ", b has " << b.items.size();`
  prints `a has 3, b has 3`. Solution: `Bag b = std::move(a);` (the implicit move constructor moves the
  vector, which is guaranteed empty afterwards). `expect`: `a has 0, b has 3`. [R]

### 2.4 `smart-relics`, "Smart relics: unique, shared, weak"

- **Concept**: `std::unique_ptr` (single owner, move-only, `std::make_unique`, `reset`); `std::shared_ptr`
  (shared ownership, reference count `use_count`, `std::make_shared`); `std::weak_ptr` (observes without
  owning: `expired`, `lock`); cycles of `shared_ptr` leak, break them with `weak_ptr` (Core Guidelines
  R.20, R.24); prefer `unique_ptr` by default; an empty `shared_ptr` has count 0 and is false.
- **Visual**: `unique_ptr` = an `item` only one actor can hold; copying `shake`s; `std::move` = `give`.
  `shared_ptr` = several actors hold ropes tied to the same item, a `value` chip shows the count; the
  item `drop`s when the last rope is cut. `weak_ptr` = a ghost rope (dotted) that doesn't keep the item
  up; `lock()` turns it solid for a moment. A cycle = two items tied to each other floating forever
  (banner "LEAK").
- **Questions**:
  1. predict: `auto p = std::make_unique<int>(5); auto q = std::move(p); std::cout << (p == nullptr) << *q;` → `15` [R]
  2. predict "Does it compile?": `auto p = std::make_unique<int>(5); auto q = p;` → No: `use of deleted function 'std::unique_ptr<...>::unique_ptr(const std::unique_ptr<...>&)'` [C-]
  3. predict: `auto a = std::make_shared<int>(1); auto b = a; std::cout << a.use_count();` → `2` [R]
  4. predict: `auto a = std::make_shared<int>(1); { auto b = a; std::cout << a.use_count(); } std::cout << a.use_count();` → `21` [R]
  5. predict: `std::weak_ptr<int> w; { auto s = std::make_shared<int>(7); w = s; std::cout << w.expired(); } std::cout << w.expired();` → `01` [R]
  6. predict: `auto s = std::make_shared<int>(7); std::weak_ptr<int> w = s; if (auto p = w.lock()) std::cout << *p << " " << s.use_count();` → `7 2` [R]
  7. predict: top `struct Node { std::shared_ptr<Node> next; ~Node() { std::cout << "bye "; } };` main `{ auto a = std::make_shared<Node>(); auto b = std::make_shared<Node>(); a->next = b; b->next = a; } std::cout << "end";` → `end` (the cycle keeps both alive: no destructor runs) [R]
  8. predict: top TORCH, main `auto p = std::make_unique<Torch>("a"); p.reset(); std::cout << "|";` → `+a-a|` [R]
  9. pick "Default smart pointer for single ownership": `std::unique_ptr` / `std::shared_ptr` / raw `new` → `unique_ptr` [Doc: Core Guidelines R.20, R.21]
  10. predict: `std::shared_ptr<int> p; std::cout << p.use_count() << (p ? "y" : "n");` → `0n` [R]
  11. predict "Does it compile?": `auto p = std::make_unique<int>(1); std::vector<std::unique_ptr<int>> v; v.push_back(p);` → No (needs `std::move(p)`) [C-]
  12. predict: `auto arr = std::make_unique<int[]>(3); std::cout << arr[2];` → `0` (value-initialized) [R]
- **Run**: top `struct Child; struct Parent { std::shared_ptr<Child> child; ~Parent() { std::cout << "parent "; } }; struct Child { std::shared_ptr<Parent> parent; ~Child() { std::cout << "child "; } };`
  main `{ auto p = std::make_shared<Parent>(); auto c = std::make_shared<Child>(); p->child = c; c->parent = p; } std::cout << "end";`
  prints `end` (leak). Solution: `std::weak_ptr<Parent> parent;` in `Child`. Output `parent child end`.
  `expect`: `parent child`. [R]

### 2.5 Boss `lifetime-lich` (mode `boss`)

1. predict (ITEM): `Item a("x"); Item b(a); Item c(std::move(b));` → `copy move ` [R]
2. predict (ITEM): `std::vector<Item> v; v.push_back(Item("t"));` → `move ` [R]
3. predict: `auto p = std::make_shared<int>(1); auto q = p; p.reset(); std::cout << q.use_count() << *q;` → `11` [R]
4. predict (TORCH): `Torch a("a"); { Torch b("b"); auto c = std::make_unique<Torch>("c"); } Torch d("d");` → `+a+b+c-c-b+d-d-a` [R]
5. predict (TORCH): top `Torch make(std::string n) { return Torch(n); }` main `Torch t = make("m"); std::cout << "|";` → `+m|-m` (guaranteed elision: one object) [R]
6. predict (ITEM): `std::vector<Item> v; v.reserve(2); Item a("x"); v.push_back(a); v.push_back(std::move(a));` → `copy move ` [R]
7. predict: top `struct Spy { Spy() { std::cout << "D"; } Spy(const Spy&) { std::cout << "C"; } Spy& operator=(const Spy&) { std::cout << "A"; return *this; } };` main `Spy a; Spy b = a; Spy c; c = a;` → `DCDA` (`Spy b = a` is construction, not assignment) [R]
8. pick "Is `const std::string& f() { return "hi"; }` safe?": No, it returns a reference to a temporary that dies at the `return` (GCC: `returning reference to temporary`) / Yes, string literals live forever → No [C+]
9. pick "Rule of zero": manage resources with members like `std::vector` and `std::unique_ptr` so you write no destructor, copy or move / write all five special members / never use classes → the first [Doc: Core Guidelines C.20]

## Region 3: `polymorph-castle`, Inheritance, polymorphism and operators

### 3.1 `heirs-and-bases`, "Heirs and bases"

- **Concept**: `struct Derived : Base`; construction order base → members → derived body, destruction
  in reverse; `public` / `protected` / `private` access; `class` inherits privately by default;
  passing arguments to the base constructor; a base with no default constructor must be initialized
  explicitly; non-virtual functions are chosen by the **static** type; name hiding (a derived `f()`
  hides all base `f` overloads, `using Base::f;` brings them back).
- **Visual**: a derived actor `enter`s wearing the base's armor first (banner "Base"), then its own
  cape (banner "Derived"); leaving, it takes off the cape first. Private members are locked chests the
  heir can't open (`shake`).
- **Questions**:
  1. predict: top `struct Base { Base() { std::cout << "B"; } ~Base() { std::cout << "~B"; } }; struct Derived : Base { Derived() { std::cout << "D"; } ~Derived() { std::cout << "~D"; } };` main `Derived d;` → `BD~D~B` [R]
  2. predict "Does it compile?": top `class Base { int secret = 1; }; struct D : Base { int get() { return secret; } };` → No: `'int Base::secret' is private within this context` (`protected` would compile) [C-]
  3. predict: top `struct Animal { std::string sound() { return "..."; } }; struct Dog : Animal { std::string sound() { return "woof"; } };` main `Dog d; Animal& a = d; std::cout << a.sound() << d.sound();` → `...woof` (not virtual: static type decides) [R]
  4. predict: top `struct Base { int hp; Base(int h) : hp(h) {} }; struct Hero : Base { Hero() : Base(50) {} };` main `Hero h; std::cout << h.hp;` → `50` [R]
  5. predict "Does it compile?": top `struct Base { Base(int) {} }; struct Hero : Base { Hero() {} };` → No: `no matching function for call to 'Base::Base()'` [C-]
  6. predict "Does it compile?": top `class Base { public: int x = 1; }; class D : Base {};` main `D d; std::cout << d.x;` → No: `'int Base::x' is inaccessible` (`class` inherits privately by default) [C-]
  7. predict "Does it compile?": top `struct A { int f() { return 1; } int f(int) { return 2; } }; struct B : A { int f() { return 3; } };` main `B b; std::cout << b.f(5);` → No: `no matching function for call to 'B::f(int)'` (name hiding; fix with `using A::f;`) [C-]
  8. predict: top `struct A { A() { std::cout << "A"; } }; struct B { B() { std::cout << "B"; } }; struct C : A { B b; C() { std::cout << "C"; } };` main `C c;` → `ABC` (base, then members, then body) [R]
- **Run**: top `struct Unit { int hp; Unit(int h = 1) : hp(h) {} }; struct Knight : Unit { Knight() {} };`
  main `Knight k; std::cout << "hp: " << k.hp;` prints `hp: 1`. Solution: `Knight() : Unit(30) {}`.
  `expect`: `hp: 30`. [R]

### 3.2 `virtual-spells`, "Virtual spells"

- **Concept**: `virtual` makes the call depend on the **dynamic** type (through a reference or
  pointer); implemented with a vtable and a hidden vptr per object (so polymorphic objects are bigger);
  `override` makes the compiler check the signature (Core Guidelines C.128); `final` forbids further
  overriding/derivation; pure virtual `= 0` makes a class abstract; a virtual call inside a
  constructor does **not** dispatch to the derived class; default arguments are taken from the static
  type; calling the base version with `Base::f()`; `std::vector<std::unique_ptr<Base>>` as the
  polymorphic container.
- **Visual**: the enemy wears a costume (static type `Animal&`) but its real body (dynamic type `Dog`)
  decides the attack: `banner` "woof". Without `virtual`, the costume decides. `override` = a seal the
  compiler checks; a wrong signature makes it `shake`.
- **Questions** (top: ANIMAL unless stated):
  1. predict: `Dog d; Animal& a = d; std::cout << a.sound();` → `woof` [R]
  2. predict "Does it compile?": top ANIMAL + `struct Lion : Animal { std::string sound() override { return "roar"; } };` → No: `marked 'override', but does not override` (missing `const`) [C-]
  3. predict "Does it compile?": top `struct Shape { virtual double area() const = 0; };` main `Shape s;` → No: `cannot declare variable 's' to be of abstract type 'Shape'` [C-]
  4. predict: `std::vector<std::unique_ptr<Animal>> zoo; zoo.push_back(std::make_unique<Dog>()); zoo.push_back(std::make_unique<Animal>()); for (auto& a : zoo) std::cout << a->sound() << " ";` → `woof ... ` [R]
  5. predict "Does it compile?": top ANIMAL + `struct Puppy final : Dog {}; struct X : Puppy {};` → No: `cannot derive from 'final' base 'Puppy'` [C-]
  6. predict: top `struct Base { Base() { hello(); } virtual void hello() { std::cout << "base "; } virtual ~Base() = default; }; struct D : Base { void hello() override { std::cout << "derived "; } };` main `D d; d.hello();` → `base derived ` [R]
  7. predict: top `struct A { int x; }; struct B { int x; virtual void f() {} };` main `std::cout << (sizeof(B) > sizeof(A));` → `1` (the hidden vptr) [R]
  8. predict: top `struct A { virtual void f(int x = 1) { std::cout << "A" << x; } virtual ~A() = default; }; struct B : A { void f(int x = 2) override { std::cout << "B" << x; } };` main `B b; A& a = b; a.f(); b.f();` → `B1B2` (body is dynamic, default argument is static) [R] (senior)
  9. predict: `Dog d; std::cout << d.Animal::sound();` → `...` [R]
  10. predict "Does it compile?": top `struct Base { void f() {} }; struct D : Base { void f() override {} };` → No (`override` on a non-virtual) [C-]
  11. pick "What does `override` buy you?": a compile error if the function doesn't actually override a virtual / faster calls / makes the function virtual in the base → the first [Doc: Core Guidelines C.128]
- **Run**: top `struct Spell { std::string name() const { return "spell"; } }; struct Fireball : Spell { std::string name() const { return "fireball"; } }; void cast(const Spell& s) { std::cout << "cast " << s.name(); }`
  main `Fireball f; cast(f);` prints `cast spell`. Solution: `virtual std::string name() const` in `Spell`
  (plus `virtual ~Spell() = default;` and `override` in `Fireball`). `expect`: `cast fireball`. [R]

### 3.3 `sliced-shields`, "Sliced shields and virtual destructors"

- **Concept**: object slicing: copying a derived object into a base **value** keeps only the base part
  (pass polymorphic objects by reference or pointer, Core Guidelines C.67); `std::vector<Base>` slices;
  virtual destructors: deleting a derived object through a base pointer without a virtual destructor is
  UB (Core Guidelines C.35: base destructors should be public and virtual, or protected and
  non-virtual); `dynamic_cast` to check the real type; `shared_ptr` created by `make_shared<Derived>`
  remembers the right deleter (senior nuance).
- **Visual**: slicing = `clone` through a narrow door: the costume is cut off (banner "SLICED"), the
  copy only knows the base move. Non-virtual destructor via base pointer: only the base armor `drop`s,
  the derived cape stays floating (banner "UB").
- **Questions** (top: ANIMAL unless stated):
  1. predict: `Dog d; Animal a = d; std::cout << a.sound();` → `...` [R]
  2. predict: top ANIMAL + `void speak(Animal a) { std::cout << a.sound(); } void speakRef(const Animal& a) { std::cout << a.sound(); }` main `Dog d; speak(d); std::cout << " "; speakRef(d);` → `... woof` [R]
  3. predict: `std::vector<Animal> v; v.push_back(Dog{}); std::cout << v[0].sound();` → `...` [R]
  4. predict: top `struct Base { virtual ~Base() { std::cout << "~B"; } }; struct D : Base { ~D() override { std::cout << "~D"; } };` main `std::unique_ptr<Base> p = std::make_unique<D>(); p.reset();` → `~D~B` [R]
  5. pick "Is it safe?": top `struct Base { ~Base() {} }; struct D : Base { std::string s = "x"; };` main `Base* p = new D; delete p;` → No: UB, `Base` needs a virtual destructor / Yes → No [C+]
  6. predict: `Dog dog; Animal& a = dog; std::cout << (dynamic_cast<Dog*>(&a) != nullptr) << (dynamic_cast<Cat*>(&a) != nullptr);` → `10` [R]
  7. predict: top `struct Base { ~Base() { std::cout << "~B"; } }; struct D : Base { ~D() { std::cout << "~D"; } };` main `{ std::shared_ptr<Base> p = std::make_shared<D>(); } std::cout << "|";` → `~D~B|` (the control block stores a deleter for `D`; `unique_ptr<Base>` would be UB here) [R] (senior)
  8. pick "When does a class need a virtual destructor?": when it is meant to be used as a polymorphic base (deleted through a base pointer) / always / never with smart pointers → the first [Doc: Core Guidelines C.35]
- **Run**: top `struct Shape { virtual std::string name() const { return "shape"; } virtual ~Shape() = default; }; struct Circle : Shape { std::string name() const override { return "circle"; } }; void show(Shape s) { std::cout << "drawing " << s.name(); }`
  main `Circle c; show(c);` prints `drawing shape`. Solution: `void show(const Shape& s)`.
  `expect`: `drawing circle`. [R]

### 3.4 `operator-runes`, "Operator runes"

- **Concept**: overloading `+` as a `const` member, `operator<<` as a free function returning the
  stream; C++20 defaulted `==` (and `!=` rewritten from it) and `<=>` (generates `<`, `>`, ...);
  prefix vs postfix `++`; function objects (`operator()`); `operator[]`; compound assignment returns
  `*this` by reference; `const` correctness of operators.
- **Visual**: an operator is a rune carved on the item: `a + b` = two gems fuse into a new gem
  (`clone` + merge); `<<` = the gem `print`s its own description.
- **Questions** (top: VEC unless stated):
  1. predict: `Vec a{1, 2}, b{3, 4}; std::cout << a + b;` → `(4,6)` [R]
  2. predict: `std::cout << (Vec{1, 2} == Vec{1, 2}) << (Vec{1, 2} != Vec{2, 1});` → `11` [R]
  3. predict "Does it compile?": `Vec a{1, 2}; bool b = a < a;` → No: `no match for 'operator<'` [C-]
  4. predict: top `struct Ver { int major, minor; auto operator<=>(const Ver&) const = default; };` main `std::cout << (Ver{1, 9} < Ver{2, 0}) << (Ver{1, 2} < Ver{1, 1});` → `10` (memberwise, in declaration order) [R]
  5. predict: top `struct Counter { int n = 0; Counter& operator++() { ++n; return *this; } Counter operator++(int) { Counter old = *this; ++n; return old; } };` main `Counter c; Counter a = c++; Counter b = ++c; std::cout << a.n << b.n << c.n;` → `022` [R]
  6. predict "Does it compile?": top `struct Hero { int hp = 1; void hit() { hp--; } };` main `const Hero h{}; h.hit();` → No (non-`const` member on a `const` object) [C-]
  7. predict: top `struct Mult { int k; int operator()(int x) const { return x * k; } };` main `Mult triple{3}; std::cout << triple(5);` → `15` [R]
  8. predict: top `struct Bag { std::vector<std::string> items{"sword", "key"}; const std::string& operator[](std::size_t i) const { return items[i]; } };` main `Bag b; std::cout << b[1];` → `key` [R]
  9. predict: top `struct Money { int c; Money& operator+=(int x) { c += x; return *this; } };` main `Money m{1}; (m += 2) += 3; std::cout << m.c;` → `6` (returning a reference lets calls chain on the same object) [R]
  10. type: `std::ostream& operator<<(std::ostream& os, const Vec& v) { ___ os << v.x; }` → `return` [Doc]
- **Run**: top `struct Money { int cents; Money operator+(const Money& o) const { return Money{cents + cents}; } };`
  main `Money a{150}, b{275}; std::cout << "total: " << (a + b).cents;` prints `total: 300`. Solution:
  `return Money{cents + o.cents};`. `expect`: `total: 425`. [R]

### 3.5 Boss `vtable-dragon` (mode `boss`)

1. predict: top `struct A { virtual void f() { std::cout << "A"; } void g() { f(); } virtual ~A() = default; }; struct B : A { void f() override { std::cout << "B"; } };` main `B b; b.g(); A a = b; a.g();` → `BA` (second call is on a sliced copy) [R]
2. predict: top `struct A { A() { std::cout << "A"; } ~A() { std::cout << "~A"; } }; struct M { M() { std::cout << "M"; } ~M() { std::cout << "~M"; } }; struct C : A { M m; C() { std::cout << "C"; } ~C() { std::cout << "~C"; } };` main `C c;` → `AMC~C~M~A` [R]
3. predict: top `struct Shape { virtual int sides() const = 0; virtual ~Shape() = default; }; struct Tri : Shape { int sides() const override { return 3; } }; struct Sq : Shape { int sides() const override { return 4; } };` main `std::vector<std::unique_ptr<Shape>> v; v.push_back(std::make_unique<Tri>()); v.push_back(std::make_unique<Sq>()); int total = 0; for (const auto& s : v) total += s->sides(); std::cout << total;` → `7` [R]
4. predict: the default-argument snippet (3.2 q8) → `B1B2` [R]
5. predict: the constructor-virtual-call snippet (3.2 q6) → `base derived ` [R]
6. predict "Does it compile?": `Lion` with missing `const` + `override` (3.2 q2) → No [C-]
7. predict: `Ver` spaceship (3.4 q4) → `10` [R]
8. predict: the `std::vector<Animal>` slicing snippet (3.3 q3) → `...` [R]
9. predict: top `void f(int) { std::cout << "int"; } void f(double) { std::cout << "double"; }` main `f(1.0f); f('c');` → `doubleint` (promotions: `float`→`double`, `char`→`int`) [R]

## Region 4: `template-tower`, Generic and modern C++

### 4.1 `template-forge`, "The template forge"

- **Concept**: function templates and argument deduction (both arguments must deduce the same `T`, or
  give it explicitly); class templates with type and non-type parameters; full specialization of
  function and class templates; `constexpr` functions and `static_assert`; `constexpr` requires
  constant arguments; `if constexpr` discards the untaken branch; C++20 concepts (`std::integral`,
  `std::floating_point`, custom `concept`, constrained templates); variadic templates, `sizeof...`
  and fold expressions.
- **Visual**: a template is a forge mold; `biggest<int>` and `biggest<double>` are two swords poured
  from the same mold (`clone` with different `value` chips). A specialization is a hand-made sword
  that replaces the mold for one type. A concept is a guard at the forge door: a `std::string` trying
  to enter `twice` makes the guard `shake`.
- **Questions**:
  1. predict: top `template <typename T> T biggest(T a, T b) { return a > b ? a : b; }` main `std::cout << biggest(3, 7) << " " << biggest(2.5, 1.5);` → `7 2.5` [R]
  2. predict "Does it compile?": same top, main `std::cout << biggest(3, 7.5);` → No: `no matching function for call to 'biggest(int, double)'` [C-]; then predict `std::cout << biggest<double>(3, 7.5);` → `7.5` [R]
  3. predict: top `template <typename T> std::string kind(T) { return "thing"; } template <> std::string kind<int>(int) { return "int"; }` main `std::cout << kind(1) << kind(1.0) << kind('c');` → `intthingthing` [R]
  4. predict: top `template <typename T, int N> struct Bag { T items[N]; int size() const { return N; } };` main `Bag<std::string, 3> b; std::cout << b.size();` → `3` [R]
  5. predict: top `constexpr int sq(int x) { return x * x; } static_assert(sq(4) == 16);` main `int arr[sq(3)]; std::cout << sizeof(arr) / sizeof(arr[0]);` → `9` [R]
  6. predict "Does it compile?": top `constexpr int fn(int x) { return x; }` main `int n = 3; constexpr int k = fn(n);` → No: `the value of 'n' is not usable in a constant expression` [C-]
  7. predict: top `template <typename T> std::string describe(T x) { if constexpr (std::is_integral_v<T>) return "int:" + std::to_string(x); else return "other"; }` main `std::cout << describe(4) << " " << describe(std::string("a"));` → `int:4 other` [R]
  8. predict: top `template <typename T> concept Numeric = std::integral<T> || std::floating_point<T>; template <Numeric T> T twice(T x) { return x * 2; }` main `std::cout << twice(21) << " " << twice(1.5);` → `42 3` [R]; "Does `twice(std::string("a"));` compile?" → No (constraint not satisfied) [C-]
  9. predict: top `template <typename T> struct Name { static constexpr const char* v = "?"; }; template <> struct Name<bool> { static constexpr const char* v = "bool"; };` main `std::cout << Name<int>::v << Name<bool>::v;` → `?bool` [R]
  10. predict: top `template <typename... Ts> auto sum(Ts... xs) { return (xs + ...); } template <typename... Ts> int count(Ts...) { return sizeof...(Ts); }` main `std::cout << sum(1, 2, 3, 4) << " " << count(1, "a", 2.0);` → `10 3` [R]
  11. predict: top `template <typename T> void show(T) { std::cout << "T "; } void show(int) { std::cout << "int "; }` main `show(1); show(1L); show<int>(1);` → `int T T ` (an exact non-template match wins; explicit `<int>` forces the template) [R] (mid/senior)
- **Run**: top `template <typename T> T average(T a, T b) { return (a + b) / 2; }` main `std::cout << "avg: " << average(3, 4);`
  prints `avg: 3`. Solution: `average<double>(3, 4)` (or `average(3.0, 4.0)`). `expect`: `avg: 3.5`. [R]

### 4.2 `lambda-scrolls`, "Lambda scrolls and the STL"

- **Concept**: lambdas (`[captures](params) { body }`); capture by value (snapshot at creation) vs by
  reference; `mutable` lets a by-value capture change its own copy; init captures `[n = 0]`; copying a
  lambda copies its state; STL algorithms with lambdas: `std::sort` with a comparator, `count_if`,
  `find_if`, `transform`, `accumulate` (the type of the initial value decides the result type!);
  `std::remove` doesn't shrink (erase-remove idiom, or C++20 `std::erase`); `std::map` (sorted, tree,
  O(log n)) vs `std::unordered_map` (hash, average O(1), unspecified order); `map[key]` inserts a
  default; `reserve` vs `size`; iterator / reference invalidation when a `vector` grows; dangling
  reference captures.
- **Visual**: a lambda is a `key` item with a small backpack (`scroll`) holding its captures: `[x]`
  `clone`s `x` into the backpack, `[&x]` puts a `lend` ghost there. `mutable` = the backpack copy can
  be edited. `std::sort` = actors line up; the comparator lambda `say`s who goes first. `map[k]` on a
  missing key = a new empty actor `enter`s. Vector growth = the whole scroll is rewritten on a bigger
  sheet and old `tag`s point at the burnt sheet (`dead`).
- **Questions**:
  1. predict: `auto add = [](int a, int b) { return a + b; }; std::cout << add(2, 3);` → `5` [R]
  2. predict: `int x = 1; auto byVal = [x] { return x; }; auto byRef = [&x] { return x; }; x = 5; std::cout << byVal() << byRef();` → `15` [R]
  3. predict: `int n = 0; auto inc = [n]() mutable { return ++n; }; inc(); inc(); std::cout << inc() << n;` → `30` [R]
  4. predict "Does it compile?": `int n = 0; auto inc = [n] { ++n; };` → No: `increment of read-only variable 'n'` [C-]
  5. predict: `std::vector<int> v{3, 1, 2}; std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; }); for (int x : v) std::cout << x;` → `321` [R]
  6. predict: `std::vector<int> v{1, 2, 3, 4, 5, 6}; std::cout << std::count_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });` → `3` [R]
  7. predict: `std::vector<double> v{0.5, 0.5, 0.5}; std::cout << std::accumulate(v.begin(), v.end(), 0) << " " << std::accumulate(v.begin(), v.end(), 0.0);` → `0 1.5` (initial value `0` is an `int`) [R]
  8. predict: `std::map<std::string, int> m{{"b", 2}, {"a", 1}, {"c", 3}}; for (const auto& [k, v] : m) std::cout << k << v;` → `a1b2c3` [R]; pick "Which container guarantees sorted iteration?": `std::map` / `std::unordered_map` → `std::map` [Doc]
  9. predict: `std::map<std::string, int> m; if (m["ghost"] == 0) std::cout << m.size();` → `1` (`[]` inserts) [R]
  10. predict: `std::vector<int> v{1, 2, 3, 2}; auto it = std::remove(v.begin(), v.end(), 2); std::cout << v.size() << " "; v.erase(it, v.end()); std::cout << v.size();` → `4 2` [R]; C++20: `std::erase(v, 2); std::cout << v.size() << v[1];` on `{1, 2, 3, 2}` → `23` [R]
  11. predict: `std::vector<int> v{1, 2, 3}; std::transform(v.begin(), v.end(), v.begin(), [](int x) { return x * x; }); auto it = std::find_if(v.begin(), v.end(), [](int x) { return x > 3; }); std::cout << *it << " " << (it - v.begin());` → `4 1` [R]
  12. pick "Is it safe?": `std::vector<int> v{1, 2, 3}; int& first = v[0]; v.push_back(4); std::cout << first;` → No: `push_back` may reallocate and invalidate `first` (UB) / Yes → No [C+] (cppreference `std::vector` invalidation table); deterministic contrast: `std::vector<int> v; v.reserve(10); std::cout << v.size() << " " << (v.capacity() >= 10);` → `0 1` [R]
  13. pick "Is it safe?": top `auto make() { int hp = 5; return [&hp] { return hp; }; }` main `std::cout << make()();` → No: the lambda holds a dangling reference to `hp` / Yes → No [C+]
  14. predict: `auto counter = [n = 0]() mutable { return ++n; }; counter(); auto copy = counter; counter(); std::cout << counter() << copy();` → `32` (copying a lambda copies its state) [R]
- **Run**: starter `int hits = 0; auto hit = [hits]() mutable { hits++; }; hit(); hit(); std::cout << "hits: " << hits;`
  prints `hits: 0`. Solution: `auto hit = [&hits]() { hits++; };`. `expect`: `hits: 2`. [R]

### 4.3 `modern-relics`, "Modern relics: C++17/20"

- **Concept**: structured bindings (copy by default, `auto&` to bind to the original); `if` with
  initializer; `std::optional` (`value_or`, `has_value`, `*`, `->`); `std::variant` (`index`,
  `std::get` throws `std::bad_variant_access`, `std::visit`); `std::string_view` (non-owning view,
  cheap `substr`, dangling when built from a temporary `std::string`); `auto` drops top-level `const`
  and references, `auto&` keeps `const`; `decltype(x)` vs `decltype((x))`; brace init with
  `initializer_list` (`vector{2, 5}` vs `vector(2, 5)`); ranges and views (`filter`, `transform`,
  lazy pipelines).
- **Visual**: `optional` = a chest that may be empty (`value_or` = a spare item the hero carries).
  `variant` = a shape-shifting item showing one form at a time (`banner` with the active index).
  `string_view` = a window looking at someone else's scroll; when the scroll burns (temporary dies),
  the window shows ash (banner "UB"). Ranges = a conveyor belt of actors passing gates (filter) and
  forges (transform).
- **Questions**:
  1. predict: `std::pair<std::string, int> p{"gem", 3}; auto [name, qty] = p; std::cout << name << qty;` → `gem3` [R]
  2. predict: top `std::optional<int> find(bool ok) { if (ok) return 7; return std::nullopt; }` main `std::cout << find(true).value_or(0) << find(false).value_or(0) << find(false).has_value();` → `700` [R]
  3. predict: `std::variant<int, std::string> v = 5; v = std::string("hi"); std::cout << v.index() << std::get<std::string>(v);` → `1hi` [R]
  4. predict: `std::variant<int, std::string> v = 5; try { std::get<std::string>(v); } catch (const std::bad_variant_access&) { std::cout << "wrong"; }` → `wrong` [R]
  5. predict: `std::variant<int, double> v = 2.5; std::visit([](auto x) { std::cout << x * 2; }, v);` → `5` [R]
  6. predict: `std::string_view sv = "dragon"; std::cout << sv.substr(0, 4) << sv.size();` → `drag6` [R]
  7. pick "Is it safe?": `std::string_view sv = std::string("temp") + "!"; std::cout << sv;` → No: the temporary string dies at the `;`, `sv` dangles (UB) / Yes → No [C+] (cppreference `basic_string_view`)
  8. predict: `const int x = 5; auto a = x; a = 6; std::cout << a;` → `6` (`auto` drops top-level `const`) [R]; "Does `const int x = 5; auto& b = x; b = 6;` compile?" → No: `assignment of read-only reference 'b'` [C-]
  9. predict: `int x = 1; decltype(x) y = 2; decltype((x)) z = x; z = 9; std::cout << x << y;` → `92` (`decltype((x))` is `int&`) [R] (senior)
  10. predict: `std::vector<int> v{1, 2, 3, 4, 5, 6}; for (int x : v | std::views::filter([](int n) { return n % 2 == 0; }) | std::views::transform([](int n) { return n * n; })) std::cout << x << " ";` → `4 16 36 ` [R]
  11. predict: `std::vector<int> a{2, 5}; std::vector<int> b(2, 5); std::cout << a.size() << a[0] << " " << b.size() << b[0];` → `22 25` [R]
  12. predict: `std::map<std::string, int> m{{"cave", 30}}; if (auto [it, ok] = m.insert({"cave", 99}); !ok) std::cout << it->second;` → `30` (`insert` doesn't overwrite) [R]
  13. predict: `std::optional<std::string> name; std::cout << name.value_or("anon") << " "; name = "Ada"; std::cout << *name << name->size();` → `anon Ada3` [R]
  14. predict: `auto x = {1, 2}; std::cout << x.size();` → `2` (`auto` + braces = `std::initializer_list<int>`) [R]
- **Run**: starter `std::pair<std::string, int> chest{"cave", 30}; auto [name, gold] = chest; gold += 10; std::cout << name << " gold: " << chest.second;`
  prints `cave gold: 30`. Solution: `auto& [name, gold] = chest;`. `expect`: `gold: 40`. [R]

### 4.4 `thread-storm`, "Thread storm"

- **Concept**: `std::thread` runs a function in parallel; `join()` waits (and makes the thread's writes
  visible); a joinable `std::thread` destroyed without `join`/`detach` calls `std::terminate`;
  `std::jthread` (C++20) joins automatically; arguments are copied into the thread (use `std::ref`
  for references); data race = two threads touching the same non-atomic variable with at least one
  write and no synchronization → UB; `std::mutex` + `std::lock_guard` (RAII lock, Core Guidelines
  CP.20); `std::atomic`; deadlock from locking two mutexes in opposite order, fixed by
  `std::scoped_lock(a, b)`; `std::async` / `std::future::get`.
- **Visual**: each thread is an extra ally running in parallel; `join` = the ally walks back to the hero
  before the hero speaks. A shared chest (variable) with two allies grabbing it at once = items fly
  everywhere (banner "DATA RACE / UB"). The mutex is a single `key`: only the actor holding it can open
  the chest; `lock_guard` gives the key back automatically at `}`.
- **Questions**:
  1. predict: `int total = 0; std::thread t([&total] { total = 42; }); t.join(); std::cout << total;` → `42` [R]
  2. pick "A `std::thread` object is destroyed while still joinable. What happens?": `std::terminate` is called / it is joined automatically / it is detached → `std::terminate` (use `std::jthread` to auto-join) [Doc: cppreference `std::thread::~thread`]
  3. predict: `int count = 0; std::mutex m; auto work = [&] { for (int i = 0; i < 1000; ++i) { std::lock_guard<std::mutex> lock(m); ++count; } }; std::thread a(work), b(work); a.join(); b.join(); std::cout << count;` → `2000` [R]
  4. pick "Same program without the mutex: what is it?": a data race (UB), the result can be anything / always 2000 / always 1000 → data race [C+]
  5. predict: `std::atomic<int> c{0}; auto work = [&] { for (int i = 0; i < 1000; ++i) c++; }; std::thread a(work), b(work); a.join(); b.join(); std::cout << c;` → `2000` [R]
  6. predict: `int x = 0; { std::jthread t([&] { x = 7; }); } std::cout << x;` → `7` [R]
  7. pick "Why `std::lock_guard` instead of `m.lock(); ... m.unlock();`?": it unlocks on every path, including exceptions and early returns (RAII) / it is faster / it allows two threads in at once → RAII [Doc: Core Guidelines CP.20]
  8. pick "Thread 1 locks `a` then `b`; thread 2 locks `b` then `a`. Risk?": deadlock; lock both with `std::scoped_lock lock(a, b);` / data race / none → deadlock [Doc]; and predict: top `std::mutex a, b; int gold = 0;` main `auto work = [&] { for (int i = 0; i < 100; ++i) { std::scoped_lock lock(a, b); ++gold; } }; std::thread t1(work), t2(work); t1.join(); t2.join(); std::cout << gold;` → `200` [R]
  9. predict: `auto f = std::async(std::launch::async, [] { return 6 * 7; }); std::cout << f.get();` → `42` [R]
  10. predict "Does it compile?": top `void addLoot(int& loot) { loot += 100; }` main `int loot = 0; std::thread t(addLoot, loot); t.join();` → No: `static assertion failed: std::thread arguments must be invocable after conversion to rvalues` (needs `std::ref(loot)`) [C-]
- **Run**: top `void addLoot(int loot) { loot += 100; }` main `int loot = 0; std::thread t(addLoot, loot); t.join(); std::cout << "loot: " << loot;`
  prints `loot: 0`. Solution: `void addLoot(int& loot)` and `std::thread t(addLoot, std::ref(loot));`.
  `expect`: `loot: 100`. [R]

### 4.5 Boss `undefined-overlord` (mode `boss`): "Defined or undefined?"

Mixed, timed. UB items are `pick` questions verified only by compiling [C+]; their answers come from
cppreference's Undefined behavior page.

1. predict: `unsigned int u = UINT_MAX; u = u + 1; std::cout << u;` → `0` (unsigned wraps: defined) [R]
2. pick "`int big = INT_MAX; std::cout << big + 1;`": UB (signed overflow) / prints `INT_MIN` / prints `0` → UB [C+]
3. pick "`std::vector<int> v{1, 2, 3}; for (auto it = v.begin(); it != v.end(); ++it) if (*it == 2) v.push_back(4);`": UB (iterator invalidation) / prints nothing, safe → UB [C+]
4. pick "`std::vector<int> v{1, 2, 3}; auto it = v.begin(); v.clear(); std::cout << *it;`": UB / prints 1 → UB [C+]
5. pick "`int arr[3] = {1, 2, 3}; std::cout << arr[3];`": UB (out of bounds) / prints 0 → UB [C+]
6. pick "`std::string s = "x"; std::string t = std::move(s); std::cout << s.size();`": defined but the value is unspecified (valid but unspecified state) / UB → not UB [C+]
7. pick "`g(a(), b())` where `a` and `b` print: the order is…": unspecified / always left to right / UB → unspecified [C+]
8. pick "`void boom() noexcept { throw 1; }` called: what happens?": `std::terminate` (GCC warns `'throw' will always call 'terminate'`) / the exception propagates / UB → `std::terminate` [C+]
9. predict: `std::vector<int> v{5, 3, 8}; auto [mn, mx] = std::minmax_element(v.begin(), v.end()); std::cout << *mn << *mx;` → `38` [R]
10. predict: `std::unordered_map<std::string, int> m{{"a", 1}}; m["b"]; std::cout << m.size() << m.count("c") << m.size();` → `202` (`count` doesn't insert, `[]` does) [R]
11. predict: the `show` template vs overload snippet (4.1 q11) → `int T T ` [R]

---

# Entry exam

Follows [../exams.md](../exams.md): bank ≥ 1.6 × `count`, round-robin draw across topics, sorted by
difficulty. Topic ids that link to a region let a strong result skip it.

## Topics

| Topic id | Name (en) | Region |
|---|---|---|
| `basics` | Types, operators and `const` | `value-village` |
| `references` | References and parameter passing | `value-village` |
| `pointers` | Pointers, stack and heap | `value-village` |
| `containers` | `vector` and `string` | `value-village` |
| `classes` | Classes, constructors and initialization | `lifetime-forest` |
| `raii` | Destructors and RAII | `lifetime-forest` |
| `move` | Copy, move and the rule of 3/5/0 | `lifetime-forest` |
| `smart_pointers` | Smart pointers | `lifetime-forest` |
| `inheritance` | Inheritance and access | `polymorph-castle` |
| `polymorphism` | Virtual functions, slicing, virtual destructors | `polymorph-castle` |
| `operators` | Operator overloading | `polymorph-castle` |
| `templates` | Templates, `constexpr` and concepts | `template-tower` |
| `lambdas_stl` | Lambdas, algorithms and containers | `template-tower` |
| `modern` | C++17/20: bindings, optional, variant, views | `template-tower` |
| `concurrency` | Threads, mutexes and atomics | `template-tower` |
| `ub` | Undefined behavior | (none) |
| `exceptions` | Exceptions and `noexcept` | (none) |
| `memory_model` | Atomics, memory order and cache effects | (none) |
| `performance` | Copy elision, moves and cost of abstractions | (none) |

## Levels

| Exam | Draws / bank | Pass | s/question | Topic ids (bank count) |
|---|---|---|---|---|
| `junior`, Junior C++ Developer | 12 / 22 | 70% | 30 | basics 3, references 3, pointers 3, containers 3, classes 3, raii 3, polymorphism 2, ub 2 |
| `mid`, Mid-level C++ Developer | 14 / 24 | 70% | 40 | move 3, smart_pointers 3, raii 2, classes 2, inheritance 2, polymorphism 3, operators 1, lambdas_stl 3, templates 2, ub 2, exceptions 1 |
| `senior`, Senior C++ Developer | 15 / 26 | 75% | 50 | move 3, polymorphism 2, templates 3, modern 3, lambdas_stl 2, concurrency 3, memory_model 2, performance 3, ub 3, exceptions 2 |

Descriptions (budget 120): junior "Simulates a first C++ screening: values, references, pointers,
vectors, classes and destructors."; mid "Simulates a mid-level screening: move semantics, smart
pointers, virtual dispatch, STL and lambdas."; senior "Simulates a senior screening: templates,
concurrency, the memory model, performance and UB."

Difficulty guide: 1 = a fact or a two-line trace; 2 = a trap that needs the rule (slicing, `const`
move, `map[]` insert); 3 = a combination or a senior nuance (`noexcept` and `vector` growth, virtual
default arguments, `decltype((x))`, `shared_ptr` deleter).

### Junior examples

1. `basics` predict: `std::cout << 7 / 2 << " " << 7.0 / 2;` → `3 3.5` [R]
2. `basics` predict "Does it compile?": `int x{3.7};` → No [C-]
3. `references` predict: `void heal(int hp) { hp += 10; }` then `int hp = 5; heal(hp); std::cout << hp;` → `5` [R]
4. `references` predict: `int a = 1, b = 2; int& r = a; r = b; b = 7; std::cout << a << r;` → `22` [R]
5. `pointers` predict: `int a = 1, b = 2; int* p = &a; p = &b; *p = 9; std::cout << a << b;` → `19` [R]
6. `pointers` predict "Does it compile?": `int x = 1; const int* p = &x; *p = 2;` → No [C-]
7. `containers` predict: `std::vector<int> a(3); std::vector<int> b{3}; std::cout << a.size() << b.size();` → `31` [R]
8. `containers` predict "Does it compile?": `std::string s = "a" + "b";` → No [C-]
9. `classes` predict "Does it compile?": `class Hero { int hp = 100; };` then `Hero h; std::cout << h.hp;` → No [C-]
10. `raii` predict (TORCH): `Torch a("a"); Torch b("b");` → `+a+b-b-a` [R]
11. `raii` predict (TORCH): `try { Torch a("a"); throw 1; } catch (int) { std::cout << "!"; }` → `+a-a!` [R]
12. `polymorphism` predict (ANIMAL): `Dog d; Animal& a = d; std::cout << a.sound();` → `woof` [R]
13. `ub` pick: `std::vector<int> v{1, 2, 3}; std::cout << v[5];` → UB [C+]
14. `ub` pick: `int* make() { int x = 5; return &x; }` → dangling pointer, UB [C+]
15. `basics` predict: top `int next() { static int n = 0; return ++n; }` main `next(); next(); std::cout << next();` → `3` [R]
16. `containers` predict: `std::string s = "abc"; std::cout << (s.find("z") == std::string::npos);` → `1` [R]; `std::cout << std::string("abc").substr(1) << std::string("hero").find("ro");` → `bc2` [R]

### Mid examples

1. `move` predict (ITEM): `const Item a("gem"); Item b = std::move(a);` → `copy ` [R]
2. `move` predict (ITEM + `void take(Item i) {}`): `Item a("gem"); take(a); take(std::move(a));` → `copy move ` [R]
3. `move` predict "Does it compile?" (ITEM): `Item a("a"); Item b("b"); b = a;` → No (user-declared move constructor deletes copy assignment) [C-]
4. `smart_pointers` predict: `auto a = std::make_shared<int>(1); { auto b = a; std::cout << a.use_count(); } std::cout << a.use_count();` → `21` [R]
5. `smart_pointers` predict: the `Node` cycle snippet (2.4 q7) → `end` [R]
6. `classes` predict: the init-order `Log` snippet (2.1 q3) → `BA` [R]
7. `classes` predict: `Hero h(); std::cout << "end";` with a printing default constructor → `end` [R]
8. `inheritance` predict "Does it compile?": name hiding `b.f(5)` (3.1 q7) → No [C-]
9. `polymorphism` predict (ANIMAL): `std::vector<Animal> v; v.push_back(Dog{}); std::cout << v[0].sound();` → `...` [R]
10. `polymorphism` predict: virtual call in constructor (3.2 q6) → `base derived ` [R]
11. `operators` predict: postfix/prefix `Counter` (3.4 q5) → `022` [R]
12. `lambdas_stl` predict: `int n = 0; auto inc = [n]() mutable { return ++n; }; inc(); inc(); std::cout << inc() << n;` → `30` [R]
13. `lambdas_stl` predict: `std::map<std::string, int> m; if (m["ghost"] == 0) std::cout << m.size();` → `1` [R]
14. `lambdas_stl` predict: `std::remove` without `erase` (4.2 q10) → `4 2` [R]
15. `templates` predict "Does it compile?": `biggest(3, 7.5)` with `template <typename T> T biggest(T a, T b)` → No [C-]
16. `ub` pick: reference into a `vector` then `push_back` (4.2 q12) → UB [C+]
17. `exceptions` predict (TORCH + `Boom`): constructor throws (2.2 q7) → `+t-t!` [R]

### Senior examples

1. `move` predict: `std::vector<Item> v; v.reserve(1); v.emplace_back("a"); v.emplace_back("b");` where `Item`'s move constructor is **not** `noexcept` → `copy ` (with `noexcept` → `move `) [R]
2. `performance` predict (ITEM + `Item make() { Item local("x"); return std::move(local); }`): `Item a = make();` → `move ` (the `std::move` blocks copy elision; `return local;` is the right form) [R] (Core Guidelines F.48)
3. `performance` pick "Cost of a virtual call compared with a template (CRTP)": an indirect call through the vtable that usually can't be inlined / exactly the same, always inlined → the first [Doc: HFT guides]
4. `polymorphism` predict: virtual function with different default arguments (3.2 q8) → `B1B2` [R]
5. `polymorphism` predict: `std::shared_ptr<Base> p = std::make_shared<D>();` with non-virtual destructors (3.3 q7) → `~D~B|` [R]
6. `templates` predict: `show(1); show(1L); show<int>(1);` (4.1 q11) → `int T T ` [R]
7. `templates` predict: `if constexpr` + `std::to_string` (4.1 q7) → `int:4 other` [R]
8. `modern` predict: `int x = 1; decltype(x) y = 2; decltype((x)) z = x; z = 9; std::cout << x << y;` → `92` [R]
9. `modern` pick: `std::string_view sv = std::string("temp") + "!";` → dangling view, UB [C+]
10. `lambdas_stl` predict: `std::accumulate(v.begin(), v.end(), 0)` over `{0.5, 0.5, 0.5}` → `0` [R]
11. `lambdas_stl` predict: copied `mutable` lambda counter (4.2 q14) → `32` [R]
12. `concurrency` predict "Does it compile?": `std::thread t(addLoot, loot);` with `void addLoot(int&)` → No [C-]
13. `concurrency` pick: the counter without a mutex → data race, UB [C+]
14. `memory_model` pick "Producer writes `data`, then sets `std::atomic<bool> ready` with `memory_order_release`; consumer spins on `ready` with `memory_order_acquire`, then reads `data`. Is the read of `data` safe?": Yes, release/acquire creates a happens-before edge / No, needs a mutex / Only with `relaxed` → Yes [Doc: cppreference `std::memory_order`]
15. `memory_model` pick "Two threads update two different counters that sit on the same 64-byte cache line. Effect?": false sharing slows both down; pad or align (`alignas(64)` / `std::hardware_destructive_interference_size`) / a data race / no effect → false sharing [Doc: HFT guides]
16. `ub` pick: `struct P { int b; int a; P() : a(1), b(a + 1) {} };` → reads `a` uninitialized, UB [C+]
17. `exceptions` pick "Strong exception guarantee means…": if the operation throws, the state is as before the call / no exception is ever thrown / resources are not leaked but the state may change → the first [Doc: cppreference Exceptions, exception safety]
18. `exceptions` predict: `void a() noexcept {} void b() {}` then `std::cout << noexcept(a()) << noexcept(b());` → `10` [R]

## Extra verified snippets for the banks

All [R] unless noted; use them to fill the banks to their sizes.

| Id | Snippet | Answer |
|---|---|---|
| E2 | `std::string s(3, 'a'); std::cout << s;` | `aaa` |
| E5 | top `void f(int) { std::cout << "int"; } void f(double) { std::cout << "double"; }` main `f(1.0f); f('c');` | `doubleint` |
| E8 | `int a[] = {1, 2, 3}; std::cout << sizeof(a) / sizeof(a[0]);` | `3` |
| E12 | `auto arr = std::make_unique<int[]>(3); std::cout << arr[2];` | `0` |
| E16 | top `struct S { S() { std::cout << "S"; } ~S() { std::cout << "~S"; } }; S& get() { static S s; return s; }` main `std::cout << "a"; get(); get(); std::cout << "b";` | `aSb~S` (constructed once on first call, destroyed after `main`) |
| E18 | `std::vector<int> v{1, 2, 3}; v.insert(v.begin(), 0); std::cout << v.size() << v[0] << v[1];` | `401` |
| X1 | `const std::map<std::string, int> m{{"a", 1}}; m["a"];` "Compiles?" | No (`operator[]` is non-`const`; use `at` or `find`) [C-] |
| X2 | `std::unique_ptr<int> a = std::make_unique<int>(1); std::unique_ptr<int> b; b = a;` "Compiles?" | No [C-] |

## Verification notes

- 190 runtime snippets ([R]) were built and executed on Compiler Explorer (GCC 14.2, `-std=c++20 -O1`)
  on 2026-10-06; every stdout matched the answers above exactly. Threads (`std::thread`, `std::jthread`,
  `std::async`) execute correctly in that runner.
- 36 compile-fail snippets ([C-]) were built and each produced a GCC error inside the snippet; quoted
  messages are GCC 14's (simplified by removing namespaces and template noise).
- 19 conceptual snippets ([C+], UB / unspecified / `noexcept` + `throw`) were built successfully. GCC
  warnings seen: `-Wreturn-local-addr` (returning `&local` and a reference to a temporary),
  `-Wterminate` (`throw` in a `noexcept` function), `-Wvexing-parse` (`Hero h();`).
- Authors re-verifying single snippets: each check is a full translation unit (includes + top +
  `int main() { body }`), so state such as `std::boolalpha` does not leak between questions.

## Sources

- cppreference, Undefined behavior: https://en.cppreference.com/w/cpp/language/ub
- cppreference, Rule of three/five/zero: https://en.cppreference.com/w/cpp/language/rule_of_three
- cppreference, Copy elision: https://en.cppreference.com/w/cpp/language/copy_elision
- cppreference, `std::vector` (iterator invalidation): https://en.cppreference.com/w/cpp/container/vector
- cppreference, `std::vector` move constructor (source guaranteed empty): https://en.cppreference.com/w/cpp/container/vector/vector
- cppreference, Constructors and member initializer lists (initialization order): https://en.cppreference.com/w/cpp/language/constructor
- cppreference, Virtual function specifier: https://en.cppreference.com/w/cpp/language/virtual
- cppreference, `std::shared_ptr`, `std::weak_ptr`: https://en.cppreference.com/w/cpp/memory/shared_ptr , https://en.cppreference.com/w/cpp/memory/weak_ptr
- cppreference, `std::basic_string_view`: https://en.cppreference.com/w/cpp/string/basic_string_view
- cppreference, `std::thread::~thread`: https://en.cppreference.com/w/cpp/thread/thread/~thread
- cppreference, `std::memory_order`: https://en.cppreference.com/w/cpp/atomic/memory_order
- cppreference, Exceptions (exception safety): https://en.cppreference.com/w/cpp/language/exceptions
- C++ Core Guidelines (R.1, R.11, R.20, R.21, R.24, C.20, C.21, C.35, C.47, C.66, C.67, C.128, ES.20, F.16, F.48, CP.20): https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines
- Hiring research and question sources: [cpp-hiring-assessments.md](cpp-hiring-assessments.md)
