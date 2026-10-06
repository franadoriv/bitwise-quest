# C# planet: proposed curriculum

Curriculum for the **C# planet** (pack `csharp`, 4 regions) and its entry exams. It is written for a learner who may
know nothing about programming, and it follows what companies actually assess (see
[csharp-hiring-assessments.md](csharp-hiring-assessments.md)). Content authors turn this into a language pack
following [../content-model.md](../content-model.md), [../authoring-lessons.md](../authoring-lessons.md) and
[../exams.md](../exams.md).

## Conventions used in this file

### Verification tags

Every question idea ends with a tag saying how its answer is proven. All `[R]` and `[C]` answers below were compiled
and executed on **.NET 10.0.3 (CoreCLR)** through the Compiler Explorer API (`dotnet100csharpcoreclr`) on 2026-10-06.
Content authors should still wire each into `check` so `content:verify` keeps them honest.

| Tag | Meaning | How it was checked |
|---|---|---|
| `[R]` | Runtime output (stdout), or the exception type and message thrown at runtime | Snippet wrapped in a file with the `using` lines shown in "Runner assumptions", executed; stdout compared exactly |
| `[C]` | "Does it compile?": No, with the exact compiler error code and message | Compiled on the same runner; the error code is the first error reported |
| `[W]` | Compiles with a warning (the warning code is the teaching point) | Same runner |
| `[Doc]` | Behaviour not safely machine-checkable (timing, GC, sync contexts, design rules) | Anchored to the Microsoft Learn page cited in the lesson |

### Runner assumptions (confirmed)

- Single file, top-level statements allowed. **Implicit usings are off**: every snippet must start with the `using`
  lines it needs (`using System;`, `using System.Collections.Generic;`, `using System.Linq;`, `using System.Text;`,
  `using System.Threading.Tasks;`). Missing `System.Collections.Generic` gives `CS0246`, missing `System.Linq` gives
  `CS1061` (both are good "does it compile?" questions in themselves).
- **Nullable reference types are on**: `string s = null;` compiles with warning `CS8600`. Use `string?` in clean
  snippets. Warnings never fail the build.
- In top-level programs, helper methods go after the statements as `static` local functions; types (`class`,
  `struct`, `record`, `interface`, `enum`) go at the very end of the file.
- Unhandled exceptions are printed to **stderr** (`Unhandled exception. System.FormatException: ...`, exit code 134);
  previous stdout lines survive. Every `run` below has an `expect` substring that the starter's stdout does not
  contain.
- Determinism rules: never rely on `Dictionary` / `HashSet` enumeration order, `GetHashCode` values, finalizer timing,
  or interleavings of concurrent tasks. Async examples below only use sequential `await`s, `Task.WhenAll` (results
  come back in argument order) or a 100 ms margin, and are marked accordingly.
- Doubles print as `3.5` on the runner; prefer integer outputs anyway.

### Question kinds

`pick` (one `___`, 2-4 options), `predict` (output, Yes/No, or exception type), `type` (exact token for `___`),
`order` (lines in the correct order, unique), `run` (broken starter → expected stdout). Prompts are short; code is at
most 12 lines. Snippets below are written compactly (the `using` lines are omitted from the inline snippets but must
be present in content); authors should split them into lines.

### Visual vocabulary (existing stage effects)

The stage understands: `tag` (a label above an actor = a variable name), `value` (a value chip), `item` (sword,
potion, gem, shield, scroll, key), `give`, `clone`, `lend`, `drop`, `dead`, `say`, `print` (console output), `shake`
(error), `banner`, `enter` / `exit`, `attack` / `hp`, `wait`. Suggested mapping for this planet:

| Code idea | On stage |
|---|---|
| Variable | `tag` label above an actor; its declared type is written on the tag (`int hp`) |
| Value type (`int`, `double`, `bool`, `struct`) | `value` chip or a small item; assignment / passing = `clone` (the receiver gets its own copy) |
| Reference type (`class`, array, `string`, `List`) | An `item` that stays in one place; assignment = `lend` where the ghost does NOT come back: both tags point at the same item |
| `null` | An actor with a `tag` but empty hands; touching the item = `shake` + `NullReferenceException` |
| Boxing | The chip is put in a `shield` crate (`clone` into a box); unboxing to the wrong type = `shake` |
| Compiler error | A gate guard at the door: `shake` + `banner` with the `CSxxxx` code; the program never starts |
| Runtime exception | The hero `attack`s and the enemy `shake`s with the exception name |
| `Console.WriteLine` | `print` |
| Class vs object | Blueprint `scroll` (class) vs the actors built from it (objects) |
| Inheritance | The child actor `enter`s wearing the parent's items plus its own |
| Interface | A `banner` contract ("CAN ATTACK") the actor must fulfil |
| Delegate / lambda | A `key` item: a spell you can hand to someone else (`give`) and they cast it later |
| Closure | The key carries a backpack (`scroll`) with the captured variable |
| LINQ pipeline | A conveyor of allies; each ally is a stage (`Where`, `Select`); items flow one by one only when someone pulls (deferred) |
| Exception / `finally` | `shake`, then the guard always closes the gate (`finally` = `banner` "ALWAYS") |
| `IDisposable` / `using` | A torch item that is lit at `using` and `drop`ped automatically when the block ends |
| `Task` / `await` | A messenger (ally) sent away (`exit`), the hero `wait`s at `await` and resumes when the messenger `enter`s with the result |

---

## Region overview

Learning order: values → objects → collections and functions → failure and time. The learner first sees what data
is and how it is copied (the most-asked interview topic), then how C# models things (classes, interfaces, records),
then the functional side (generics, lambdas, LINQ), and finally what happens when things go wrong or take time
(exceptions, resources, async).

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `value-village` | village | Types, strings, null, value vs reference, equality | 4 + boss |
| 2 | `class-forest` | forest | Classes, properties, inheritance, interfaces, records and patterns | 4 + boss |
| 3 | `linq-peaks` | mountain | Collections, generics, delegates, closures, LINQ, deferred execution | 4 + boss |
| 4 | `task-tower` | tower | Exceptions, `using` / IDisposable, async/await and Task | 3 + boss |

The `castle` theme is left free for a future region 5, `span-castle` (memory and performance: GC generations,
finalizers, `Span<T>`, `readonly struct`, `in`, thread safety, dependency injection lifetimes). Those topics are
exam-only for now (see the entry exams).

---

## Region 1: `value-village`, Values, types and equality

### 1.1 `types-and-variables`, "Labels and chips"

- **Concept**: a variable is a typed label: `int`, `double`, `bool`, `string`, `char`; `var` infers the type once
  (it is still static); integer division and `%`; casting (`(int)3.9` truncates); `const`; `int.Parse` vs
  `int.TryParse` with `out`; string `+` concatenation evaluates left to right.
- **Visual**: hero gets `tag` `int hp` and a `value` chip `10`. Assigning `3.5` to the tag: the gate guard `shake`s
  with `CS0266`. `7 / 2` drops a chip `3` (the `.5` falls to the ground with `drop`).
- **Questions**:
  1. predict: `int hp = 10; hp = hp + 5; Console.WriteLine(hp);` → `15` [R]
  2. predict: `Console.WriteLine(7 / 2);` → `3`; follow-up `Console.WriteLine(7 / 2.0);` → `3.5` [R]
  3. predict: `Console.WriteLine(7 % 3);` → `1` [R]
  4. predict: `Console.WriteLine("1" + 2 + 3);` → `123`; `Console.WriteLine(1 + 2 + "3");` → `33` [R]
  5. predict "Does it compile?": `int x = 3.5;` → No: `CS0266 Cannot implicitly convert type 'double' to 'int'. An explicit conversion exists (are you missing a cast?)` [C]
  6. predict: `Console.WriteLine((int)3.9);` → `3` (truncates, does not round) [R]
  7. predict "Does it compile?": `var x = 5; x = "five";` → No: `CS0029 Cannot implicitly convert type 'string' to 'int'` (`var` is not dynamic) [C]
  8. predict "Does it compile?": `const int gold = 5; gold = 6;` → No: `CS0131 The left-hand side of an assignment must be a variable, property or indexer` [C]
  9. predict: `Console.WriteLine(int.TryParse("abc", out int n) + " " + n);` → `False 0` [R]
  10. predict "What happens?": `Console.WriteLine(int.Parse("abc"));` → `FormatException` (`The input string 'abc' was not in a correct format.`) [R]
  11. predict (stretch): `int max = int.MaxValue; max++; Console.WriteLine(max);` → `-2147483648` (silent overflow; `checked { }` would throw `OverflowException`) [R]
  12. predict: `int z = 0; Console.WriteLine(10 / z);` → `DivideByZeroException`; with `double z = 0` → `Infinity` [R]
