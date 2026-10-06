import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for moon Railhaven (Rails). Rails can't run in the sandbox, so every task is "Rails under
// the hood": the player builds our mini version of a Rails mechanism in plain Ruby 3.4.7 (Compiler
// Explorer). Tests are appended on the server by /api/run, so hidden tests never reach the browser.
// Each task is self-contained: any fake DB it needs lives in the starter (the player's file).

const rb = String.raw;

// ─── REGION BOSSES ────────────────────────────────────────────────────────────

/** Boss mini project (Record Village): the table-name convention. */
export const tableNameTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the golem's table names", "Mini proyecto: los nombres de tabla del gólem", "ミニ課題：ゴーレムのテーブル名"),
  brief: L(
    'Write table_name(class_name), our mini version of the Rails convention. Turn CamelCase into snake_case ("BlogPost" → "blog_post"), then pluralize the end: consonant + y → ies ("Category" → "categories", but "Day" → "days"); ending in s, x, ch or sh → add es ("Box" → "boxes"); otherwise add s ("Post" → "posts").',
    'Escribe table_name(class_name), nuestra mini versión de la convención de Rails. Pasa CamelCase a snake_case ("BlogPost" → "blog_post") y luego pluraliza el final: consonante + y → ies ("Category" → "categories", pero "Day" → "days"); si termina en s, x, ch o sh → agrega es ("Box" → "boxes"); si no, agrega s ("Post" → "posts").',
    'Rails の規約のミニ版 table_name(class_name) を書こう。CamelCase を snake_case にし（"BlogPost" → "blog_post"）、末尾を複数形に：子音 + y は ies（"Category" → "categories"、"Day" は "days"）、s・x・ch・sh で終われば es（"Box" → "boxes"）、それ以外は s（"Post" → "posts"）。',
  ),
  starter: rb`def table_name(class_name)
  # your code here
  class_name.downcase
end
`,
  solution: rb`def table_name(class_name)
  snake = class_name.gsub(/([a-z\d])([A-Z])/, '\1_\2').downcase
  if snake.match?(/[^aeiou]y\z/)
    snake.sub(/y\z/, "ies")
  elsif snake.match?(/(s|x|ch|sh)\z/)
    snake + "es"
  else
    snake + "s"
  end
end
`,
  nearMiss: [
    // No underscores between the words.
    rb`def table_name(class_name)
  name = class_name.downcase
  if name.match?(/[^aeiou]y\z/)
    name.sub(/y\z/, "ies")
  elsif name.match?(/(s|x|ch|sh)\z/)
    name + "es"
  else
    name + "s"
  end
end
`,
    // Every final y becomes ies: "Day" → "daies".
    rb`def table_name(class_name)
  snake = class_name.gsub(/([a-z\d])([A-Z])/, '\1_\2').downcase
  if snake.end_with?("y")
    snake.sub(/y\z/, "ies")
  elsif snake.match?(/(s|x|ch|sh)\z/)
    snake + "es"
  else
    snake + "s"
  end
end
`,
  ],
  tests: [
    { run: 'p table_name("Post")', expect: '"posts"' },
    { run: 'p table_name("BlogPost")', expect: '"blog_posts"' },
    { run: 'p table_name("Category")', expect: '"categories"', hidden: true },
    { run: 'p table_name("Box")', expect: '"boxes"', hidden: true },
    { run: 'p table_name("Day")', expect: '"days"', hidden: true },
    { run: 'p table_name("LineItem")', expect: '"line_items"', hidden: true },
  ],
  hint: L(
    "First put an underscore wherever a lower-case letter meets an upper-case one, then look only at the last letters.",
    "Primero pon un guion bajo donde una minúscula toca una mayúscula; luego mira solo las últimas letras.",
    "まず小文字と大文字の境目に _ を入れ、それから最後の文字だけを見よう。",
  ),
  note: "recap-conventions",
  explain: L(
    "gsub(/([a-z\\d])([A-Z])/, '\\1_\\2') splits the words; then only the ending decides the plural: consonant + y → ies, s/x/ch/sh → es, else s.",
    "gsub(/([a-z\\d])([A-Z])/, '\\1_\\2') separa las palabras; luego solo el final decide el plural: consonante + y → ies, s/x/ch/sh → es, si no s.",
    "gsub(/([a-z\\d])([A-Z])/, '\\1_\\2') で単語を分け、複数形は末尾だけで決める：子音+y → ies、s/x/ch/sh → es、他は s。",
  ),
};

// Our mini DB for the comments loader: every call to comments_where is one query.
const COMMENTS_DB = rb`# Our mini DB (keep it): every call to comments_where is ONE query.
COMMENTS = [
  {id: 1, post_id: 1, body: "first!"},
  {id: 2, post_id: 2, body: "nice"},
  {id: 3, post_id: 1, body: "+1"},
  {id: 4, post_id: 3, body: "meh"},
]
$queries = 0

def comments_where(post_ids)
  $queries += 1
  COMMENTS.select { |c| post_ids.include?(c[:post_id]) }
end

`;

/** Boss mini project (Association Forest): an N+1-free loader. */
export const commentsLoaderTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: load comments without N+1", "Mini proyecto: carga comentarios sin N+1", "ミニ課題：N+1 なしでコメントを読む"),
  brief: L(
    "Our mini version of preloading. Write comments_by_post(post_ids) using the mini DB in the starter (each comments_where call counts as 1 query). Return a hash of post_id => array of comment bodies, keys in the order of post_ids, bodies in DB order. A post without comments maps to []. Use at most ONE query, and none at all when post_ids is empty.",
    "Nuestra mini versión de la precarga. Escribe comments_by_post(post_ids) con la mini DB del código inicial (cada llamada a comments_where cuenta como 1 consulta). Devuelve un hash de post_id => array de cuerpos de comentarios, claves en el orden de post_ids y cuerpos en el orden de la DB. Un post sin comentarios va a []. Usa como máximo UNA consulta, y ninguna si post_ids está vacío.",
    "プリロードのミニ版。初期コードのミニ DB（comments_where 1回が1クエリ）で comments_by_post(post_ids) を書こう。post_id => コメント本文の配列のハッシュを返す。キーは post_ids の順、本文は DB の順。コメントのない投稿は []。クエリは最大1回、post_ids が空なら0回。",
  ),
  starter: `${COMMENTS_DB}def comments_by_post(post_ids)
  # your code here
  {}
end
`,
  solution: `${COMMENTS_DB}def comments_by_post(post_ids)
  return {} if post_ids.empty?
  found = comments_where(post_ids)
  post_ids.to_h { |id| [id, found.select { |c| c[:post_id] == id }.map { |c| c[:body] }] }
end
`,
  nearMiss: [
    // N+1: one query per post.
    `${COMMENTS_DB}def comments_by_post(post_ids)
  post_ids.to_h { |id| [id, comments_where([id]).map { |c| c[:body] }] }
end
`,
    // group_by drops posts without comments and follows DB order.
    `${COMMENTS_DB}def comments_by_post(post_ids)
  comments_where(post_ids).group_by { |c| c[:post_id] }.transform_values { |cs| cs.map { |c| c[:body] } }
end
`,
    // Still runs a query for an empty list.
    `${COMMENTS_DB}def comments_by_post(post_ids)
  found = comments_where(post_ids)
  post_ids.to_h { |id| [id, found.select { |c| c[:post_id] == id }.map { |c| c[:body] }] }
end
`,
  ],
  tests: [
    { run: "$queries = 0\np [comments_by_post([1, 2]), $queries]", expect: '[{1 => ["first!", "+1"], 2 => ["nice"]}, 1]' },
    { run: "$queries = 0\np [comments_by_post([4]), $queries]", expect: "[{4 => []}, 1]" },
    { run: "$queries = 0\np [comments_by_post([]), $queries]", expect: "[{}, 0]", hidden: true },
    { run: "$queries = 0\np [comments_by_post([3, 1, 2]), $queries]", expect: '[{3 => ["meh"], 1 => ["first!", "+1"], 2 => ["nice"]}, 1]', hidden: true },
    { run: "$queries = 0\ncomments_by_post([1, 2, 3])\ncomments_by_post([2])\np $queries", expect: "2", hidden: true },
  ],
  hint: L(
    "Ask the DB once for every id, then split the rows per post in Ruby. Posts with no rows still need a key.",
    "Pide a la DB todos los ids una vez y reparte las filas por post en Ruby. Los posts sin filas igual necesitan clave.",
    "DB には全 id を1回で聞き、行の振り分けは Ruby で。行がない投稿にもキーが要る。",
  ),
  note: "recap-n-plus-one",
  explain: L(
    "One comments_where for all ids, then build each post's list from the loaded rows: that's what includes does. Skip the query when there are no ids.",
    "Un solo comments_where con todos los ids y luego arma la lista de cada post con las filas cargadas: eso hace includes. Sin ids, no consultes.",
    "全 id で comments_where を1回だけ呼び、読んだ行から投稿ごとのリストを作る。includes がやっていること。id がなければクエリしない。",
  ),
};

