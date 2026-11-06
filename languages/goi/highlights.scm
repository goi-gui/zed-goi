;; Highlights for .goi design files.
;;
;; The language is markup: element names, property names and small value
;; expressions. Elements read as types, properties as fields, and the enum and
;; colour-role identifiers in value position as constants, because that is what
;; they are: names the framework resolves, not variables.

(comment) @comment

(escape_sequence) @string.escape
(string) @string
(color) @string.special
(number) @number
(boolean) @boolean

["import" "props" "bridge" "data" "type" "func" "if" "else" "for" "range" "switch" "case" "default"] @keyword

;; $children is a slot, not a value; $actions { ... } fills a named one.
(slot
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

;; A builtin call reads as a function.
(builtin_call
  name: (builtin_name) @function.builtin)

(conditional_question) @operator
(conditional_colon) @operator
(percent_sign) @operator

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

(map_type "map" @type)

;; props.title reads a declared input.
(reference
  object: (identifier) @namespace
  "." @punctuation.delimiter
  member: (identifier) @property
  (#eq? @namespace "props"))

(reference
  object: (identifier) @variable)

(reference
  "." @punctuation.delimiter
  member: (identifier) @property)

;; bridge.onOpen(post.id): the namespace and the handler it calls.
(handler_call
  function: (reference
    object: (identifier) @namespace
    member: (identifier) @function.method))

;; Enum and colour-role names: `filled`, `primary`, `dark_mode`.
(primary
  (identifier) @constant)

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
  "!"
] @operator

[
  "{"
  "}"
  "("
  ")"
] @punctuation.bracket

[
  ","
  ";"
] @punctuation.delimiter
