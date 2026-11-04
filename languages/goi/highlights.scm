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

["import" "as" "props" "bridge" "data" "type" "func"] @keyword

;; Block tags: {#if}, {:else}, {/if}, {#each}, {/each}. They read as control
;; flow, so they take the keyword colour rather than the punctuation one.
[
  "{#if"
  "{:else"
  "{/if}"
  "{#each"
  "{/each}"
  "if"
  "as"
] @keyword

;; $children is a slot, not a value; $actions { ... } fills a named one.
(slot
  "$" @punctuation.special
  name: (identifier) @keyword)

;; The row variable of {#each data.rows as row}.
(each_block
  item: (identifier) @variable)

;; A declared data variable reads as a field; its type as a type.
(data_field
  name: (identifier) @property
  type: (data_type
    element: (identifier) @type))

(data_shape
  name: (identifier) @type)

;; A handler declaration reads as a function, its parameters as parameters.
(data_field
  name: (identifier) @function
  type: (data_type
    (func_type)))

(func_parameter
  name: (identifier) @variable.parameter
  type: (identifier) @type)

(conditional_question) @operator
(conditional_colon) @operator
(percent_sign) @operator

(element
  name: (element_name) @type)

(property
  name: (identifier) @property)

;; Event properties (`onClick`, `onChange`) call Go handlers.
((property
  name: (identifier) @function.method)
  (#match? @function.method "^on[A-Z]"))

;; `Count is ${bridge.count}`: a template is a string, its holes are code.
(template_string) @string

(template_interpolation
  "${" @punctuation.special
  "}" @punctuation.special)

(map_entry
  name: (identifier) @attribute)

;; A fragment's input block: the prop names are fields, their types are types.
(props_block
  "props" @keyword)

(prop_field
  name: (identifier) @property
  type: (data_type
    element: (identifier) @type))

;; A handler prop reads as a function, like a bridge handler.
(prop_field
  name: (identifier) @function
  type: (data_type
    (func_type)))

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