const ROUTES_RB = '[["GET", "/posts", "posts#index"], ["GET", "/posts/new", "posts#new"], ["GET", "/posts/:id", "posts#show"], ["PATCH", "/posts/:id", "posts#update"], ["GET", "/posts/:post_id/comments/:id", "comments#show"]]';
const routesTest = (call: string) => `routes = ${ROUTES_RB}\np ${call}`;

/** Boss mini project (Controller Castle): a tiny router. */
export const routerTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the dragon's router", "Mini proyecto: el router del dragón", "ミニ課題：ドラゴンのルーター"),
  brief: L(
    'Our mini router. Write match_route(routes, verb, path). routes is an array of [verb, pattern, "controller#action"] in priority order. A route matches when the verb is equal and the path has the same number of segments, each literal segment equal and each :name segment captured. Return [target, params] for the FIRST match (params has Symbol keys and String values, e.g. ["posts#show", {id: "7"}]), or nil.',
    'Nuestro mini router. Escribe match_route(routes, verb, path). routes es un array de [verb, patrón, "controller#action"] en orden de prioridad. Una ruta encaja si el verbo es igual y el path tiene la misma cantidad de segmentos, cada segmento literal igual y cada segmento :name capturado. Devuelve [target, params] de la PRIMERA que encaje (params con claves Symbol y valores String, p. ej. ["posts#show", {id: "7"}]), o nil.',
    'ミニルーター match_route(routes, verb, path) を書こう。routes は [verb, パターン, "controller#action"] の配列で優先順。verb が同じで、path のセグメント数が同じ、文字どおりのセグメントが一致し、:name のセグメントは取り出せたら一致。「最初に」一致したものの [target, params]（キーは Symbol、値は String。例 ["posts#show", {id: "7"}]）、なければ nil。',
  ),
  starter: rb`def match_route(routes, verb, path)
  # your code here
  nil
end
`,
  solution: rb`def match_route(routes, verb, path)
  parts = path.split("/").reject(&:empty?)
  routes.each do |route_verb, pattern, target|
    next unless route_verb == verb
    pieces = pattern.split("/").reject(&:empty?)
    next unless pieces.size == parts.size
    params = {}
    matched = pieces.zip(parts).all? do |piece, part|
      if piece.start_with?(":")
        params[piece.delete_prefix(":").to_sym] = part
        true
      else
        piece == part
      end
    end
    return [target, params] if matched
  end
  nil
end
`,
  nearMiss: [
    // Ignores the HTTP verb.
    rb`def match_route(routes, verb, path)
  parts = path.split("/").reject(&:empty?)
  routes.each do |_route_verb, pattern, target|
    pieces = pattern.split("/").reject(&:empty?)
    next unless pieces.size == parts.size
    params = {}
    matched = pieces.zip(parts).all? do |piece, part|
      if piece.start_with?(":")
        params[piece.delete_prefix(":").to_sym] = part
        true
      else
        piece == part
      end
    end
    return [target, params] if matched
  end
  nil
end
`,
    // No segment count check: "/posts" matches "/posts/7" as a prefix.
    rb`def match_route(routes, verb, path)
  parts = path.split("/").reject(&:empty?)
  routes.each do |route_verb, pattern, target|
    next unless route_verb == verb
    pieces = pattern.split("/").reject(&:empty?)
    params = {}
    matched = pieces.zip(parts).all? do |piece, part|
      if piece.start_with?(":")
        params[piece.delete_prefix(":").to_sym] = part
        true
      else
        piece == part
      end
    end
    return [target, params] if matched
  end
  nil
end
`,
  ],
  tests: [
    { run: routesTest('match_route(routes, "GET", "/posts/7")'), expect: '["posts#show", {id: "7"}]' },
    { run: routesTest('match_route(routes, "GET", "/posts")'), expect: '["posts#index", {}]' },
    { run: routesTest('match_route(routes, "GET", "/posts/new")'), expect: '["posts#new", {}]', hidden: true },
    { run: routesTest('match_route(routes, "DELETE", "/posts/7")'), expect: "nil", hidden: true },
    { run: routesTest('match_route(routes, "GET", "/posts/3/comments/9")'), expect: '["comments#show", {post_id: "3", id: "9"}]', hidden: true },
    { run: routesTest('match_route(routes, "GET", "/posts/7/edit")'), expect: "nil", hidden: true },
  ],
  hint: L(
    "Split both into segments. Same count first, then compare in pairs: literals must be equal, :name parts are captured.",
    "Separa ambos en segmentos. Primero igual cantidad; luego compara en pares: literales iguales, los :name se capturan.",
    "両方をセグメントに分ける。まず数が同じか、次にペアで比べる：文字どおりの部分は一致、:name は取り出す。",
  ),
  note: "recap-routes",
  explain: L(
    "Check the verb and the segment count, then zip pattern and path: literals must match, :name captures. Routes are tried in order, so /posts/new wins.",
    "Revisa el verbo y la cantidad de segmentos y luego haz zip de patrón y path: los literales deben coincidir, :name captura. Se prueban en orden: gana /posts/new.",
    "verb とセグメント数を確かめ、パターンと path を zip。文字どおりは一致、:name は取り出す。ルートは順に試すので /posts/new が勝つ。",
  ),
};

// ─── EXAMS: JUNIOR (ide) ──────────────────────────────────────────────────────