- **Run**: starter
  `int gold = 7; int players = 2; double share = gold / players; Console.WriteLine($"share: {share}");`
  prints `share: 3`. Solution: `double share = gold / (double)players;`. `expect`: `share: 3.5`. [R]

### 1.2 `strings-and-null`, "Words that never change, and empty hands"

- **Concept**: strings are immutable (methods return a new string); interpolation `$"..."`; `.Length`, indexing,
  `Substring`, `string.Join`, `Split`; verbatim `@"..."`; `StringBuilder` for loops; `null`; nullable value types
  `int?`; nullable reference types `string?`; operators `?.`, `??`, `??=`; `NullReferenceException`.
- **Visual**: `s.ToUpper()` makes a new scroll appear (`clone` with banner "NEW STRING") while the hero keeps the old
  one unless the tag is moved. A `null` tag is an actor with empty hands; `?.` makes the actor `say` "nothing here"
  instead of crashing; `??` hands a backup potion.
- **Questions**:
  1. predict: `string s = "hero"; s.ToUpper(); Console.WriteLine(s);` → `hero` [R]
  2. pick: `string s = "hero"; ___; Console.WriteLine(s);` to print `HERO`: `s = s.ToUpper()` / `s.ToUpper()` / `ToUpper(s)` → `s = s.ToUpper()` [R]
  3. predict: `string name = "Ada"; int lvl = 3; Console.WriteLine($"{name} is level {lvl + 1}");` → `Ada is level 4` [R]
  4. predict: `string a = "hi"; string b = a; b += "!"; Console.WriteLine(a + " " + b);` → `hi hi!` [R]
  5. predict "Does it compile?": `string s = "a"; s[0] = 'b';` → No: `CS0200 Property or indexer 'string.this[int]' cannot be assigned to -- it is read only` [C]
  6. predict: `var sb = new StringBuilder(); for (int i = 0; i < 3; i++) sb.Append(i); Console.WriteLine(sb.ToString());` → `012` [R]
  7. predict: `string? s = null; Console.WriteLine(s ?? "none");` → `none` [R]
  8. predict: `string? s = null; Console.WriteLine(s?.Length ?? -1);` → `-1` [R]
  9. predict "What happens?": `string? s = null; Console.WriteLine(s.Length);` → `NullReferenceException` (and compile warning `CS8602 Dereference of a possibly null reference.`) [R][W]
  10. predict: `string? s = null; s ??= "default"; s ??= "other"; Console.WriteLine(s);` → `default` [R]
  11. predict: `int? n = null; Console.WriteLine(n.HasValue + " " + n.GetValueOrDefault());` → `False 0` [R]
  12. predict "What happens?": `int? n = null; Console.WriteLine(n.Value);` → `InvalidOperationException` (`Nullable object must have a value.`) [R]
  13. predict "Does it compile?": `int? n = 3; int m = n;` → No: `CS0266 Cannot implicitly convert type 'int?' to 'int'` [C]
  14. predict: `Console.WriteLine("a,b,,c".Split(',').Length);` → `4` [R]
- **Run**: starter `string? nick = null; int len = nick.Length; Console.WriteLine($"len: {len}");` → throws
  `NullReferenceException`. Solution: `int len = nick?.Length ?? 0;`. `expect`: `len: 0`. [R]

### 1.3 `value-and-reference`, "Copies and shared treasure"

- **Concept**: value types (`int`, `double`, `bool`, `struct`) are copied on assignment and when passed; reference
  types (`class`, arrays, `List`) share one object; `ref` and `out` parameters; reassigning a reference parameter vs
  mutating the object; boxing (`object o = 42`) and unboxing to the exact type; a struct read from a `List` is a
  copy.
- **Visual**: struct = a chip that is `clone`d on every `=`; class = an item that stays with the first actor while the
  second actor's tag points at it (`lend`, ghost does not return). `ref` = handing over the tag itself. Boxing = the
  chip goes into a crate; unboxing as `long` makes the crate `shake`.
- **Questions**:
  1. predict: `int a = 5; int b = a; b++; Console.WriteLine(a + " " + b);` → `5 6` [R]
  2. predict: `struct PointS { public int X; }` and `var p = new PointS { X = 1 }; var q = p; q.X = 99; Console.WriteLine(p.X);` → `1` [R]
  3. predict: same with `class PointC { public int X; }` → `99` [R]
  4. predict: `int[] a = { 1, 2 }; int[] b = a; b[0] = 9; Console.WriteLine(a[0]);` → `9` [R]
  5. predict: `static void AddOne(int n) { n++; }` and `int x = 1; AddOne(x); Console.WriteLine(x);` → `1`; with `ref int n` and `AddOne(ref x)` → `2` [R]
  6. predict: `static void Move(PointC p) { p.X = 50; }` → caller sees `50`; `static void Replace(PointC p) { p = new PointC { X = 77 }; }` → caller still sees `1`; with `ref PointC p` → `77` [R]
  7. pick: `static void Divide(int a, int b, ___ int q, ___ int r) { q = a / b; r = a % b; }` called as `Divide(7, 2, out int q, out int r)` → `out` (prints `3 1`) [R]
  8. predict "Does it compile?": `void F(out int r) { }` → No: `CS0177 The out parameter 'r' must be assigned to before control leaves the current method` [C]
  9. predict: `int i = 42; object o = i; i = 7; Console.WriteLine(o);` → `42` (the box holds a copy) [R]
  10. predict "What happens?": `object o = 42; long l = (long)o;` → `InvalidCastException` (unbox to the exact type; `(long)(int)o` works and gives `42`) [R]
  11. predict "Does it compile?": `var list = new List<PointS>(); list[0].X = 5;` (with `X` a property) → No: `CS1612 Cannot modify the return value of 'List<PointS>.this[int]' because it is not a variable` [C]
- **Run**: starter (with `struct HeroS { public int Hp; }`)
  `var hs = new HeroS[] { new HeroS { Hp = 10 } }; var h = hs[0]; h.Hp += 5; Console.WriteLine($"hp: {hs[0].Hp}");`
  prints `hp: 10`. Solution: `hs[0].Hp += 5;` (array elements are variables) or make `HeroS` a class.
  `expect`: `hp: 15`. [R]

### 1.4 `equality`, "Equal or the same?"

- **Concept**: `==` on value types compares values; on classes it compares references (unless overloaded); `string`
  overloads `==` to compare text; `Equals` is virtual; `object.ReferenceEquals`; `==` between two `object`-typed
  variables is reference comparison even if they hold strings; boxed ints compared with `==` are different boxes.
- **Visual**: two actors holding look-alike gems. `==` on classes asks "is it the SAME gem?" (`lend` ghosts meet or
  not). `Equals` on a string asks "same text?". A `banner` "SAME OBJECT" vs "SAME VALUE".
- **Questions**:
  1. predict: `var a = new PointC { X = 1 }; var b = new PointC { X = 1 }; Console.WriteLine(a == b);` → `False` [R]
  2. predict: `var a = new PointS { X = 1 }; var b = new PointS { X = 1 }; Console.WriteLine(a.Equals(b));` → `True` (struct `Equals` compares fields) [R]
  3. predict: `string a = "hi"; string b = new string(new[] { 'h', 'i' }); Console.WriteLine((a == b) + " " + ReferenceEquals(a, b));` → `True False` [R]
  4. predict: `object a = new string(new[] { 'h', 'i' }); object b = new string(new[] { 'h', 'i' }); Console.WriteLine((a == b) + " " + a.Equals(b));` → `False True` [R]
  5. predict: `var a = new PointC { X = 1 }; var b = a; Console.WriteLine(ReferenceEquals(a, b));` → `True` [R]
  6. predict: `int x = 5; object o1 = x; object o2 = x; Console.WriteLine((o1 == o2) + " " + o1.Equals(o2));` → `False True` [R]
  7. predict: `Console.WriteLine(ReferenceEquals("hi", "hi"));` → `True` (literals are interned) [R]
  8. predict: `Console.WriteLine(string.Equals("ADA", "ada", StringComparison.OrdinalIgnoreCase) + " " + ("ADA" == "ada"));` → `True False` [R]
- **Run**: starter `object a = "gem"; object b = new string("gem".ToCharArray()); Console.WriteLine($"match: {a == b}");`
  prints `match: False`. Solution: `a.Equals(b)`. `expect`: `match: True`. [R]

### 1.5 Boss `copy-golem` (mode `boss`)

