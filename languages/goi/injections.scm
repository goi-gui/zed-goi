;; setup blocks are ordinary Go declarations. Tree-sitter-goi keeps the body
;; balanced; the Go grammar paints its keywords, functions and types.
((setup_block
  body: (go_content) @injection.content)
 (#set! injection.language "go"))