export const permitTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "strong_params",
  difficulty: 1,
  prompt: L("Coding: our mini permit", "Código: nuestro mini permit", "コーディング：ミニ版 permit"),
  brief: L(
    "Our mini version of strong params. Write permit(params, *allowed): params is a hash with Symbol keys. Return a NEW hash with only the allowed keys that are present, in the order they appear in params. Keys that are not allowed (like :admin) are dropped; missing keys are not added. Don't modify params.",
    "Nuestra mini versión de strong params. Escribe permit(params, *allowed): params es un hash con claves Symbol. Devuelve un hash NUEVO solo con las claves permitidas que estén presentes, en el orden en que aparecen en params. Las no permitidas (como :admin) se descartan; las que faltan no se agregan. No modifiques params.",
    "ストロングパラメータのミニ版。permit(params, *allowed) を書こう。params は Symbol キーのハッシュ。許可されたキーのうち存在するものだけを params の順で持つ「新しい」ハッシュを返す。許可外（:admin など）は落とし、ないキーは足さない。params は変えないこと。",
  ),
  starter: rb`def permit(params, *allowed)
  # your code here
  params
end
`,
  solution: rb`def permit(params, *allowed)
  params.select { |key, _| allowed.include?(key) }
end
`,
  nearMiss: [
    // Builds from the allowed list: adds nil for missing keys and changes the order.
    rb`def permit(params, *allowed)
  allowed.to_h { |key| [key, params[key]] }
end
`,
    // delete_if filters in place: the caller's params lose their keys.
    rb`def permit(params, *allowed)
  params.delete_if { |key, _| !allowed.include?(key) }
end
`,
    // A denylist only stops the keys you thought of.
    rb`def permit(params, *allowed)
  params.reject { |key, _| key == :admin }
end
`,
  ],
  tests: [
    { run: 'p permit({title: "Hi", admin: true}, :title)', expect: '{title: "Hi"}' },
    { run: "p permit({}, :title)", expect: "{}" },
    { run: 'p permit({body: "x", title: "T", role: "admin"}, :title, :body)', expect: '{body: "x", title: "T"}', hidden: true },
    { run: 'p permit({title: "T"}, :title, :body)', expect: '{title: "T"}', hidden: true },
    { run: 'params = {title: "T", admin: true}\npermit(params, :title)\np params', expect: '{title: "T", admin: true}', hidden: true },
  ],
  explain: L(
    "Hash#select returns a new hash with the pairs whose key is allowed, keeping params' order. An allowlist is safer than rejecting known bad keys.",
    "Hash#select devuelve un hash nuevo con los pares cuya clave está permitida, en el orden de params. Una lista blanca es más segura que rechazar claves malas.",
    "Hash#select は許可されたキーの組だけを params の順で持つ新しいハッシュを返す。悪いキーを弾くより許可リストのほうが安全。",
  ),
};

const USERS_RB = 'users = [{id: 1, name: "Ada", role: "admin"}, {id: 2, name: "Bo", role: "user"}, {id: 3, name: "Cy", role: "user"}]';

export const findByTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "finders",
  difficulty: 1,
  prompt: L("Coding: our mini find_by", "Código: nuestro mini find_by", "コーディング：ミニ版 find_by"),
  brief: L(
    'Our mini version of find_by. Write find_by(rows, conditions): rows is an array of hashes and conditions a hash like {role: "user", name: "Cy"}. Return the FIRST row where EVERY condition matches, or nil when no row does (like find_by, not find: no exception).',
    'Nuestra mini versión de find_by. Escribe find_by(rows, conditions): rows es un array de hashes y conditions un hash como {role: "user", name: "Cy"}. Devuelve la PRIMERA fila donde se cumplen TODAS las condiciones, o nil si ninguna (como find_by, no find: sin excepción).',
    'find_by のミニ版。find_by(rows, conditions) を書こう。rows はハッシュの配列、conditions は {role: "user", name: "Cy"} のようなハッシュ。「すべての」条件が合う「最初の」行を返し、なければ nil（find ではなく find_by なので例外なし）。',
  ),
  starter: rb`def find_by(rows, conditions)
  # your code here
  nil
end
`,
  solution: rb`def find_by(rows, conditions)
  rows.find { |row| conditions.all? { |key, value| row[key] == value } }
end
`,
  nearMiss: [
    // any? matches a row when just one condition fits.
    rb`def find_by(rows, conditions)
  rows.find { |row| conditions.any? { |key, value| row[key] == value } }
end
`,
    // select returns every match as an array, like where.
    rb`def find_by(rows, conditions)
  rows.select { |row| conditions.all? { |key, value| row[key] == value } }
end
`,
  ],
  tests: [
    { run: `${USERS_RB}\np find_by(users, name: "Bo")`, expect: '{id: 2, name: "Bo", role: "user"}' },
    { run: `${USERS_RB}\np find_by(users, name: "Zed")`, expect: "nil" },
    { run: `${USERS_RB}\np find_by(users, role: "user")[:id]`, expect: "2", hidden: true },
    { run: `${USERS_RB}\np find_by(users, role: "user", name: "Cy")[:id]`, expect: "3", hidden: true },
    { run: `${USERS_RB}\np find_by(users, role: "admin", name: "Bo")`, expect: "nil", hidden: true },
    { run: "p find_by([], id: 1)", expect: "nil", hidden: true },
  ],
  explain: L(
    "Enumerable#find stops at the first row for which the block is true, and all? requires every condition. With no match, find returns nil.",
    "Enumerable#find se detiene en la primera fila donde el bloque es verdadero, y all? exige todas las condiciones. Sin coincidencias, find devuelve nil.",
    "Enumerable#find はブロックが真になる最初の行で止まり、all? はすべての条件を求める。一致がなければ find は nil。",
  ),
};

export const fullMessagesTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "validations",
  difficulty: 1,
  prompt: L("Coding: our mini full_messages", "Código: nuestro mini full_messages", "コーディング：ミニ版 full_messages"),
  brief: L(
    'Our mini version of errors.full_messages. Write full_messages(errors): errors is a hash of field => array of messages. Return a flat array of strings "<Field> <message>", fields in hash order and messages in order. The field name is humanized: underscores become spaces and only the first letter is upper case (:first_name → "First name").',
    'Nuestra mini versión de errors.full_messages. Escribe full_messages(errors): errors es un hash de campo => array de mensajes. Devuelve un array plano de strings "<Campo> <mensaje>", campos en el orden del hash y mensajes en orden. El nombre se humaniza: los guiones bajos pasan a espacios y solo la primera letra va en mayúscula (:first_name → "First name").',
    'errors.full_messages のミニ版。full_messages(errors) を書こう。errors は「項目 => メッセージ配列」のハッシュ。"<項目> <メッセージ>" の文字列を平らな配列で返す（項目はハッシュの順、メッセージも順番どおり）。項目名は _ を空白にし、先頭だけ大文字（:first_name → "First name"）。',
  ),
  starter: rb`def full_messages(errors)
  # your code here
  []
end
`,
  solution: rb`def full_messages(errors)
  errors.flat_map do |field, messages|
    label = field.to_s.tr("_", " ").capitalize
    messages.map { |message| "#{label} #{message}" }
  end
end
`,
  nearMiss: [
    // Keeps the underscore: "First_name".
    rb`def full_messages(errors)
  errors.flat_map do |field, messages|
    messages.map { |message| "#{field.to_s.capitalize} #{message}" }
  end
end
`,
    // map instead of flat_map: an array of arrays.
    rb`def full_messages(errors)
  errors.map do |field, messages|
    label = field.to_s.tr("_", " ").capitalize
    messages.map { |message| "#{label} #{message}" }
  end
end
`,
  ],
  tests: [
    { run: `p full_messages({title: ["can't be blank"]})`, expect: `["Title can't be blank"]` },
    { run: "p full_messages({})", expect: "[]" },
    { run: 'p full_messages({first_name: ["is too short"]})', expect: '["First name is too short"]', hidden: true },
    { run: 'p full_messages({email: ["is invalid", "is taken"], age: ["must be positive"]})', expect: '["Email is invalid", "Email is taken", "Age must be positive"]', hidden: true },
    { run: "p full_messages({tags: []})", expect: "[]", hidden: true },
  ],
  explain: L(
    "flat_map joins each field's messages into one flat list; tr(\"_\", \" \").capitalize humanizes the field like Rails does.",
    "flat_map junta los mensajes de cada campo en una sola lista plana; tr(\"_\", \" \").capitalize humaniza el campo como Rails.",
    "flat_map で各項目のメッセージを1つの平らなリストにし、tr(\"_\", \" \").capitalize で Rails のように項目名を整える。",
  ),
};

