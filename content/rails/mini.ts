// Hidden helpers for the Rails moon. Rails itself cannot run in the game's sandboxes, so lessons build
// small plain-Ruby versions of its mechanisms. `check.program` prepends these (players see them
// introduced in dialogs, never as their own code). Run beats stay self-contained plain Ruby, since
// the player's editor sends exactly its contents.
// Source and design: docs/research/rails-curriculum.md ("Shared helper code").

/** In-memory DB that counts queries, a lazy chainable Relation and a Model base (regions 1-2). */
export const MINI_RECORD = String.raw`class RecordNotFound < StandardError; end
class RecordInvalid < StandardError; end

module DB
  @tables = Hash.new { |h, k| h[k] = [] }
  @queries = 0
  class << self
    attr_reader :tables
    attr_accessor :queries
    def select(table)
      @queries += 1
      @tables[table].select { |row| yield row }.map(&:dup)
    end
    def insert(table, row)
      @queries += 1
      row[:id] = @tables[table].size + 1
      @tables[table] << row.dup
      row[:id]
    end
    def update(table, row)
      @queries += 1
      i = @tables[table].index { |r| r[:id] == row[:id] }
      @tables[table][i] = row.dup
    end
  end
end

class Relation
  include Enumerable
  def initialize(model, conds = {}, order = nil, limit = nil, incl = [])
    @model, @conds, @order, @limit, @incl = model, conds, order, limit, incl
  end
  def where(c) = Relation.new(@model, @conds.merge(c), @order, @limit, @incl)
  def order(k) = Relation.new(@model, @conds, k, @limit, @incl)
  def limit(n) = Relation.new(@model, @conds, @order, n, @incl)
  def includes(a) = Relation.new(@model, @conds, @order, @limit, @incl + [a])
  def loaded? = !@records.nil?
  def to_a
    @records ||= begin
      rows = DB.select(@model.table) { |r| @conds.all? { |k, v| v.is_a?(Array) ? v.include?(r[k]) : r[k] == v } }
      rows = rows.sort_by { |r| r[@order] } if @order
      rows = rows.first(@limit) if @limit
      recs = rows.map { |r| @model.new(r) }
      @incl.each { |a| @model.preload(recs, a) }
      recs
    end
  end
  def each(&) = to_a.each(&)
  def to_sql
    sql = "SELECT * FROM #{@model.table}"
    sql += " WHERE " + @conds.map { |k, v| "#{k} = #{v.inspect}" }.join(" AND ") unless @conds.empty?
    sql += " ORDER BY #{@order}" if @order
    sql += " LIMIT #{@limit}" if @limit
    sql
  end
end

class Model
  def self.table = name.downcase + "s"
  def self.attribute(*names)
    names.each do |n|
      define_method(n) { @attrs[n] }
      define_method("#{n}=") { |v| @attrs[n] = v }
    end
  end
  def self.all = Relation.new(self)
  def self.where(c) = all.where(c)
  def self.order(k) = all.order(k)
  def self.includes(a) = all.includes(a)
  def self.find_by(c) = where(c).first
  def self.find(id)
    find_by(id: id) or raise RecordNotFound, "Couldn't find #{name} with 'id'=#{id}"
  end
  def self.method_missing(m, *args)
    return super unless m.start_with?("find_by_")
    find_by(m.to_s.delete_prefix("find_by_").to_sym => args.first)
  end
  def self.respond_to_missing?(m, priv = false) = m.start_with?("find_by_") || super
  def self.create(attrs) = new(attrs).tap(&:save)

  def self.validations = (@validations ||= [])
  def self.validates_presence_of(*fields) = fields.each { |f| validations << f }
  def self.before_save_chain = (@before_save ||= [])
  def self.before_save(m) = before_save_chain << m

  def self.has_many(name)
    fk = :"#{self.name.downcase}_id"
    klass = name.to_s.chomp("s").capitalize
    define_method(name) { Object.const_get(klass).where(fk => id) }
  end
  def self.belongs_to(name)
    define_method(name) do
      @cache.fetch(name) { @cache[name] = Object.const_get(name.to_s.capitalize).find(@attrs[:"#{name}_id"]) }
    end
  end
  def self.preload(records, name)
    ids = records.map { |r| r.read(:"#{name}_id") }.uniq
    found = Object.const_get(name.to_s.capitalize).where(id: ids).to_a
    records.each { |r| r.cache[name] = found.find { |o| o.id == r.read(:"#{name}_id") } }
  end

  attr_reader :errors, :cache
  def initialize(attrs = {})
    @attrs = attrs.dup
    @errors = Hash.new { |h, k| h[k] = [] }
    @cache = {}
  end
  def id = @attrs[:id]
  def read(k) = @attrs[k]
  def persisted? = !id.nil?
  def valid?
    errors.clear
    self.class.validations.each do |f|
      v = @attrs[f]
      errors[f] << "can't be blank" if v.nil? || v.to_s.strip.empty?
    end
    errors.empty?
  end
  def save
    return false unless valid?
    halted = catch(:abort) do
      self.class.before_save_chain.each { |m| send(m) }
      false
    end != false
    return false if halted
    persisted? ? DB.update(self.class.table, @attrs) : @attrs[:id] = DB.insert(self.class.table, @attrs)
    true
  end
  def save!
    save or raise RecordInvalid, "Validation failed: " + errors.map { |f, ms| ms.map { |m| "#{f.capitalize} #{m}" } }.flatten.join(", ")
  end
  def inspect = "#<#{self.class.name} #{@attrs.map { |k, v| "#{k}: #{v.inspect}" }.join(", ")}>"
end
`;

/** A base controller with a halting before_action chain (region 3). */
export const MINI_CONTROLLER = String.raw`class Controller
  def self.filters = (@filters ||= [])
  def self.before_action(m, only: nil) = filters << [m, only]
  def initialize(user = nil) = @user = user
  def process(action)
    self.class.filters.each do |m, only|
      next if only && !only.include?(action)
      send(m)
      return @response if @response
    end
    send(action)
    @response
  end
  def redirect_to(path) = @response = "302 #{path}"
  def render(text) = @response = "200 #{text}"
end
`;

/** Prepends a helper to a snippet to make a full program. */
export const withHelper = (helper: string, code: string) => `${helper}
${code}
`;
