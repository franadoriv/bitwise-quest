import type { Beat, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";

// REGION 3 · POLYMORPH CASTLE  (inheritance, virtual/override/final, slicing and virtual destructors, operators)

const say = (text: Text): Beat => ({ kind: "dialog", speaker: "master", text });
const enemySays = (text: Text): Beat => ({ kind: "dialog", speaker: "enemy", text });

/** Dedent a code block written inline (drops the first newline and the common indentation). */
const cc = (s: string) => {
  const lines = s.replace(/^\n+/, "").replace(/\s+$/, "").split("\n");
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => (l.match(/^ */) ?? [""])[0].length));
  return lines.map((l) => l.slice(ind)).join("\n");
};

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const SAFE = L("Is it safe?", "¿Es seguro?", "安全？");
const YES = L("Yes", "Sí", "はい");
const NO_GCC = L("No: g++ stops it", "No: g++ lo detiene", "いいえ：g++ が止める");

const ANIMAL = cc(`
  struct Animal {
    virtual std::string sound() const { return "..."; }
    virtual ~Animal() = default;
  };
  struct Dog : Animal {
    std::string sound() const override { return "woof"; }
  };`);

const VEC = cc(`
  struct Vec {
    int x, y;
    Vec operator+(const Vec& o) const { return {x + o.x, y + o.y}; }
    bool operator==(const Vec&) const = default;
  };
  std::ostream& operator<<(std::ostream& os, const Vec& v) {
    return os << "(" << v.x << "," << v.y << ")";
  }`);