export const restActionTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "routing",
  difficulty: 1,
  prompt: L("Coding: which REST action?", "Código: ¿qué acción REST?", "コーディング：どの REST アクション？"),
  brief: L(
    "resources :photos gives 7 routes: GET /photos index, GET /photos/new new, POST /photos create, GET /photos/:id show, GET /photos/:id/edit edit, PATCH or PUT /photos/:id update, DELETE /photos/:id destroy. Write rest_action(verb, path) returning the action name as a String for any resource name, or nil for anything else.",
    "resources :photos da 7 rutas: GET /photos index, GET /photos/new new, POST /photos create, GET /photos/:id show, GET /photos/:id/edit edit, PATCH o PUT /photos/:id update, DELETE /photos/:id destroy. Escribe rest_action(verb, path) que devuelva el nombre de la acción como String para cualquier recurso, o nil en otro caso.",
    "resources :photos は7つのルートを作る：GET /photos index、GET /photos/new new、POST /photos create、GET /photos/:id show、GET /photos/:id/edit edit、PATCH か PUT /photos/:id update、DELETE /photos/:id destroy。どのリソース名でもアクション名を String で返し、それ以外は nil を返す rest_action(verb, path) を書こう。",
  ),
  starter: rb`def rest_action(verb, path)
  # your code here
  nil
end
`,
  solution: rb`def rest_action(verb, path)
  parts = path.split("/").reject(&:empty?)
  case parts.size
  when 1
    {"GET" => "index", "POST" => "create"}[verb]
  when 2
    return (verb == "GET" ? "new" : nil) if parts[1] == "new"
    {"GET" => "show", "PATCH" => "update", "PUT" => "update", "DELETE" => "destroy"}[verb]
  when 3
    verb == "GET" && parts[2] == "edit" ? "edit" : nil
  end
end
`,
  nearMiss: [
    // /photos/new is read as /photos/:id.
    rb`def rest_action(verb, path)
  parts = path.split("/").reject(&:empty?)
  case parts.size
  when 1
    {"GET" => "index", "POST" => "create"}[verb]
  when 2
    {"GET" => "show", "PATCH" => "update", "PUT" => "update", "DELETE" => "destroy"}[verb]
  when 3
    verb == "GET" && parts[2] == "edit" ? "edit" : nil
  end
end
`,
    // Forgets that PUT also updates.
    rb`def rest_action(verb, path)
  parts = path.split("/").reject(&:empty?)
  case parts.size
  when 1
    {"GET" => "index", "POST" => "create"}[verb]
  when 2
    return (verb == "GET" ? "new" : nil) if parts[1] == "new"
    {"GET" => "show", "PATCH" => "update", "DELETE" => "destroy"}[verb]
  when 3
    verb == "GET" && parts[2] == "edit" ? "edit" : nil
  end
end
`,
  ],
  tests: [
    { run: 'p rest_action("GET", "/photos")', expect: '"index"' },
    { run: 'p rest_action("DELETE", "/photos/3")', expect: '"destroy"' },
    { run: 'p rest_action("GET", "/photos/new")', expect: '"new"', hidden: true },
    { run: 'p [rest_action("PATCH", "/photos/3"), rest_action("PUT", "/photos/3")]', expect: '["update", "update"]', hidden: true },
    { run: 'p rest_action("GET", "/users/9/edit")', expect: '"edit"', hidden: true },
    { run: 'p [rest_action("POST", "/photos"), rest_action("POST", "/photos/3")]', expect: '["create", nil]', hidden: true },
  ],
  explain: L(
    "Count the segments, then the verb picks the action. Check /new before treating the second segment as an :id, just like the route order in Rails.",
    "Cuenta los segmentos y luego el verbo elige la acción. Revisa /new antes de tratar el segundo segmento como :id, igual que el orden de rutas en Rails.",
    "セグメントを数え、verb でアクションを決める。2つ目を :id とみなす前に /new を調べる。Rails のルート順と同じ。",
  ),
};

// ─── EXAMS: MID (2 ide + 2 paper) ─────────────────────────────────────────────

export const callbacksTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "callbacks",
  difficulty: 2,
  prompt: L("Coding: a halting callback chain", "Código: una cadena de callbacks que se detiene", "コーディング：止められるコールバック列"),
  brief: L(
    "Our mini version of before_save callbacks. Write run_callbacks(record, callbacks): call each callback (a lambda) in order with record. A callback halts the chain with throw :abort: stop right there and return false. Returning false does NOT halt (as in Rails 5+). If every callback runs, return true.",
    "Nuestra mini versión de los callbacks before_save. Escribe run_callbacks(record, callbacks): llama a cada callback (una lambda) en orden con record. Un callback detiene la cadena con throw :abort: para ahí mismo y devuelve false. Devolver false NO la detiene (como en Rails 5+). Si corren todos, devuelve true.",
    "before_save コールバックのミニ版。run_callbacks(record, callbacks) を書こう。各コールバック（ラムダ）を順に record で呼ぶ。throw :abort で列を止めたら、その場で終えて false を返す。false を返すだけでは止まらない（Rails 5 以降と同じ）。全部動いたら true。",
  ),
  starter: rb`def run_callbacks(record, callbacks)
  # your code here
  true
end
`,
  solution: rb`def run_callbacks(record, callbacks)
  catch(:abort) do
    callbacks.each { |callback| callback.call(record) }
    return true
  end
  false
end
`,
  nearMiss: [
    // Rails 4 style: a false return halts.
    rb`def run_callbacks(record, callbacks)
  catch(:abort) do
    callbacks.each { |callback| return false if callback.call(record) == false }
    return true
  end
  false
end
`,
    // Catches each callback on its own, so the chain keeps going after a halt.
    rb`def run_callbacks(record, callbacks)
  ok = true
  callbacks.each do |callback|
    ok = false if catch(:abort) { callback.call(record); :done } != :done
  end
  ok
end
`,
  ],
  tests: [
    { run: "log = []\nok = run_callbacks(log, [->(r) { r << :a }, ->(r) { r << :b }])\np [ok, log]", expect: "[true, [:a, :b]]" },
    { run: "log = []\nok = run_callbacks(log, [->(r) { r << :a }, ->(r) { throw :abort }, ->(r) { r << :c }])\np [ok, log]", expect: "[false, [:a]]" },
    { run: "p run_callbacks([], [])", expect: "true", hidden: true },
    { run: "p run_callbacks([], [->(r) { throw :abort }])", expect: "false", hidden: true },
    { run: "log = []\nok = run_callbacks(log, [->(r) { false }, ->(r) { r << :saved }])\np [ok, log]", expect: "[true, [:saved]]", hidden: true },
  ],
  explain: L(
    "Wrap the whole loop in catch(:abort): a throw jumps out of it, skipping the rest. Return true from inside when the loop finishes.",
    "Envuelve todo el bucle en catch(:abort): un throw salta fuera, saltándose el resto. Devuelve true desde adentro cuando el bucle termina.",
    "ループ全体を catch(:abort) で包む。throw でそこから抜け、残りは飛ばされる。ループを終えたら中で true を返す。",
  ),
};

