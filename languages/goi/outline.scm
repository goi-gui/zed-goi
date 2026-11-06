; The outline mirrors the design's element tree, which is the shape a reader
; navigates: Window > Column > Card > Row.
(element
  name: (element_name) @name) @item

;; Blocks are navigation targets too: a long {#if} is easier to find by its
;; condition than by scrolling.
(if_block
  "if" @name) @item

(for_block
  "for" @name) @item

(switch_block
  "switch" @name) @item

;; The declarations a file makes: rows and handlers.
(bridge_block
  ["bridge" "data"] @name
  (declaration name: (identifier) @name) @item) @item

(data_shape
  name: (identifier) @name) @item

;; A fragment's declared inputs and the app values a design reads.
(props_block
  "props" @name
  (declaration name: (identifier) @name) @item) @item