// ─── 3.1 Heirs and bases ───────────────────────────────────────────────────
const heirs: LessonDef = {
  slug: "heirs-and-bases",
  title: L("Heirs and bases", "Herederos y bases", "継承：親と子"),
  concept: "inheritance",
  mode: "lesson",
  xp: 70,
  enemy: "cpp/segfault-skull",
  enemyName: L("HEIR SKULL", "CRÁNEO HEREDERO", "ツギテスカル"),
  beats: [
    say(L(
      "Welcome to Polymorph Castle! A class can INHERIT: struct Knight : Unit gets all of Unit, then adds its own parts.",
      "¡Bienvenido al Castillo Polimorfo! Una clase puede HEREDAR: struct Knight : Unit recibe todo Unit y suma lo suyo.",
      "ポリモーフ城へようこそ！クラスは継承できる。struct Knight : Unit は Unit を全部もらい、自分の部品を足すよ。",
    )),
    {
      kind: "act",
      prompt: L("Build an heir and watch the armor go on", "Crea un heredero y mira la armadura", "子クラスを作って、よろいの順番を見よう"),
      steps: [
        { label: L("BASE", "BASE", "親"), line: 'struct Base { Base() { std::cout << "B"; } ~Base() { std::cout << "~B"; } };', effects: [{ t: "item", kind: "shield", holder: "hero" }, { t: "tag", actor: "hero", text: "Base" }] },
        { label: L("DERIVED", "DERIVADA", "子"), line: 'struct Derived : Base { Derived() { std::cout << "D"; } ~Derived() { std::cout << "~D"; } };', effects: [{ t: "tag", actor: "hero", text: "Derived" }] },
        { label: L("CREATE", "CREAR", "作る"), line: "{ Derived d;", effects: [{ t: "banner", text: L("Base first!", "¡Base primero!", "親が先！") }, { t: "print", text: "BD" }], output: "BD" },
        { label: L("CLOSE }", "CERRAR }", "} で閉じる"), line: "}", effects: [{ t: "say", actor: "hero", text: L("Cape off first", "Primero la capa", "マントから脱ぐ") }, { t: "drop" }, { t: "print", text: "~D~B" }], output: "~D~B" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: cc(`
        struct Base {
          Base() { std::cout << "B"; }
          ~Base() { std::cout << "~B"; }
        };
        struct Derived : Base {
          Derived() { std::cout << "D"; }
          ~Derived() { std::cout << "~D"; }
        };
        int main() { Derived d; }`),
      options: ["BD~D~B", "DB~B~D", "BD~B~D"],
      answer: 0,
      output: "BD~D~B",
      check: { compiles: true, stdout: "BD~D~B" },
      explain: L("The base is built first and destroyed last, like armor: on first, off last.", "La base se construye primero y se destruye al final, como una armadura.", "親が最初に作られ、最後にこわされる。よろいと同じで、先に着て後で脱ぐ。"),
      win: [{ t: "print", text: "BD~D~B" }],
    },
    say(L(
      "Full order: base first, then the members, then the derived body. Destruction runs the exact reverse.",
      "Orden completo: primero la base, luego los miembros y al final el cuerpo derivado. Al destruir, al revés.",
      "順番は、親 → メンバー → 子の本体。こわすときはちょうど逆になるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: cc(`
        struct A { A() { std::cout << "A"; } };
        struct B { B() { std::cout << "B"; } };
        struct C : A {
          B b;
          C() { std::cout << "C"; }
        };
        int main() { C c; }`),
      options: ["ABC", "BAC", "CBA"],
      answer: 0,
      output: "ABC",
      check: { compiles: true, stdout: "ABC" },
      explain: L("A is the base, b is a member, and the C body runs last.", "A es la base, b es un miembro y el cuerpo de C corre al final.", "A は親、b はメンバー、C の本体は最後に動く。"),
      win: [{ t: "print", text: "ABC" }],
    },
    say(L(
      "private parts stay locked, even for heirs. protected opens them to heirs only; public opens them to everyone.",
      "Lo private queda cerrado, incluso para herederos. protected lo abre solo a herederos; public, a todos.",
      "private は子どもにも開かない。protected は子だけに、public はみんなに開くよ。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: cc(`
        class Base {
          int secret = 1;
        };
        struct D : Base {
          int get() { return secret; }
        };
        int main() {}`),
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("In a class, members are private by default: 'int Base::secret' is private within this context.", "En class, los miembros son private por defecto: 'int Base::secret' is private within this context.", "class のメンバーは標準で private。'secret' is private within this context になる。"),
      win: [{ t: "shake" }, { t: "say", actor: "hero", text: L("Locked chest!", "¡Cofre cerrado!", "カギつきの箱！") }],
    },
    {
      kind: "pick",
      prompt: L("Open it to heirs only", "Ábrelo solo a herederos", "子だけに開こう"),
      code: cc(`
        class Base {
        ___:
          int secret = 1;
        };
        struct D : Base {
          int get() { return secret; }
        };
        int main() { D d; std::cout << d.get(); }`),
      options: ["protected", "private"],
      answer: 0,
      check: { compiles: true, stdout: "1", wrongFail: true },
      explain: L("protected lets D read secret, but code outside the family still can't.", "protected deja que D lea secret, pero el código de afuera sigue sin poder.", "protected なら D は secret を読める。外のコードは読めないまま。"),
      win: [{ t: "print", text: "1" }],
    },
    say(L(
      "The heir can pass values to the base constructor in its init list: Hero() : Base(50) {}.",
      "El heredero puede pasar valores al constructor base en su lista de inicio: Hero() : Base(50) {}.",
      "子は初期化リストで親のコンストラクタに値を渡せる：Hero() : Base(50) {}。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: cc(`
        struct Base {
          int hp;
          Base(int h) : hp(h) {}
        };
        struct Hero : Base {
          Hero() : Base(50) {}
        };
        int main() { Hero h; std::cout << h.hp; }`),
      options: ["50", "0", L("Nothing: it fails", "Nada: falla", "何も：失敗")],
      answer: 0,
      output: "50",
      check: { compiles: true, stdout: "50" },
      explain: L("Base(50) runs first and sets hp to 50.", "Base(50) corre primero y pone hp en 50.", "Base(50) が先に動いて hp を 50 にする。"),
      win: [{ t: "print", text: "50" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: cc(`
        struct Base {
          Base(int) {}
        };
        struct Hero : Base {
          Hero() {}
        };
        int main() { Hero h; }`),
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("Base has no default constructor, so Hero must call Base(...): no matching function for call to 'Base::Base()'.", "Base no tiene constructor por defecto, así que Hero debe llamar a Base(...): no matching function for call to 'Base::Base()'.", "Base には引数なしのコンストラクタがない。Hero は Base(...) を呼ぶ必要がある。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "One trap: a plain member function is chosen by the STATIC type, the type the code sees, not the real object.",
      "Una trampa: una función miembro común se elige por el tipo ESTÁTICO, el que ve el código, no el objeto real.",
      "ワナに注意。ふつうのメンバー関数は、本物の型ではなくコード上の型（静的な型）で選ばれる。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: cc(`
        struct Animal { std::string sound() { return "..."; } };
        struct Dog : Animal { std::string sound() { return "woof"; } };
        int main() {
          Dog d;
          Animal& a = d;
          std::cout << a.sound() << d.sound();
        }`),
      options: ["...woof", "woofwoof", "......"],
      answer: 0,
      output: "...woof",
      check: { compiles: true, stdout: "...woof" },
      explain: L("a is an Animal&, so a.sound() calls Animal's version. The next lesson fixes this with virtual.", "a es un Animal&, así que a.sound() llama a la versión de Animal. La próxima lección lo arregla con virtual.", "a は Animal& なので Animal 版が呼ばれる。次のレッスンで virtual を使って直すよ。"),
      win: [{ t: "print", text: "...woof" }],
    },
    {
      kind: "type",
      prompt: L("Pass 30 to the base", "Pasa 30 a la base", "親に 30 を渡そう"),
      code: cc(`
        struct Unit {
          int hp;
          Unit(int h) : hp(h) {}
        };
        struct Knight : Unit {
          Knight() : ___(30) {}
        };
        int main() { Knight k; std::cout << k.hp; }`),
      answer: "Unit",
      check: { compiles: true, stdout: "30" },
      explain: L("In the init list you call the base by its name: Unit(30).", "En la lista de inicio llamas a la base por su nombre: Unit(30).", "初期化リストでは親を名前で呼ぶ：Unit(30)。"),
      win: [{ t: "print", text: "30" }],
    },
    {
      kind: "run",
      prompt: L("The knight must start with 30 hp", "El caballero debe empezar con 30 hp", "騎士を hp 30 で始めさせよう"),
      starter: cc(`
        #include <iostream>

        struct Unit {
          int hp;
          Unit(int h = 1) : hp(h) {}
        };
        struct Knight : Unit {
          Knight() {}
        };

        int main() {
          Knight k;
          std::cout << "hp: " << k.hp;
        }`) + "\n",
      solution: cc(`
        #include <iostream>

        struct Unit {
          int hp;
          Unit(int h = 1) : hp(h) {}
        };
        struct Knight : Unit {
          Knight() : Unit(30) {}
        };

        int main() {
          Knight k;
          std::cout << "hp: " << k.hp;
        }`) + "\n",
      expect: "hp: 30",
      fallback: [String.raw`Knight\s*\(\s*\)\s*:\s*Unit\s*[({]\s*30\s*[)}]`],
      explain: L("Without an init list, Unit uses its default 1. Write Knight() : Unit(30) {}.", "Sin lista de inicio, Unit usa su valor por defecto 1. Escribe Knight() : Unit(30) {}.", "初期化リストがないと Unit は標準の 1 を使う。Knight() : Unit(30) {} と書こう。"),
    },
  ],
};

// ─── 3.2 Virtual spells ────────────────────────────────────────────────────
const virtualSpells: LessonDef = {
  slug: "virtual-spells",
  title: L("Virtual spells", "Hechizos virtuales", "virtual の呪文"),
  concept: "virtual",
  mode: "lesson",
  xp: 75,
  enemy: "cpp/ub-imp",
  enemyName: L("COSTUME IMP", "DIABLILLO DISFRAZ", "ヘンソウインプ"),
  beats: [
    say(L(
      "Mark a function virtual and the REAL object decides, even through a base reference or pointer.",
      "Marca una función como virtual y decide el objeto REAL, incluso a través de una referencia o puntero base.",
      "関数に virtual をつけると、親の参照やポインタ越しでも本物のオブジェクトが決める。",
    )),
    {
      kind: "act",
      prompt: L("Dress the dog as an Animal and call it", "Disfraza al perro de Animal y llámalo", "犬に Animal の服を着せて呼ぼう"),
      steps: [
        { label: L("VIRTUAL", "VIRTUAL", "virtual"), line: 'struct Animal { virtual std::string sound() const { return "..."; } };', effects: [{ t: "tag", actor: "enemy", text: "Animal" }] },
        { label: L("OVERRIDE", "OVERRIDE", "override"), line: 'struct Dog : Animal { std::string sound() const override { return "woof"; } };' },
        { label: L("COSTUME", "DISFRAZ", "変装"), line: "Dog d; Animal& a = d;", effects: [{ t: "say", actor: "enemy", text: L("I'm an Animal...", "Soy un Animal...", "ただの Animal…") }] },
        { label: L("CALL", "LLAMAR", "呼ぶ"), line: "std::cout << a.sound();", effects: [{ t: "banner", text: L("Really a Dog!", "¡Era un Dog!", "正体は Dog！") }, { t: "attack", from: "hero", to: "enemy" }, { t: "print", text: "woof" }], output: "woof" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: ANIMAL + "\nint main() {\n  Dog d;\n  Animal& a = d;\n  std::cout << a.sound();\n}",
      options: ["woof", "...", "...woof"],
      answer: 0,
      output: "woof",
      check: { compiles: true, stdout: "woof" },
      explain: L("sound is virtual, so the call follows the real object, a Dog, through the hidden vtable.", "sound es virtual, así que la llamada sigue al objeto real, un Dog, por la vtable oculta.", "sound は virtual。隠れた vtable を通って、本物の Dog の関数が呼ばれる。"),
      win: [{ t: "print", text: "woof" }],
    },
    say(L(
      "Write override on the heir's version: the compiler then checks it REALLY replaces a virtual function.",
      "Escribe override en la versión del heredero: el compilador revisa que REALMENTE reemplace una función virtual.",
      "子の関数に override と書こう。本当に virtual 関数を置きかえているか、コンパイラが確かめる。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: ANIMAL + '\nstruct Lion : Animal {\n  std::string sound() override { return "roar"; }\n};\nint main() {}',
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("const is missing, so it's a different function: marked 'override', but does not override. Without override, the typo would hide.", "Falta const, así que es otra función: marked 'override', but does not override. Sin override, el error quedaría oculto.", "const がないので別の関数あつかい：marked 'override', but does not override。"),
      win: [{ t: "shake" }, { t: "say", actor: "hero", text: L("Seal broken!", "¡Sello roto!", "封印エラー！") }],
    },
    {
      kind: "predict",
      prompt: L("What does override give you?", "¿Qué te da override?", "override で得られるのは？"),
      code: 'std::string sound() const override { return "woof"; }',
      options: [
        L("An error if nothing is overridden", "Un error si no reemplaza nada", "置きかえ失敗ならエラー"),
        L("Faster calls", "Llamadas más rápidas", "呼び出しが速くなる"),
        L("Makes the base virtual", "Hace virtual la base", "親を virtual にする"),
      ],
      answer: 0,
      explain: L("override changes nothing at run time. It's a check: the compiler fails if no virtual function matches.", "override no cambia nada al ejecutar. Es un control: el compilador falla si no coincide ninguna función virtual.", "override は実行時には何も変えない。合う virtual 関数がなければエラーにするチェックだよ。"),
    },
    say(L(
      "= 0 makes a function pure virtual: no body here, heirs must write it. A class with one is ABSTRACT.",
      "= 0 hace una función virtual pura: sin cuerpo aquí, los herederos deben escribirla. Su clase es ABSTRACTA.",
      "= 0 で純粋仮想関数になる。ここには中身がなく、子が書く。それを持つクラスは抽象クラス。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: cc(`
        struct Shape {
          virtual double area() const = 0;
        };
        int main() {
          Shape s;
        }`),
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("You can't create an abstract object: cannot declare variable 's' to be of abstract type 'Shape'.", "No se puede crear un objeto abstracto: cannot declare variable 's' to be of abstract type 'Shape'.", "抽象クラスのオブジェクトは作れない：abstract type 'Shape' のエラー。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: ANIMAL + "\nint main() {\n  std::vector<std::unique_ptr<Animal>> zoo;\n  zoo.push_back(std::make_unique<Dog>());\n  zoo.push_back(std::make_unique<Animal>());\n  for (auto& a : zoo) std::cout << a->sound() << \" \";\n}",
      options: ["woof ...", "... ...", "woof woof"],
      answer: 0,
      output: "woof ... ",
      check: { compiles: true, stdout: "woof ..." },
      explain: L("A vector of unique_ptr<Animal> keeps each real object, so each one answers with its own sound.", "Un vector de unique_ptr<Animal> guarda cada objeto real, y cada uno responde con su propio sonido.", "unique_ptr<Animal> の vector は本物を保つので、それぞれが自分の声で答える。"),
      win: [{ t: "print", text: "woof ..." }],
    },
    say(L(
      "final closes the door: a final class can't be inherited, and a final function can't be overridden again.",
      "final cierra la puerta: no se puede heredar de una clase final ni volver a reemplazar una función final.",
      "final は扉を閉じる。final クラスは継承できず、final 関数はもう置きかえられない。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: ANIMAL + "\nstruct Puppy final : Dog {};\nstruct X : Puppy {};\nint main() {}",
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("Puppy is final: cannot derive from 'final' base 'Puppy'.", "Puppy es final: cannot derive from 'final' base 'Puppy'.", "Puppy は final：cannot derive from 'final' base 'Puppy'。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "Careful inside constructors: while Base is being built, the Derived part doesn't exist yet.",
      "Cuidado en los constructores: mientras se construye Base, la parte Derived aún no existe.",
      "コンストラクタの中は要注意。Base を作っている間、子の部分はまだ存在しない。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: cc(`
        struct Base {
          Base() { hello(); }
          virtual void hello() { std::cout << "base "; }
          virtual ~Base() = default;
        };
        struct D : Base {
          void hello() override { std::cout << "derived "; }
        };
        int main() { D d; d.hello(); }`),
      options: ["base derived", "derived derived", "base base"],
      answer: 0,
      output: "base derived ",
      check: { compiles: true, stdout: "base derived" },
      explain: L("A virtual call inside Base() stays in Base: D isn't built yet. Later, d.hello() reaches D.", "Una llamada virtual dentro de Base() se queda en Base: D aún no existe. Luego d.hello() llega a D.", "Base() の中の virtual 呼び出しは Base 止まり。D はまだないから。後の d.hello() は D に届く。"),
      win: [{ t: "print", text: "base derived" }],
    },
    {
      kind: "type",
      prompt: L("Ask the compiler to check it", "Pide al compilador que lo revise", "コンパイラにチェックさせよう"),
      code: ANIMAL + '\nstruct Lion : Animal {\n  std::string sound() const ___ { return "roar"; }\n};\nint main() { Lion l; Animal& a = l; std::cout << a.sound(); }',
      answer: "override",
      check: { compiles: true, stdout: "roar" },
      explain: L("override goes after const. Now a typo in the signature is a compile error, not a silent bug.", "override va después de const. Ahora un error en la firma es un error de compilación, no un bug silencioso.", "override は const の後。シグネチャの書きまちがいがコンパイルエラーになる。"),
      win: [{ t: "print", text: "roar" }],
    },
    {
      kind: "run",
      prompt: L("Make cast() use the real spell", "Haz que cast() use el hechizo real", "cast() で本物の呪文を使わせよう"),
      starter: cc(`
        #include <iostream>
        #include <string>

        struct Spell {
          std::string name() const { return "spell"; }
        };
        struct Fireball : Spell {
          std::string name() const { return "fireball"; }
        };
        void cast(const Spell& s) { std::cout << "cast " << s.name(); }

        int main() {
          Fireball f;
          cast(f);
        }`) + "\n",
      solution: cc(`
        #include <iostream>
        #include <string>

        struct Spell {
          virtual std::string name() const { return "spell"; }
          virtual ~Spell() = default;
        };
        struct Fireball : Spell {
          std::string name() const override { return "fireball"; }
        };
        void cast(const Spell& s) { std::cout << "cast " << s.name(); }

        int main() {
          Fireball f;
          cast(f);
        }`) + "\n",
      expect: "cast fireball",
      fallback: [String.raw`virtual\s+std::string\s+name\s*\(\s*\)\s*const`],
      explain: L("Without virtual, s.name() follows the static type Spell. Add virtual in Spell (plus a virtual destructor and override).", "Sin virtual, s.name() sigue el tipo estático Spell. Agrega virtual en Spell (y un destructor virtual y override).", "virtual がないと静的な型 Spell の name が呼ばれる。Spell に virtual をつけよう。"),
    },
  ],
};

// ─── 3.3 Sliced shields and virtual destructors ───────────────────────────
const sliced: LessonDef = {
  slug: "sliced-shields",
  title: L("Sliced shields", "Escudos rebanados", "切られた盾"),
  concept: "slicing",
  mode: "lesson",
  xp: 75,
  enemy: "cpp/leak-slime",
  enemyName: L("SLICER SLIME", "BABOSA REBANADORA", "キリトリスライム"),
  beats: [
    say(L(
      "Copy a Dog into a plain Animal VALUE and only the Animal part fits. The rest is cut off: that's SLICING.",
      "Copia un Dog en un VALOR Animal y solo cabe la parte Animal. El resto se corta: eso es SLICING.",
      "Dog を Animal の「値」にコピーすると Animal 部分しか入らない。残りは切り落とされる。これがスライシング。",
    )),
    {
      kind: "act",
      prompt: L("Push the dog through the narrow door", "Pasa al perro por la puerta estrecha", "犬をせまい扉に通してみよう"),
      steps: [
        { label: L("DOG", "DOG", "Dog"), line: "Dog d;", effects: [{ t: "item", kind: "shield", holder: "hero" }, { t: "tag", actor: "hero", text: "d" }] },
        { label: L("COPY", "COPIAR", "コピー"), line: "Animal a = d;", effects: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "a" }, { t: "banner", text: L("SLICED!", "¡REBANADO!", "スライス！") }] },
        { label: L("CALL", "LLAMAR", "呼ぶ"), line: "std::cout << a.sound();", effects: [{ t: "say", actor: "ally", text: L("Just an Animal", "Solo un Animal", "ただの Animal") }, { t: "print", text: "..." }], output: "..." },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: ANIMAL + "\nint main() {\n  Dog d;\n  Animal a = d;\n  std::cout << a.sound();\n}",
      options: ["...", "woof", L("It doesn't compile", "No compila", "コンパイルできない")],
      answer: 0,
      output: "...",
      check: { compiles: true, stdout: "..." },
      explain: L("a is a new Animal object, not a Dog. virtual can't help: the Dog part was never copied.", "a es un objeto Animal nuevo, no un Dog. virtual no ayuda: la parte Dog nunca se copió.", "a は新しい Animal で、Dog ではない。Dog 部分はコピーされていないので virtual も効かない。"),
      win: [{ t: "print", text: "..." }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: ANIMAL + "\nvoid speak(Animal a) { std::cout << a.sound(); }\nvoid speakRef(const Animal& a) { std::cout << a.sound(); }\nint main() {\n  Dog d;\n  speak(d); std::cout << \" \"; speakRef(d);\n}",
      options: ["... woof", "woof woof", "... ..."],
      answer: 0,
      output: "... woof",
      check: { compiles: true, stdout: "... woof" },
      explain: L("Passing by value slices; passing by reference keeps the real Dog. Pass polymorphic objects by & or pointer.", "Pasar por valor rebana; por referencia conserva el Dog real. Pasa objetos polimórficos por & o puntero.", "値渡しはスライスし、参照渡しは本物の Dog を保つ。ポリモーフィックな型は & かポインタで。"),
      win: [{ t: "print", text: "... woof" }],
    },
    say(L(
      "A std::vector<Animal> stores Animal values, so it slices too. For a mixed zoo, store pointers like unique_ptr.",
      "Un std::vector<Animal> guarda valores Animal, así que también rebana. Para un zoo mixto, guarda punteros como unique_ptr.",
      "std::vector<Animal> は Animal の値を入れるので、やはりスライスする。混ぜたいなら unique_ptr を入れよう。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: ANIMAL + "\nint main() {\n  std::vector<Animal> v;\n  v.push_back(Dog{});\n  std::cout << v[0].sound();\n}",
      options: ["...", "woof"],
      answer: 0,
      output: "...",
      check: { compiles: true, stdout: "..." },
      explain: L("push_back copies only the Animal part of the Dog into the vector.", "push_back copia al vector solo la parte Animal del Dog.", "push_back は Dog の Animal 部分だけを vector にコピーする。"),
      win: [{ t: "print", text: "..." }],
    },
    say(L(
      "Deleting a Derived through a Base pointer? Base needs a VIRTUAL destructor, so the Derived part is cleaned up too.",
      "¿Borras un Derived con un puntero Base? Base necesita un destructor VIRTUAL para limpiar también la parte Derived.",
      "親のポインタで子を消す？なら親のデストラクタは virtual に。子の部分も片づけられる。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: cc(`
        struct Base {
          virtual ~Base() { std::cout << "~B"; }
        };
        struct D : Base {
          ~D() override { std::cout << "~D"; }
        };
        int main() {
          std::unique_ptr<Base> p = std::make_unique<D>();
          p.reset();
        }`),
      options: ["~D~B", "~B", "~B~D"],
      answer: 0,
      output: "~D~B",
      check: { compiles: true, stdout: "~D~B" },
      explain: L("The destructor is virtual, so deleting through Base runs ~D first, then ~B.", "El destructor es virtual, así que borrar por Base corre primero ~D y luego ~B.", "デストラクタが virtual なので、Base 経由でも ~D、~B の順に動く。"),
      win: [{ t: "drop" }, { t: "print", text: "~D~B" }],
    },
    {
      kind: "predict",
      prompt: SAFE,
      code: cc(`
        struct Base { ~Base() {} };
        struct D : Base { std::string s = "x"; };
        int main() {
          Base* p = new D;
          delete p;
        }`),
      options: [
        L("No: UB, ~Base isn't virtual", "No: UB, ~Base no es virtual", "いいえ：UB、~Base が非 virtual"),
        L("Yes: delete cleans it all", "Sí: delete limpia todo", "はい：delete で全部消える"),
      ],
      answer: 0,
      check: {
        compiles: true,
        program: "#include <string>\nstruct Base { ~Base() {} };\nstruct D : Base { std::string s = \"x\"; };\nvoid neverCalled() {\n  Base* p = new D;\n  delete p;\n}\nint main() {}\n",
      },
      explain: L("It compiles, but deleting a D through a Base* without a virtual destructor is undefined behavior.", "Compila, pero borrar un D con un Base* sin destructor virtual es comportamiento indefinido.", "コンパイルは通るが、virtual でないデストラクタで Base* から D を消すのは未定義動作。"),
      win: [{ t: "banner", text: L("UB!", "¡UB!", "UB！") }, { t: "shake" }],
    },
    say(L(
      "Need the real type back? dynamic_cast<Dog*>(&a) gives a Dog* if a is really a Dog, or nullptr if not.",
      "¿Necesitas el tipo real? dynamic_cast<Dog*>(&a) da un Dog* si a es realmente un Dog, o nullptr si no.",
      "本物の型を知りたい？dynamic_cast<Dog*>(&a) は本当に Dog なら Dog*、違えば nullptr を返す。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: ANIMAL + "\nstruct Cat : Animal {};\nint main() {\n  Dog dog;\n  Animal& a = dog;\n  std::cout << (dynamic_cast<Dog*>(&a) != nullptr)\n            << (dynamic_cast<Cat*>(&a) != nullptr);\n}",
      options: ["10", "11", "01"],
      answer: 0,
      output: "10",
      check: { compiles: true, stdout: "10" },
      explain: L("a really is a Dog: the Dog cast works (1), the Cat cast gives nullptr (0).", "a realmente es un Dog: el cast a Dog funciona (1), el de Cat da nullptr (0).", "a の正体は Dog。Dog へのキャストは成功（1）、Cat は nullptr（0）。"),
      win: [{ t: "print", text: "10" }],
    },
    {
      kind: "type",
      prompt: L("Give Shape a safe destructor", "Dale a Shape un destructor seguro", "Shape に安全なデストラクタを"),
      code: cc(`
        struct Shape {
          virtual std::string name() const { return "shape"; }
          virtual ~Shape() = ___;
        };
        int main() {
          std::unique_ptr<Shape> s = std::make_unique<Shape>();
          std::cout << s->name();
        }`),
      answer: "default",
      check: { compiles: true, stdout: "shape" },
      explain: L("virtual ~Shape() = default; is the classic line for a base meant to be used through pointers.", "virtual ~Shape() = default; es la línea clásica para una base que se usará con punteros.", "virtual ~Shape() = default; はポインタで使う親クラスの定番の一行。"),
      win: [{ t: "print", text: "shape" }],
    },
    {
      kind: "run",
      prompt: L("Stop show() from slicing the circle", "Evita que show() rebane el círculo", "show() で円が切られないようにしよう"),
      starter: cc(`
        #include <iostream>
        #include <string>

        struct Shape {
          virtual std::string name() const { return "shape"; }
          virtual ~Shape() = default;
        };
        struct Circle : Shape {
          std::string name() const override { return "circle"; }
        };
        void show(Shape s) { std::cout << "drawing " << s.name(); }

        int main() {
          Circle c;
          show(c);
        }`) + "\n",
      solution: cc(`
        #include <iostream>
        #include <string>

        struct Shape {
          virtual std::string name() const { return "shape"; }
          virtual ~Shape() = default;
        };
        struct Circle : Shape {
          std::string name() const override { return "circle"; }
        };
        void show(const Shape& s) { std::cout << "drawing " << s.name(); }

        int main() {
          Circle c;
          show(c);
        }`) + "\n",
      expect: "drawing circle",
      fallback: [String.raw`void\s+show\s*\(\s*(const\s+)?Shape\s*&`, String.raw`void\s+show\s*\(\s*Shape\s+const\s*&`],
      explain: L("show(Shape s) copies only the Shape part. Take it by reference: show(const Shape& s).", "show(Shape s) copia solo la parte Shape. Recíbelo por referencia: show(const Shape& s).", "show(Shape s) は Shape 部分だけコピーする。参照で受けよう：show(const Shape& s)。"),
    },
  ],
};

// ─── 3.4 Operator runes ────────────────────────────────────────────────────
const operators: LessonDef = {
  slug: "operator-runes",
  title: L("Operator runes", "Runas de operadores", "演算子のルーン"),
  concept: "operators",
  mode: "lesson",
  xp: 75,
  enemy: "golem",
  enemyName: L("RUNE GOLEM", "GÓLEM DE RUNAS", "ルーンゴーレム"),
  beats: [
    say(L(
      "Your own types can use operators: write operator+ and a + b fuses two gems. operator<< teaches cout to print them.",
      "Tus tipos pueden usar operadores: escribe operator+ y a + b fusiona dos gemas. operator<< enseña a cout a imprimirlas.",
      "自分の型にも演算子が使える。operator+ を書けば a + b で宝石が合体。operator<< で cout に表示できる。",
    )),
    {
      kind: "act",
      prompt: L("Carve the + rune and fuse two gems", "Talla la runa + y fusiona dos gemas", "+ のルーンを刻んで、宝石を合体させよう"),
      steps: [
        { label: L("TYPE", "TIPO", "型"), line: "struct Vec { int x, y; };", effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "a", value: "(1,2)" }] },
        { label: L("RUNE +", "RUNA +", "+ のルーン"), line: "Vec operator+(const Vec& o) const { return {x + o.x, y + o.y}; }", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "b", value: "(3,4)" }] },
        { label: L("RUNE <<", "RUNA <<", "<< のルーン"), line: "std::ostream& operator<<(std::ostream& os, const Vec& v) { return os << ...; }" },
        { label: L("FUSE", "FUSIONAR", "合体"), line: "std::cout << a + b;", effects: [{ t: "give", to: "hero" }, { t: "value", actor: "hero", text: "(4,6)" }, { t: "print", text: "(4,6)" }], output: "(4,6)" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: VEC + "\nint main() {\n  Vec a{1, 2}, b{3, 4};\n  std::cout << a + b;\n}",
      options: ["(4,6)", "(1,2)(3,4)", "(3,4)"],
      answer: 0,
      output: "(4,6)",
      check: { compiles: true, stdout: "(4,6)" },
      explain: L("a + b calls a.operator+(b), which builds a new Vec. Then operator<< prints it.", "a + b llama a a.operator+(b), que crea un Vec nuevo. Luego operator<< lo imprime.", "a + b は a.operator+(b) を呼んで新しい Vec を作る。それを operator<< が表示する。"),
      win: [{ t: "print", text: "(4,6)" }],
    },
    say(L(
      "C++20 can write some for you: bool operator==(const Vec&) const = default; compares every member, and != comes free.",
      "C++20 puede escribir algunos por ti: bool operator==(const Vec&) const = default; compara cada miembro, y != viene gratis.",
      "C++20 は自動で書いてくれる。operator== を = default にすると全メンバーを比べ、!= もついてくる。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: VEC + "\nint main() {\n  std::cout << (Vec{1, 2} == Vec{1, 2})\n            << (Vec{1, 2} != Vec{2, 1});\n}",
      options: ["11", "10", "01"],
      answer: 0,
      output: "11",
      check: { compiles: true, stdout: "11" },
      explain: L("Same members: equal (1). Different members: != is true (1). C++20 rewrites != from ==.", "Mismos miembros: iguales (1). Distintos: != es true (1). C++20 reescribe != a partir de ==.", "メンバーが同じなら等しい（1）。違えば != が true（1）。!= は == から作られる。"),
      win: [{ t: "print", text: "11" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: VEC + "\nint main() {\n  Vec a{1, 2};\n  bool b = a < a;\n}",
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("== doesn't give you <. g++ says: no match for 'operator<'.", "== no te da <. g++ dice: no match for 'operator<'.", "== があっても < は作られない。no match for 'operator<' になる。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "For ordering, default the spaceship <=>: it compares members in order and gives you <, >, <= and >=.",
      "Para ordenar, usa la nave espacial <=> con = default: compara los miembros en orden y te da <, >, <= y >=.",
      "順序がほしいなら宇宙船演算子 <=> を = default に。メンバーを順に比べ、< > <= >= が使える。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: cc(`
        struct Ver {
          int major, minor;
          auto operator<=>(const Ver&) const = default;
        };
        int main() {
          std::cout << (Ver{1, 9} < Ver{2, 0})
                    << (Ver{1, 2} < Ver{1, 1});
        }`),
      options: ["10", "01", "11"],
      answer: 0,
      output: "10",
      check: { compiles: true, stdout: "10" },
      explain: L("major is compared first: 1 < 2 decides. When majors tie, minor decides: 2 < 1 is false.", "Primero se compara major: 1 < 2 decide. Si empatan, decide minor: 2 < 1 es false.", "まず major を比べ、1 < 2 で決まる。同じなら minor で比べ、2 < 1 は false。"),
      win: [{ t: "print", text: "10" }],
    },
    {
      kind: "type",
      prompt: L("Carve the spaceship", "Talla la nave espacial", "宇宙船を刻もう"),
      code: cc(`
        struct Ver {
          int major, minor;
          auto operator___(const Ver&) const = default;
        };
        int main() { std::cout << (Ver{2, 0} > Ver{1, 5}); }`),
      answer: "<=>",
      check: { compiles: true, stdout: "1" },
      explain: L("operator<=> = default generates all four ordering operators from the members.", "operator<=> = default genera los cuatro operadores de orden a partir de los miembros.", "operator<=> = default でメンバーから4つの比較演算子が作られる。"),
      win: [{ t: "print", text: "1" }],
    },
    say(L(
      "++c is prefix: add, then hand back the new value. c++ is postfix: hand back the OLD value, then add.",
      "++c es prefijo: suma y devuelve el valor nuevo. c++ es postfijo: devuelve el valor VIEJO y luego suma.",
      "++c は前置：足してから新しい値を返す。c++ は後置：古い値を返してから足す。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: cc(`
        struct Counter {
          int n = 0;
          Counter& operator++() { ++n; return *this; }
          Counter operator++(int) { Counter old = *this; ++n; return old; }
        };
        int main() {
          Counter c;
          Counter a = c++;
          Counter b = ++c;
          std::cout << a.n << b.n << c.n;
        }`),
      options: ["022", "122", "012"],
      answer: 0,
      output: "022",
      check: { compiles: true, stdout: "022" },
      explain: L("c++ returned the old copy (0). ++c added and returned the new value (2). c ends at 2.", "c++ devolvió la copia vieja (0). ++c sumó y devolvió el nuevo (2). c termina en 2.", "c++ は古いコピー（0）を返し、++c は足した値（2）を返す。c は最後に 2。"),
      win: [{ t: "print", text: "022" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: cc(`
        struct Mult {
          int k;
          int operator()(int x) const { return x * k; }
        };
        int main() {
          Mult triple{3};
          std::cout << triple(5);
        }`),
      options: ["15", "8", "3"],
      answer: 0,
      output: "15",
      check: { compiles: true, stdout: "15" },
      explain: L("operator() makes an object callable like a function: a function object that keeps its own k.", "operator() hace que un objeto se llame como una función: un objeto función que guarda su propio k.", "operator() でオブジェクトを関数のように呼べる。自分の k を持つ関数オブジェクトだ。"),
      win: [{ t: "print", text: "15" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: cc(`
        struct Money {
          int c;
          Money& operator+=(int x) { c += x; return *this; }
        };
        int main() {
          Money m{1};
          (m += 2) += 3;
          std::cout << m.c;
        }`),
      options: ["6", "3", "4"],
      answer: 0,
      output: "6",
      check: { compiles: true, stdout: "6" },
      explain: L("+= returns *this by reference, so the second += works on the same m: 1 + 2 + 3.", "+= devuelve *this por referencia, así que el segundo += actúa sobre el mismo m: 1 + 2 + 3.", "+= は *this を参照で返すので、2回目の += も同じ m に効く：1 + 2 + 3。"),
      win: [{ t: "print", text: "6" }],
    },
    {
      kind: "type",
      prompt: L("Hand the stream back", "Devuelve el stream", "ストリームを返そう"),
      code: cc(`
        struct Vec { int x, y; };
        std::ostream& operator<<(std::ostream& os, const Vec& v) {
          ___ os << v.x << "," << v.y;
        }
        int main() { std::cout << Vec{1, 2} << "!"; }`),
      answer: "return",
      check: { compiles: true, stdout: "1,2!" },
      explain: L("operator<< must return the stream so chains like cout << v << \"!\" keep going.", "operator<< debe devolver el stream para que cadenas como cout << v << \"!\" sigan.", "operator<< はストリームを返す。だから cout << v << \"!\" とつなげられる。"),
      win: [{ t: "print", text: "1,2!" }],
    },
    {
      kind: "run",
      prompt: L("Fix the + rune: total must be 425", "Arregla la runa +: el total debe ser 425", "+ のルーンを直して合計を 425 に"),
      starter: cc(`
        #include <iostream>

        struct Money {
          int cents;
          Money operator+(const Money& o) const { return Money{cents + cents}; }
        };

        int main() {
          Money a{150}, b{275};
          std::cout << "total: " << (a + b).cents;
        }`) + "\n",
      solution: cc(`
        #include <iostream>

        struct Money {
          int cents;
          Money operator+(const Money& o) const { return Money{cents + o.cents}; }
        };

        int main() {
          Money a{150}, b{275};
          std::cout << "total: " << (a + b).cents;
        }`) + "\n",
      expect: "total: 425",
      fallback: [String.raw`cents\s*\+\s*o\.cents`, String.raw`o\.cents\s*\+\s*cents`, String.raw`this->cents\s*\+\s*o\.cents`],
      explain: L("cents + cents doubles a. Add the other side: cents + o.cents.", "cents + cents duplica a. Suma el otro lado: cents + o.cents.", "cents + cents だと a が2倍になるだけ。相手を足そう：cents + o.cents。"),
    },
  ],
};

// ─── 3.5 Boss: Vtable Dragon ───────────────────────────────────────────────
const boss: LessonDef = {
  slug: "vtable-dragon",
  title: L("Boss: Vtable Dragon", "Jefe: Dragón Vtable", "ボス：vtable ドラゴン"),
  concept: "polymorphism",
  mode: "boss",
  xp: 190,
  enemy: "dragon",
  enemyName: L("VTABLE DRAGON", "DRAGÓN VTABLE", "vtable ドラゴン"),
  beats: [
    enemySays(L(
      "I AM THE VTABLE DRAGON. I swap costumes, slice shields and twist your runes. Who REALLY answers the call?",
      "SOY EL DRAGÓN VTABLE. Cambio disfraces, rebano escudos y tuerzo tus runas. ¿Quién responde REALMENTE la llamada?",
      "我は vtable ドラゴン。衣装を替え、盾を切り、ルーンをねじる。呼び出しに答えるのは本当はだれだ？",
    )),
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: cc(`
        struct A {
          virtual void f() { std::cout << "A"; }
          void g() { f(); }
          virtual ~A() = default;
        };
        struct B : A { void f() override { std::cout << "B"; } };
        int main() { B b; b.g(); A a = b; a.g(); }`),
      options: ["BA", "BB", "AA"], answer: 0, output: "BA",
      check: { compiles: true, stdout: "BA" },
      explain: L("b.g() dispatches to B. a is a sliced copy: a real A.", "b.g() despacha a B. a es una copia rebanada: un A real.", "b.g() は B へ。a はスライスされた本物の A。"),
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: cc(`
        struct A { A() { std::cout << "A"; } ~A() { std::cout << "~A"; } };
        struct M { M() { std::cout << "M"; } ~M() { std::cout << "~M"; } };
        struct C : A {
          M m;
          C() { std::cout << "C"; }
          ~C() { std::cout << "~C"; }
        };
        int main() { C c; }`),
      options: ["AMC~C~M~A", "MAC~C~A~M", "AMC~A~M~C"], answer: 0, output: "AMC~C~M~A",
      check: { compiles: true, stdout: "AMC~C~M~A" },
      explain: L("Base, member, body; then the exact reverse.", "Base, miembro, cuerpo; luego al revés exacto.", "親 → メンバー → 本体。こわすときは逆。"),
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: cc(`
        struct Shape { virtual int sides() const = 0; virtual ~Shape() = default; };
        struct Tri : Shape { int sides() const override { return 3; } };
        struct Sq : Shape { int sides() const override { return 4; } };
        int main() {
          std::vector<std::unique_ptr<Shape>> v;
          v.push_back(std::make_unique<Tri>());
          v.push_back(std::make_unique<Sq>());
          int total = 0;
          for (const auto& s : v) total += s->sides();
          std::cout << total;
        }`),
      options: ["7", "0", "8"], answer: 0, output: "7",
      check: { compiles: true, stdout: "7" },
      explain: L("Each pointer keeps its real shape: 3 + 4.", "Cada puntero conserva su forma real: 3 + 4.", "ポインタは本物の形を保つ：3 + 4。"),
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: cc(`
        struct A {
          virtual void f(int x = 1) { std::cout << "A" << x; }
          virtual ~A() = default;
        };
        struct B : A { void f(int x = 2) override { std::cout << "B" << x; } };
        int main() { B b; A& a = b; a.f(); b.f(); }`),
      options: ["B1B2", "B2B2", "A1B2"], answer: 0, output: "B1B2",
      check: { compiles: true, stdout: "B1B2" },
      explain: L("The body is picked at run time; default args by the static type.", "El cuerpo se elige al ejecutar; los valores por defecto, por el tipo estático.", "本体は実行時に、デフォルト引数は静的な型で決まる。"),
    },
    {
      kind: "predict", time: 15, prompt: COMPILES,
      code: ANIMAL + '\nstruct Lion : Animal {\n  std::string sound() override { return "roar"; }\n};\nint main() {}',
      options: [YES, NO_GCC], answer: 1,
      check: { compiles: false },
      explain: L("No const: it overrides nothing, and override catches it.", "Sin const no reemplaza nada, y override lo detecta.", "const がなく何も置きかえない。override が見抜く。"),
    },
    {
      kind: "pick", time: 15, prompt: L("Which one makes it abstract?", "¿Cuál la hace abstracta?", "抽象クラスにするのは？"),
      code: "struct Shape {\n  virtual double area() const ___;\n};\nstruct Sq : Shape { double area() const override { return 4; } };\nint main() { Sq s; std::cout << s.area(); }",
      options: ["= 0", "= default"], answer: 0,
      check: { compiles: true, stdout: "4", wrongFail: true },
      explain: L("= 0 means pure virtual: no body, heirs must write it.", "= 0 es virtual pura: sin cuerpo, los herederos la escriben.", "= 0 は純粋仮想。中身は子が書く。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: cc(`
        struct Ver {
          int major, minor;
          auto operator<=>(const Ver&) const = default;
        };
        int main() {
          std::cout << (Ver{3, 0} > Ver{2, 9}) << (Ver{1, 1} >= Ver{1, 2});
        }`),
      options: ["10", "01", "11"], answer: 0, output: "10",
      check: { compiles: true, stdout: "10" },
      explain: L("Members compare in order: major first, then minor.", "Los miembros se comparan en orden: primero major, luego minor.", "メンバーを順に比べる：major、次に minor。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: ANIMAL + "\nint main() {\n  std::vector<Animal> v;\n  v.push_back(Dog{});\n  std::cout << v[0].sound();\n}",
      options: ["...", "woof"], answer: 0, output: "...",
      check: { compiles: true, stdout: "..." },
      explain: L("A vector of values slices every Dog.", "Un vector de valores rebana cada Dog.", "値の vector は Dog をスライスする。"),
    },
    {
      kind: "predict", time: 20, prompt: COMPILES,
      code: cc(`
        struct A {
          int f() { return 1; }
          int f(int) { return 2; }
        };
        struct B : A { int f() { return 3; } };
        int main() { B b; std::cout << b.f(5); }`),
      options: [YES, NO_GCC], answer: 1,
      check: { compiles: false },
      explain: L("B::f hides every A::f. using A::f; brings them back.", "B::f oculta todos los A::f. using A::f; los recupera.", "B::f が A::f を全部隠す。using A::f; で戻せる。"),
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: "void f(int) { std::cout << \"int\"; }\nvoid f(double) { std::cout << \"double\"; }\nint main() { f(1.0f); f('c'); }",
      options: ["doubleint", "intint", "doubledouble"], answer: 0, output: "doubleint",
      check: { compiles: true, stdout: "doubleint" },
      explain: L("Promotions win: float goes to double, char to int.", "Ganan las promociones: float pasa a double, char a int.", "昇格が優先：float は double、char は int へ。"),
    },
    enemySays(L(
      "My vtable... read entry by entry. Climb, then: Template Tower forges a new mold for every type.",
      "Mi vtable... leída entrada por entrada. Sube, entonces: la Torre de Plantillas forja un molde para cada tipo.",
      "わが vtable を一つずつ読み解いたか…。登るがいい。テンプレートの塔は型ごとに型枠を鍛える。",
    )),
  ],
};

export const polymorphCastle: RegionDef = {
  slug: "polymorph-castle",
  name: L("Polymorph Castle", "Castillo Polimorfo", "ポリモーフ城"),
  subtitle: L("Inheritance, virtual, slicing, operators", "Herencia, virtual, slicing, operadores", "継承・virtual・スライス・演算子"),
  theme: "castle",
  lessons: [heirs, virtualSpells, sliced, operators, boss],
};