const QUERY_HEAD = rb`class Query
  def initialize(table, conditions = {}, order = nil, limit = nil)
    @table = table
    @conditions = conditions
    @order = order
    @limit = limit
  end
`;

const QUERY_TO_SQL = rb`
  def to_sql
    sql = "SELECT * FROM #{@table}"
    unless @conditions.empty?
      sql += " WHERE " + @conditions.map { |col, val| "#{col} = #{val.is_a?(String) ? "'#{val}'" : val}" }.join(" AND ")
    end
    sql += " ORDER BY #{@order}" if @order
    sql += " LIMIT #{@limit}" if @limit
    sql
  end
end
`;

export const queryTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "relations",
  difficulty: 2,
  prompt: L("Coding: a chainable query", "Código: una consulta encadenable", "コーディング：つなげられるクエリ"),
  brief: L(
    "Our mini version of a relation. Finish class Query: where(hash), order(column) and limit(n) each return a NEW Query (the receiver never changes). Several where calls add up with AND. to_sql builds \"SELECT * FROM t WHERE a = 1 AND b = 'x' ORDER BY c LIMIT 2\": String values in single quotes, others as they print; skip the parts that are not set.",
    "Nuestra mini versión de una relación. Termina la clase Query: where(hash), order(column) y limit(n) devuelven cada uno un Query NUEVO (el receptor nunca cambia). Varios where se suman con AND. to_sql arma \"SELECT * FROM t WHERE a = 1 AND b = 'x' ORDER BY c LIMIT 2\": valores String entre comillas simples, los demás como se imprimen; omite las partes que no estén puestas.",
    "リレーションのミニ版 Query を完成させよう。where(hash)・order(column)・limit(n) はどれも「新しい」Query を返す（元は変えない）。where を重ねると AND でつながる。to_sql は \"SELECT * FROM t WHERE a = 1 AND b = 'x' ORDER BY c LIMIT 2\" を作る。String はシングルクォートで囲み、他はそのまま。設定のない部分は省く。",
  ),
  starter: `${QUERY_HEAD}
  def where(conditions)
    # your code here
  end

  def order(column)
    # your code here
  end

  def limit(n)
    # your code here
  end

  def to_sql
    # your code here
  end
end
`,
  solution: `${QUERY_HEAD}
  def where(conditions) = Query.new(@table, @conditions.merge(conditions), @order, @limit)
  def order(column) = Query.new(@table, @conditions, column, @limit)
  def limit(n) = Query.new(@table, @conditions, @order, n)
${QUERY_TO_SQL}`,
  nearMiss: [
    // Mutates the receiver and returns self.
    `${QUERY_HEAD}
  def where(conditions)
    @conditions = @conditions.merge(conditions)
    self
  end

  def order(column)
    @order = column
    self
  end

  def limit(n)
    @limit = n
    self
  end
${QUERY_TO_SQL}`,
    // A second where replaces the first.
    `${QUERY_HEAD}
  def where(conditions) = Query.new(@table, conditions, @order, @limit)
  def order(column) = Query.new(@table, @conditions, column, @limit)
  def limit(n) = Query.new(@table, @conditions, @order, n)
${QUERY_TO_SQL}`,
  ],
  tests: [
    { run: 'puts Query.new("posts").where(published: true).order(:id).limit(2).to_sql', expect: "SELECT * FROM posts WHERE published = true ORDER BY id LIMIT 2" },
    { run: 'puts Query.new("users").to_sql', expect: "SELECT * FROM users" },
    { run: 'base = Query.new("posts")\nbase.where(draft: false)\nputs base.to_sql', expect: "SELECT * FROM posts", hidden: true },
    { run: 'puts Query.new("users").where(name: "Bo").where(age: 30).to_sql', expect: "SELECT * FROM users WHERE name = 'Bo' AND age = 30", hidden: true },
    { run: 'puts Query.new("posts").limit(5).order(:title).to_sql', expect: "SELECT * FROM posts ORDER BY title LIMIT 5", hidden: true },
  ],
  explain: L(
    "Each builder returns Query.new with one part changed and merges the conditions, so a relation can be reused safely; to_sql only reads.",
    "Cada método devuelve Query.new con una parte cambiada y fusiona las condiciones, así una relación se reutiliza sin riesgo; to_sql solo lee.",
    "各メソッドは1か所だけ変えた Query.new を返し、条件は merge する。だからリレーションを安全に使い回せる。to_sql は読むだけ。",
  ),
};

export const escapeTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "views",
  difficulty: 2,
  prompt: L("Written test: escape HTML", "Prueba escrita: escapa HTML", "筆記：HTML エスケープ"),
  brief: L(
    "Our mini version of ERB's <%= %> escaping. Write h(value): turn value into a string (nil becomes \"\") and replace & < > \" ' with &amp; &lt; &gt; &quot; &#39;. Every character is escaped exactly once: h(\"&lt;\") is \"&amp;lt;\".",
    "Nuestra mini versión del escapado de <%= %> en ERB. Escribe h(value): pasa value a string (nil queda \"\") y reemplaza & < > \" ' por &amp; &lt; &gt; &quot; &#39;. Cada carácter se escapa exactamente una vez: h(\"&lt;\") es \"&amp;lt;\".",
    "ERB の <%= %> のエスケープのミニ版 h(value) を書こう。value を文字列にし（nil は \"\"）、& < > \" ' を &amp; &lt; &gt; &quot; &#39; に置きかえる。各文字はちょうど1回だけ：h(\"&lt;\") は \"&amp;lt;\"。",
  ),
  starter: rb`def h(value)
  # your code here
  value.to_s
end
`,
  solution: rb`ESCAPES = {"&" => "&amp;", "<" => "&lt;", ">" => "&gt;", '"' => "&quot;", "'" => "&#39;"}

def h(value)
  value.to_s.gsub(/[&<>"']/, ESCAPES)
end
`,
  nearMiss: [
    // Escapes & last, so it re-escapes the entities it just wrote.
    rb`def h(value)
  value.to_s.gsub("<", "&lt;").gsub(">", "&gt;").gsub('"', "&quot;").gsub("'", "&#39;").gsub("&", "&amp;")
end
`,
    // nil has no gsub.
    rb`ESCAPES = {"&" => "&amp;", "<" => "&lt;", ">" => "&gt;", '"' => "&quot;", "'" => "&#39;"}

def h(value)
  value.gsub(/[&<>"']/, ESCAPES)
end
`,
  ],
  tests: [
    { run: 'puts h("<b>hi</b>")', expect: "&lt;b&gt;hi&lt;/b&gt;" },
    { run: 'puts h("Tom & Jerry")', expect: "Tom &amp; Jerry" },
    { run: `puts h(%q(say "it's"))`, expect: "say &quot;it&#39;s&quot;", hidden: true },
    { run: "p h(nil)", expect: '""', hidden: true },
    { run: 'puts h("&lt;")', expect: "&amp;lt;", hidden: true },
    { run: "puts h(42)", expect: "42", hidden: true },
  ],
  explain: L(
    "One gsub with a character class and a hash replaces every character in a single pass, so nothing is escaped twice. to_s handles nil and numbers.",
    "Un gsub con una clase de caracteres y un hash reemplaza todo en una pasada: nada se escapa dos veces. to_s cubre nil y números.",
    "文字クラスとハッシュを使った gsub 1回なら一度に置きかえるので二重エスケープしない。to_s で nil や数値も扱える。",
  ),
};

export const requireParamsTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "strong_params",
  difficulty: 2,
  prompt: L("Written test: require and permit", "Prueba escrita: require y permit", "筆記：require と permit"),
  brief: L(
    'Our mini version of params.require(:post).permit(...). Write ParameterMissing (a StandardError) and safe_params(params, key, *allowed). params[key] must be a non-empty Hash; otherwise raise ParameterMissing with the message "param is missing or the value is empty: <key>". Return a new hash with only the allowed keys of params[key], in their original order.',
    'Nuestra mini versión de params.require(:post).permit(...). Escribe ParameterMissing (un StandardError) y safe_params(params, key, *allowed). params[key] debe ser un Hash no vacío; si no, lanza ParameterMissing con el mensaje "param is missing or the value is empty: <key>". Devuelve un hash nuevo solo con las claves permitidas de params[key], en su orden original.',
    'params.require(:post).permit(...) のミニ版。ParameterMissing（StandardError）と safe_params(params, key, *allowed) を書こう。params[key] は空でない Hash でなければならず、違えば "param is missing or the value is empty: <key>" の ParameterMissing を投げる。params[key] の許可キーだけを元の順で持つ新しいハッシュを返す。',
  ),
  starter: rb`class ParameterMissing < StandardError; end

def safe_params(params, key, *allowed)
  # your code here
  {}
end
`,
  solution: rb`class ParameterMissing < StandardError; end

def safe_params(params, key, *allowed)
  value = params[key]
  unless value.is_a?(Hash) && !value.empty?
    raise ParameterMissing, "param is missing or the value is empty: #{key}"
  end
  value.select { |k, _| allowed.include?(k) }
end
`,
  nearMiss: [
    // fetch raises KeyError, not ParameterMissing.
    rb`class ParameterMissing < StandardError; end

def safe_params(params, key, *allowed)
  params.fetch(key).select { |k, _| allowed.include?(k) }
end
`,
    // Only checks for nil: an empty hash or a String slips through.
    rb`class ParameterMissing < StandardError; end

def safe_params(params, key, *allowed)
  value = params[key]
  raise ParameterMissing, "param is missing or the value is empty: #{key}" if value.nil?
  value.select { |k, _| allowed.include?(k) }
end
`,
  ],
  tests: [
    { run: 'p safe_params({post: {title: "Hi", admin: true}}, :post, :title)', expect: '{title: "Hi"}' },
    { run: "begin\n  safe_params({}, :post, :title)\nrescue ParameterMissing => e\n  puts e.message\nend", expect: "param is missing or the value is empty: post" },
    { run: "begin\n  safe_params({post: {}}, :post, :title)\nrescue ParameterMissing => e\n  puts e.message\nend", expect: "param is missing or the value is empty: post", hidden: true },
    { run: 'begin\n  safe_params({user: "hack"}, :user, :name)\nrescue ParameterMissing => e\n  puts e.message\nend', expect: "param is missing or the value is empty: user", hidden: true },
    { run: 'p safe_params({post: {body: "b", title: "t", id: 9}}, :post, :title, :body)', expect: '{body: "b", title: "t"}', hidden: true },
  ],
  explain: L(
    "Check the nested value is a non-empty Hash before permitting, and raise your own error so the controller can answer 400. Then select the allowed keys.",
    "Revisa que el valor anidado sea un Hash no vacío antes de permitir y lanza tu propio error: así el controlador responde 400. Luego elige las claves.",
    "permit の前に、入れ子の値が空でない Hash か確かめ、自分の例外を投げればコントローラーは 400 を返せる。その後で許可キーを選ぶ。",
  ),
};

// ─── EXAMS: SENIOR (1 ide + 3 paper) ──────────────────────────────────────────

const CACHE_HEAD = rb`class MiniCache
  def initialize
    @store = {}
  end
`;

export const cacheFetchTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "caching",
  difficulty: 3,
  prompt: L("Coding: our mini Rails.cache.fetch", "Código: nuestro mini Rails.cache.fetch", "コーディング：ミニ版 Rails.cache.fetch"),
  brief: L(
    "Our mini version of Rails.cache. Finish MiniCache: fetch(key) { ... } runs the block only on a miss, stores its value and returns it; on a hit it returns the stored value without calling the block. nil and false are values too: once stored, they are hits. delete(key) removes the entry and returns the old value, so the next fetch recomputes.",
    "Nuestra mini versión de Rails.cache. Termina MiniCache: fetch(key) { ... } corre el bloque solo si falta la clave, guarda su valor y lo devuelve; si está, devuelve lo guardado sin llamar al bloque. nil y false también son valores: una vez guardados, cuentan como acierto. delete(key) borra la entrada y devuelve el valor viejo, así el siguiente fetch recalcula.",
    "Rails.cache のミニ版 MiniCache を完成させよう。fetch(key) { ... } はキーがないときだけブロックを実行し、値を保存して返す。あれば保存済みの値をブロックなしで返す。nil や false も値なので、保存後はヒット扱い。delete(key) はエントリを消して古い値を返し、次の fetch で計算し直す。",
  ),
  starter: `${CACHE_HEAD}
  def fetch(key)
    # your code here
  end

  def delete(key)
    # your code here
  end
end
`,
  solution: `${CACHE_HEAD}
  def fetch(key)
    return @store[key] if @store.key?(key)
    @store[key] = yield
  end

  def delete(key)
    @store.delete(key)
  end
end
`,
  nearMiss: [
    // ||= treats a cached nil or false as a miss.
    `${CACHE_HEAD}
  def fetch(key)
    @store[key] ||= yield
  end

  def delete(key)
    @store.delete(key)
  end
end
`,
    // Always recomputes.
    `${CACHE_HEAD}
  def fetch(key)
    @store[key] = yield
  end

  def delete(key)
    @store.delete(key)
  end
end
`,
  ],
  tests: [
    { run: 'cache = MiniCache.new\ncalls = 0\n2.times { cache.fetch("k") { calls += 1; "v" } }\np [cache.fetch("k") { "other" }, calls]', expect: '["v", 1]' },
    { run: 'p MiniCache.new.fetch("x") { 42 }', expect: "42" },
    { run: 'cache = MiniCache.new\ncalls = 0\n3.times { cache.fetch("none") { calls += 1; nil } }\np calls', expect: "1", hidden: true },
    { run: 'cache = MiniCache.new\ncache.fetch("a") { 1 }\np [cache.delete("a"), cache.fetch("a") { 2 }]', expect: "[1, 2]", hidden: true },
    { run: 'cache = MiniCache.new\ncalls = 0\n2.times { cache.fetch("f") { calls += 1; false } }\np calls', expect: "1", hidden: true },
    { run: 'cache = MiniCache.new\ncache.fetch("a") { 1 }\np cache.fetch("b") { 2 }', expect: "2", hidden: true },
  ],
  explain: L(
    "Ask key? instead of testing the value: ||= recomputes nil and false every time, which turns an expensive empty result into a cache miss forever.",
    "Pregunta key? en vez de mirar el valor: ||= recalcula nil y false cada vez, y un resultado vacío y costoso queda como fallo de caché para siempre.",
    "値ではなく key? で調べる。||= だと nil や false を毎回計算し直し、重い空の結果がずっとキャッシュミスになる。",
  ),
};