- **Mix**: value vs reference copies, `ref`, null operators, integer division, string immutability, equality.
- **Boss run**: starter `static void Heal(int hp) { hp += 20; }` then `int hp = 50; Heal(hp); Console.WriteLine($"hp: {hp}");`
  prints `hp: 50`. Solution: `static void Heal(ref int hp)` and `Heal(ref hp);` (or return the new value).
  `expect`: `hp: 70`. [R]
- **Boss questions** (pick 6-8): 1.1 q4, 1.1 q7, 1.2 q4, 1.2 q8, 1.3 q3, 1.3 q6, 1.3 q9, 1.4 q4, 1.4 q6.

---

## Region 2: `class-forest`, Classes, inheritance, interfaces and records

### 2.1 `classes-and-properties`, "Blueprints and actors"

- **Concept**: `class`, fields, constructors, `new`; properties (`get` / `set`, computed, validation in a setter,
  get-only, `init`, `required`); access modifiers (`public`, `private`, `protected`, `internal`); `static` members
  shared by all instances; `ToString()` override; default `ToString()` prints the type name.
- **Visual**: the class is a blueprint `scroll`; each `new` makes an actor `enter`. A private field is an item in a
  locked chest (`shake` when touched from outside). A `static` counter is a `banner` above the whole village shared
  by every actor.
- **Questions**:
  1. predict (with a `Hero` whose `Hp` setter clamps `value < 0 ? 0 : value`): `var h = new Hero("Ada"); h.Hp = -10; Console.WriteLine(h.Hp);` → `0` [R]
  2. predict: `class Counter { public int N; public static int Total; public void Add() { N++; Total++; } }` and `var c = new Counter(); c.Add(); c.Add(); var d = new Counter(); d.Add(); Console.WriteLine(c.N + " " + d.N + " " + Counter.Total);` → `2 1 3` [R]
  3. predict "Does it compile?": accessing `h._hp` where `private int _hp;` → No: `CS0122 'Hero._hp' is inaccessible due to its protection level` [C]
  4. predict "Does it compile?": `public string Name { get; }` then `h.Name = "x";` → No: `CS0200 Property or indexer 'Hero.Name' cannot be assigned to -- it is read only` [C]
  5. predict "Does it compile?": `public int Lvl { get; init; }` then `var h = new Hero { Lvl = 1 }; h.Lvl = 2;` → No: `CS8852 Init-only property or indexer 'Hero.Lvl' can only be assigned in an object initializer, ...` [C]
  6. predict "Does it compile?": `public required string Name { get; init; }` then `var c = new Config();` → No: `CS9035 Required member 'Config.Name' must be set in the object initializer or attribute constructor.` [C]
  7. predict "Does it compile?": `public readonly int Id = 1;` then `h.Id = 2;` → No: `CS0191 A readonly field cannot be assigned to (except in a constructor ...)` [C]
  8. predict: `class Hero { ... }` without `ToString` and `Console.WriteLine(new Hero("Zed"));` → `Hero`; with `public override string ToString() => _t.ToUpper() + "!";` on a `Shout("hey")` → `HEY!` [R]
  9. predict "Does it compile?": `Console.WriteLine(h.Count);` where `Count` is `static` → No: `CS0176 Member 'Hero.Count' cannot be accessed with an instance reference; qualify it with a type name instead` [C]
- **Run**: starter `class Hero { public int Hp { get; set; } }` with `var h = new Hero(); h.Hp = -20; Console.WriteLine($"hp: {h.Hp}");`
  prints `hp: -20`. Solution: `private int _hp = 100; public int Hp { get => _hp; set => _hp = Math.Max(0, value); }`.
  `expect`: `hp: 0`. [R]

### 2.2 `inheritance-and-polymorphism`, "Bloodlines"

