/**
 * Tree-sitter grammar for goi design files (.goi).
 *
 * The language is markup, not a script: elements hold properties, values are
 * literals or small expressions, and behaviour lives in Go. Newlines are not
 * tokens, so a member is a property when its identifier is followed by `:` and
 * a child element when it is followed by `{`.
 */
module.exports = grammar({
  name: 'goi',

  extras: $ => [/\s/, $.comment],

  word: $ => $.identifier,

  rules: {
    source_file: $ => seq(
      repeat(choice(
        $.import_statement,
        $.props_block,
        $.bridge_block,
        $.data_shape,
      )),
      field('root', $.element),
    ),

    // bridge { Loading bool, Tickets []ticket, OnOpen func(id string) }
    // `data { ... }` is the original spelling and parses alike.
    bridge_block: $ => seq(
      choice('bridge', 'data'),
      '{',
      repeat($._decl),
      '}',
    ),

    // type ticket { Title string }
    // `data ticket { ... }` is the original spelling.
    data_shape: $ => seq(
      choice('type', 'data'),
      field('name', $.identifier),
      '{',
      repeat($._decl),
      '}',
    ),

    // props { Title string, Rows []ticket }
    props_block: $ => seq(
      'props',
      '{',
      repeat($._decl),
      '}',
    ),

    _decl: $ => $.declaration,

    // Name Type — Go's field syntax, no colon.
    declaration: $ => seq(
      field('name', $.identifier),
      field('type', $.type),
      optional(choice(',', ';')),
    ),

    type: $ => choice(
      $.func_type,
      $.slice_type,
      $.map_type,
      $.type_name,
    ),

    type_name: $ => $.identifier,

    slice_type: $ => seq('[', ']', $.type),

    map_type: $ => seq('map', '[', field('key', $.type_name), ']', $.type),

    // func(id string, count uint)
    func_type: $ => seq(
      'func',
      '(',
      optional(seq(
        $.func_parameter,
        repeat(seq(',', $.func_parameter)),
        optional(','),
      )),
      ')',
    ),

    func_parameter: $ => seq(
      field('name', $.identifier),
      field('type', $.type),
    ),

    // import "./Sidebar.goi" as Sidebar
    import_statement: $ => seq(
      'import',
      field('path', $.string),
      'as',
      field('alias', $.identifier),
      optional(';'),
    ),

    // import "./Sidebar.goi" as Sidebar
    import_statement: $ => seq(
      'import',
      field('path', $.string),
      'as',
      field('alias', $.identifier),
      optional(';'),
    ),

    // Column { ... }
    element: $ => seq(
      field('name', alias($.identifier, $.element_name)),
      '{',
      repeat($._member),
      '}',
    ),

    _member: $ => choice(
      $.property,
      $.element,
      $.if_block,
      $.for_block,
      $.slot,
    ),

    // if cond { … } else if cond { … } else { … }
    if_block: $ => seq(
      'if',
      field('condition', $.value),
      field('body', $.block_body),
      repeat(seq('else', 'if', field('condition', $.value), field('body', $.block_body))),
      optional(seq('else', field('body', $.block_body))),
    ),

    // for i, row := range bridge.rows { … }
    for_block: $ => seq(
      'for',
      optional(seq(
        field('key', $.identifier),
        optional(seq(',', field('value', $.identifier))),
        ':=',
      )),
      'range',
      field('range', $.value),
      field('body', $.block_body),
    ),

    block_body: $ => seq('{', repeat($._member), '}'),

    // $children — where an instance's children go. A named slot such as
    // `$actions { ... }` is the same marker with a body.
    slot: $ => seq(
      '$',
      field('name', $.identifier),
      optional(seq('{', repeat($._member), '}')),
    ),

    // spacing: 8
    property: $ => seq(
      field('name', $.identifier),
      ':',
      field('value', $.value),
      optional(';'),
    ),

    // Values are one expression grammar, so `text: hello` and
    // `width: side.width / 2` are both plain values.
    // A value is an expression; the conditional is optional, which is what
    // makes `text: hello` a plain value and `a ? b : c` a conditional.
    value: $ => prec.right(seq(
      field('condition', $.or_expression),
      optional(seq(
        alias('?', $.conditional_question),
        field('then', $.value),
        alias(':', $.conditional_colon),
        field('else', $.value),
      )),
    )),

    or_expression: $ => prec.left(seq(
      $.and_expression,
      repeat(seq('||', $.and_expression)),
    )),

    and_expression: $ => prec.left(seq(
      $.equality_expression,
      repeat(seq('&&', $.equality_expression)),
    )),

    equality_expression: $ => prec.left(seq(
      $.comparison_expression,
      repeat(seq(choice('==', '!='), $.comparison_expression)),
    )),

    comparison_expression: $ => prec.left(seq(
      $.sum_expression,
      repeat(seq(choice('<', '<=', '>', '>='), $.sum_expression)),
    )),

    sum_expression: $ => prec.left(seq(
      $.term_expression,
      repeat(seq(choice('+', '-'), $.term_expression)),
    )),

    term_expression: $ => prec.left(seq(
      $.unary_expression,
      repeat(seq(choice('*', '/'), $.unary_expression)),
    )),

    unary_expression: $ => choice(
      prec(2, seq(choice('!', '-'), $.unary_expression)),
      $.primary,
    ),

    primary: $ => choice(
      $.string,
      $.formatf_call,
      $.percentage,
      $.number,
      $.boolean,
      $.color,
      $.handler_call,
      $.reference,
      $.identifier,
      $.map,
      $.parenthesized_expression,
    ),

    parenthesized_expression: $ => seq('(', $.value, ')'),

    // 50%
    percentage: $ => seq($.number, alias('%', $.percent_sign)),

    // formatf("%d items", bridge.Count) — Go's fmt verbs in a string value.
    formatf_call: $ => seq(
      'formatf',
      '(',
      optional(seq(
        $.value,
        repeat(seq(',', $.value)),
        optional(','),
      )),
      ')',
    ),

    // bridge.onOpen(post.id), the value of an event property.
    handler_call: $ => seq(
      field('function', $.reference),
      '(',
      optional(seq(
        $.value,
        repeat(seq(',', $.value)),
        optional(','),
      )),
      ')',
    ),

    // side.width, app.dark, window.width, props.title
    reference: $ => prec(1, seq(
      field('object', $.identifier),
      '.',
      field('member', $.identifier),
    )),

    // { base: 16, md: 24 }
    map: $ => seq(
      '{',
      optional(seq(
        $.map_entry,
        repeat(seq(',', $.map_entry)),
        optional(','),
      )),
      '}',
    ),

    map_entry: $ => seq(
      field('name', $.identifier),
      ':',
      field('value', $.value),
    ),

    string: $ => seq(
      '"',
      repeat(choice(
        $._string_content,
        $.escape_sequence,
      )),
      '"',
    ),

    _string_content: _ => token.immediate(/[^"\\\n]+/),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /["\\/bfnrt]/,
        /u\{[0-9a-fA-F]{1,6}\}/,
        /u[0-9a-fA-F]{4}/,
      ),
    )),

    number: _ => {
      const digits = /[0-9]+(_[0-9]+)*/;
      const fraction = seq('.', digits);
      return token(seq(digits, optional(fraction)));
    },

    boolean: _ => choice('true', 'false'),

    // #rgb, #rrggbb, #rrggbbaa
    color: _ => token(seq(
      '#',
      choice(
        /[0-9a-fA-F]{8}/,
        /[0-9a-fA-F]{6}/,
        /[0-9a-fA-F]{3}/,
      ),
    )),

    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    comment: _ => token(choice(
      seq('//', /[^\n]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
    )),
  },
});