export const transactionTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "database",
  difficulty: 3,
  prompt: L("Written test: our mini transaction", "Prueba escrita: nuestra mini transacción", "筆記：ミニ版トランザクション"),
  brief: L(
    "Our mini version of a DB transaction on a Hash store (numbers as values). Write Rollback (a StandardError) and transaction(store) { |s| ... }: yield store; if the block finishes, keep the changes and return its value. If it raises Rollback, restore store to how it was and return nil. Any other error also restores store, then is re-raised. Restore the SAME hash object the caller holds.",
    "Nuestra mini versión de una transacción sobre un Hash (valores numéricos). Escribe Rollback (un StandardError) y transaction(store) { |s| ... }: haz yield de store; si el bloque termina, conserva los cambios y devuelve su valor. Si lanza Rollback, restaura store a como estaba y devuelve nil. Cualquier otro error también restaura store y luego se relanza. Restaura el MISMO hash que tiene quien llama.",
    "Hash（値は数値）を使う DB トランザクションのミニ版。Rollback（StandardError）と transaction(store) { |s| ... } を書こう。store を yield し、ブロックが終われば変更を残してその値を返す。Rollback なら store を元に戻して nil。他の例外も store を戻してから再送出。呼び出し側が持つ「同じ」ハッシュを戻すこと。",
  ),
  starter: rb`class Rollback < StandardError; end

def transaction(store)
  # your code here
  yield store
end
`,
  solution: rb`class Rollback < StandardError; end

def transaction(store)
  snapshot = store.dup
  yield store
rescue Rollback
  store.replace(snapshot)
  nil
rescue StandardError
  store.replace(snapshot)
  raise
end
`,
  nearMiss: [
    // store = snapshot only rebinds the local variable.
    rb`class Rollback < StandardError; end

def transaction(store)
  snapshot = store.dup
  yield store
rescue Rollback
  store = snapshot
  nil
rescue StandardError
  store = snapshot
  raise
end
`,
    // Swallows every error.
    rb`class Rollback < StandardError; end

def transaction(store)
  snapshot = store.dup
  yield store
rescue StandardError
  store.replace(snapshot)
  nil
end
`,
  ],
  tests: [
    { run: "bank = {ada: 10, bo: 0}\nr = transaction(bank) { |s| s[:ada] -= 4; s[:bo] += 4; :ok }\np [r, bank]", expect: "[:ok, {ada: 6, bo: 4}]" },
    { run: "bank = {ada: 10}\nr = transaction(bank) { |s| s[:ada] = 0; raise Rollback }\np [r, bank]", expect: "[nil, {ada: 10}]" },
    { run: 'bank = {ada: 10}\nbegin\n  transaction(bank) { |s| s[:ada] = 1; s[:eve] = 5; raise ArgumentError, "boom" }\nrescue ArgumentError => e\n  p [e.message, bank]\nend', expect: '["boom", {ada: 10}]', hidden: true },
    { run: "bank = {}\np transaction(bank) { |s| s[:x] = 1 }", expect: "1", hidden: true },
    { run: "bank = {a: 1}\ntransaction(bank) { |s| s[:a] = 2 }\np bank", expect: "{a: 2}", hidden: true },
  ],
  explain: L(
    "Snapshot with dup, then store.replace(snapshot) mutates the caller's hash; store = snapshot only moves a local label. Bare raise re-raises the error.",
    "Toma una copia con dup; store.replace(snapshot) cambia el hash de quien llama, store = snapshot solo mueve una etiqueta local. raise sin argumentos relanza.",
    "dup で控えを取り、store.replace(snapshot) で呼び出し側のハッシュを戻す。store = snapshot はローカルの名札を動かすだけ。引数なし raise で再送出。",
  ),
};

export const rackTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "architecture",
  difficulty: 3,
  prompt: L("Written test: Rack middleware", "Prueba escrita: middleware de Rack", "筆記：Rack ミドルウェア"),
  brief: L(
    'A Rack app responds to call(env) and returns [status, headers, body]. Write class Auth: Auth.new(app, token); call(env) calls app only when env["HTTP_AUTHORIZATION"] is "Bearer <token>", else returns [401, {"content-type" => "text/plain"}, ["unauthorized"]]. Write build_stack(app, *layers): each layer is a proc that wraps an inner app; the FIRST layer is outermost (it runs first).',
    'Una app Rack responde a call(env) y devuelve [status, headers, body]. Escribe la clase Auth: Auth.new(app, token); call(env) llama a app solo si env["HTTP_AUTHORIZATION"] es "Bearer <token>"; si no, devuelve [401, {"content-type" => "text/plain"}, ["unauthorized"]]. Escribe build_stack(app, *layers): cada capa es un proc que envuelve una app interna; la PRIMERA capa es la de afuera (corre primero).',
    'Rack アプリは call(env) で [status, headers, body] を返す。Auth クラスを書こう：Auth.new(app, token)。call(env) は env["HTTP_AUTHORIZATION"] が "Bearer <token>" のときだけ app を呼び、違えば [401, {"content-type" => "text/plain"}, ["unauthorized"]]。build_stack(app, *layers) も書く。各 layer は内側のアプリを包む proc で、「最初の」layer が一番外側（最初に動く）。',
  ),
  starter: rb`class Auth
  def initialize(app, token)
    # your code here
  end

  def call(env)
    # your code here
  end
end

def build_stack(app, *layers)
  # your code here
  app
end
`,
  solution: rb`class Auth
  def initialize(app, token)
    @app = app
    @token = token
  end

  def call(env)
    if env["HTTP_AUTHORIZATION"] == "Bearer #{@token}"
      @app.call(env)
    else
      [401, {"content-type" => "text/plain"}, ["unauthorized"]]
    end
  end
end

def build_stack(app, *layers)
  layers.reverse.reduce(app) { |inner, layer| layer.call(inner) }
end
`,
  nearMiss: [
    // Wraps in list order: the first layer ends up innermost.
    rb`class Auth
  def initialize(app, token)
    @app = app
    @token = token
  end

  def call(env)
    if env["HTTP_AUTHORIZATION"] == "Bearer #{@token}"
      @app.call(env)
    else
      [401, {"content-type" => "text/plain"}, ["unauthorized"]]
    end
  end
end

def build_stack(app, *layers)
  layers.reduce(app) { |inner, layer| layer.call(inner) }
end
`,
    // Accepts any header that ends with the token, without "Bearer ".
    rb`class Auth
  def initialize(app, token)
    @app = app
    @token = token
  end

  def call(env)
    if env["HTTP_AUTHORIZATION"].to_s.end_with?(@token)
      @app.call(env)
    else
      [401, {"content-type" => "text/plain"}, ["unauthorized"]]
    end
  end
end

def build_stack(app, *layers)
  layers.reverse.reduce(app) { |inner, layer| layer.call(inner) }
end
`,
  ],
  tests: [
    { run: 'app = ->(env) { [200, {}, ["hi"]] }\np Auth.new(app, "s3").call({"HTTP_AUTHORIZATION" => "Bearer s3"})', expect: '[200, {}, ["hi"]]' },
    { run: 'app = ->(env) { [200, {}, ["hi"]] }\np Auth.new(app, "s3").call({})', expect: '[401, {"content-type" => "text/plain"}, ["unauthorized"]]' },
    { run: "log = []\ntag = ->(name) { ->(inner) { ->(env) { log << name; inner.call(env) } } }\napp = ->(env) { log << :app; [200, {}, []] }\nbuild_stack(app, tag.(:outer), tag.(:inner)).call({})\np log", expect: "[:outer, :inner, :app]", hidden: true },
    { run: 'calls = 0\napp = ->(env) { calls += 1; [200, {}, []] }\nstack = build_stack(app, ->(inner) { Auth.new(inner, "k") })\nstatus, = stack.call({"HTTP_AUTHORIZATION" => "Bearer nope"})\np [status, calls]', expect: "[401, 0]", hidden: true },
    { run: "app = ->(env) { [204, {}, []] }\np build_stack(app).call({})", expect: "[204, {}, []]", hidden: true },
    { run: 'p Auth.new(->(env) { [200, {}, ["ok"]] }, "k").call({"HTTP_AUTHORIZATION" => "k"})[0]', expect: "401", hidden: true },
  ],
  explain: L(
    "A middleware keeps the next app and decides whether to call it. Build the stack from the inside out (reverse the list) so the first layer runs first.",
    "Un middleware guarda la app siguiente y decide si la llama. Arma la pila de adentro hacia afuera (invierte la lista) para que la primera capa corra primero.",
    "ミドルウェアは次のアプリを持ち、呼ぶかどうかを決める。スタックは内側から組む（リストを逆に）と、最初の layer が最初に動く。",
  ),
};