- **Concept**: `class Dog : Animal`; single class inheritance; `virtual` / `override` (decided by the runtime object)
  vs `new` (hiding, decided by the variable's declared type); `base.Method()`; constructors run base first;
  `sealed`; `is`, `as`, casts and `InvalidCastException`; overriding vs overloading.
- **Visual**: the child actor `enter`s wearing the parent's items. With `override`, the actor speaks with its own
  voice whatever tag it wears; with `new`, the tag decides (`say` "..." under an `Animal` tag).
- **Questions**:
  1. predict: `class Animal { public virtual string Speak() => "..."; }`, `class Dog : Animal { public override string Speak() => "Woof"; }`, `Animal a = new Dog(); Console.WriteLine(a.Speak());` → `Woof` [R]
  2. predict: `class Cat : Animal { public new string Speak() => "Meow"; }`, `Animal a = new Cat(); Console.WriteLine(a.Speak());` → `...`; with `Cat c = new Cat();` → `Meow` [R]
  3. predict: `class Puppy : Dog { public override string Speak() => base.Speak() + "!"; }` → `Woof!` [R]
  4. predict: `class Parent { public Parent() { Console.Write("P "); } }`, `class Child : Parent { public Child() { Console.Write("C "); } }`, `new Child();` → `P C ` [R]
  5. predict: `Animal a = new Dog(); Console.WriteLine((a is Dog) + " " + (a is Cat) + " " + (a as Cat == null));` → `True False True` [R]
  6. predict "What happens?": `Animal a = new Dog(); Cat c = (Cat)a;` → `InvalidCastException` (`Unable to cast object of type 'Dog' to type 'Cat'.`) [R]
  7. predict "Does it compile?": `class A { public string F() => "a"; } class C2 : A { public override string F() => "c"; }` → No: `CS0506 ... cannot override inherited member 'A.F()' because it is not marked virtual, abstract, or override` [C]
  8. predict "Does it compile?": `sealed class Boss { } class Minion : Boss { }` → No: `CS0509 'Minion': cannot derive from sealed type 'Boss'` [C]
  9. predict "Does it compile?": `class D : A, B { }` (two classes) → No: `CS1721 Class 'D' cannot have multiple base classes: 'A' and 'B'` [C]
  10. predict: hiding without `new` (`class E : A { public string G() => "e"; }` where `A.G` is virtual) → compiles with warning `CS0114 'E.G()' hides inherited member 'A.G()'...` [W]
- **Run**: starter `class Monster { public string Roar() => "..."; } class Dragon : Monster { public new string Roar() => "ROAR"; }`
  with `Monster m = new Dragon(); Console.WriteLine(m.Roar());` prints `...`. Solution: `public virtual string Roar()`
  and `public override string Roar()`. `expect`: `ROAR`. [R]

### 2.3 `interfaces-and-abstract`, "Contracts and half-built blueprints"

- **Concept**: `interface` = contract (a class can implement many); `abstract class` = partial implementation with
  state, cannot be instantiated; `abstract` members must be overridden; default interface methods (C# 8+) are only
  visible through the interface type; programming against interfaces (`List<IGreeter>`); constructor injection as
  a first taste of dependency injection.
- **Visual**: an interface is a `banner` contract ("CAN GREET") the actor must carry; an abstract class is a
  blueprint with blank parts (instantiating it: the guard `shake`s).
- **Questions**:
  1. predict: `interface IGreeter { string Greet(); string Bye() => "bye"; }`, `class Robot : IGreeter { public string Greet() => "beep"; }`, `IGreeter g = new Robot(); Console.WriteLine(g.Greet() + " " + g.Bye());` → `beep bye` [R]
  2. predict: `class Elf : IGreeter { public string Greet() => "hail"; public string Bye() => "farewell"; }`, `IGreeter g = new Elf(); Console.WriteLine(g.Bye());` → `farewell` [R]
  3. predict: `abstract class Shape { public abstract int Area(); public string Describe() => $"area={Area()}"; }`, `class Square : Shape { ... Area() => _s * _s; }`, `Shape s = new Square(3); Console.WriteLine(s.Area() + " " + s.Describe());` → `9 area=9` [R]
  4. predict "Does it compile?": `var s = new Shape();` → No: `CS0144 Cannot create an instance of the abstract type or interface 'Shape'` [C]
  5. predict "Does it compile?": `interface IG { string Greet(); } class Robot : IG { }` → No: `CS0535 'Robot' does not implement interface member 'IG.Greet()'` [C]
  6. predict: `var list = new List<IGreeter> { new Robot(), new Elf() }; foreach (var g in list) Console.Write(g.Greet() + " ");` → `beep hail ` [R]
  7. predict (DI taste): `interface IFormatter { string Format(string s); }`, `class LoudFormatter : IFormatter { public string Format(string s) => s.ToUpper() + "!"; }`, `class Greeter { private readonly IFormatter _f; public Greeter(IFormatter f) { _f = f; } public string Greet(string n) => _f.Format("hi " + n); }`, `Console.WriteLine(new Greeter(new LoudFormatter()).Greet("ada"));` → `HI ADA!` [R]
  8. pick: "A type can inherit from ___ class(es) and implement ___ interface(s)": `one / many`, `many / one`, `many / many` → `one / many` [C via 2.2 q9]
- **Run**: starter `interface IEnemy { int Damage(); } class Slime : IEnemy { }` with `IEnemy e = new Slime(); Console.WriteLine($"damage: {e.Damage()}");`
  fails to compile (`CS0535`). Solution: `class Slime : IEnemy { public int Damage() => 3; }`. `expect`: `damage: 3`. [R]

### 2.4 `records-and-patterns`, "Twins, tuples and the sorting hat"

- **Concept**: `record` (value equality, generated `ToString`, positional properties are `init`, `with` copies,
  deconstruction); `record struct`; `with` is shallow; tuples `(Name: "Ada", Lvl: 3)`, tuple swap, tuple equality;
  pattern matching: `is` type pattern with a variable, `switch` expressions with relational patterns and `_`,
  property patterns, positional patterns, `when` guards, non-exhaustive switch → `SwitchExpressionException`; enums
  and `[Flags]`.
- **Visual**: two record actors with identical gems: `==` gives a `banner` "TWINS" (value equality). `with` = `clone`
  then change one item. The switch expression is a sorting hat: each value walks under the hat and is sent to the
  first matching door.
- **Questions**:
  1. predict: `record Item(string Name, int Qty);`, `var a = new Item("gem", 3); var b = new Item("gem", 3); Console.WriteLine((a == b) + " " + ReferenceEquals(a, b));` → `True False` [R]
  2. predict: `var a = new Item("gem", 3); var b = a with { Qty = 5 }; Console.WriteLine(a.Qty + " " + b.Qty);` → `3 5` [R]
  3. predict: `Console.WriteLine(new Item("gem", 3));` → `Item { Name = gem, Qty = 3 }` [R]
  4. predict "Does it compile?": `var it = new Item("a", 1); it.Qty = 2;` → No: `CS8852 Init-only property or indexer 'Item.Qty' can only be assigned in an object initializer, ...` [C]
  5. predict: `var (name, qty) = new Item("key", 1); Console.WriteLine(name + qty);` → `key1` [R]
  6. predict: `int a = 1, b = 2; (a, b) = (b, a); Console.WriteLine($"{a} {b}");` → `2 1` [R]
  7. predict: `static string Grade(int n) => n switch { < 0 => "neg", 0 => "zero", > 100 => "huge", _ => "pos" };` over `-5, 0, 7, 150` → `neg zero pos huge` [R]
  8. predict: `object o = 42; if (o is int n && n > 40) Console.WriteLine("big " + n); else Console.WriteLine("no");` → `big 42` [R]
  9. predict: `static string Describe(object? o) => o switch { int i => $"int {i}", string s => $"str {s.Length}", null => "null", _ => o.GetType().Name };` over `1, "hi", null, 2.5` → `int 1|str 2|null|Double|` [R]
  10. predict: `record Bag(string Name, List<string> Items);`, `var c = new Bag("x", new List<string> { "a" }); var d = c with { }; d.Items.Add("b"); Console.WriteLine(c.Items.Count + " " + (c == d));` → `2 True` (`with` is shallow) [R]
  11. predict: `enum Color { Red, Green, Blue }`, `var e = Color.Green; Console.WriteLine(e + " " + (int)e + " " + (Color)5);` → `Green 1 5` [R]
  12. predict: `[Flags] enum Perm { None = 0, Read = 1, Write = 2, Exec = 4 }`, `var f = Perm.Read | Perm.Write; Console.WriteLine(f + " " + f.HasFlag(Perm.Write));` → `Read, Write True` [R]
- **Run**: starter `class Loot { public string Name; public int Gold; public Loot(string n, int g) { Name = n; Gold = g; } }`
  with `var a = new Loot("gem", 5); var b = new Loot("gem", 5); Console.WriteLine($"equal: {a == b}");` prints
  `equal: False`. Solution: `record Loot(string Name, int Gold);`. `expect`: `equal: True`. [R]

### 2.5 Boss `class-treant`

- **Mix**: properties, `override` vs `new`, interfaces, records, switch expressions.
- **Boss run**: starter
  `Console.WriteLine("start"); string Rank(int score) => score switch { >= 90 => "S", >= 50 => "A" }; Console.WriteLine($"rank: {Rank(42)}");`
  compiles with warning `CS8509` and crashes at runtime with `System.Runtime.CompilerServices.SwitchExpressionException`
  (`Non-exhaustive switch expression failed to match its input.`); stdout has only `start`. Solution: add
  `_ => "unknown"`. `expect`: `rank: unknown`. [R]
- **Boss questions**: 2.1 q2, 2.1 q5, 2.2 q2, 2.2 q4, 2.3 q2, 2.4 q1, 2.4 q7, 2.4 q10.

---

## Region 3: `linq-peaks`, Collections, delegates and LINQ

### 3.1 `collections-and-generics`, "The adventurer's packs"

- **Concept**: arrays (fixed size, default values), `List<T>` (`Add`, `Insert`, `Remove`, `RemoveAll`, `Count`),
  `Dictionary<TKey, TValue>` (indexer set vs get, `Add` duplicates, `TryGetValue`, `GetValueOrDefault`),
  `HashSet<T>` (`Add` returns `bool`), `Queue` / `Stack`; generics `<T>` and constraints (`where T : IComparable<T>`);
  `default(T)`; modifying a list while `foreach`-ing it throws; `List<string>` is not a `List<object>` but is an
  `IEnumerable<object>` (covariance, senior teaser).
- **Visual**: a `List` is a scroll that grows; a `Dictionary` is a wall of labelled chests (`tag` = key, `item` =
  value). Opening a missing chest: `shake` + `KeyNotFoundException`. A `HashSet` refuses a duplicate gem (`say` "already
  have it").
- **Questions**:
  1. predict: `var l = new List<string> { "sword" }; l.Add("shield"); l.Insert(0, "gem"); Console.WriteLine(string.Join(",", l) + " " + l.Count);` → `gem,sword,shield 3` [R]
  2. predict "What happens?": `var l = new List<int> { 1, 2 }; Console.WriteLine(l[2]);` → `ArgumentOutOfRangeException` (arrays throw `IndexOutOfRangeException` instead) [R]
  3. predict: `var d = new Dictionary<string, int> { ["gold"] = 5 }; d["gold"] += 10; d["gems"] = 1; Console.WriteLine(d["gold"] + " " + d.Count);` → `15 2` [R]
  4. predict "What happens?": `var d = new Dictionary<string, int>(); Console.WriteLine(d["missing"]);` → `KeyNotFoundException` (`The given key 'missing' was not present in the dictionary.`) [R]
  5. predict "What happens?": `d.Add("a", 1); d.Add("a", 2);` → `ArgumentException` (`An item with the same key has already been added. Key: a`) [R]
  6. predict: `var s = new HashSet<string> { "a", "b" }; Console.WriteLine(s.Add("a") + " " + s.Add("c") + " " + s.Count);` → `False True 3` [R]
  7. predict: `static T Max<T>(T a, T b) where T : IComparable<T> => a.CompareTo(b) >= 0 ? a : b;`, `Console.WriteLine(Max(3, 9) + " " + Max("pear", "apple"));` → `9 pear` [R]
  8. predict "Does it compile?": `Max(new Hero(), new Hero());` with that constraint → No: `CS0311 The type 'Hero' cannot be used as type parameter 'T' ...` [C]
  9. predict "Does it compile?": `static T Add<T>(T a, T b) => a + b;` → No: `CS0019 Operator '+' cannot be applied to operands of type 'T' and 'T'` [C]
  10. predict "What happens?": `var l = new List<int> { 1, 2, 3 }; foreach (var x in l) if (x == 2) l.Remove(x);` → `InvalidOperationException` (`Collection was modified; enumeration operation may not execute.`) [R]
  11. predict: `int[] a = new int[3]; Console.WriteLine(a[1] + " " + a.Length);` → `0 3` [R]
  12. predict "Does it compile?": `List<object> l = new List<string>();` → No: `CS0029`; but `IEnumerable<object> l = new List<string>();` compiles [C]
  13. predict: `var q = new Queue<string>(); q.Enqueue("a"); q.Enqueue("b"); var st = new Stack<string>(); st.Push("a"); st.Push("b"); Console.WriteLine(q.Dequeue() + st.Pop());` → `ab` [R]
- **Run**: starter `var stock = new Dictionary<string, int> { ["potion"] = 3 }; Console.WriteLine($"ether: {stock["ether"]}");`
  → throws `KeyNotFoundException`. Solution: `stock.GetValueOrDefault("ether")` (or `TryGetValue`).
  `expect`: `ether: 0`. [R]

### 3.2 `delegates-and-closures`, "Spells in a bottle"

- **Concept**: delegates as values: `Func<T, TResult>`, `Action<T>`, `Predicate<T>`; lambdas; multicast `+=` (an
  `Action` runs all, a `Func` returns the last result); events (`event Action<int>`, `?.Invoke`, only the owner can
  raise it); closures capture variables, not values; `for` loop variable is shared (`333`), `foreach` variable is
  fresh each iteration (`012`, since C# 5); a local copy fixes `for`; returning a lambda (`MakeAdder`).
- **Visual**: a lambda is a `key` item; `give` it to an ally who casts it later. The closure key carries a backpack
  `scroll` with the captured variable; in a `for` loop all three keys share ONE backpack, so when cast they all
  `say` 3.
- **Questions**:
  1. predict: `Func<int, int> dbl = x => x * 2; Console.WriteLine(dbl(dbl(3)));` → `12` [R]
  2. predict: `Action<string> say = s => Console.Write(s); say += s => Console.Write(s.ToUpper()); say("hi");` → `hiHI` [R]
  3. predict: `Func<int> f = () => 1; f += () => 2; Console.WriteLine(f());` → `2` [R]
  4. predict: `int count = 0; Action inc = () => count++; inc(); inc(); Console.WriteLine(count);` → `2` [R]
  5. predict: `var acts = new List<Action>(); for (int i = 0; i < 3; i++) acts.Add(() => Console.Write(i)); foreach (var a in acts) a();` → `333` [R]
  6. predict: same with `foreach (var i in new[] { 0, 1, 2 })` → `012` [R]
  7. pick: fix for q5: `int copy = i; acts.Add(() => Console.Write(copy));` / `acts.Add(() => Console.Write(i++));` → the first, prints `012` [R]
  8. predict: `class Door { public event Action<int>? Opened; public void Open() => Opened?.Invoke(7); }`, `door.Opened += n => Console.Write("A" + n + " "); door.Opened += n => Console.Write("B" + n); door.Open();` → `A7 B7` [R]
  9. predict: with no subscribers, `door.Open(); Console.WriteLine("ok");` → `ok` (`?.` skips a null delegate; calling a null `Action` directly throws `NullReferenceException`) [R]
  10. predict "Does it compile?": `d.Opened();` from outside `Door` → No: `CS0070 The event 'Door.Opened' can only appear on the left hand side of += or -= (except when used from within the type 'Door')` [C]
  11. predict: `static Func<int, int> MakeAdder(int k) => x => x + k;` `Console.WriteLine(MakeAdder(10)(5));` → `15` [R]
  12. type: `___<int, bool> isEven = n => n % 2 == 0;` → `Func` (or `Predicate` with one type argument: `Predicate<int>`) [R]
- **Run**: starter `var acts = new List<Action>(); for (int i = 0; i < 3; i++) acts.Add(() => Console.Write(i)); foreach (var a in acts) a(); Console.WriteLine();`
  prints `333`. Solution: copy into a local inside the loop (or loop with `foreach` over `new[] { 0, 1, 2 }`).
  `expect`: `012`. [R]

### 3.3 `linq-basics`, "The caravan of helpers"

- **Concept**: `using System.Linq;`; method syntax `Where`, `Select`, `OrderBy` / `OrderByDescending` / `ThenBy`,
  `Take` / `Skip`, `Count`, `Sum`, `Max`, `Distinct`, `Any` / `All`, `GroupBy`, `SelectMany`, `ToDictionary`,
  `Aggregate`; query syntax (`from ... where ... select`); `First` vs `FirstOrDefault` vs `Single`; empty-sequence
  exceptions; extension methods (how LINQ is built: a `static` method in a `static` class with `this`).
- **Visual**: a caravan of allies; each ally holds a sign (`Where`, `Select`) and passes items forward. `First` on an
  empty caravan: `shake`. `FirstOrDefault` hands back a `0` chip.
- **Questions** (with `var nums = new List<int> { 5, 3, 8, 1, 8 };`):
  1. predict: `Console.WriteLine(string.Join(",", nums.Where(n => n > 3).Select(n => n * 10)));` → `50,80,80` [R]
  2. predict: `Console.WriteLine(string.Join(",", nums.OrderBy(n => n)));` → `1,3,5,8,8` [R]
  3. predict: `Console.WriteLine(nums.First() + " " + nums.First(n => n > 5) + " " + nums.Last());` → `5 8 8` [R]
  4. predict "What happens?": `nums.First(n => n > 100)` → `InvalidOperationException` (`Sequence contains no matching element`); `nums.FirstOrDefault(n => n > 100)` → `0` [R]
  5. predict "What happens?": `nums.Single(n => n == 8)` → `InvalidOperationException` (`Sequence contains more than one matching element`) [R]
  6. predict: `Console.WriteLine(nums.Count(n => n == 8) + " " + nums.Sum() + " " + nums.Max() + " " + nums.Distinct().Count());` → `2 25 8 4` [R]
  7. predict: `Console.WriteLine(nums.Any(n => n > 7) + " " + nums.All(n => n > 0));` → `True True` [R]
  8. predict: `var words = new[] { "apple", "avocado", "banana" }; foreach (var g in words.GroupBy(w => w[0])) Console.Write($"{g.Key}:{string.Join("+", g)} ");` → `a:apple+avocado b:banana ` (GroupBy keeps first-seen key order) [R]
  9. predict: `var q = from n in nums where n % 2 == 0 select n / 2; Console.WriteLine(string.Join(",", q));` → `4,4` [R]
  10. predict: `Console.WriteLine(string.Join(",", new[] { new[] { 1, 2 }, new[] { 3 } }.SelectMany(a => a)));` → `1,2,3` [R]
  11. predict "What happens?": `new List<int>().Max()` → `InvalidOperationException` (`Sequence contains no elements`); `new List<int>().Sum()` → `0` [R]
  12. predict: `static class Ext { public static string Shout(this string s) => s.ToUpper() + "!"; }`, `Console.WriteLine("hello".Shout());` → `HELLO!` [R]
  13. predict: `var people = new[] { ("Ada", 36), ("Bob", 25), ("Cy", 36) }; Console.WriteLine(string.Join(",", people.OrderByDescending(p => p.Item2).ThenBy(p => p.Item1).Select(p => p.Item1)));` → `Ada,Cy,Bob` [R]
  14. predict "Does it compile?": `int[] a = {1,2,3}; Console.WriteLine(a.Sum());` with only `using System;` → No: `CS1061 'int[]' does not contain a definition for 'Sum' ...` [C]
- **Run**: starter `var scores = new List<int> { 40, 90, 70 }; var top = scores.OrderBy(s => s).First(); Console.WriteLine($"top: {top}");`
  prints `top: 40`. Solution: `OrderByDescending` (or `scores.Max()`). `expect`: `top: 90`. [R]

### 3.4 `deferred-execution`, "Nothing moves until you pull"

- **Concept**: a LINQ query is a recipe, run when enumerated (`foreach`, `ToList`, `Count`, `First`); it sees changes
  to the source and to captured variables; each enumeration runs it again; items flow one by one through the whole
  pipeline; `ToList()` / `ToArray()` materialize a snapshot; exceptions surface at enumeration time; `yield return`
  iterators are lazy too; `List.Sort()` sorts in place while `OrderBy` returns a new lazy sequence.
- **Visual**: the caravan stands still (`wait`) until the hero pulls an item; then one item travels the whole caravan
  before the next starts (`w1 w2 s2 ...`). `ToList` = a `clone` of the results into a chest.
- **Questions**:
  1. predict: `var src = new List<int> { 1, 2, 3 }; var q = src.Where(n => n > 1); src.Add(4); Console.WriteLine(q.Count());` → `3` [R]
  2. predict: same with `.ToList()` and `q.Count` → `2` [R]
  3. predict: `var q = new[] { 1, 2, 3 }.Select(n => { Console.Write("s" + n + " "); return n; }); Console.Write("before "); foreach (var x in q) { }` → `before s1 s2 s3 ` [R]
  4. predict: `new[] { 1, 2, 3, 4 }.Where(n => { Console.Write("w" + n + " "); return n % 2 == 0; }).Select(n => { Console.Write("s" + n + " "); return n; }).ToList();` → `w1 w2 s2 w3 w4 s4 ` [R]
  5. predict: `int limit = 2; var q = new[] { 1, 2, 3 }.Where(n => n > limit); limit = 0; Console.WriteLine(q.Count());` → `3` [R]
  6. predict: `var q = new[] { 1, 0, 2 }.Select(n => 10 / n); Console.Write("ok "); Console.WriteLine(q.Sum());` → prints `ok ` then `DivideByZeroException` [R]
  7. predict: `static IEnumerable<int> Gen() { Console.Write("g1 "); yield return 1; Console.Write("g2 "); yield return 2; }`, `var g = Gen(); Console.Write("made "); Console.WriteLine(g.First());` → `made g1 1` [R]
  8. predict: `var first = new[] { 1, 2, 3 }.Select(n => { Console.Write("s" + n + " "); return n; }).First(); Console.WriteLine(first);` → `s1 1` (only what is needed runs) [R]
  9. predict: `var list = new List<int> { 3, 1, 2 }; var sorted = list.OrderBy(x => x); list.Sort(); Console.WriteLine(string.Join("", list) + " " + string.Join("", sorted));` → `123 123` [R]
  10. predict: `int calls = 0; var q = new[] { 1, 2, 3 }.Select(n => { calls++; return n; }); foreach (var _ in q) { } foreach (var _ in q) { } Console.WriteLine(calls);` → `6` (multiple enumeration) [R]
- **Run**: starter `var hp = new List<int> { 5, 0, 3 }; var alive = hp.Where(h => h > 0); hp.Clear(); Console.WriteLine($"alive: {alive.Count()}");`
  prints `alive: 0`. Solution: `var alive = hp.Where(h => h > 0).ToList();` and `alive.Count`. `expect`: `alive: 2`. [R]

### 3.5 Boss `linq-hydra`

- **Mix**: collections, closures, LINQ operators, deferred execution.
- **Boss run**: starter
  `var mobs = new List<int> { 1, 2, 3, 4 }; foreach (var m in mobs) if (m % 2 == 0) mobs.Remove(m); Console.WriteLine($"left: {string.Join(",", mobs)}");`
  → throws `InvalidOperationException` (`Collection was modified; ...`). Solution: `mobs.RemoveAll(m => m % 2 == 0);`
  (or `mobs = mobs.Where(m => m % 2 != 0).ToList();`). `expect`: `left: 1,3`. [R]
- **Boss questions**: 3.1 q4, 3.1 q6, 3.2 q3, 3.2 q5, 3.3 q4, 3.3 q8, 3.4 q1, 3.4 q4.

---

## Region 4: `task-tower`, Exceptions, resources and async

### 4.1 `exceptions`, "When spells backfire"

- **Concept**: `try` / `catch` / `finally`; catch order (specific first; a general catch first is a compile error);
  `finally` runs even after `return`; exception filters `catch (X e) when (...)`; custom exceptions; wrapping with
  `InnerException`; `throw;` keeps the original stack trace while `throw ex;` resets it (analyzer `CA2200`);
  common exception types (`ArgumentNullException` derives from `ArgumentException`).
- **Visual**: the hero casts (`attack`), the spell backfires (`shake` with the exception name); the first matching
  `catch` guard steps in; the `finally` guard always closes the gate with a `banner` "ALWAYS".
- **Questions**:
  1. predict: `try { Console.Write("A "); throw new InvalidOperationException("boom"); Console.Write("B "); } catch (InvalidOperationException e) { Console.Write("C:" + e.Message + " "); } finally { Console.Write("F"); }` → `A C:boom F` [R]
  2. predict: `try { int.Parse("x"); } catch (ArgumentException) { Console.Write("arg "); } catch (FormatException) { Console.Write("fmt "); } catch (Exception) { Console.Write("any "); }` → `fmt ` [R]
  3. predict: `static int F1() { try { return 1; } finally { Console.Write("finally "); } }`, `Console.WriteLine(F1());` → `finally 1` [R]
  4. predict "Does it compile?": `try { } catch (Exception) { } catch (FormatException) { }` → No: `CS0160 A previous catch clause already catches all exceptions of this or of a super type ('Exception')` [C]
  5. predict: `try { try { throw new Exception("inner"); } finally { Console.Write("fin "); } } catch (Exception e) { Console.Write("caught " + e.Message); }` → `fin caught inner` [R]
  6. predict: with `class GameOverException : Exception { public int Lives; ... }`, `try { throw new GameOverException(3); } catch (GameOverException e) when (e.Lives == 0) { Console.Write("zero "); } catch (GameOverException e) { Console.Write("lives " + e.Lives); }` → `lives 3` [R]
  7. predict: `static void Rethrow(bool keep) { try { Thrower(); } catch (Exception ex) { if (keep) throw; else throw ex; } }`; does the caught `StackTrace` contain `Thrower`? `keep = true` → `True`, `keep = false` → `False` (and the compiler reports `CA2200`) [R][W]
  8. predict: `try { throw new ArgumentNullException("name"); } catch (ArgumentException e) { Console.WriteLine(e.GetType().Name + " | " + e.Message); }` → `ArgumentNullException | Value cannot be null. (Parameter 'name')` [R]
  9. predict: `catch (Exception e) { throw new InvalidOperationException("save failed", e); }` around `throw new Exception("disk")`, caller prints `e.Message + " <- " + e.InnerException!.Message` → `save failed <- disk` [R]
  10. predict "Does it compile?": `void F() { throw; }` → No: `CS0156 A throw statement with no arguments is not allowed outside of a catch clause` [C]
- **Run**: starter `int lives = int.Parse("ten"); Console.WriteLine(lives); Console.WriteLine("done");` → crashes with
  `FormatException`. Solution: `try { ... } catch (FormatException) { Console.WriteLine("bad input"); } finally { Console.WriteLine("done"); }`.
  `expect`: `bad input`. [R]

### 4.2 `using-and-disposal`, "Torches go out"

- **Concept**: `IDisposable.Dispose()` releases resources (files, connections) deterministically; `using (...) { }`
  block and `using var` declaration (disposed at the end of the enclosing scope, in reverse order); `Dispose` runs
  even when an exception is thrown (it is a `try` / `finally`); make `Dispose` idempotent; `using` on a type that is
  not `IDisposable` is a compile error; the garbage collector frees memory but not at a predictable time;
  finalizers (`~Torch()`) are a last-resort safety net (concept only, never machine-checked).
- **Visual**: `using` lights a torch item; when the block ends the torch is `drop`ped automatically (`print` "out").
  Two torches go out in reverse order. A thrown exception still puts the torch out before the guard catches it.
- **Questions** (with `class Torch : IDisposable` that writes `light<n> ` in the constructor and `out<n> ` in `Dispose`, guarded by a `_done` flag):
  1. predict: `using (var t = new Torch("A")) { Console.Write("use "); } Console.WriteLine("after");` → `lightA use outA after` [R]
  2. predict: `using var a = new Torch("A"); using var b = new Torch("B"); Console.Write("body ");` (end of method) → `lightA lightB body outB outA ` [R]
  3. predict: `try { using var t = new Torch("A"); throw new Exception("x"); } catch { Console.Write("caught "); }` → `lightA outA caught ` [R]
  4. predict: `try { using var t = new Torch("A"); Console.Write("body "); } finally { Console.Write("fin "); }` → `lightA body outA fin ` [R]
  5. predict: `var t = new Torch("A"); t.Dispose(); t.Dispose();` → `lightA outA ` (idempotent) [R]
  6. predict "Does it compile?": `class Hero { }` and `using var h = new Hero();` → No: `CS1674 'Hero': type used in a using statement must implement 'System.IDisposable'.` [C]
  7. pick: "When does the GC run a finalizer?" `At the end of the using block` / `At a time chosen by the runtime, possibly never before exit` / `Immediately when the variable goes out of scope` → the second [Doc: GC fundamentals, Implement a Dispose method]
  8. order: lines of `using (var t = new Torch("A")) { Console.Write("use "); }` output: `lightA`, `use`, `outA` [R]
- **Run**: starter `class Torch : IDisposable { public Torch() => Console.WriteLine("torch lit"); public void Dispose() => Console.WriteLine("torch out"); }`
  with `{ var t = new Torch(); Console.WriteLine("exploring"); } Console.WriteLine("back in town");` never prints
  `torch out`. Solution: `using var t = new Torch();` → `torch lit / exploring / torch out / back in town`.
  `expect`: `torch out`. [R]

### 4.3 `async-await`, "Messengers and waiting"

- **Concept**: `async Task` / `async Task<T>`; `await` pauses the method without blocking the thread; code before
  the first `await` runs synchronously; a not-awaited `Task<int>` is not an `int`; `Task.WhenAll` runs tasks
  concurrently and returns results in argument order; exceptions travel through `await` (the first one is rethrown,
  not an `AggregateException`), but `.Wait()` / `.Result` wrap them in `AggregateException`; a forgotten `await`
  swallows the exception (warning `CS4014`); `async void` exceptions crash the process (only for event handlers);
  `.Result` / `.Wait()` can deadlock in UI / old ASP.NET contexts (a console app has no sync context, so it does not
  deadlock here); `ConfigureAwait(false)` in library code; `Task.FromResult`, `ValueTask`, `IAsyncEnumerable`
  (`await foreach`) as senior extras.
- **Visual**: the hero sends a messenger (ally `exit`s) and keeps working; at `await` the hero `wait`s; the messenger
  `enter`s with a `value` chip. `WhenAll` = three messengers leave together; the results are laid out in the order
  they were sent, not the order they returned. An unawaited failing messenger burns its scroll off-stage (nobody sees
  the `shake`).
- **Questions**:
  1. predict: `static async Task Work(string n) { Console.Write(n + "1 "); await Task.Delay(100); Console.Write(n + "2 "); }`, `var t1 = Work("w"); Console.Write("main "); await t1;` → `w1 main w2 ` [R, 100 ms margin]
  2. predict: `static async Task<int> Add(int a, int b) { await Task.Delay(10); return a + b; }`, `Console.WriteLine(await Add(2, 3));` → `5` [R]
  3. predict: `static async Task<int> Slow(int v, int ms) { await Task.Delay(ms); return v; }`, `var res = await Task.WhenAll(Slow(3, 300), Slow(1, 10), Slow(2, 100)); Console.WriteLine(string.Join(",", res));` → `3,1,2` [R]
  4. predict: `try { await Fail(); } catch (InvalidOperationException e) { Console.WriteLine("caught " + e.Message); }` with `Fail` throwing `InvalidOperationException("bad")` after a delay → `caught bad` [R]
  5. predict: `try { Fail().Wait(); } catch (Exception e) { Console.WriteLine(e.GetType().Name + " -> " + e.InnerException!.GetType().Name); }` → `AggregateException -> InvalidOperationException` [R]
  6. predict: `try { await Task.WhenAll(Fail(), Fail2()); } catch (Exception e) { Console.WriteLine(e.GetType().Name + " " + e.Message); }` (`Fail2` throws `ArgumentException`) → `InvalidOperationException bad` (await rethrows the first) [R]
  7. predict "Does it compile?": `void F() { await Task.Delay(1); }` → No: `CS4033 The 'await' operator can only be used within an async method. ...` [C]
  8. predict "Does it compile?": `async Task F() { await Task.Delay(1); return 5; }` → No: `CS1997 Since 'U.e5()' is an async method that returns 'Task', a return keyword must not be followed by an object expression` (message names the method) [C]
  9. predict "Does it compile?": `int n = Get();` where `Get` is `async Task<int>` → No: `CS0029 Cannot implicitly convert type 'System.Threading.Tasks.Task<int>' to 'int'` [C]
  10. predict: `Console.Write("A "); await Task.Delay(50); Console.Write("B "); await Task.Delay(50); Console.WriteLine("C");` → `A B C` [R]
  11. predict "What happens?": `static async void Boom() { await Task.Delay(10); throw new InvalidOperationException("lost"); }`, `Console.WriteLine("before"); Boom(); await Task.Delay(300); Console.WriteLine("after");` → prints `before`, then the process crashes (`Unhandled exception. System.InvalidOperationException: lost`); `after` never prints [R]
  12. pick: "Why can `task.Result` deadlock in a UI app?" `The continuation needs the UI thread, which is blocked waiting for it` / `Result is slower than await` / `Tasks cannot return values` → the first [Doc: Async/await best practices, ConfigureAwait FAQ]
- **Run**: starter `var total = AddAsync(2, 3); Console.WriteLine($"total: {total}");` prints
  `total: System.Runtime.CompilerServices.AsyncTaskMethodBuilder`1+AsyncStateMachineBox`1[...]` (a Task, not a
  number). Solution: `var total = await AddAsync(2, 3);`. `expect`: `total: 5`. [R]

### 4.4 Boss `task-lich`

- **Mix**: exceptions, `finally`, `using`, `await`, `WhenAll`, `async void`.
- **Boss run**: starter
  `try { LoadAsync(); } catch (Exception e) { Console.WriteLine($"caught: {e.Message}"); } await Task.Delay(200); Console.WriteLine("end");`
  with `static async Task LoadAsync() { await Task.Delay(50); throw new InvalidOperationException("save corrupted"); }`.
  Starter prints only `end` (warning `CS4014`; the exception is silently lost). Solution: `try { await LoadAsync(); }`.
  Output `caught: save corrupted / end`. `expect`: `caught: save corrupted`. [R]
- **Boss questions**: 4.1 q2, 4.1 q3, 4.1 q7, 4.2 q2, 4.2 q3, 4.3 q1, 4.3 q3, 4.3 q5, 4.3 q11.

---

## Entry exams

### Topics

`content/csharp/topics.ts`. Topics with a region allow skipping that region; the others count toward score and
report only.

| Topic id | Region | Covers |
|---|---|---|
| `types-strings` | `value-village` | Types, casts, integer division, `var`, `const`, parsing, strings, `StringBuilder` |
| `nulls` | `value-village` | `null`, `int?`, `string?`, `?.`, `??`, `??=`, NRT warnings |
| `value-reference` | `value-village` | Struct vs class copies, `ref` / `out` / `in`, boxing / unboxing |
| `equality` | `value-village` | `==` vs `Equals` vs `ReferenceEquals`, string interning |
| `classes` | `class-forest` | Properties, `init`, `required`, access modifiers, `static`, constructors |
| `inheritance` | `class-forest` | `virtual` / `override` / `new` / `sealed`, `base`, `is` / `as`, casts |
| `interfaces` | `class-forest` | Interfaces, abstract classes, default interface methods |
| `records-patterns` | `class-forest` | Records, `with`, tuples, switch expressions, patterns, enums |
| `collections-generics` | `linq-peaks` | `List`, `Dictionary`, `HashSet`, generics, constraints |
| `delegates-closures` | `linq-peaks` | `Func` / `Action`, events, closures in loops, extension methods |
| `linq` | `linq-peaks` | Operators, `First` / `FirstOrDefault` / `Single`, `GroupBy`, deferred execution, `yield` |
| `exceptions` | `task-tower` | `try` / `catch` / `finally`, filters, `throw;` vs `throw ex;` |
| `disposal` | `task-tower` | `IDisposable`, `using`, dispose order, finalizers (concept) |
| `async` | `task-tower` | `Task`, `await`, `WhenAll`, exceptions, `async void`, deadlocks, `ConfigureAwait` |
| `memory` | none | GC generations, LOH, boxing cost, `Span<T>`, `readonly struct`, `in` |
| `concurrency` | none | `lock`, `Interlocked`, races, thread pool vs `Thread` |
| `design-di` | none | Dependency injection, lifetimes, `IEnumerable` vs `IQueryable`, variance, SOLID |

### Levels

| Level | `count` / bank | Pass | Topics |
|---|---|---|---|
| junior | 12 / 22 | 60% | `types-strings`, `nulls`, `value-reference`, `equality`, `classes`, `inheritance`, `collections-generics`, `linq`, `exceptions` |
| mid | 14 / 24 | 65% | `value-reference`, `equality`, `interfaces`, `records-patterns`, `collections-generics`, `delegates-closures`, `linq`, `exceptions`, `disposal`, `async` |
| senior | 15 / 26 | 70% | `async`, `memory`, `concurrency`, `design-di`, `delegates-closures`, `linq`, `equality`, `records-patterns`, `disposal` |

(Banks are at least 1.6 × `count`, as required by [../exams.md](../exams.md).) Difficulty 1-3 within each level.

### Junior examples

1. predict (`types-strings`, d1): `Console.WriteLine(7 / 2);` → `3` [R]
2. predict (`types-strings`, d2): `string s = "hero"; s.ToUpper(); Console.WriteLine(s);` → `hero` [R]
3. predict (`nulls`, d2): `string? s = null; Console.WriteLine(s?.Length ?? -1);` → `-1` [R]
4. predict (`value-reference`, d2): struct `PointS` copy, `q.X = 99; Console.WriteLine(p.X);` → `1`; class version → `99` [R]
5. predict (`equality`, d2): two `new PointC { X = 1 }` compared with `==` → `False` [R]
6. predict (`classes`, d2): "Does it compile?" `h.Name = "x";` with `public string Name { get; }` → No, `CS0200` [C]
7. predict (`inheritance`, d2): `Animal a = new Dog(); Console.WriteLine(a.Speak());` (virtual/override) → `Woof` [R]
8. predict (`collections-generics`, d2): `d["missing"]` on an empty `Dictionary<string, int>` → `KeyNotFoundException` [R]
9. pick (`linq`, d2): to get `0` instead of an exception when nothing matches, use `First` / `FirstOrDefault` / `Single` → `FirstOrDefault` [R]
10. predict (`exceptions`, d1): `try { ... throw ... } catch { ... } finally { ... }` from 4.1 q1 → `A C:boom F` [R]
11. predict (`types-strings`, d3): `Console.WriteLine("1" + 2 + 3);` → `123` [R]
12. predict (`value-reference`, d3): `static void AddOne(int n) { n++; }`, `int x = 1; AddOne(x); Console.WriteLine(x);` → `1` [R]

### Mid examples

1. predict (`value-reference`, d2): `int i = 42; object o = i; i = 7; Console.WriteLine(o);` → `42` [R]
2. predict (`value-reference`, d3): `object o = 42; long l = (long)o;` → `InvalidCastException` [R]
3. predict (`equality`, d3): `int x = 5; object o1 = x; object o2 = x; Console.WriteLine((o1 == o2) + " " + o1.Equals(o2));` → `False True` [R]
4. predict (`interfaces`, d2): default interface method `Bye()` called on `IGreeter g = new Robot();` → `bye`; "Does `new Robot().Bye()` compile?" → No: `CS1061 'Robot' does not contain a definition for 'Bye' ...` (default methods are only reachable through the interface type) [R][C]
5. predict (`records-patterns`, d2): `record Item(string Name, int Qty);` two equal instances, `a == b` → `True` [R]
6. predict (`records-patterns`, d3): `with { }` on a record holding a `List<string>`, then adding to the copy's list → original count `2`, `c == d` → `True` [R]
7. predict (`delegates-closures`, d3): `for` loop capturing `i` into three `Action`s → `333` [R]
8. predict (`linq`, d2): `src.Where(n => n > 1)` then `src.Add(4)` then `q.Count()` → `3` [R]
9. predict (`linq`, d3): `Where` + `Select` with logging, `.ToList()` → `w1 w2 s2 w3 w4 s4 ` [R]
10. predict (`exceptions`, d2): `throw;` vs `throw ex;` and the stack trace → `throw;` keeps it [R]
11. predict (`disposal`, d2): two `using var` torches → `lightA lightB body outB outA ` [R]
12. predict (`async`, d2): `Fail().Wait()` caught as `Exception` → `AggregateException -> InvalidOperationException` [R]
13. predict (`async`, d3): `await Task.WhenAll(Slow(3, 300), Slow(1, 10), Slow(2, 100))` → `3,1,2` [R]
14. predict (`collections-generics`, d3): "Does it compile?" `static T Add<T>(T a, T b) => a + b;` → No, `CS0019` [C]

### Senior examples

1. predict (`async`, d2): `async void` method throwing after an await, with the caller awaiting `Task.Delay(300)` → process crashes after `before`; `after` never prints [R]
2. pick (`async`, d3): why `.Result` deadlocks under a single-threaded synchronization context (UI, classic ASP.NET) and how `ConfigureAwait(false)` in library code avoids it → "the continuation is posted to the blocked context" [Doc: ConfigureAwait FAQ]
3. predict (`async`, d3): forgotten `await` inside `try` (task-tower boss starter) → only `end` is printed; the exception is lost [R]
4. predict (`memory`, d3): `interface IMover { void Move(); } struct MoverS : IMover { public int X; public void Move() => X++; }`, `IMover m = new MoverS(); m.Move(); m.Move(); var s = new MoverS(); s.Move(); IMover boxed = s; boxed.Move(); Console.WriteLine(((MoverS)m).X + " " + s.X);` → `2 1` (the boxed copy is mutated, not `s`) [R]
5. predict (`memory`, d2): `int[] arr = { 1, 2, 3, 4 }; Span<int> s = arr.AsSpan(2); s[0] = 7; Console.WriteLine(string.Join(",", arr));` → `1,2,7,4` (a span is a view, not a copy) [R]
6. predict (`memory`, d3): "Does it compile?" a `Span<int>` local used after an `await` → No: `CS4007 Instance of type 'System.Span<int>' cannot be preserved across 'await' or 'yield' boundary.`; a `Span<int>` field in a class → `CS8345` [C]
7. predict (`memory`, d3): "Does it compile?" `static int Bad(in int x) { x = 5; return x; }` → No: `CS8331 Cannot assign to variable 'x' ... because it is a readonly variable` [C]
8. predict (`equality`, d3): `string a = "hello"; string b = "hel" + "lo"; string c = string.Concat("hel", "lo"); Console.WriteLine(ReferenceEquals(a, b) + " " + ReferenceEquals(a, c) + " " + ReferenceEquals(a, string.Intern(c)));` → `True False True` (constant folding and interning) [R]
9. predict (`equality`, d3): `class Key { public int V; ... }` vs `record KeyR(int V);`, two equal-valued instances in a `HashSet` each → `2 1` (no `Equals` / `GetHashCode` override on the class) [R]
10. predict (`concurrency`, d2): `int n = 0; Parallel.For(0, 1000, _ => Interlocked.Increment(ref n)); Console.WriteLine(n);` → `1000` (with `n++` the result is not guaranteed: do not machine-check that variant) [R]
11. predict (`concurrency`, d2): `lock (lk) { total++; }` inside `Parallel.For(0, 100, ...)` → `100` [R]
12. predict (`design-di`, d2): `Func<object, string> f = o => o.ToString()!; Func<string, object> g = f; Console.WriteLine(g("x"));` → compiles (variance), prints `x` [R]
13. pick (`design-di`, d3): "A singleton service takes a scoped `DbContext` in its constructor. What is the problem?" → captive dependency: the scoped service lives as long as the singleton [Doc: Dependency injection in .NET, service lifetimes]
14. pick (`design-di`, d3): `IQueryable<T>` vs `IEnumerable<T>` with EF Core: where does `Where` run? → `IQueryable` builds an expression tree translated to SQL; `IEnumerable` filters in memory after loading [Doc]
15. predict (`linq`, d3): multiple enumeration of a `Select` with a side-effect counter enumerated twice → `6` [R]
16. predict (`delegates-closures`, d2): `foreach` capture → `012` vs `for` capture → `333`; "which C# version changed `foreach`?" → C# 5 [R; Doc]

## Notes for content authors

- Keep the first lines of every snippet as real `using` directives; the absence of implicit usings is a feature to
  teach (region 1 or 3 "does it compile?" questions), not something to hide.
- For "Does it compile?" answers, show the error code plus the short message; the full messages above are exact as
  printed by the .NET 10 compiler (`CS1997` includes the method name, so adapt it to the snippet).
- Never machine-check: dictionary or hash-set iteration order, `GetHashCode` values, finalizer output, unsynchronized
  `n++` races, `Task.Delay` interleavings with small margins, exact stack-trace text.
- Region 5 candidate (`span-castle`, castle theme): GC and finalizers, `Span<T>` / `Memory<T>`, `readonly struct`,
  `in`, `ref` locals (`ref int r = ref a[1]; r = 20;` → `20`, verified), `lock` / `Interlocked`, DI lifetimes,
  modern C# (collection expressions `int[] xs = [1, 2, 3]; List<int> ys = [.. xs, 4];`, `xs[^1]` → `3`,
  `xs[1..]` → `2,3`, primary constructors, `required`, all verified).

## Sources

See [csharp-hiring-assessments.md](csharp-hiring-assessments.md#sources) for the full list. Lesson-specific
references (Microsoft Learn):

- Value types / reference types: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-types
- Boxing and unboxing: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/boxing-and-unboxing
- Nullable reference types: https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references
- Equality comparisons: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/statements-expressions-operators/equality-comparisons
- `override` vs `new`: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/knowing-when-to-use-override-and-new-keywords
- Default interface methods: https://learn.microsoft.com/en-us/dotnet/csharp/advanced-topics/interface-implementation/default-interface-methods-versions
- Records: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record
- Pattern matching: https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/pattern-matching
- Generic constraints: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/constraints-on-type-parameters
- Lambda expressions (captured variables): https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions
- LINQ deferred execution: https://learn.microsoft.com/en-us/dotnet/standard/linq/deferred-execution-lazy-evaluation
- Exception handling statements: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/exception-handling-statements
- `using` statement: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/using
- Implement a Dispose method: https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/implementing-dispose
- Asynchronous programming: https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/
- Async/await best practices: https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming
- ConfigureAwait FAQ: https://devblogs.microsoft.com/dotnet/configureawait-faq/
- GC fundamentals: https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals
- Memory and spans: https://learn.microsoft.com/en-us/dotnet/standard/memory-and-spans/
- Dependency injection: https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection
