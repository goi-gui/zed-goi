;; Highlights for .goi design files.
;;
;; The language is markup: element names, property names and small value
;; expressions. Elements read as types, properties as fields, and the enum and
;; colour-role identifiers in value position as constants, because that is what
;; they are: names the framework resolves, not variables.

(comment) @comment

(escape_sequence) @string.escape
(string) @string

;; !"…"!: a block string is one token, so its interior is not laid out as code.
(block_string) @string
(gradient) @string.special
(color) @string.special
(number) @number
(boolean) @boolean

["import" "props" "bridge" "data" "type" "setup" "func" "if" "else" "for" "range" "switch" "case" "default" "continue" "break" "responsive" "conditional" "state" "none"] @keyword

;; shadow: 2 2 5 primary, 0 4 12 #000000 inset — the insets keyword and a role
;; colour, which reads as a constant like every other role name.
(shadow_name) @property
(shadow_layer "inset" @keyword)
(shadow_number) @number
(shadow_color) @constant

(scale_name) @property

(theme_transition_name) @property
(theme_transition
  ["crossfade" "wipe" "none"] @keyword)

;; decoration: underline overline — each stroke name is a constant.
(decoration_name) @property
(decoration_keyword) @constant

;; rotate: 45deg, z 90deg, 1 1 1 25turn — the name is a property, the axis and
;; the angle follow.
(rotate_name) @property
(rotate
  ["x" "y" "z"] @constant)
(angle) @number

;; transition: width 500ms, background 1s — the property and its duration.
(transition_name) @property
(transition_property) @property
(duration) @number
(timing_function) @keyword

;; $children is a slot, not a value; $actions { ... } fills a named one and
;; len($actions) reads its size.
(slot
  "$" @punctuation.special
  name: (identifier) @keyword)

(slot_ref
  "$" @punctuation.special
  name: (identifier) @keyword)

;; The loop variables of `for i, row := range bridge.rows`.
(for_block
  key: (identifier) @variable)

(for_block
  value: (identifier) @variable)

;; A declared row type reads as a type.
(data_shape
  name: (identifier) @type)

;; A handler declaration reads as a function, its parameters as parameters.
(func_parameter
  name: (identifier) @variable.parameter)

(type_name) @type

;; greet(name), reset() — a setup function called from a value or event.
(setup_call
  name: (identifier) @function.call)

;; A builtin call reads as a function.
(builtin_call
  name: (builtin_name) @function.builtin)

(conditional_question) @operator
(conditional_colon) @operator
(percent_sign) @operator

(import_statement
  alias: (identifier) @type)

(element
  name: (element_name) @type)

(property
  name: (identifier) @property)

;; A declaration's name is a field.
(declaration
  name: (identifier) @property)

;; Event properties (`onClick`, `onChange`) call Go handlers.
((property
  name: (identifier) @function.method)
  (#match? @function.method "^on[A-Z]"))

(map_entry
  name: (identifier) @attribute)

(default_key) @keyword

(map_type "map" @type)

(reference
  object: (identifier) @variable)

(reference
  "." @punctuation.delimiter
  member: (identifier) @property)

;; props.title, bridge.rows, app.dark and window.width read a namespace.
(reference
  object: (identifier) @namespace
  "." @punctuation.delimiter
  member: (identifier) @property
  (#match? @namespace "^(props|bridge|data|app|window)$"))

;; A colour role after theme. or customColor. reads as a constant, like a bare
;; role does.
(reference
  object: (identifier) @namespace
  "." @punctuation.delimiter
  member: (identifier) @constant
  (#match? @namespace "^(theme|customColor)$"))

;; bridge.onOpen(post.id): the handler it calls. A node method is a variable
;; with a method, not a namespace.
(handler_call
  function: (reference
    object: (identifier) @variable
    member: (identifier) @function.method))

(handler_call
  function: (reference
    object: (identifier) @namespace
    member: (identifier) @function.method)
  (#match? @namespace "^(bridge|data)$"))

;; Enum and colour-role names: `filled`, `primary`, `dark_mode`.
(primary
  (identifier) @constant)

;; event is the payload an event passes, not a design constant.
((primary
  (identifier) @variable.builtin)
  (#eq? @variable.builtin "event"))

[
  "||"
  "&&"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "+"
  "-"
  "*"
  "/"
  "%"
  "!"
  ":="
] @operator

[
  "{"
  "}"
  "("
  ")"
  "["
  "]"
] @punctuation.bracket

[
  ","
  ";"
  ":"
] @punctuation.delimiter