const VALIDATIONS_HEAD = rb`module Validations
  def self.included(base)
    base.extend(ClassMethods)
  end
`;

const VALID_Q = rb`
  def valid?
    @errors = {}
    self.class.rules.each do |attr, presence, max_length|
      value = public_send(attr).to_s
      (@errors[attr] ||= []) << "can't be blank" if presence && value.strip.empty?
      (@errors[attr] ||= []) << "is too long" if max_length && value.length > max_length
    end
    @errors.empty?
  end
end
`;

export const validatesTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "validations",
  difficulty: 3,
  prompt: L("Written test: our mini validates DSL", "Prueba escrita: nuestro mini DSL validates", "筆記：ミニ版 validates DSL"),
  brief: L(
    "Our mini version of validations. Finish module Validations (a class includes it). The macro validates(attr, presence: false, max_length: nil) stores a rule FOR THAT CLASS only. valid? clears errors, checks every rule (presence: blank after strip → \"can't be blank\"; length over max_length → \"is too long\") and returns true when there are none. errors is a hash of attr => messages ({} at first).",
    "Nuestra mini versión de validaciones. Termina el módulo Validations (una clase lo incluye). La macro validates(attr, presence: false, max_length: nil) guarda una regla SOLO PARA ESA clase. valid? limpia errors, revisa cada regla (presence: en blanco tras strip → \"can't be blank\"; largo mayor a max_length → \"is too long\") y devuelve true si no hay. errors es un hash de attr => mensajes ({} al inicio).",
    "検証のミニ版 Validations モジュールを完成させよう（クラスが include する）。マクロ validates(attr, presence: false, max_length: nil) は「そのクラスだけ」のルールを保存する。valid? は errors を空にし、各ルールを調べ（presence：strip 後に空 → \"can't be blank\"、max_length 超え → \"is too long\"）、なければ true。errors は attr => メッセージのハッシュ（最初は {}）。",
  ),
  starter: `${VALIDATIONS_HEAD}
  module ClassMethods
    def validates(attr, presence: false, max_length: nil)
      # your code here
    end
  end

  def errors
    # your code here
  end

  def valid?
    # your code here
  end
end
`,
  solution: `${VALIDATIONS_HEAD}
  module ClassMethods
    def rules = (@rules ||= [])

    def validates(attr, presence: false, max_length: nil)
      rules << [attr, presence, max_length]
    end
  end

  def errors = (@errors ||= {})
${VALID_Q}`,
  nearMiss: [
    // A class variable in ClassMethods is ONE list shared by every class.
    `${VALIDATIONS_HEAD}
  module ClassMethods
    def rules = (@@rules ||= [])

    def validates(attr, presence: false, max_length: nil)
      rules << [attr, presence, max_length]
    end
  end

  def errors = (@errors ||= {})
${VALID_Q}`,
    // Never clears old errors, so a fixed record stays invalid.
    `${VALIDATIONS_HEAD}
  module ClassMethods
    def rules = (@rules ||= [])

    def validates(attr, presence: false, max_length: nil)
      rules << [attr, presence, max_length]
    end
  end

  def errors = (@errors ||= {})

  def valid?
    self.class.rules.each do |attr, presence, max_length|
      value = public_send(attr).to_s
      (errors[attr] ||= []) << "can't be blank" if presence && value.strip.empty?
      (errors[attr] ||= []) << "is too long" if max_length && value.length > max_length
    end
    errors.empty?
  end
end
`,
  ],
  tests: [
    { run: "class Post\n  include Validations\n  attr_accessor :title\n  validates :title, presence: true, max_length: 5\nend\npost = Post.new\np [post.valid?, post.errors]", expect: "[false, {title: [\"can't be blank\"]}]" },
    { run: 'class Note\n  include Validations\n  attr_accessor :body\n  validates :body, max_length: 3\nend\nnote = Note.new\nnote.body = "hello"\np [note.valid?, note.errors]', expect: '[false, {body: ["is too long"]}]' },
    { run: "class Tag\n  include Validations\n  attr_accessor :name\n  validates :name, presence: true\nend\nclass Badge\n  include Validations\n  attr_accessor :label\nend\np Badge.new.valid?", expect: "true", hidden: true },
    { run: 'class Hero\n  include Validations\n  attr_accessor :name\n  validates :name, presence: true\nend\nhero = Hero.new\nhero.valid?\nhero.name = "Kira"\np [hero.valid?, hero.errors]', expect: "[true, {}]", hidden: true },
    { run: 'class Item\n  include Validations\n  attr_accessor :code\n  validates :code, presence: true\nend\nitem = Item.new\nitem.code = "  "\np item.valid?', expect: "false", hidden: true },
  ],
  explain: L(
    "Keep the rules in an instance variable of the class (@rules inside ClassMethods), not in @@rules, which every class would share. Reset errors in valid?.",
    "Guarda las reglas en una variable de instancia de la clase (@rules en ClassMethods), no en @@rules, que comparten todas las clases. Reinicia errors en valid?.",
    "ルールはクラスのインスタンス変数（ClassMethods 内の @rules）に持たせる。@@rules は全クラスで共有される。valid? で errors をリセットする。",
  ),
};
