import type { Beat, LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
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


// Guidebook notes: long explanations players can reopen from any question (📖).
// Examples use names and values different from the questions so they never give an answer away.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
/** A runnable example; the validator checks `output` against the real compiler. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code: cc(code), output, caption });
/** An example that must NOT compile (verified too). */
const bad = (code: string, caption: Text): NoteBlock => ({ t: "code", code: cc(code), caption, check: { compiles: false } });

// ── Shared notes ──
const buildOrderNote = note("build-order", L("Build order: base, members, body", "Orden: base, miembros, cuerpo", "作る順番：親→メンバー→本体"),
  p(
    "A derived object contains a whole base object inside it, like a knight wearing armor. When you create a derived object, C++ builds it from the inside out: first the base part, then each member in the order they are declared, and only then does the derived constructor's body run.",
    "Un objeto derivado lleva dentro un objeto base completo, como un caballero con armadura. Al crear un objeto derivado, C++ lo construye de adentro hacia afuera: primero la parte base, luego cada miembro en el orden en que se declaró, y recién entonces corre el cuerpo del constructor derivado.",
    "子のオブジェクトの中には、親のオブジェクトがまるごと入っている。作るときは内側から：まず親の部分、次に宣言した順にメンバー、最後に子のコンストラクタ本体が動く。",
  ),
  ex(`
    struct Engine { Engine() { std::cout << "E"; } ~Engine() { std::cout << "~E"; } };
    struct Vehicle { Vehicle() { std::cout << "V"; } ~Vehicle() { std::cout << "~V"; } };
    struct Car : Vehicle {
      Engine e;
      Car() { std::cout << "C"; }
      ~Car() { std::cout << "~C"; }
    };
    int main() { Car c; }`, "VEC~C~E~V",
    L("Built inside out, destroyed outside in", "Se construye de adentro hacia afuera y se destruye al revés", "内側から作り、外側からこわす")),
  p(
    "Why this order? The derived body may use the base and the members, so they must already exist when it runs. Destruction is the exact mirror: the derived destructor body runs first, then the members are destroyed in reverse order, and the base goes last, because the base can't vanish while the parts on top of it still rely on it.",
    "¿Por qué este orden? El cuerpo derivado puede usar la base y los miembros, así que deben existir cuando corre. La destrucción es el espejo exacto: primero corre el cuerpo del destructor derivado, luego se destruyen los miembros en orden inverso y la base va al final, porque no puede desaparecer mientras lo de encima depende de ella.",
    "なぜこの順番？子の本体は親やメンバーを使うかもしれないので、先にできていないと困る。こわすときはちょうど鏡うつし：子のデストラクタ本体、メンバー（逆順）、最後に親。上にのっている部分が頼っているうちは、親は消えられない。",
  ),
  ex(`
    struct Wheel {
      int id;
      Wheel(int i) : id(i) { std::cout << "W" << id; }
    };
    struct Bike { Wheel front{1}; Wheel back{2}; };
    int main() { Bike b; }`, "W1W2",
    L("Members are built in the order they are declared", "Los miembros se construyen en el orden de declaración", "メンバーは宣言した順に作られる")),
  p(
    "Rule to remember: on = base, members, body; off = body, members, base. A common mistake is thinking the derived constructor runs first because it is the one you called. It is called first, but before its body starts, it builds everything it stands on.",
    "Regla para recordar: al poner = base, miembros, cuerpo; al quitar = cuerpo, miembros, base. Un error común es creer que el constructor derivado corre primero porque es el que llamaste. Se llama primero, pero antes de que empiece su cuerpo construye todo aquello sobre lo que se apoya.",
    "覚え方：着るときは 親→メンバー→本体、脱ぐときは 本体→メンバー→親。よくある誤解は「呼んだのは子だから子が先」。呼ばれるのは先でも、本体の前に土台を全部作るのじゃ。",
  ),
);

const sliceNote = note("slicing", L("Slicing: copies keep only the base", "Slicing: la copia guarda solo la base", "スライス：コピーは親の部分だけ"),
  p(
    "A variable of a base type, declared by value, has room for exactly a base object, nothing more. If you copy a derived object into it, only the base part is copied and the extra derived part is cut away. This is called slicing. The new variable is a genuine base object, so even virtual functions answer with the base version.",
    "Una variable de tipo base declarada por valor tiene lugar para un objeto base exactamente, nada más. Si copias un objeto derivado en ella, solo se copia la parte base y lo extra del derivado se recorta. Esto se llama slicing. La nueva variable es un objeto base de verdad, así que incluso las funciones virtuales responden con la versión base.",
    "値として宣言した親の型の変数には、親1個分の場所しかない。子のオブジェクトをコピーすると親の部分だけが入り、子の追加部分は切り落とされる。これがスライス。新しい変数は本物の親なので、virtual 関数も親の版が答える。",
  ),
  ex(`
    struct Vehicle {
      virtual std::string kind() const { return "vehicle"; }
      virtual ~Vehicle() = default;
    };
    struct Truck : Vehicle { std::string kind() const override { return "truck"; } };
    int main() {
      Truck t;
      Vehicle copy = t; const Vehicle& ref = t;
      std::cout << copy.kind() << " " << ref.kind();
    }`, "vehicle truck",
    L("The copy is a real Vehicle; the reference still sees the Truck", "La copia es un Vehicle real; la referencia ve el Truck", "コピーは本物の Vehicle、参照は Truck を見る")),
  p(
    "Slicing happens anywhere a copy is made: assigning to a base variable, passing a parameter by value, returning a base by value, or storing objects in a container of base values such as std::vector<Base>. A reference or a pointer doesn't copy anything; it just points at the original, so the full derived object stays reachable.",
    "El slicing ocurre en cualquier lugar donde se hace una copia: al asignar a una variable base, al pasar un parámetro por valor, al devolver una base por valor o al guardar objetos en un contenedor de valores base como std::vector<Base>. Una referencia o un puntero no copian nada; solo señalan al original, así que el objeto derivado completo sigue al alcance.",
    "スライスはコピーが起きる所ならどこでも起きる：親の変数への代入、値渡しの引数、値での戻り値、std::vector<Base> のような親の値のコンテナ。参照やポインタはコピーせず元を指すだけなので、子のオブジェクト全体に届く。",
  ),
  ex(`
    struct Vehicle {
      virtual std::string kind() const { return "vehicle"; }
      virtual ~Vehicle() = default;
    };
    struct Truck : Vehicle { std::string kind() const override { return "truck"; } };
    int main() {
      std::vector<std::unique_ptr<Vehicle>> garage;
      garage.push_back(std::make_unique<Truck>());
      std::cout << garage[0]->kind();
    }`, "truck",
    L("A container of pointers keeps each real object", "Un contenedor de punteros guarda cada objeto real", "ポインタのコンテナは本物を保つ")),
  p(
    "Rule to remember: polymorphic objects travel by reference (const Base&) or by pointer (Base*, std::unique_ptr<Base>), never by value. A common mistake is expecting virtual to rescue a sliced copy; it can't, because the derived part is no longer there to call.",
    "Regla para recordar: los objetos polimórficos viajan por referencia (const Base&) o por puntero (Base*, std::unique_ptr<Base>), nunca por valor. Un error común es esperar que virtual salve una copia rebanada; no puede, porque la parte derivada ya no está ahí para llamarla.",
    "覚え方：ポリモーフィックなオブジェクトは参照（const Base&）かポインタ（Base*、std::unique_ptr<Base>）で運ぶ。値では運ばない。よくある誤解は「virtual があればスライスされても大丈夫」。子の部分がもう無いので呼べないのじゃ。",
  ),
);

// ── 3.1 Heirs and bases ──
const heirsNotes: NoteDef[] = [
  buildOrderNote,
  note("access", L("private, protected and public", "private, protected y public", "private・protected・public"),
    p(
      "Access keywords decide who may touch a member. public: anyone. private: only the class's own member functions. protected: the class itself and its heirs (derived classes), but not outside code. Everything after a keyword like public: gets that access, until the next keyword.",
      "Las palabras de acceso deciden quién puede tocar un miembro. public: cualquiera. private: solo las funciones miembro de la propia clase. protected: la clase y sus herederos (clases derivadas), pero no el código de afuera. Todo lo que sigue a una palabra como public: recibe ese acceso, hasta la siguiente palabra.",
      "アクセス指定子は、だれがメンバーにさわれるかを決める。public はだれでも。private はそのクラス自身のメンバー関数だけ。protected はクラス自身と子クラスだけで、外のコードはだめ。public: などの後ろは、次の指定子まで同じアクセスになる。",
    ),
    p(
      "The only difference between struct and class is the default. In a struct, members are public until you say otherwise; in a class, they are private. So class Box { int n; }; hides n from everyone, heirs included. Inheritance follows the same default: struct D : B inherits publicly, class D : B privately.",
      "La única diferencia entre struct y class es el valor por defecto. En un struct los miembros son public hasta que digas otra cosa; en una class son private. Así, class Box { int n; }; oculta n a todos, herederos incluidos. La herencia sigue la misma regla: struct D : B hereda en público, class D : B en privado.",
      "struct と class のちがいは標準のアクセスだけ。struct のメンバーは標準で public、class は private。だから class Box { int n; }; の n は子クラスからも見えない。継承も同じで、struct D : B は public 継承、class D : B は private 継承になる。",
    ),
    ex(`
      struct Tool {
      protected:
        int weight = 3;
      };
      struct Hammer : Tool {
        int heavy() const { return weight * 2; }
      };
      int main() { Hammer h; std::cout << h.heavy(); }`, "6",
      L("An heir can read a protected member", "Un heredero puede leer un miembro protected", "子は protected メンバーを読める")),
    bad(`
      struct Tool {
      protected:
        int weight = 3;
      };
      int main() { Tool t; return t.weight; }`,
      L("Does not compile: outside code can't read protected", "No compila: el código de afuera no lee protected", "コンパイル不可：外から protected は読めない")),
    p(
      "Rule to remember: private = me only, protected = me and my heirs, public = everyone. Common mistake: assuming an heir can read everything its base has. Inheriting a private member means the heir carries it inside, but still can't name it; the base must offer protected access or a public function.",
      "Regla para recordar: private = solo yo, protected = yo y mis herederos, public = todos. Error común: suponer que un heredero puede leer todo lo de su base. Heredar un miembro private significa que el heredero lo lleva adentro, pero no puede nombrarlo; la base debe dar acceso protected o una función public.",
      "覚え方：private は自分だけ、protected は自分と子、public はみんな。よくある誤解は「子は親のものを全部読める」。private メンバーは子の中に入ってはいるが、名前で使えない。親が protected にするか public 関数を用意する必要がある。",
    ),
  ),
  note("base-ctor", L("Calling the base constructor", "Llamar al constructor base", "親のコンストラクタを呼ぶ"),
    p(
      "Since the base part is built before the heir's body runs, the heir can't set it up inside its body. Instead, it passes arguments to the base in the member initializer list, the part after the colon: Child() : Parent(args) {}. You call the base by its type name, just like calling a constructor.",
      "Como la parte base se construye antes de que corra el cuerpo del heredero, este no puede prepararla dentro de su cuerpo. En cambio, le pasa argumentos a la base en la lista de inicialización, la parte después de los dos puntos: Child() : Parent(args) {}. A la base se la llama por su nombre de tipo, igual que a un constructor.",
      "親の部分は子の本体より先に作られるので、本体の中では設定できない。かわりにコロンの後ろの初期化リストで親に引数を渡す：Child() : Parent(args) {}。親は型の名前で、コンストラクタのように呼ぶ。",
    ),
    ex(`
      struct Plant {
        int height;
        Plant(int h) : height(h) {}
      };
      struct Tree : Plant {
        Tree() : Plant(12) {}
      };
      int main() { Tree t; std::cout << t.height; }`, "12",
      L("Tree hands 12 to Plant before its own body runs", "Tree le da 12 a Plant antes de su propio cuerpo", "Tree は本体の前に Plant へ 12 を渡す")),
    p(
      "If the initializer list doesn't mention the base, C++ calls the base's default constructor, the one with no arguments. If the base has a default argument, that default is used, which can silently give you the wrong value. If the base has no constructor that takes zero arguments, the heir doesn't compile.",
      "Si la lista de inicialización no menciona la base, C++ llama al constructor por defecto de la base, el que no recibe argumentos. Si la base tiene un argumento por defecto, se usa ese valor, y puede darte en silencio el valor equivocado. Si la base no tiene un constructor sin argumentos, el heredero no compila.",
      "初期化リストに親が書かれていないと、C++ は引数なしのコンストラクタを呼ぶ。親にデフォルト引数があればその値が使われ、気づかずにまちがった値になることも。引数なしで呼べるコンストラクタがなければ、子はコンパイルできない。",
    ),
    bad(`
      struct Plant {
        int height;
        Plant(int h) : height(h) {}
      };
      struct Tree : Plant { Tree() {} };
      int main() { Tree t; }`,
      L("Does not compile: Plant needs a height", "No compila: Plant necesita una altura", "コンパイル不可：Plant には高さが必要")),
    p(
      "Rule to remember: base values go in the initializer list, named by the base type. A common mistake is assigning in the body, like height = 12; inside Tree() { }. That only works if the base could be built first without arguments, and it builds the base twice in effect: once by default, then overwritten.",
      "Regla para recordar: los valores de la base van en la lista de inicialización, nombrados por el tipo base. Un error común es asignar en el cuerpo, como height = 12; dentro de Tree() { }. Eso solo funciona si la base se puede construir antes sin argumentos, y en la práctica la prepara dos veces: una por defecto y otra al sobrescribir.",
      "覚え方：親への値は初期化リストに、親の型名で書く。よくあるミスは Tree() { height = 12; } のように本体で代入すること。親が引数なしで作れるときしか動かず、しかも標準で作ってから上書きする二度手間になる。",
    ),
  ),
  note("static-type", L("Static type picks plain functions", "El tipo estático elige funciones comunes", "ふつうの関数は静的な型で決まる"),
    p(
      "Every expression has a static type: the type the compiler sees written in the code. A Base& or Base* has static type Base even when it refers to a derived object. The object it really refers to has a dynamic type, which may be a derived class. For a plain (non-virtual) member function, the compiler picks the version from the static type, at compile time.",
      "Toda expresión tiene un tipo estático: el que el compilador ve escrito en el código. Un Base& o Base* tiene tipo estático Base aunque apunte a un objeto derivado. El objeto real tiene un tipo dinámico, que puede ser una clase derivada. Para una función miembro común (no virtual), el compilador elige la versión del tipo estático, al compilar.",
      "式にはそれぞれ静的な型がある。コードに書かれていてコンパイラが見る型じゃ。Base& や Base* の静的な型は、子を指していても Base。本当に指している物の型は動的な型。ふつうの（virtual でない）メンバー関数は、コンパイル時に静的な型で選ばれる。",
    ),
    ex(`
      struct Instrument { std::string play() { return "note"; } };
      struct Drum : Instrument { std::string play() { return "boom"; } };
      int main() {
        Drum d;
        Instrument* p = &d;
        std::cout << p->play() << " " << d.play();
      }`, "note boom",
      L("Same object, two calls: the pointer's type decides", "El mismo objeto, dos llamadas: decide el tipo del puntero", "同じ物でも、ポインタの型で決まる")),
    p(
      "Why? Without virtual, the compiler simply looks up the name in the class it sees and calls that function directly, with no check at run time of what the object really is. The derived version doesn't replace the base one; it only hides it when you call through the derived type.",
      "¿Por qué? Sin virtual, el compilador solo busca el nombre en la clase que ve y llama a esa función directamente, sin revisar al ejecutar qué es el objeto en realidad. La versión derivada no reemplaza a la base; solo la oculta cuando llamas a través del tipo derivado.",
      "なぜ？virtual がないと、コンパイラは見えているクラスで名前を探し、その関数を直接呼ぶ。実行時に本当の型は調べない。子の版は親の版を置きかえるのではなく、子の型で呼んだときに隠すだけじゃ。",
    ),
    p(
      "Rule to remember: no virtual means the written type decides. A common mistake is expecting a base reference to \"know\" it holds a derived object. It does hold it, but a plain call never asks. The next lesson shows how virtual makes the real object answer.",
      "Regla para recordar: sin virtual, decide el tipo escrito. Un error común es esperar que una referencia base \"sepa\" que guarda un objeto derivado. Lo guarda, pero una llamada común nunca pregunta. La próxima lección muestra cómo virtual hace que responda el objeto real.",
      "覚え方：virtual なしなら、書かれた型が決める。よくある誤解は「親の参照は中身が子だと知っている」。中身は子でも、ふつうの呼び出しは聞きに行かない。次のレッスンで virtual を使って本物に答えさせよう。",
    ),
  ),
];

// ── 3.2 Virtual spells ──
const virtualNotes: NoteDef[] = [
  note("virtual-dispatch", L("virtual: the real object decides", "virtual: decide el objeto real", "virtual：本物が決める"),
    p(
      "Mark a member function virtual in the base and calls through a base reference or pointer are decided at run time by the real object. Each polymorphic object secretly carries a pointer to its class's table of virtual functions (the vtable). A virtual call looks up the function in that table, so a derived object answers with its own version.",
      "Marca una función miembro como virtual en la base y las llamadas por una referencia o puntero base se deciden al ejecutar, según el objeto real. Cada objeto polimórfico lleva en secreto un puntero a la tabla de funciones virtuales de su clase (la vtable). Una llamada virtual busca la función en esa tabla, así que un objeto derivado responde con su propia versión.",
      "親のメンバー関数に virtual をつけると、親の参照やポインタ越しの呼び出しは実行時に本物のオブジェクトで決まる。ポリモーフィックなオブジェクトは、自分のクラスの virtual 関数表（vtable）へのポインタをこっそり持つ。呼び出しはその表を引くので、子は自分の版で答える。",
    ),
    ex(`
      struct Instrument {
        virtual std::string play() const { return "note"; }
        virtual ~Instrument() = default;
      };
      struct Drum : Instrument { std::string play() const override { return "boom"; } };
      void perform(const Instrument& i) { std::cout << i.play() << " "; }
      int main() { Drum d; Instrument plain; perform(d); perform(plain); }`, "boom note",
      L("One function, two answers: each object brings its own play()", "Una función, dos respuestas: cada objeto trae su play()", "同じ関数で答えが2つ：物ごとの play()")),
    p(
      "This is what makes one function work for a whole family: perform takes any Instrument, and you never need an if to check the kind. Containers of pointers work the same way: a std::vector<std::unique_ptr<Base>> can hold different heirs, and a loop calling a virtual function gets each one's own behavior.",
      "Esto hace que una función sirva para toda una familia: perform recibe cualquier Instrument y nunca necesitas un if para revisar el tipo. Los contenedores de punteros funcionan igual: un std::vector<std::unique_ptr<Base>> puede guardar herederos distintos, y un bucle que llama a una función virtual obtiene el comportamiento de cada uno.",
      "これで1つの関数がファミリー全体に使える。perform はどんな Instrument でも受けとり、種類を if で調べる必要がない。ポインタのコンテナも同じ。std::vector<std::unique_ptr<Base>> にいろいろな子を入れ、ループで virtual 関数を呼べば、それぞれの動きになる。",
    ),
    p(
      "Rule to remember: virtual works only through a reference or a pointer, and only for functions marked virtual in the base (heirs inherit the virtual-ness). Common mistake: adding virtual only in the derived class. The base reference looks up the base's function, and if that one isn't virtual, the call is decided at compile time.",
      "Regla para recordar: virtual solo funciona a través de una referencia o un puntero, y solo para funciones marcadas virtual en la base (los herederos heredan esa marca). Error común: poner virtual solo en la clase derivada. La referencia base busca la función de la base, y si esa no es virtual, la llamada se decide al compilar.",
      "覚え方：virtual が効くのは参照かポインタ越しで、親で virtual にした関数だけ（子にも引きつがれる）。よくあるミスは子だけに virtual を書くこと。親の参照は親の関数を探すので、そこが virtual でなければコンパイル時に決まってしまう。",
    ),
  ),
  note("override-final", L("override and final", "override y final", "override と final"),
    p(
      "A derived function replaces a virtual one only if its signature matches exactly: same name, same parameter types, same const. Any difference creates a brand new function that silently replaces nothing. Writing override after the signature asks the compiler to check: if no virtual function in a base matches, it is a compile error.",
      "Una función derivada reemplaza a una virtual solo si su firma coincide exactamente: mismo nombre, mismos tipos de parámetros, mismo const. Cualquier diferencia crea una función nueva que en silencio no reemplaza nada. Escribir override después de la firma le pide al compilador que revise: si ninguna función virtual de una base coincide, es un error de compilación.",
      "子の関数が virtual 関数を置きかえるのは、シグネチャが完全に一致するときだけ：名前、引数の型、const まで同じ。ちがいがあると新しい別の関数になり、何も置きかえない。シグネチャの後ろに override と書くと、合う virtual 関数がなければコンパイルエラーにしてくれる。",
    ),
    ex(`
      struct Tool {
        virtual int weight() const { return 1; }
        virtual ~Tool() = default;
      };
      struct Saw : Tool { int weight() const override { return 2; } };
      int main() { Saw s; const Tool& t = s; std::cout << t.weight(); }`, "2",
      L("The signature matches, so override is happy", "La firma coincide, así que override está conforme", "シグネチャが一致、override も満足")),
    bad(`
      struct Tool {
        virtual int weight() const { return 1; }
        virtual ~Tool() = default;
      };
      struct Saw : Tool { int wieght() const override { return 2; } };
      int main() {}`,
      L("Does not compile: a typo means nothing is overridden", "No compila: un error de tipeo no reemplaza nada", "コンパイル不可：つづりミスで何も置きかえない")),
    p(
      "override changes nothing at run time; it is purely a safety check, and it costs nothing. final goes the other way: a class marked final can't be inherited from, and a virtual function marked final can't be overridden again further down. Use it to say \"this is the end of the line\".",
      "override no cambia nada al ejecutar; es solo un control de seguridad y no cuesta nada. final va en sentido contrario: de una clase marcada final no se puede heredar, y una función virtual marcada final no se puede volver a reemplazar más abajo. Úsalo para decir \"aquí termina la línea\".",
      "override は実行時には何も変えない。ただの安全チェックで、コストもゼロ。final は逆向きで、final のクラスは継承できず、final の virtual 関数はそれ以上置きかえられない。「ここで終わり」と示すのに使う。",
    ),
    bad(`
      struct Tool { virtual ~Tool() = default; };
      struct Saw final : Tool {};
      struct MiniSaw : Saw {};
      int main() {}`,
      L("Does not compile: Saw is final", "No compila: Saw es final", "コンパイル不可：Saw は final")),
    p(
      "Rule to remember: always write override on functions meant to replace a virtual one. Common mistake: forgetting const, or changing a parameter type, and then wondering why the base version still runs. With override, that mistake becomes a clear error instead of a silent bug.",
      "Regla para recordar: escribe siempre override en las funciones que deben reemplazar a una virtual. Error común: olvidar const o cambiar un tipo de parámetro, y luego preguntarse por qué sigue corriendo la versión base. Con override, ese error se vuelve un mensaje claro en vez de un bug silencioso.",
      "覚え方：virtual を置きかえる関数には必ず override を書く。よくあるミスは const を忘れたり引数の型を変えたりして、なぜか親の版が動くこと。override があれば、静かなバグではなくはっきりしたエラーになる。",
    ),
  ),
  note("pure-virtual", L("Pure virtual and abstract classes", "Virtual pura y clases abstractas", "純粋仮想関数と抽象クラス"),
    p(
      "Sometimes a base class has no sensible default: what sound does a generic instrument make? Write = 0 instead of a body to make the function pure virtual. It says: every concrete heir must provide this. A class with at least one pure virtual function is abstract.",
      "A veces una clase base no tiene un comportamiento razonable por defecto: ¿qué sonido hace un instrumento genérico? Escribe = 0 en lugar de un cuerpo para hacer la función virtual pura. Significa: todo heredero concreto debe escribirla. Una clase con al menos una función virtual pura es abstracta.",
      "親クラスに意味のある標準動作がないこともある。ただの「楽器」はどんな音？そんなときは本体のかわりに = 0 と書いて純粋仮想関数にする。「具体的な子は必ずこれを書くこと」という意味じゃ。純粋仮想関数を1つでも持つクラスは抽象クラス。",
    ),
    ex(`
      struct Instrument {
        virtual std::string play() const = 0;
        virtual ~Instrument() = default;
      };
      struct Flute : Instrument { std::string play() const override { return "toot"; } };
      int main() { Flute f; const Instrument& i = f; std::cout << i.play(); }`, "toot",
      L("Flute fills in the missing body, so it can be created", "Flute escribe el cuerpo que falta, así que se puede crear", "Flute が中身を書くので作れる")),
    p(
      "You can't create an object of an abstract class, because calling its pure function would have nothing to run. But you can still use references and pointers to it, and that is the whole point: the abstract class is an interface, and the heirs are the real things behind it.",
      "No puedes crear un objeto de una clase abstracta, porque llamar a su función pura no tendría nada que ejecutar. Pero sí puedes usar referencias y punteros a ella, y esa es justamente la idea: la clase abstracta es una interfaz, y los herederos son las cosas reales detrás.",
      "抽象クラスのオブジェクトは作れない。純粋関数を呼んでも動かす中身がないからじゃ。でも参照やポインタは使える。それこそが目的で、抽象クラスはインターフェース、その向こうにいる子が本物になる。",
    ),
    bad(`
      struct Instrument {
        virtual std::string play() const = 0;
        virtual ~Instrument() = default;
      };
      struct Flute : Instrument {};
      int main() { Flute f; }`,
      L("Does not compile: Flute forgot play(), so it's still abstract", "No compila: Flute olvidó play() y sigue abstracta", "コンパイル不可：play() がなく Flute も抽象のまま")),
    p(
      "Rule to remember: = 0 means \"no body here, heirs must write it\". Don't confuse it with = default, which asks the compiler to generate a normal body (it only works for special functions like constructors, destructors and comparisons). Common mistake: an heir that forgets one pure function is abstract too.",
      "Regla para recordar: = 0 significa \"sin cuerpo aquí, los herederos deben escribirlo\". No lo confundas con = default, que le pide al compilador generar un cuerpo normal (solo sirve para funciones especiales como constructores, destructores y comparaciones). Error común: un heredero que olvida una función pura también es abstracto.",
      "覚え方：= 0 は「ここに中身はない、子が書く」。= default と混同しないこと。= default はコンパイラにふつうの中身を作らせるもので、コンストラクタ・デストラクタ・比較など特別な関数専用。よくあるミス：純粋関数を1つ書き忘れた子も抽象クラスになる。",
    ),
  ),
  note("virtual-in-ctor", L("virtual calls during construction", "Llamadas virtuales al construir", "作っている最中の virtual"),
    p(
      "While a base constructor runs, the derived part doesn't exist yet: its members haven't been built. So C++ treats the object as a plain base during that time, and a virtual call made from the base constructor reaches the base version, never the derived one. Once construction finishes, virtual calls work normally.",
      "Mientras corre un constructor base, la parte derivada todavía no existe: sus miembros no se han construido. Por eso C++ trata al objeto como una base común durante ese tiempo, y una llamada virtual hecha desde el constructor base llega a la versión base, nunca a la derivada. Cuando termina la construcción, las llamadas virtuales funcionan normal.",
      "親のコンストラクタが動いている間、子の部分はまだ存在しない（メンバーも作られていない）。だからその間、オブジェクトはただの親としてあつかわれ、親のコンストラクタからの virtual 呼び出しは親の版に届く。作り終われば virtual はふつうに動く。",
    ),
    p(
      "The same happens in reverse inside a base destructor: by then the derived part has already been destroyed, so a virtual call there also stays in the base. This protects you: a derived function could otherwise read members that are not alive.",
      "Lo mismo pasa al revés dentro de un destructor base: para entonces la parte derivada ya se destruyó, así que una llamada virtual ahí también se queda en la base. Esto te protege: si no, una función derivada podría leer miembros que no están vivos.",
      "逆に親のデストラクタの中でも同じ。そのときには子の部分はもうこわれているので、virtual 呼び出しは親止まり。こうしないと、子の関数が生きていないメンバーを読んでしまうからじゃ。",
    ),
    ex(`
      struct Machine {
        virtual std::string name() const { return "machine"; }
        virtual ~Machine() { std::cout << " bye " << name(); }
      };
      struct Robot : Machine { std::string name() const override { return "robot"; } };
      int main() { Robot r; std::cout << r.name(); }`, "robot bye machine",
      L("In the base destructor, the Robot part is already gone", "En el destructor base, la parte Robot ya no existe", "親のデストラクタでは Robot 部分はもう無い")),
    p(
      "Rule to remember: inside a base constructor or destructor, virtual calls behave as if the object were only the base. Common mistake: calling a virtual \"setup\" function from the base constructor and expecting the heir's version. Call it after the object is fully built instead.",
      "Regla para recordar: dentro de un constructor o destructor base, las llamadas virtuales se comportan como si el objeto fuera solo la base. Error común: llamar a una función virtual de \"preparación\" desde el constructor base esperando la versión del heredero. Llámala después de que el objeto esté completo.",
      "覚え方：親のコンストラクタやデストラクタの中では、virtual 呼び出しはオブジェクトが親だけであるかのように動く。よくあるミスは、親のコンストラクタから virtual の準備関数を呼んで子の版を期待すること。作り終わってから呼ぼう。",
    ),
  ),
];

// ── 3.3 Sliced shields ──
const slicedNotes: NoteDef[] = [
  sliceNote,
  note("virtual-destructor", L("Virtual destructors", "Destructores virtuales", "virtual デストラクタ"),
    p(
      "When you destroy an object through a base pointer (delete p, or a std::unique_ptr<Base> going away), C++ calls the destructor through that base type. If the base destructor is virtual, the call reaches the real object's destructor first, then the base's, so every part is cleaned up.",
      "Cuando destruyes un objeto a través de un puntero base (delete p, o un std::unique_ptr<Base> que desaparece), C++ llama al destructor a través de ese tipo base. Si el destructor base es virtual, la llamada llega primero al destructor del objeto real y luego al de la base, así que se limpia cada parte.",
      "親のポインタ越しにオブジェクトを消すとき（delete p や std::unique_ptr<Base> の破棄）、C++ は親の型でデストラクタを呼ぶ。親のデストラクタが virtual なら、まず本物のデストラクタ、次に親のものが動き、全部が片づく。",
    ),
    ex(`
      struct Resource {
        virtual ~Resource() { std::cout << "~R"; }
      };
      struct File : Resource {
        ~File() override { std::cout << "~F"; }
      };
      int main() { Resource* r = new File; delete r; }`, "~F~R",
      L("Through a Resource*, both destructors still run", "Con un Resource*, igual corren ambos destructores", "Resource* 越しでも両方動く")),
    p(
      "Without virtual, deleting a derived object through a base pointer is undefined behavior: the program may skip the derived destructor and leak, corrupt memory, or seem to work. It compiles fine, so the compiler won't save you. That is why a base meant to be used through pointers declares virtual ~Base() = default;.",
      "Sin virtual, borrar un objeto derivado a través de un puntero base es comportamiento indefinido: el programa puede saltarse el destructor derivado y perder memoria, corromperla o parecer que funciona. Compila sin problemas, así que el compilador no te salva. Por eso una base pensada para usarse con punteros declara virtual ~Base() = default;.",
      "virtual がないと、親のポインタで子を消すのは未定義動作。子のデストラクタが飛ばされてリークしたり、メモリがこわれたり、動いて見えたりする。コンパイルは通るので気づけない。だからポインタで使う親は virtual ~Base() = default; と書く。",
    ),
    ex(`
      struct Resource { virtual ~Resource() = default; };
      struct File : Resource { ~File() override { std::cout << "closed"; } };
      int main() { std::unique_ptr<Resource> r = std::make_unique<File>(); }`, "closed",
      L("= default: an empty virtual destructor, written for you", "= default: un destructor virtual vacío, escrito por ti", "= default：空の virtual デストラクタを自動で")),
    p(
      "Rule to remember: if a class has any virtual function, or will be deleted through a base pointer, give it a virtual destructor. Common mistake: thinking delete knows the real type on its own. It only knows what the pointer's type tells it, unless the destructor is virtual.",
      "Regla para recordar: si una clase tiene alguna función virtual, o se va a borrar con un puntero base, dale un destructor virtual. Error común: pensar que delete conoce solo el tipo real. Solo sabe lo que le dice el tipo del puntero, a menos que el destructor sea virtual.",
      "覚え方：virtual 関数を持つクラスや、親のポインタで消されるクラスには virtual デストラクタを。よくある誤解は「delete は本当の型を自分で知っている」。デストラクタが virtual でなければ、ポインタの型しか知らない。",
    ),
  ),
  note("dynamic-cast", L("dynamic_cast: asking the real type", "dynamic_cast: preguntar el tipo real", "dynamic_cast：本当の型を聞く"),
    p(
      "Sometimes you hold a base pointer and need to know if the object is a specific heir. dynamic_cast<Heir*>(ptr) checks at run time: if the object really is an Heir (or derives from it), you get a valid Heir*; if not, you get nullptr. You then test the result before using it.",
      "A veces tienes un puntero base y necesitas saber si el objeto es un heredero concreto. dynamic_cast<Heir*>(ptr) lo revisa al ejecutar: si el objeto realmente es un Heir (o deriva de él), obtienes un Heir* válido; si no, obtienes nullptr. Luego pruebas el resultado antes de usarlo.",
      "親のポインタを持っていて、それが特定の子かどうか知りたいときがある。dynamic_cast<Heir*>(ptr) は実行時に確かめ、本当に Heir（かその子）なら有効な Heir*、ちがえば nullptr を返す。使う前に結果を確認しよう。",
    ),
    ex(`
      struct Vehicle { virtual ~Vehicle() = default; };
      struct Truck : Vehicle { int load = 5; };
      struct Bus : Vehicle {};
      int main() {
        Bus b;
        Vehicle* v = &b;
        if (Truck* t = dynamic_cast<Truck*>(v)) std::cout << t->load;
        else std::cout << "not a truck";
      }`, "not a truck",
      L("The cast fails safely: nullptr, so the else branch runs", "El cast falla de forma segura: nullptr, y corre el else", "キャスト失敗は安全に nullptr、else が動く")),
    p(
      "A pointer converted to bool is true when it is not null, so if (auto* t = dynamic_cast<T*>(p)) is a common pattern, and printing ptr != nullptr shows 1 or 0. With references there is no null: dynamic_cast<Heir&>(ref) throws std::bad_cast when the type is wrong.",
      "Un puntero convertido a bool es true cuando no es nulo, así que if (auto* t = dynamic_cast<T*>(p)) es un patrón común, e imprimir ptr != nullptr muestra 1 o 0. Con referencias no existe el nulo: dynamic_cast<Heir&>(ref) lanza std::bad_cast cuando el tipo es incorrecto.",
      "ポインタを bool にすると、null でなければ true。だから if (auto* t = dynamic_cast<T*>(p)) はよく使う形で、ptr != nullptr を表示すると 1 か 0 になる。参照には null がないので、dynamic_cast<Heir&>(ref) は型がちがうと std::bad_cast を投げる。",
    ),
    bad(`
      struct Vehicle {};
      struct Truck : Vehicle {};
      int main() { Truck t; Vehicle* v = &t; Truck* p = dynamic_cast<Truck*>(v); }`,
      L("Does not compile: Vehicle has no virtual function", "No compila: Vehicle no tiene funciones virtuales", "コンパイル不可：Vehicle に virtual 関数がない")),
    p(
      "Rule to remember: dynamic_cast needs a polymorphic base (at least one virtual function, often the destructor), because it reads the hidden type information that virtual adds. Prefer virtual functions when you can; reach for dynamic_cast when you truly need to ask \"what are you?\".",
      "Regla para recordar: dynamic_cast necesita una base polimórfica (al menos una función virtual, a menudo el destructor), porque lee la información de tipo oculta que agrega virtual. Prefiere funciones virtuales cuando puedas; usa dynamic_cast cuando de verdad necesites preguntar \"¿qué eres?\".",
      "覚え方：dynamic_cast にはポリモーフィックな親（virtual 関数が1つ以上、よくあるのはデストラクタ）が必要。virtual が加える隠れた型情報を読むからじゃ。できれば virtual 関数を使い、本当に「おまえは何だ？」と聞きたいときに使おう。",
    ),
  ),
];

// ── 3.4 Operator runes ──
const operatorNotes: NoteDef[] = [
  note("operator-basics", L("Writing your own operators", "Escribir tus propios operadores", "自分の演算子を書く"),
    p(
      "An operator is just a function with a special name. If you write a member function called operator+, then a + b on your type becomes a.operator+(b): the left side is the object (this), the right side is the parameter. It returns a new value and leaves both sides unchanged, just like + on numbers.",
      "Un operador es solo una función con un nombre especial. Si escribes una función miembro llamada operator+, entonces a + b con tu tipo se vuelve a.operator+(b): el lado izquierdo es el objeto (this) y el derecho es el parámetro. Devuelve un valor nuevo y deja ambos lados sin cambios, igual que + con números.",
      "演算子は特別な名前の関数にすぎない。operator+ というメンバー関数を書けば、a + b は a.operator+(b) になる。左が自分（this）、右が引数。数の + と同じく、新しい値を返し、両方とも変えない。",
    ),
    ex(`
      struct Point {
        int x, y;
        Point operator-(const Point& o) const { return {x - o.x, y - o.y}; }
      };
      std::ostream& operator<<(std::ostream& os, const Point& p) {
        return os << "[" << p.x << " " << p.y << "]";
      }
      int main() { std::cout << Point{5, 9} - Point{2, 4}; }`, "[3 5]",
      L("operator- builds a new Point; operator<< prints it", "operator- crea un Point nuevo; operator<< lo imprime", "operator- が新しい Point を作り、operator<< が表示")),
    p(
      "Inside the member, the plain names x and y belong to the left object, and o.x, o.y to the right one. operator<< is written as a free function, outside the struct, because its left side is the stream (std::cout), not your type: std::cout << p calls operator<<(std::cout, p).",
      "Dentro del miembro, los nombres x e y a secas pertenecen al objeto izquierdo, y o.x, o.y al derecho. operator<< se escribe como función libre, fuera del struct, porque su lado izquierdo es el stream (std::cout), no tu tipo: std::cout << p llama a operator<<(std::cout, p).",
      "メンバーの中で、ただの x と y は左のオブジェクトのもの、o.x と o.y は右のもの。operator<< は構造体の外の自由関数として書く。左側がストリーム（std::cout）で、自分の型ではないからじゃ：std::cout << p は operator<<(std::cout, p) を呼ぶ。",
    ),
    bad(`
      int operator+(int a, int b) { return a - b; }
      int main() {}`,
      L("Does not compile: at least one side must be your own type", "No compila: al menos un lado debe ser tu propio tipo", "コンパイル不可：片方は自分の型でないとだめ")),
    p(
      "Rule to remember: a @ b means a.operator@(b) (or operator@(a, b) for a free function). Common mistake: using your own member on both sides, like x + x, which ignores the other object completely. Also, you can't change what operators do on built-in types like int.",
      "Regla para recordar: a @ b significa a.operator@(b) (u operator@(a, b) si es función libre). Error común: usar tu propio miembro en ambos lados, como x + x, lo que ignora por completo al otro objeto. Además, no puedes cambiar lo que hacen los operadores con tipos básicos como int.",
      "覚え方：a @ b は a.operator@(b)（自由関数なら operator@(a, b)）。よくあるミスは x + x のように自分のメンバーを両側に使い、相手を完全に無視すること。また int のような組みこみ型の演算子は変えられない。",
    ),
  ),
  note("defaulted-compare", L("Defaulted == and <=>", "== y <=> con = default", "= default の == と <=>"),
    p(
      "Since C++20 the compiler can write comparisons for you. bool operator==(const T&) const = default; compares every member, in order, and is true only if all are equal. You also get != for free: the compiler rewrites a != b as !(a == b).",
      "Desde C++20 el compilador puede escribir las comparaciones por ti. bool operator==(const T&) const = default; compara cada miembro, en orden, y es true solo si todos son iguales. También obtienes != gratis: el compilador reescribe a != b como !(a == b).",
      "C++20 からはコンパイラが比較を書いてくれる。bool operator==(const T&) const = default; は全メンバーを順に比べ、全部同じときだけ true。!= もついてくる。コンパイラが a != b を !(a == b) に書きかえるからじゃ。",
    ),
    ex(`
      struct Color {
        int r, g, b;
        bool operator==(const Color&) const = default;
      };
      int main() { std::cout << (Color{1, 2, 3} != Color{1, 2, 4}); }`, "1",
      L("Only == is written, yet != works", "Solo se escribe ==, y aun así != funciona", "== だけ書いても != が使える")),
    p(
      "Equality says nothing about order, so == alone does not give you < or >. For ordering, default the three-way comparison operator <=> (the \"spaceship\"). It compares members one by one in declaration order and stops at the first difference, like sorting words letter by letter. From it you get <, >, <= and >=, and a defaulted <=> also brings a defaulted ==.",
      "La igualdad no dice nada del orden, así que == solo no te da < ni >. Para ordenar, usa = default con el operador de comparación de tres vías <=> (la \"nave espacial\"). Compara los miembros uno por uno en orden de declaración y se detiene en la primera diferencia, como ordenar palabras letra por letra. De él obtienes <, >, <= y >=, y un <=> con = default también trae un == con = default.",
      "等しさは順序について何も言わないので、== だけでは < や > は使えない。順序には三方比較演算子 <=>（宇宙船）を = default にする。宣言順にメンバーを1つずつ比べ、最初にちがった所で決まる。単語を1文字ずつ比べるのと同じ。<, >, <=, >= が使え、== もついてくる。",
    ),
    ex(`
      struct Date {
        int year, month;
        auto operator<=>(const Date&) const = default;
      };
      int main() {
        std::cout << (Date{2024, 5} > Date{2024, 11}) << (Date{2023, 12} < Date{2024, 1});
      }`, "01",
      L("year decides first; month only breaks a tie", "Primero decide year; month solo desempata", "まず year、同じときだけ month")),
    bad(`
      struct Color {
        int r, g, b;
        bool operator==(const Color&) const = default;
      };
      int main() { bool x = Color{1, 2, 3} < Color{3, 2, 1}; }`,
      L("Does not compile: == gives no ordering", "No compila: == no da orden", "コンパイル不可：== では順序がない")),
    p(
      "Rule to remember: == (and !=) for equality, <=> for ordering; the order of members in the struct is the order of comparison. Common mistake: expecting a later member to matter when an earlier one already differs. Put the most important member first.",
      "Regla para recordar: == (y !=) para igualdad, <=> para orden; el orden de los miembros en el struct es el orden de comparación. Error común: esperar que un miembro posterior importe cuando uno anterior ya es distinto. Pon primero el miembro más importante.",
      "覚え方：等しさは ==（と !=）、順序は <=>。構造体のメンバーの順番が比べる順番。よくある誤解は、前のメンバーがもうちがうのに後ろのメンバーが効くと思うこと。大事なメンバーを先に書こう。",
    ),
  ),
  note("increment-ops", L("Prefix ++x and postfix x++", "Prefijo ++x y postfijo x++", "前置 ++x と後置 x++"),
    p(
      "Both forms add one, but they hand back different things. Prefix ++x adds first and gives back the updated object itself. Postfix x++ saves a copy of the old value, adds one to the object, and gives back that old copy. The object always ends up incremented; only the value of the expression differs.",
      "Ambas formas suman uno, pero devuelven cosas distintas. El prefijo ++x suma primero y devuelve el propio objeto ya actualizado. El postfijo x++ guarda una copia del valor viejo, suma uno al objeto y devuelve esa copia vieja. El objeto siempre termina incrementado; solo cambia el valor de la expresión.",
      "どちらも1足すが、返す物がちがう。前置 ++x は先に足して、更新された自分自身を返す。後置 x++ は古い値のコピーを取っておき、自分に1足して、古いコピーを返す。オブジェクトはどちらでも増える。ちがうのは式の値だけ。",
    ),
    ex(`
      int k = 5;
      int a = k++;
      int b = ++k;
      std::cout << a << " " << b << " " << k;`, "5 7 7",
      L("a got the old 5; b got the new 7", "a recibió el 5 viejo; b el 7 nuevo", "a は古い 5、b は新しい 7")),
    p(
      "For your own type, C++ tells the two apart with a dummy parameter: T& operator++() is prefix and returns *this by reference; T operator++(int) is postfix and returns the saved copy by value. The int is never used; it's only a marker.",
      "Para tu propio tipo, C++ distingue las dos con un parámetro de relleno: T& operator++() es prefijo y devuelve *this por referencia; T operator++(int) es postfijo y devuelve la copia guardada por valor. El int nunca se usa; es solo una marca.",
      "自分の型では、ダミー引数で区別する。T& operator++() が前置で、*this を参照で返す。T operator++(int) が後置で、取っておいたコピーを値で返す。int は使われない、ただの目印じゃ。",
    ),
    ex(`
      struct Ticket {
        int num = 10;
        Ticket& operator++() { ++num; return *this; }
        Ticket operator++(int) { Ticket before = *this; ++num; return before; }
      };
      int main() {
        Ticket t;
        Ticket x = t++;
        std::cout << x.num << " " << t.num;
      }`, "10 11",
      L("Postfix: x keeps the number from before the step", "Postfijo: x guarda el número de antes del paso", "後置：x は増える前の番号を持つ")),
    p(
      "Rule to remember: prefix = add, then give the new value; postfix = give the old value, then add. Track the object and the returned value separately. Common mistake: assuming x++ returns the new value because the ++ is \"right there\".",
      "Regla para recordar: prefijo = suma y da el valor nuevo; postfijo = da el valor viejo y luego suma. Sigue por separado el objeto y el valor devuelto. Error común: creer que x++ devuelve el valor nuevo porque el ++ está \"ahí mismo\".",
      "覚え方：前置は「足してから新しい値」、後置は「古い値を渡してから足す」。オブジェクトと返り値を別々に追おう。よくある誤解は、++ がついているから x++ も新しい値を返すと思うこと。",
    ),
  ),
  note("call-operator", L("operator(): objects you can call", "operator(): objetos que se llaman", "operator()：呼べるオブジェクト"),
    p(
      "Overloading operator() makes an object callable with parentheses, like a function. Such an object is called a function object (or functor). Unlike a plain function, it can carry its own data in members, set when it is created, and use that data on every call.",
      "Sobrecargar operator() hace que un objeto se pueda llamar con paréntesis, como una función. Ese objeto se llama objeto función (o functor). A diferencia de una función común, puede llevar sus propios datos en miembros, fijados al crearlo, y usarlos en cada llamada.",
      "operator() をオーバーロードすると、オブジェクトを関数のようにかっこで呼べる。これを関数オブジェクト（ファンクタ）と呼ぶ。ふつうの関数とちがい、作るときに決めたデータをメンバーに持ち、呼ぶたびに使える。",
    ),
    ex(`
      struct Adder {
        int bonus;
        int operator()(int x) const { return x + bonus; }
      };
      int main() {
        Adder plus100{100};
        std::cout << plus100(5) << " " << plus100(1);
      }`, "105 101",
      L("plus100 remembers its bonus between calls", "plus100 recuerda su bonus entre llamadas", "plus100 は呼ぶたびに bonus を覚えている")),
    p(
      "Function objects are what STL algorithms expect as rules: std::count_if, std::sort and friends accept anything callable. Lambdas, which you'll meet in Template Tower, are a short way of writing exactly this kind of object.",
      "Los objetos función son lo que los algoritmos de la STL esperan como reglas: std::count_if, std::sort y compañía aceptan cualquier cosa que se pueda llamar. Las lambdas, que verás en la Torre de Plantillas, son una forma corta de escribir justamente este tipo de objeto.",
      "関数オブジェクトは STL アルゴリズムがルールとして受けとる物。std::count_if や std::sort は呼べる物なら何でも受けとる。テンプレートの塔で出会うラムダは、まさにこの種のオブジェクトを短く書く方法じゃ。",
    ),
    ex(`
      struct IsBig {
        int limit;
        bool operator()(int x) const { return x > limit; }
      };
      int main() {
        std::vector<int> v{4, 12, 7, 30};
        std::cout << std::count_if(v.begin(), v.end(), IsBig{10});
      }`, "2",
      L("A function object as the rule of an algorithm", "Un objeto función como regla de un algoritmo", "アルゴリズムのルールとしての関数オブジェクト")),
    p(
      "Rule to remember: obj(args) on an object means obj.operator()(args). Common mistake: confusing creating the object, Adder plus100{100}, with calling it, plus100(5). The braces set the stored data; the parentheses run the call.",
      "Regla para recordar: obj(args) sobre un objeto significa obj.operator()(args). Error común: confundir crear el objeto, Adder plus100{100}, con llamarlo, plus100(5). Las llaves fijan los datos guardados; los paréntesis hacen la llamada.",
      "覚え方：オブジェクトに obj(args) と書くと obj.operator()(args) になる。よくあるミスは、作る Adder plus100{100} と呼ぶ plus100(5) を混同すること。波かっこはデータを決め、丸かっこは呼び出す。",
    ),
  ),
  note("chaining", L("Return references to chain", "Devolver referencias para encadenar", "参照を返してつなげる"),
    p(
      "Compound assignment operators like += change the object on the left. By convention they return *this by reference (T&), so the result of a += b is the same object a. That lets you chain: (a += 1) += 2 changes a twice. If += returned a copy instead, the second += would change a temporary copy that is thrown away.",
      "Los operadores de asignación compuesta como += cambian el objeto de la izquierda. Por convención devuelven *this por referencia (T&), así que el resultado de a += b es el mismo objeto a. Eso permite encadenar: (a += 1) += 2 cambia a dos veces. Si += devolviera una copia, el segundo += cambiaría una copia temporal que se descarta.",
      "+= のような複合代入は左のオブジェクトを変える。慣例として *this を参照（T&）で返すので、a += b の結果は a そのもの。だから (a += 1) += 2 で a が2回変わる。もしコピーを返すと、2回目の += は捨てられる一時コピーを変えてしまう。",
    ),
    ex(`
      struct Score {
        int pts = 0;
        Score operator+=(int n) { pts += n; return *this; }
      };
      int main() { Score s; (s += 10) += 5; std::cout << s.pts; }`, "10",
      L("Returning by value: the second += hits a copy", "Devolver por valor: el segundo += le pega a una copia", "値で返すと、2回目の += はコピーに効く")),
    p(
      "operator<< follows the same idea: it takes the stream by reference and must return it, so std::cout << a << b works as (std::cout << a) << b. Forgetting the return in a function that should return a value compiles with only a warning, but using it is undefined behavior.",
      "operator<< sigue la misma idea: recibe el stream por referencia y debe devolverlo, así std::cout << a << b funciona como (std::cout << a) << b. Olvidar el return en una función que debe devolver un valor compila solo con una advertencia, pero usarla es comportamiento indefinido.",
      "operator<< も同じ考え。ストリームを参照で受けとり、それを返す。だから std::cout << a << b は (std::cout << a) << b として動く。値を返すべき関数で return を忘れても警告だけでコンパイルされるが、それを使うのは未定義動作じゃ。",
    ),
    ex(`
      struct Tag { std::string name; };
      std::ostream& operator<<(std::ostream& os, const Tag& t) {
        return os << "#" << t.name;
      }
      int main() { std::cout << Tag{"cpp"} << " " << Tag{"fun"}; }`, "#cpp #fun",
      L("Each << hands the stream to the next one", "Cada << le pasa el stream al siguiente", "<< ごとにストリームを次へ渡す")),
    p(
      "Rule to remember: operators that modify the left side (=, +=, -=, prefix ++) return T& to *this; operator<< returns the stream it received. Common mistake: returning by value, which makes chains quietly act on copies.",
      "Regla para recordar: los operadores que modifican el lado izquierdo (=, +=, -=, ++ prefijo) devuelven T& a *this; operator<< devuelve el stream que recibió. Error común: devolver por valor, lo que hace que las cadenas actúen en silencio sobre copias.",
      "覚え方：左側を変える演算子（=, +=, -=, 前置 ++）は *this を T& で返す。operator<< は受けとったストリームを返す。よくあるミスは値で返すこと。つなげた操作がこっそりコピーに効いてしまう。",
    ),
  ),
];

// ── 3.5 Boss: recap notes ──
const bossNotes: NoteDef[] = [
  note("recap-dispatch", L("Recap: virtual calls", "Repaso: llamadas virtuales", "復習：virtual 呼び出し"),
    p(
      "A virtual function called through a base reference or pointer runs the real object's version, looked up at run time in the vtable. A plain function runs the version of the static type. override makes the compiler check that the signature (name, parameters, const) really matches a base virtual function; = 0 makes it pure, so the class is abstract.",
      "Una función virtual llamada por una referencia o puntero base corre la versión del objeto real, buscada al ejecutar en la vtable. Una función común corre la versión del tipo estático. override hace que el compilador revise que la firma (nombre, parámetros, const) coincida de verdad con una virtual de la base; = 0 la hace pura, y la clase queda abstracta.",
      "親の参照やポインタ越しの virtual 関数は、実行時に vtable を引いて本物の版が動く。ふつうの関数は静的な型の版。override はシグネチャ（名前・引数・const）が親の virtual と本当に一致するかをチェック。= 0 で純粋になり、クラスは抽象になる。",
    ),
    p(
      "Two subtle rules. First, a non-virtual member that calls a virtual one still dispatches on the real object, because the call goes through this. Second, default arguments are not part of the dispatch: they are filled in at compile time from the static type, while the body is chosen at run time.",
      "Dos reglas sutiles. Primero, un miembro no virtual que llama a uno virtual igual despacha según el objeto real, porque la llamada pasa por this. Segundo, los argumentos por defecto no forman parte del despacho: se completan al compilar según el tipo estático, mientras que el cuerpo se elige al ejecutar.",
      "細かいルールが2つ。1つ目、virtual でないメンバーが virtual を呼んでも、this を通るので本物で決まる。2つ目、デフォルト引数は振り分けに入らない。引数は静的な型でコンパイル時に入り、本体は実行時に選ばれる。",
    ),
    ex(`
      struct Lamp {
        virtual void on(int level = 1) { std::cout << "lamp" << level << " "; }
        virtual ~Lamp() = default;
      };
      struct Led : Lamp { void on(int level = 9) override { std::cout << "led" << level << " "; } };
      int main() { Led l; Lamp plain; Lamp& r = l; r.on(); plain.on(); }`, "led1 lamp1",
      L("Led's body runs, with Lamp's default argument", "Corre el cuerpo de Led, con el argumento por defecto de Lamp", "Led の本体が、Lamp のデフォルト引数で動く")),
    bad(`
      struct Gem {
        virtual int shine() const = 0;
        virtual ~Gem() = default;
      };
      int main() { Gem g; }`,
      L("Does not compile: Gem is abstract", "No compila: Gem es abstracta", "コンパイル不可：Gem は抽象クラス")),
    p(
      "Common mistakes to avoid: forgetting const and losing the override, mixing up = 0 (no body, heirs write it) with = default (compiler writes a normal body), and expecting a heir's default argument when calling through a base reference.",
      "Errores comunes que evitar: olvidar const y perder el override, confundir = 0 (sin cuerpo, lo escriben los herederos) con = default (el compilador escribe un cuerpo normal), y esperar el argumento por defecto del heredero al llamar por una referencia base.",
      "さけたいミス：const を忘れて override にならない、= 0（中身なし、子が書く）と = default（コンパイラがふつうの中身を書く）を混同する、親の参照越しに子のデフォルト引数を期待する。",
    ),
  ),
  note("recap-objects", L("Recap: build order and slicing", "Repaso: orden y slicing", "復習：作る順番とスライス"),
    p(
      "Construction goes base, then members in declaration order, then the derived body. Destruction is the exact reverse. Copying a derived object into a base value (a variable, a by-value parameter, a std::vector<Base>) keeps only the base part: the copy is a real base object and virtual calls on it answer as the base.",
      "La construcción va: base, luego miembros en orden de declaración, luego el cuerpo derivado. La destrucción es el reverso exacto. Copiar un objeto derivado en un valor base (una variable, un parámetro por valor, un std::vector<Base>) guarda solo la parte base: la copia es un objeto base real y las llamadas virtuales sobre ella responden como la base.",
      "作る順番は 親 → メンバー（宣言順）→ 子の本体。こわすときはちょうど逆。子を親の「値」（変数、値渡しの引数、std::vector<Base>）にコピーすると親の部分だけが残る。コピーは本物の親なので、virtual も親として答える。",
    ),
    ex(`
      struct Frame { Frame() { std::cout << "F"; } ~Frame() { std::cout << "~F"; } };
      struct Glass { Glass() { std::cout << "G"; } ~Glass() { std::cout << "~G"; } };
      struct Window : Frame {
        Glass g;
        Window() { std::cout << "W"; }
        ~Window() { std::cout << "~W"; }
      };
      int main() { Window w; }`, "FGW~W~G~F",
      L("On: base, member, body. Off: the mirror image", "Al poner: base, miembro, cuerpo. Al quitar: el espejo", "着る：親・メンバー・本体、脱ぐ：その逆")),
    ex(`
      struct Bird {
        virtual std::string call() const { return "tweet"; }
        std::string greet() const { return "I say " + call(); }
        virtual ~Bird() = default;
      };
      struct Owl : Bird { std::string call() const override { return "hoot"; } };
      int main() { Owl o; Bird copy = o; std::cout << o.greet() << ", " << copy.greet(); }`, "I say hoot, I say tweet",
      L("greet() dispatches through this; the sliced copy is just a Bird", "greet() despacha por this; la copia rebanada es solo un Bird", "greet() は this 経由で振り分け、コピーはただの Bird")),
    p(
      "Common mistakes to avoid: thinking the derived constructor body runs first, forgetting that members are built between the base and the body, and expecting virtual to rescue a sliced copy. Keep polymorphic objects behind references or pointers.",
      "Errores comunes que evitar: creer que el cuerpo del constructor derivado corre primero, olvidar que los miembros se construyen entre la base y el cuerpo, y esperar que virtual salve una copia rebanada. Mantén los objetos polimórficos detrás de referencias o punteros.",
      "さけたいミス：子のコンストラクタ本体が先に動くと思う、メンバーは親と本体の間に作られることを忘れる、スライスされたコピーを virtual が救うと思う。ポリモーフィックな物は参照かポインタで持とう。",
    ),
  ),
  note("recap-operators", L("Recap: defaulted comparisons", "Repaso: comparaciones = default", "復習：= default の比較"),
    p(
      "auto operator<=>(const T&) const = default; compares members one by one, in the order they are declared, and the first member that differs decides the result. Later members only matter when all earlier ones are equal. From it you get <, >, <= and >=, plus == and !=.",
      "auto operator<=>(const T&) const = default; compara los miembros uno por uno, en el orden en que se declararon, y el primer miembro distinto decide el resultado. Los miembros posteriores solo importan cuando todos los anteriores son iguales. De él obtienes <, >, <= y >=, además de == y !=.",
      "auto operator<=>(const T&) const = default; は宣言順にメンバーを1つずつ比べ、最初にちがったメンバーで結果が決まる。後ろのメンバーは、前が全部同じときだけ効く。<, >, <=, >= に加えて == と != も使える。",
    ),
    ex(`
      struct Rank {
        int tier, stars;
        auto operator<=>(const Rank&) const = default;
      };
      int main() {
        std::cout << (Rank{2, 1} <= Rank{1, 5}) << (Rank{3, 4} >= Rank{3, 4});
      }`, "01",
      L("tier decides first; equal ranks satisfy >=", "Primero decide tier; rangos iguales cumplen >=", "まず tier、同じなら >= は true")),
    p(
      "Remember that comparisons print as 1 (true) or 0 (false) with std::cout. For <= and >=, equal values count as true. Common mistake: looking at the larger later member (5 stars!) when an earlier member has already decided.",
      "Recuerda que las comparaciones se imprimen como 1 (true) o 0 (false) con std::cout. Para <= y >=, los valores iguales cuentan como true. Error común: fijarse en el miembro posterior más grande (¡5 estrellas!) cuando un miembro anterior ya decidió.",
      "比較は std::cout で 1（true）か 0（false）と表示される。<= と >= では、等しいときも true。よくあるミスは、前のメンバーでもう決まっているのに、後ろの大きい数（星5つ！）を見てしまうこと。",
    ),
  ),
  note("recap-overloads", L("Recap: name hiding and overloads", "Repaso: ocultar nombres y sobrecargas", "復習：名前の隠蔽とオーバーロード"),
    p(
      "When a derived class declares a function with some name, it hides every base function with that same name, whatever their parameters. Name lookup stops at the first class where the name is found, and only then looks for the best match. using Base::name; inside the derived class brings the base versions back into the set.",
      "Cuando una clase derivada declara una función con cierto nombre, oculta todas las funciones de la base con ese mismo nombre, sin importar sus parámetros. La búsqueda de nombres se detiene en la primera clase donde encuentra el nombre, y solo entonces busca la mejor coincidencia. using Base::name; dentro de la derivada devuelve las versiones de la base al conjunto.",
      "子クラスがある名前の関数を宣言すると、引数にかかわらず親の同じ名前の関数は全部隠れる。名前探しは名前が見つかった最初のクラスで止まり、そこで一番合うものを探す。子の中に using Base::name; と書けば親の版も候補に戻る。",
    ),
    ex(`
      struct Printer {
        void print(int n) { std::cout << "int " << n; }
        void print(std::string s) { std::cout << "text " << s; }
      };
      struct ColorPrinter : Printer {
        using Printer::print;
        void print(double d) { std::cout << "double " << d; }
      };
      int main() { ColorPrinter c; c.print(std::string("hi")); }`, "text hi",
      L("using brings the hidden base overloads back", "using recupera las sobrecargas ocultas de la base", "using で隠れた親の版を戻す")),
    bad(`
      struct Printer { void print(std::string s) {} };
      struct ColorPrinter : Printer { void print(double d) {} };
      int main() { ColorPrinter c; c.print(std::string("hi")); }`,
      L("Does not compile: only print(double) is visible", "No compila: solo se ve print(double)", "コンパイル不可：見えるのは print(double) だけ")),
    p(
      "Among overloads, the compiler ranks how each argument fits: an exact match is best, then a promotion (char, short or bool to int; float to double), then a conversion (int to double, double to int...). So a small integer type prefers an int overload, and a float prefers a double overload.",
      "Entre sobrecargas, el compilador clasifica cómo encaja cada argumento: una coincidencia exacta es lo mejor, luego una promoción (char, short o bool a int; float a double) y luego una conversión (int a double, double a int...). Así, un tipo entero pequeño prefiere la sobrecarga int, y un float prefiere la double.",
      "オーバーロードでは、引数の合い方に順位がある：完全一致が一番、次に昇格（char・short・bool → int、float → double）、その次が変換（int → double など）。だから小さい整数型は int 版を、float は double 版を選ぶ。",
    ),
    ex(`
      void show(long) { std::cout << "long "; }
      void show(int) { std::cout << "int "; }
      int main() { short s = 2; show(s); show(5L); }`, "int long",
      L("short promotes to int; 5L is already a long", "short se promueve a int; 5L ya es long", "short は int に昇格、5L はもともと long")),
  ),
];

// ─── 3.1 Heirs and bases ───────────────────────────────────────────────────
const heirs: LessonDef = {
  slug: "heirs-and-bases",
  title: L("Heirs and bases", "Herederos y bases", "継承：親と子"),
  concept: "inheritance",
  mode: "lesson",
  xp: 70,
  enemy: "cpp/segfault-skull",
  enemyName: L("HEIR SKULL", "CRÁNEO HEREDERO", "ツギテスカル"),
  notes: heirsNotes,
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
      hint: L("Think of armor: which layer must exist before the next goes on? Taking it off runs the other way.", "Piensa en una armadura: ¿qué capa debe existir antes de la siguiente? Al quitarla, es al revés.", "よろいを思い出そう。どの層が先に必要？脱ぐときは逆じゃ。"),
      note: "build-order",
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
      hint: L("Three parts get built: the base, the member b and C's own body. Which must be ready before the body runs?", "Se construyen tres partes: la base, el miembro b y el cuerpo de C. ¿Cuáles deben estar listas antes del cuerpo?", "親、メンバー b、C の本体。本体の前にできていないといけないのは？"),
      note: "build-order",
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
      hint: L("Look at the keyword used to declare Base. What is the default access for members of a class?", "Mira la palabra usada para declarar Base. ¿Cuál es el acceso por defecto de los miembros de una class?", "Base を宣言したキーワードを見よう。class のメンバーの標準アクセスは？"),
      note: "access",
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
      hint: L("You want heirs inside and outsiders kept out. Which access level is made exactly for that?", "Quieres a los herederos adentro y a los de afuera fuera. ¿Qué nivel de acceso existe justo para eso?", "子は入れて、外の人は入れない。そのためのアクセス指定は？"),
      note: "access",
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
      hint: L("The init list runs before the heir's body. Follow the number handed to the base.", "La lista de inicio corre antes del cuerpo del heredero. Sigue el número que se le pasa a la base.", "初期化リストは子の本体より先。親に渡す数を追おう。"),
      note: "base-ctor",
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
      hint: L("Hero() names no base constructor, so the default one is needed. Does Base have one?", "Hero() no nombra ningún constructor base, así que hace falta el por defecto. ¿Base tiene uno?", "Hero() は親のコンストラクタを指定していない。Base に引数なし版はある？"),
      note: "base-ctor",
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
      hint: L("sound() is not virtual. Which type does the code see for a, and which for d?", "sound() no es virtual. ¿Qué tipo ve el código para a, y cuál para d?", "sound() は virtual ではない。a と d、コード上の型はそれぞれ何？"),
      note: "static-type",
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
      hint: L("In the init list, a base is called like a constructor: by its type name.", "En la lista de inicio, a la base se la llama como a un constructor: por su nombre de tipo.", "初期化リストでは、親をコンストラクタのように型名で呼ぶ。"),
      note: "base-ctor",
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
      hint: L("Knight's constructor never tells Unit which hp to use. Where do you pass values to a base?", "El constructor de Knight nunca le dice a Unit qué hp usar. ¿Dónde se le pasan valores a la base?", "Knight は Unit に hp を伝えていない。親に値を渡す場所はどこ？"),
      note: "base-ctor",
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
  notes: virtualNotes,
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
      hint: L("sound() is marked virtual. Who decides which version runs: the reference's type or the real object?", "sound() está marcada virtual. ¿Quién decide qué versión corre: el tipo de la referencia o el objeto real?", "sound() は virtual。どの版が動くかを決めるのは参照の型？本物？"),
      note: "virtual-dispatch",
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
      hint: L("Compare the two signatures piece by piece. Does Lion's version truly match the base one?", "Compara las dos firmas pieza por pieza. ¿La versión de Lion coincide de verdad con la de la base?", "2つのシグネチャを部品ごとに比べよう。Lion の版は親と本当に一致する？"),
      note: "override-final",
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
      hint: L("Does override change how the program runs, or what the compiler checks?", "¿override cambia cómo corre el programa, o lo que revisa el compilador?", "override が変えるのは実行の仕方？コンパイラのチェック？"),
      note: "override-final",
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
      hint: L("Shape has a function with = 0 and no body. Can an object of such a class exist?", "Shape tiene una función con = 0 y sin cuerpo. ¿Puede existir un objeto de esa clase?", "Shape には中身のない = 0 の関数がある。そのクラスの物は作れる？"),
      note: "pure-virtual",
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
      hint: L("Each unique_ptr points at a real object. Which sound() does a virtual call reach for each one?", "Cada unique_ptr apunta a un objeto real. ¿Qué sound() alcanza la llamada virtual en cada uno?", "unique_ptr はそれぞれ本物を指す。virtual 呼び出しはどの sound() に届く？"),
      note: "virtual-dispatch",
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
      hint: L("Look at how Puppy is declared. What does that extra word forbid?", "Mira cómo se declara Puppy. ¿Qué prohíbe esa palabra extra?", "Puppy の宣言を見よう。ついている言葉は何を禁止する？"),
      note: "override-final",
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
      hint: L("When Base() runs, has the D part been built yet? Then think about the call after construction.", "Cuando corre Base(), ¿ya se construyó la parte D? Luego piensa en la llamada tras la construcción.", "Base() が動くとき、D の部分はもうある？作り終わった後の呼び出しも考えよう。"),
      note: "virtual-in-ctor",
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
      hint: L("Which keyword asks the compiler to confirm this replaces a virtual function?", "¿Qué palabra le pide al compilador confirmar que esto reemplaza una función virtual?", "virtual 関数を置きかえているか、コンパイラに確かめさせる言葉は？"),
      note: "override-final",
      code: ANIMAL + '\nstruct Lion : Animal {\n  std::string sound() const ___ { return "roar"; }\n};\nint main() { Lion l; Animal& a = l; std::cout << a.sound(); }',
      answer: "override",
      check: { compiles: true, stdout: "roar" },
      explain: L("override goes after const. Now a typo in the signature is a compile error, not a silent bug.", "override va después de const. Ahora un error en la firma es un error de compilación, no un bug silencioso.", "override は const の後。シグネチャの書きまちがいがコンパイルエラーになる。"),
      win: [{ t: "print", text: "roar" }],
    },
    {
      kind: "run",
      prompt: L("Make cast() use the real spell", "Haz que cast() use el hechizo real", "cast() で本物の呪文を使わせよう"),
      hint: L("Through a const Spell&, which name() runs when it isn't virtual? What keyword changes that?", "Con un const Spell&, ¿qué name() corre si no es virtual? ¿Qué palabra cambia eso?", "const Spell& 越しで virtual でないと、どの name() が動く？変える言葉は？"),
      note: "virtual-dispatch",
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
  notes: slicedNotes,
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
      hint: L("a is a brand new Animal value, not a reference. How much of the Dog fits inside it?", "a es un valor Animal nuevo, no una referencia. ¿Cuánto del Dog cabe adentro?", "a は参照ではなく新しい Animal の値。Dog のどこまでが入る？"),
      note: "slicing",
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
      hint: L("One function takes its parameter by value, the other by reference. Which one makes a copy?", "Una función recibe su parámetro por valor, la otra por referencia. ¿Cuál hace una copia?", "片方は値渡し、もう片方は参照渡し。コピーするのはどっち？"),
      note: "slicing",
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
      hint: L("What does std::vector<Animal> actually store: Animal values, or the real objects?", "¿Qué guarda en realidad std::vector<Animal>: valores Animal, o los objetos reales?", "std::vector<Animal> が入れるのは Animal の値？本物？"),
      note: "slicing",
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
      hint: L("The base destructor is virtual. Deleting through Base, which destructors run, and in what order?", "El destructor base es virtual. Al borrar por Base, ¿qué destructores corren y en qué orden?", "親のデストラクタは virtual。Base 越しに消すと、どれがどの順で動く？"),
      note: "virtual-destructor",
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
      hint: L("Is ~Base virtual? Think about what delete through a Base* can know about the D part.", "¿~Base es virtual? Piensa qué puede saber delete, con un Base*, de la parte D.", "~Base は virtual？Base* 越しの delete は D の部分を知っている？"),
      note: "virtual-destructor",
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
      hint: L("a really is a Dog. A cast to the wrong type gives nullptr, and a bool prints as 1 or 0.", "a en verdad es un Dog. Un cast al tipo equivocado da nullptr, y un bool se imprime como 1 o 0.", "a の正体は Dog。型ちがいのキャストは nullptr、bool は 1 か 0 で表示。"),
      note: "dynamic-cast",
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
      hint: L("A virtual destructor with no special work can ask the compiler to write its body.", "Un destructor virtual sin trabajo especial puede pedirle al compilador que escriba su cuerpo.", "特別な仕事のない virtual デストラクタは、中身をコンパイラにまかせられる。"),
      note: "virtual-destructor",
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
      hint: L("show takes its Shape by value, so it copies. What kind of parameter avoids the copy?", "show recibe su Shape por valor, así que copia. ¿Qué tipo de parámetro evita la copia?", "show は Shape を値で受けるのでコピーする。コピーしない引数の形は？"),
      note: "slicing",
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
  notes: operatorNotes,
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
      hint: L("a + b calls operator+, which adds x with x and y with y. Then << prints the result.", "a + b llama a operator+, que suma x con x e y con y. Luego << imprime el resultado.", "a + b は operator+ で x 同士、y 同士を足す。それを << が表示。"),
      note: "operator-basics",
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
      hint: L("A defaulted == compares every member. And since C++20, != is written from ==.", "Un == con = default compara cada miembro. Y desde C++20, != se escribe a partir de ==.", "= default の == は全メンバーを比べる。C++20 では != は == から作られる。"),
      note: "defaulted-compare",
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
      hint: L("Only == was defaulted. Does equality also tell the compiler how to order two values?", "Solo se usó = default con ==. ¿La igualdad le dice al compilador cómo ordenar dos valores?", "= default にしたのは == だけ。等しさから順序はわかる？"),
      note: "defaulted-compare",
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
      hint: L("A defaulted <=> compares members in declaration order. The first difference decides.", "Un <=> con = default compara los miembros en orden de declaración. Decide la primera diferencia.", "= default の <=> は宣言順に比べる。最初のちがいで決まる。"),
      note: "defaulted-compare",
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
      hint: L("Which single operator, when defaulted, gives you <, >, <= and >=? It's made of three symbols.", "¿Qué operador, con = default, te da <, >, <= y >=? Está hecho de tres símbolos.", "= default で < > <= >= をくれる演算子は？記号3つでできている。"),
      note: "defaulted-compare",
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
      hint: L("Prefix and postfix differ in what they hand back. Track n after each line.", "Prefijo y postfijo difieren en lo que devuelven. Sigue el valor de n tras cada línea.", "前置と後置は返す物がちがう。各行のあとの n を追おう。"),
      note: "increment-ops",
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
      hint: L("operator() lets you call the object like a function. Use the k stored inside triple.", "operator() permite llamar al objeto como a una función. Usa el k guardado en triple.", "operator() で物を関数のように呼べる。triple の中の k を使おう。"),
      note: "call-operator",
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
      hint: L("Check what += returns: a copy, or the same object? That decides what the second += changes.", "Mira qué devuelve +=: ¿una copia o el mismo objeto? Eso decide qué cambia el segundo +=.", "+= が返すのはコピー？同じ物？それで2回目の += が変える物が決まる。"),
      note: "chaining",
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
      hint: L("operator<< must hand the stream back so the chain can go on. Which keyword gives a value back?", "operator<< debe devolver el stream para que la cadena siga. ¿Qué palabra devuelve un valor?", "つなげるには operator<< がストリームを返す必要がある。値を返す言葉は？"),
      note: "chaining",
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
      hint: L("operator+ should combine this object with the other one. Which operand is being ignored?", "operator+ debe combinar este objeto con el otro. ¿Qué operando se está ignorando?", "operator+ は自分と相手を合わせるはず。無視されているのはどっち？"),
      note: "operator-basics",
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
  notes: bossNotes,
  beats: [
    enemySays(L(
      "I AM THE VTABLE DRAGON. I swap costumes, slice shields and twist your runes. Who REALLY answers the call?",
      "SOY EL DRAGÓN VTABLE. Cambio disfraces, rebano escudos y tuerzo tus runas. ¿Quién responde REALMENTE la llamada?",
      "我は vtable ドラゴン。衣装を替え、盾を切り、ルーンをねじる。呼び出しに答えるのは本当はだれだ？",
    )),
    {
      kind: "predict", time: 20, prompt: PRINT,
      hint: L("b.g() calls the virtual f on a real B. What kind of object is a after A a = b?", "b.g() llama a la f virtual sobre un B real. ¿Qué clase de objeto es a tras A a = b?", "b.g() は本物の B で virtual f を呼ぶ。A a = b の後の a は何？"),
      note: "recap-dispatch",
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
      hint: L("Base first, then members, then the body. Destruction is the mirror image.", "Primero la base, luego los miembros, luego el cuerpo. La destrucción es el espejo.", "親 → メンバー → 本体。こわすときは鏡うつし。"),
      note: "recap-objects",
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
      hint: L("Each pointer keeps its real shape, and sides() is virtual. Add up what each one answers.", "Cada puntero conserva su forma real, y sides() es virtual. Suma lo que responde cada uno.", "ポインタは本物の形を保ち、sides() は virtual。それぞれの答えを足そう。"),
      note: "recap-dispatch",
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
      hint: L("The body is chosen by the real object, but default arguments come from the type the code sees.", "El cuerpo lo elige el objeto real, pero los valores por defecto salen del tipo que ve el código.", "本体は本物が選ぶが、デフォルト引数はコード上の型から来る。"),
      note: "recap-dispatch",
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
      hint: L("Compare Lion's signature with the base's sound(). What does override do on a mismatch?", "Compara la firma de Lion con el sound() de la base. ¿Qué hace override si no coinciden?", "Lion と親の sound() のシグネチャを比べよう。不一致なら override は？"),
      note: "recap-dispatch",
      code: ANIMAL + '\nstruct Lion : Animal {\n  std::string sound() override { return "roar"; }\n};\nint main() {}',
      options: [YES, NO_GCC], answer: 1,
      check: { compiles: false },
      explain: L("No const: it overrides nothing, and override catches it.", "Sin const no reemplaza nada, y override lo detecta.", "const がなく何も置きかえない。override が見抜く。"),
    },
    {
      kind: "pick", time: 15, prompt: L("Which one makes it abstract?", "¿Cuál la hace abstracta?", "抽象クラスにするのは？"),
      hint: L("Which ending makes a virtual function pure, with no body, so heirs must write it?", "¿Qué final hace pura a una función virtual, sin cuerpo, para que la escriban los herederos?", "中身なしで子に書かせる、純粋仮想にする書き方は？"),
      note: "recap-dispatch",
      code: "struct Shape {\n  virtual double area() const ___;\n};\nstruct Sq : Shape { double area() const override { return 4; } };\nint main() { Sq s; std::cout << s.area(); }",
      options: ["= 0", "= default"], answer: 0,
      check: { compiles: true, stdout: "4", wrongFail: true },
      explain: L("= 0 means pure virtual: no body, heirs must write it.", "= 0 es virtual pura: sin cuerpo, los herederos la escriben.", "= 0 は純粋仮想。中身は子が書く。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      hint: L("Members compare in declaration order: major first. minor only matters on a tie.", "Los miembros se comparan en orden de declaración: primero major. minor solo importa si empatan.", "宣言順に比べる：まず major。minor は同点のときだけ。"),
      note: "recap-operators",
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
      hint: L("A vector of Animal values: does each element keep the Dog part?", "Un vector de valores Animal: ¿cada elemento conserva la parte Dog?", "Animal の値の vector。各要素に Dog の部分は残る？"),
      note: "recap-objects",
      code: ANIMAL + "\nint main() {\n  std::vector<Animal> v;\n  v.push_back(Dog{});\n  std::cout << v[0].sound();\n}",
      options: ["...", "woof"], answer: 0, output: "...",
      check: { compiles: true, stdout: "..." },
      explain: L("A vector of values slices every Dog.", "Un vector de valores rebana cada Dog.", "値の vector は Dog をスライスする。"),
    },
    {
      kind: "predict", time: 20, prompt: COMPILES,
      hint: L("B declares its own f. What happens to every A::f with that name, even with other parameters?", "B declara su propia f. ¿Qué pasa con cada A::f de ese nombre, aun con otros parámetros?", "B が自分の f を宣言した。引数のちがう A::f たちはどうなる？"),
      note: "recap-overloads",
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
      hint: L("For each call, find the overload reached by a promotion (no value change), not a conversion.", "En cada llamada, busca la sobrecarga que se alcanza por promoción (sin cambiar el valor), no por conversión.", "各呼び出しで、変換ではなく昇格（値が変わらない）で届く版を探そう。"),
      note: "recap-overloads",
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
